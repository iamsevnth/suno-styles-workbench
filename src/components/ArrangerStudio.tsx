import React, { useMemo, useState } from "react";
import {
  ARRANGEMENT_SECTION_TYPES,
  LOCAL_PROJECT_KEY,
  arrangeLyrics,
  approximateRhymeKey,
  estimatedSyllables,
  parseProjectJSON,
  parseWholeSong,
  sectionLabel,
  sourceLines,
  suggestTargets,
  type ArrangementOptions,
  type ArrangementResult,
  type ArrangerProject,
  type InputMode,
  type SourceSection,
  type TargetSection,
} from "../lib/lyrics/arranger.ts";
import type { SectionType } from "../lib/lyrics/types.ts";

interface ArrangerStudioProps {
  onShowDialog: (kind: "ok" | "error", title: string, body: string) => void;
  copyToClipboard: (text: string) => Promise<boolean>;
  onSendToPhonetics: (text: string) => void;
}

const inputClass = "w-full rounded-lg border border-[var(--border)] bg-[var(--bg)] text-[var(--fg)] px-3 py-2 text-xs focus:border-[var(--ring)] focus:outline-none";
const buttonClass = "rounded-lg border border-[var(--border)] bg-[var(--bg)] text-xs font-medium text-[var(--fg-muted)] hover:text-[var(--fg)] hover:bg-[var(--bg-subtle)] px-3 py-2";
const starter: SourceSection = { id: "source-1", type: "chorus", text: "", locked: false };
const defaultOptions: ArrangementOptions = {
  seed: 42,
  preserveRhyme: true,
  targetBpm: 140,
};

function makeId(prefix: string): string {
  return prefix + "-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 8);
}
function downloadText(name: string, content: string, mime: string): void {
  const file = new Blob([content], { type: mime });
  const url = URL.createObjectURL(file);
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 500);
}
function safeSeed(value: number): number {
  return Number.isFinite(value) ? Math.trunc(value) : 42;
}

export default function ArrangerStudio({
  onShowDialog,
  copyToClipboard,
  onSendToPhonetics,
}: ArrangerStudioProps) {
  const [mode, setMode] = useState<InputMode>("whole");
  const [wholeText, setWholeText] = useState("");
  const [sections, setSections] = useState<SourceSection[]>([starter]);
  const [targets, setTargets] = useState<TargetSection[]>([]);
  const [options, setOptions] = useState<ArrangementOptions>(defaultOptions);
  const [result, setResult] = useState<ArrangementResult | null>(null);
  const [hasSaved, setHasSaved] = useState(false);
  const [revision, setRevision] = useState(0);
  const [outputRevision, setOutputRevision] = useState(-1);
  const [displayProvenance, setDisplayProvenance] = useState(false);

  const effectiveSections = useMemo(
    () => mode === "whole" ? parseWholeSong(wholeText) : sections,
    [mode, wholeText, sections],
  );
  const sourceCount = useMemo(() => {
    try { return sourceLines(effectiveSections).length; } catch { return 0; }
  }, [effectiveSections]);
  const stale = outputRevision !== revision;
  const readyResult = result && !stale ? result : null;
  const markChanged = () => { setRevision(r => r + 1); setHasSaved(false); };
  const changeMode = (next: InputMode) => {
    if (mode === next) return;
    if (mode === "whole" && next === "sections") {
      const parsed = parseWholeSong(wholeText);
      setSections(parsed.length ? parsed.map(s => ({ ...s, id: makeId("source") })) : [starter]);
    } else if (mode === "sections" && next === "whole") {
      setWholeText(sections.map(s => "[" + sectionLabel(s.type) + "]\n" + s.text).join("\n\n"));
    }
    setMode(next);
    setTargets([]);
    markChanged();
  };
  const patchSource = (id: string, delta: Partial<SourceSection>) => {
    setSections(before => before.map(s => s.id === id ? { ...s, ...delta } : s));
    markChanged();
  };
  const patchTarget = (id: string, delta: Partial<TargetSection>) => {
    setTargets(before => before.map(s => s.id === id ? { ...s, ...delta } : s));
    markChanged();
  };
  const manualAdd = () => {
    if (targets.length >= 40) {
      onShowDialog("error", "Structure limit", "A maximum of 40 destination sections is supported.");
      return;
    }
    const first = effectiveSections[0];
    setTargets(prev => [...prev, { id: makeId("target"), type: first?.type ?? "verse", sourceId: first?.id,
      bars: 8, mode: "whole" }]);
    markChanged();
  };
  const arrange = () => {
    try {
      const selected = targets.length ? targets : suggestTargets(effectiveSections);
      if (!selected.length) throw new Error("Add your original lyric lines before arranging.");
      const output = arrangeLyrics(effectiveSections, selected, options);
      if (!output.verified) throw new Error("Source provenance check did not pass.");
      if (!targets.length) setTargets(selected);
      setResult(output);
      setOutputRevision(revision);
    } catch (error) {
      setResult(null);
      onShowDialog("error", "Arrangement blocked", error instanceof Error ? error.message : "Please review the source and destination sections.");
    }
  };
  const snapshot = (): ArrangerProject => ({
    version: 1, mode, wholeText, sections: effectiveSections, targets, options,
  });
  const save = () => {
    try {
      const serialized = JSON.stringify(snapshot());
      localStorage.setItem(LOCAL_PROJECT_KEY, serialized);
      setHasSaved(true);
      onShowDialog("ok", "Project saved on this device", "Your source lyrics and arrangement settings were saved in this browser. They were not uploaded.");
    } catch {
      onShowDialog("error", "Local save failed", "Browser storage is unavailable or full. Export the project as JSON instead.");
    }
  };
  const applyProject = (project: ArrangerProject) => {
    setMode(project.mode);
    setWholeText(project.wholeText);
    setSections(project.sections.length ? project.sections : [starter]);
    setTargets(project.targets);
    setOptions(project.options);
    setResult(null);
    setOutputRevision(-1);
    setRevision(r => r + 1);
    setHasSaved(true);
  };
  const load = () => {
    try {
      const json = localStorage.getItem(LOCAL_PROJECT_KEY);
      if (!json) throw new Error("No saved Lyrics Studio project exists in this browser.");
      applyProject(parseProjectJSON(json));
      onShowDialog("ok", "Project restored", "The locally saved lyrics and structure have been restored.");
    } catch (error) {
      onShowDialog("error", "Restore failed", error instanceof Error ? error.message : "Could not restore the project.");
    }
  };
  const importProject = async (file: File | undefined) => {
    if (!file) return;
    try {
      if (file.size > 500000) throw new Error("Project file exceeds 500 KB.");
      const project = parseProjectJSON(await file.text());
      applyProject(project);
      onShowDialog("ok", "Project imported", "Your project was restored from the selected JSON file.");
    } catch (error) {
      onShowDialog("error", "Import failed", error instanceof Error ? error.message : "Invalid project file.");
    }
  };
  const copyOutput = async () => {
    if (!readyResult) return;
    const success = await copyToClipboard(readyResult.fullText);
    onShowDialog(success ? "ok" : "error", success ? "Lyrics copied" : "Clipboard unavailable",
      success ? "Copied Suno-ready lyrics with source-preserving phrase text." : "Select the output and copy manually.");
  };
  const removeLocal = () => {
    try {
      localStorage.removeItem(LOCAL_PROJECT_KEY);
      setHasSaved(false);
      onShowDialog("ok", "Local project cleared", "Only the browser's saved Lyrics Studio project was deleted; the current editor remains open.");
    } catch {
      onShowDialog("error", "Storage unavailable", "Could not clear browser storage.");
    }
  };
  const setBpm = (kind: "targetBpm" | "sourceBpm", value: string) => {
    const num = value === "" ? undefined : Number(value);
    setOptions(current => kind === "targetBpm"
      ? { ...current, targetBpm: num ?? 0 }
      : { ...current, sourceBpm: num });
    markChanged();
  };
  const linePreview = useMemo(() => {
    try {
      return sourceLines(effectiveSections).slice(0, 8).map(l => ({
        section: l.sectionType,
        line: l.text,
        syllables: estimatedSyllables(l.text),
        rhyme: approximateRhymeKey(l.text),
      }));
    } catch { return []; }
  }, [effectiveSections]);

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)] lg:items-start">
      <section className="rounded-2xl border border-[var(--border)] bg-[var(--bg-elevated)] p-4 sm:p-6 flex flex-col gap-5">
        <header>
          <span className="label-caps text-[var(--accent)]">Stage 1 — Original Lyric Material</span>
          <h2 className="text-base font-semibold text-[var(--fg)] mt-1">Source-Preserving Lyrics Arranger</h2>
          <p className="text-xs text-[var(--fg-muted)] mt-2">
            Paste lyrics you wrote or have permission to use. The arranger never creates new lyrical words:
            it reorders, repeats, or groups exact source phrases. Song-section labels are output metadata.
          </p>
        </header>
        <div className="flex gap-2" role="group" aria-label="Lyrics input mode">
          <button type="button" className={mode === "whole" ? "btn-primary px-3 py-2 text-xs rounded-lg" : buttonClass}
            onClick={() => changeMode("whole")}>Paste Entire Song</button>
          <button type="button" className={mode === "sections" ? "btn-primary px-3 py-2 text-xs rounded-lg" : buttonClass}
            onClick={() => changeMode("sections")}>Separate Sections</button>
        </div>
        {mode === "whole" ? (
          <div>
            <label htmlFor="arranger-whole" className="label-caps mb-2 block">Entire Original Draft</label>
            <textarea id="arranger-whole" rows={13} value={wholeText}
              onChange={e => { setWholeText(e.target.value); markChanged(); }}
              placeholder={"[Chorus]\nPaste your existing hook, one lyric line per row\nRepeat or rearrange your own words\n\n[Verse]\nPaste your next original section here"}
              className={inputClass + " min-h-[260px] font-mono resize-y leading-relaxed"}/>
            <p className="text-xs text-[var(--fg-subtle)] mt-2">
              Recognizes [Verse], [Chorus], [Build Up], [Drop] and related tags. Blank lines separate source groups.
              Unknown bracketed tags remain source text and are not interpreted as new instructions.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {sections.map((s, i) => (
              <div key={s.id} className="border border-[var(--border)] bg-[var(--bg)] rounded-xl p-3 flex flex-col gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-[11px] text-[var(--fg-muted)]">Source {i + 1}</span>
                  <select value={s.type} aria-label={"Section type for source " + (i + 1)}
                    onChange={e => patchSource(s.id, { type: e.target.value as SectionType })}
                    className={inputClass + " w-auto flex-1"}>
                    {ARRANGEMENT_SECTION_TYPES.map(t => <option key={t} value={t}>{sectionLabel(t)}</option>)}
                  </select>
                  <label className="text-xs text-[var(--fg-muted)] flex items-center gap-1">
                    <input type="checkbox" checked={!!s.locked}
                      onChange={e => patchSource(s.id, { locked: e.target.checked })}/> Keep Order
                  </label>
                  <button className={buttonClass} type="button" aria-label={"Remove source " + (i + 1)}
                    onClick={() => { setSections(before => before.filter(x => x.id !== s.id)); setTargets(before => before.filter(t => t.sourceId !== s.id)); markChanged(); }}>Remove</button>
                </div>
                <textarea rows={5} value={s.text} aria-label={"Original lyric text for source " + (i + 1)}
                  onChange={e => patchSource(s.id, { text: e.target.value })}
                  placeholder="Paste only lyrics that you supplied..."
                  className={inputClass + " resize-y font-mono leading-relaxed"}/>
              </div>
            ))}
            <button type="button" onClick={() => {
              if (sections.length >= 80) return onShowDialog("error", "Limit reached", "Up to 80 input sections.");
              setSections(previous => [...previous, { id: makeId("source"), type: "verse", text: "" }]);
              markChanged();
            }} className={buttonClass}>+ Add Source Section</button>
          </div>
        )}
        <div className="text-xs text-[var(--fg-subtle)] font-mono">
          {sourceCount} non-empty lyric line(s) · {effectiveSections.length} source section(s)
        </div>
        <div className="border-t border-[var(--border)] pt-4 flex flex-col gap-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="font-semibold text-sm text-[var(--fg)]">Stage 2 — Destination Structure</h3>
            <div className="flex gap-2">
              <button className={buttonClass} type="button" onClick={() => { setTargets(suggestTargets(effectiveSections)); markChanged(); }}>
                Suggest Structure
              </button>
              <button className={buttonClass} type="button" onClick={manualAdd}>+ Section</button>
            </div>
          </div>
          <p className="text-xs text-[var(--fg-subtle)]">
            Define the order and bar slots for each destination section. One existing line/fragment occupies one
            planned slot; this is a lyric planning assumption, not verified musical transcription.
          </p>
          {targets.length === 0 && <div className="p-4 text-xs rounded-xl border border-dashed border-[var(--border)] text-[var(--fg-muted)]">
            Select Suggest Structure or add destination sections manually. The arranger can also suggest a structure when you click Arrange.
          </div>}
          {targets.map((s, i) => (
            <div key={s.id} className="rounded-xl border border-[var(--border)] bg-[var(--bg)] p-3 flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono text-[var(--fg-subtle)]">{i + 1}.</span>
                <select value={s.type} aria-label={"Destination type " + (i + 1)}
                  className={inputClass + " flex-1 min-w-0"}
                  onChange={e => patchTarget(s.id, { type: e.target.value as SectionType })}>
                  {ARRANGEMENT_SECTION_TYPES.map(t => <option key={t} value={t}>{sectionLabel(t)}</option>)}
                </select>
                <button type="button" className={buttonClass} aria-label={"Move destination " + (i + 1) + " up"}
                  disabled={i === 0} onClick={() => {
                    setTargets(before => { const copy = [...before]; [copy[i-1], copy[i]] = [copy[i], copy[i-1]]; return copy; }); markChanged();
                  }}>↑</button>
                <button type="button" className={buttonClass} aria-label={"Move destination " + (i + 1) + " down"}
                  disabled={i === targets.length - 1} onClick={() => {
                    setTargets(before => { const copy = [...before]; [copy[i], copy[i+1]] = [copy[i+1], copy[i]]; return copy; }); markChanged();
                  }}>↓</button>
                <button type="button" className={buttonClass} aria-label={"Delete destination " + (i + 1)}
                  onClick={() => { setTargets(before => before.filter(x => x.id !== s.id)); markChanged(); }}>×</button>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                <label className="text-[11px] text-[var(--fg-muted)]">Bars / Slots
                  <input type="number" min={1} max={64} value={s.bars} className={inputClass + " mt-1"} aria-label={"Bars for destination " + (i + 1)}
                    onChange={e => patchTarget(s.id, { bars: Number(e.target.value) })}/>
                </label>
                <label className="text-[11px] text-[var(--fg-muted)]">Operation
                  <select className={inputClass + " mt-1"} value={s.mode} onChange={e => patchTarget(s.id, { mode: e.target.value as "whole" | "chop" })}>
                    <option value="whole">Reorder Lines</option>
                    <option value="chop">Chop Long Lines</option>
                  </select>
                </label>
                <label className="text-[11px] text-[var(--fg-muted)] col-span-2 sm:col-span-1">From Source
                  <select className={inputClass + " mt-1"} value={s.sourceId ?? ""}
                    onChange={e => patchTarget(s.id, { sourceId: e.target.value || undefined })}>
                    <option value="">Auto Match</option>
                    {effectiveSections.map((entry, j) =>
                      <option key={entry.id} value={entry.id}>{j + 1}. {sectionLabel(entry.type)}</option>)}
                  </select>
                </label>
              </div>
            </div>
          ))}
        </div>
        <div className="border-t border-[var(--border)] pt-4 flex flex-col gap-3">
          <h3 className="font-semibold text-sm text-[var(--fg)]">Stage 3 — Arrangement Controls</h3>
          <div className="grid grid-cols-2 gap-3">
            <label className="text-xs text-[var(--fg-muted)]">Destination BPM
              <input type="number" min={40} max={240} value={options.targetBpm}
                onChange={e => setBpm("targetBpm", e.target.value)} className={inputClass + " mt-1"}/>
            </label>
            <label className="text-xs text-[var(--fg-muted)]">Original BPM (optional)
              <input type="number" min={40} max={240} value={options.sourceBpm ?? ""}
                onChange={e => setBpm("sourceBpm", e.target.value)} className={inputClass + " mt-1"}/>
            </label>
            <label className="text-xs text-[var(--fg-muted)]">Variation Seed
              <input type="number" step={1} value={options.seed}
                onChange={e => { setOptions(before => ({ ...before, seed: safeSeed(Number(e.target.value)) })); markChanged(); }}
                className={inputClass + " mt-1"}/>
            </label>
            <label className="flex gap-2 items-center text-xs text-[var(--fg-muted)]">
              <input type="checkbox" checked={options.preserveRhyme}
                onChange={e => { setOptions(before => ({ ...before, preserveRhyme: e.target.checked })); markChanged(); }}/>
              Keep Adjacent Phrase Pairs
            </label>
          </div>
          <div className="flex flex-wrap gap-2">
            <button className="btn-primary rounded-lg px-5 py-2.5 text-xs font-semibold" type="button" onClick={arrange}>Arrange Supplied Lyrics</button>
            <button className={buttonClass} type="button" onClick={() => {
              setOptions(before => ({ ...before, seed: before.seed === 2147483647 ? 0 : before.seed + 1 }));
              markChanged();
              setResult(null);
            }}>New Variation Seed</button>
          </div>
          <p className="text-xs text-[var(--fg-subtle)]">
            Variation shuffles source line/phrase groups; it does not call an AI service. Locked source sections preserve original line order within their selected pool.
          </p>
        </div>
        <div className="border-t border-[var(--border)] pt-4 flex flex-col gap-2">
          <h3 className="text-sm font-semibold text-[var(--fg)]">Local Project</h3>
          <div className="flex gap-2 flex-wrap">
            <button className={buttonClass} type="button" onClick={save}>Save to Browser</button>
            <button className={buttonClass} type="button" onClick={load}>Restore Saved</button>
            <button className={buttonClass} type="button" onClick={() => {
              downloadText("suno-lyrics-project-v5.2.json", JSON.stringify(snapshot(), null, 2), "application/json;charset=utf-8");
            }}>Export Project JSON</button>
            <label className={buttonClass + " cursor-pointer"}>
              Import JSON
              <input type="file" accept=".json,application/json" className="sr-only"
                onChange={e => { const file = e.target.files?.[0]; void importProject(file); e.target.value = ""; }}/>
            </label>
            <button className={buttonClass} type="button" onClick={removeLocal}>Clear Saved Copy</button>
          </div>
          <p className="text-[11px] text-[var(--fg-subtle)]">
            Browser save is explicit, not automatic. Lyrics are not sent to our servers. Keep a JSON backup:
            clearing site data or using another browser can erase local copies. {hasSaved && "A local project copy is available."}
          </p>
        </div>
      </section>
      <section className="flex flex-col gap-4">
        <div className="border border-[var(--border)] rounded-2xl bg-[var(--bg-elevated)] p-4 sm:p-6 flex flex-col gap-3">
          <span className="label-caps text-[var(--accent)]">Stage 4 — Suno-Ready Arrangement</span>
          <h2 className="font-semibold text-base text-[var(--fg)]">Source Integrity: {readyResult?.verified ? "Verified" : "Not Yet Verified"}</h2>
          {readyResult ? (
            <>
              <p className="text-xs text-[var(--fg-muted)]">
                {readyResult.sections.length} arranged sections · {readyResult.repeatedSlots} reused phrase slots · {readyResult.sourceLineCount} source lines
              </p>
              <textarea value={readyResult.fullText} readOnly rows={22}
                aria-label="Verified source-preserving lyrics"
                className={inputClass + " min-h-[420px] resize-y font-mono leading-relaxed"}/>
              <div className="flex flex-wrap gap-2">
                <button type="button" className="btn-primary rounded-lg px-4 py-2 text-xs font-semibold" onClick={() => void copyOutput()}>Copy to Suno</button>
                <button type="button" className={buttonClass} onClick={() => downloadText("suno-rearranged-lyrics.txt", readyResult.fullText, "text/plain;charset=utf-8")}>Download TXT</button>
                <button type="button" className={buttonClass} onClick={() => onSendToPhonetics(readyResult.fullText)}>Send to Phonetics</button>
                <button type="button" className={buttonClass} onClick={() => setDisplayProvenance(p => !p)}>
                  {displayProvenance ? "Hide Source Map" : "Show Source Map"}
                </button>
              </div>
              {displayProvenance && (
                <div className="max-h-[380px] overflow-auto text-xs border border-[var(--border)] rounded-lg p-3">
                  {readyResult.sections.map((section, i) =>
                    <div key={section.id} className="mb-3">
                      <strong className="block text-[var(--fg)] mb-1">{i + 1}. {sectionLabel(section.type)}</strong>
                      {section.lines.map((line, j) =>
                        <div key={j} className="font-mono text-[11px] text-[var(--fg-muted)] py-1">
                          Slot {j + 1}: source {line.sourceId}, original line {line.sourceLineNumber},
                          characters [{line.start}–{line.end}]{line.repeated ? " (repeated)" : ""}
                        </div>)}
                    </div>)}
                </div>
              )}
              <div className="rounded-xl bg-[var(--bg)] p-3 border border-[var(--border)] text-xs text-[var(--fg-muted)]">
                <h3 className="font-semibold text-[var(--fg)] mb-1">Arrangement Review</h3>
                {readyResult.warnings.map((warning, i) => <p key={i} className="mb-2">• {warning}</p>)}
              </div>
            </>
          ) : (
            <div className="min-h-[300px] border border-dashed border-[var(--border)] rounded-xl flex items-center justify-center p-6 text-center text-xs text-[var(--fg-muted)]">
              {result && stale
                ? "Your source or settings changed after the last output. Run Arrange Supplied Lyrics again to reverify."
                : "Enter original lyrics, configure destination sections, and arrange. Output stays read-only to preserve provenance."}
            </div>
          )}
        </div>
        <div className="border border-[var(--border)] rounded-2xl bg-[var(--bg-elevated)] p-4 flex flex-col gap-2">
          <h3 className="text-sm font-semibold text-[var(--fg)]">Rhythm & Rhyme Preview</h3>
          <p className="text-xs text-[var(--fg-subtle)]">
            Rough syllable estimates and spelled-ending rhyme keys—not a phonetic dictionary,
            not a performance or audio test. Actual vocal phrasing depends on accent and delivery.
          </p>
          {linePreview.map((item, i) => (
            <div key={i} className="border-t border-[var(--border)] pt-2 text-xs">
              <span className="font-mono text-[var(--fg-muted)]">{sectionLabel(item.section)} · ~{item.syllables} syllables · ending “{item.rhyme || "?"}”</span>
              <p className="text-[var(--fg)] mt-1">{item.line}</p>
            </div>
          ))}
          {!linePreview.length && <p className="text-xs text-[var(--fg-muted)]">Paste lyrics to preview estimated rhythm and rhyme.</p>}
        </div>
      </section>
    </div>
  );
}
