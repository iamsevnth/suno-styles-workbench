import React, { useEffect, useState, useRef } from "react";
import LyricsStudio from "./components/LyricsStudio.tsx";
import { generateStylesPrompts } from "./lib/suno/generate.ts";
import { parseUserInput } from "./lib/suno/parse.ts";
import { SKILLS, skillById } from "./lib/suno/skills/catalog.ts";
import { runSkill, SkillReport } from "./lib/suno/skills/run.ts";
import { pickSuggestions, SURPRISE_BRIEF } from "./lib/suno/suggestions.ts";
import { historyFileStamp, toTitleCase } from "./lib/suno/title-case.ts";
import { GenerateResult, HistoryEntry, PromptCandidate } from "./lib/suno/types.ts";
import { formatAllPromptsTxt } from "./lib/suno/v6.ts";

const STORAGE_KEY = "suno-styles-generator:v1";
const HISTORY_KEY = "suno-styles-history:v1";
const SUGGEST_KEY = "suno-styles-suggestions:v1";
const DEFAULT_COUNT = 3;

interface ModalState {
  open: boolean;
  kind: "ok" | "error";
  title: string;
  body: string;
}

export default function App() {
  const [view, setView] = useState<"styles" | "lyrics" | "skills">("styles");
  const [input, setInput] = useState<string>("");
  const [count, setCount] = useState<number>(DEFAULT_COUNT);
  const [profileEnabled, setProfileEnabled] = useState<boolean>(true);
  const [generation, setGeneration] = useState<number>(0);
  const [seedUsed, setSeedUsed] = useState<number>(0);
  const [prompts, setPrompts] = useState<PromptCandidate[]>([]);
  const [parsed, setParsed] = useState<GenerateResult["parsed"] | null>(null);
  const [lastAction, setLastAction] = useState<string>("");
  const [suggestions, setSuggestions] = useState<string[]>([SURPRISE_BRIEF]);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [historyOpen, setHistoryOpen] = useState<boolean>(true);
  const [expandedPlans, setExpandedPlans] = useState<Record<number, boolean>>({});
  const [openHistory, setOpenHistory] = useState<Record<string, boolean>>({});
  const [cliOpen, setCliOpen] = useState<boolean>(false);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);

  // Skills Studio state
  const [skillId, setSkillId] = useState<string>("optimizer");
  const [skillFields, setSkillFields] = useState<Record<string, string>>({});
  const [skillReport, setSkillReport] = useState<SkillReport | null>(null);
  const [skillError, setSkillError] = useState<string>("");

  // Modal feedback
  const [modal, setModal] = useState<ModalState>({
    open: false,
    kind: "ok",
    title: "",
    body: "",
  });

  const briefRef = useRef<HTMLTextAreaElement>(null);
  const workbenchRef = useRef<HTMLDivElement>(null);

  // User Resizable Interface Dimensions (Width & Height)
  const [workbenchWidth, setWorkbenchWidth] = useState<number | null>(() => {
    try {
      const saved = sessionStorage.getItem("suno_wb_width");
      return saved ? parseInt(saved, 10) : null;
    } catch {
      return null;
    }
  });

  const [workbenchHeight, setWorkbenchHeight] = useState<number | null>(() => {
    try {
      const saved = sessionStorage.getItem("suno_wb_height");
      return saved ? parseInt(saved, 10) : null;
    } catch {
      return null;
    }
  });

  const [isResizing, setIsResizing] = useState<"width-right" | "width-left" | "height" | "both" | null>(null);

  const startResize = (mode: "width-right" | "width-left" | "height" | "both", e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const startX = e.clientX;
    const startY = e.clientY;
    const container = workbenchRef.current;
    if (!container) return;

    const rect = container.getBoundingClientRect();
    const startW = rect.width;
    const startH = rect.height;

    setIsResizing(mode);
    document.body.style.userSelect = "none";
    document.body.style.cursor =
      mode === "height" ? "ns-resize" : mode === "both" ? "nwse-resize" : "ew-resize";

    const onPointerMove = (moveEvent: PointerEvent) => {
      if (mode === "width-right" || mode === "both") {
        const deltaX = moveEvent.clientX - startX;
        const newWidth = Math.max(680, Math.min(window.innerWidth - 24, Math.round(startW + deltaX * 2)));
        setWorkbenchWidth(newWidth);
      } else if (mode === "width-left") {
        const deltaX = startX - moveEvent.clientX;
        const newWidth = Math.max(680, Math.min(window.innerWidth - 24, Math.round(startW + deltaX * 2)));
        setWorkbenchWidth(newWidth);
      }

      if (mode === "height" || mode === "both") {
        const deltaY = moveEvent.clientY - startY;
        const newHeight = Math.max(500, Math.round(startH + deltaY));
        setWorkbenchHeight(newHeight);
      }
    };

    const onPointerUp = () => {
      setIsResizing(null);
      document.body.style.userSelect = "";
      document.body.style.cursor = "";
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);

      if (workbenchRef.current) {
        const finalRect = workbenchRef.current.getBoundingClientRect();
        if (mode.startsWith("width") || mode === "both") {
          sessionStorage.setItem("suno_wb_width", Math.round(finalRect.width).toString());
        }
        if (mode === "height" || mode === "both") {
          sessionStorage.setItem("suno_wb_height", Math.round(finalRect.height).toString());
        }
      }
    };

    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
  };

  const handleResetSize = () => {
    setWorkbenchWidth(null);
    setWorkbenchHeight(null);
    sessionStorage.removeItem("suno_wb_width");
    sessionStorage.removeItem("suno_wb_height");
  };

  const handleToggleFullWidth = () => {
    if (workbenchWidth && workbenchWidth > window.innerWidth - 60) {
      handleResetSize();
    } else {
      const full = window.innerWidth - 32;
      setWorkbenchWidth(full);
      sessionStorage.setItem("suno_wb_width", full.toString());
    }
  };

  // Initialize from storage
  useEffect(() => {
    try {
      const snapRaw = sessionStorage.getItem(STORAGE_KEY);
      if (snapRaw) {
        const snap = JSON.parse(snapRaw);
        if (snap.input !== undefined) setInput(snap.input);
        if (snap.count !== undefined) setCount(snap.count);
        if (snap.profileEnabled !== undefined) setProfileEnabled(snap.profileEnabled);
        if (snap.generation !== undefined) setGeneration(snap.generation);
        if (snap.seedUsed !== undefined) setSeedUsed(snap.seedUsed);
        if (snap.lastAction !== undefined) setLastAction(snap.lastAction);
        if (snap.hasResults && snap.result?.prompts) {
          setPrompts(snap.result.prompts);
          setParsed(snap.result.parsed);
        }
      }
    } catch {
      /* ignore */
    }

    try {
      const chipsRaw = sessionStorage.getItem(SUGGEST_KEY);
      if (chipsRaw) {
        const chips = JSON.parse(chipsRaw);
        if (Array.isArray(chips) && chips.length) {
          setSuggestions(chips[0] === SURPRISE_BRIEF ? chips : [SURPRISE_BRIEF, ...chips]);
        }
      } else {
        const initial = pickSuggestions(Date.now() >>> 0);
        setSuggestions(initial);
        sessionStorage.setItem(SUGGEST_KEY, JSON.stringify(initial));
      }
    } catch {
      /* ignore */
    }

    try {
      const histRaw = localStorage.getItem(HISTORY_KEY);
      if (histRaw) {
        const hist = JSON.parse(histRaw);
        if (Array.isArray(hist)) setHistory(hist);
      }
    } catch {
      /* ignore */
    }

    // Hash router support
    const handleHash = () => {
      const h = window.location.hash.replace("#", "");
      if (h === "skills") setView("skills");
      else if (h === "lyrics") setView("lyrics");
      else setView("styles");
    };
    handleHash();
    window.addEventListener("hashchange", handleHash);

    // Initial skill fields
    const def = skillById("optimizer");
    if (def) {
      const initFields: Record<string, string> = {};
      def.fields.forEach((f) => {
        initFields[f.key] = f.kind === "select" && f.options?.[0] ? f.options[0].value : "";
      });
      setSkillFields(initFields);
    }

    return () => window.removeEventListener("hashchange", handleHash);
  }, []);

  // Save session state
  const saveSession = (
    newInput: string,
    newCount: number,
    newProf: boolean,
    newGen: number,
    newSeed: number,
    newAction: string,
    newPrompts: PromptCandidate[],
    newParsed: GenerateResult["parsed"] | null
  ) => {
    try {
      sessionStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          input: newInput,
          count: newCount,
          profileEnabled: newProf,
          generation: newGen,
          seedUsed: newSeed,
          lastAction: newAction,
          hasResults: newPrompts.length > 0,
          result: newPrompts.length ? { prompts: newPrompts, parsed: newParsed } : undefined,
        })
      );
    } catch {
      /* ignore */
    }
  };

  const showDialog = (kind: "ok" | "error", title: string, body: string) => {
    setModal({ open: true, kind, title, body });
  };

  const copyToClipboard = async (text: string): Promise<boolean> => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
        return true;
      }
    } catch {
      /* fallback below */
    }
    try {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.setAttribute("readonly", "");
      ta.style.position = "fixed";
      ta.style.left = "-9999px";
      document.body.appendChild(ta);
      ta.select();
      const ok = document.execCommand("copy");
      ta.remove();
      return ok;
    } catch {
      return false;
    }
  };

  const handleGenerate = () => {
    const brief = input.trim();
    if (!brief) {
      const msg = "Enter a creative brief first — nothing was generated.";
      setLastAction(msg);
      saveSession(input, count, profileEnabled, generation, seedUsed, msg, prompts, parsed);
      return;
    }

    setIsGenerating(true);
    try {
      const seed = (Math.floor(Math.random() * 1e9) ^ Date.now()) >>> 0;
      const avoidFingerprints = history
        .filter((e) => e.brief.trim() === brief)
        .flatMap((e) => (e.prompts || []).map((p) => p.recipeId).filter(Boolean))
        .slice(-80) as string[];

      const out = generateStylesPrompts(brief, {
        count,
        profileEnabled,
        seed,
        avoidFingerprints,
      });

      const nextGen = generation + 1;
      setSeedUsed(seed);
      setPrompts(out.prompts);
      setParsed(out.parsed);
      setGeneration(nextGen);
      setExpandedPlans({});

      const newEntry: HistoryEntry = {
        id: `${Date.now()}-${seed}`,
        createdAt: new Date().toISOString(),
        brief,
        seed,
        profileEnabled,
        prompts: out.prompts.map((p) => ({
          title: p.title,
          styles: p.styles,
          characters: p.characters,
          bpm: p.bpm,
          score: p.score,
          primaryGenre: p.plan.primaryGenre,
          secondaryGenre: p.plan.secondaryGenre,
          accentGenre: p.plan.accentGenre,
          recipeId: p.plan.recipeId,
        })),
      };

      const updatedHistory = [...history, newEntry];
      setHistory(updatedHistory);
      localStorage.setItem(HISTORY_KEY, JSON.stringify(updatedHistory));

      const head = out.prompts[0]?.styles.slice(0, 48).replace(/\s+/g, " ") ?? "";
      const bpmNote = out.parsed.bpm != null ? `${out.parsed.bpm} BPM` : "BPM inferred";
      const actionMsg = `seed ${seed} · ${bpmNote} · ${out.prompts.length} styles · "${head}..."`;
      setLastAction(actionMsg);

      saveSession(brief, count, profileEnabled, nextGen, seed, actionMsg, out.prompts, out.parsed);
    } catch (err: unknown) {
      const errMessage = err instanceof Error ? err.message : "unknown error";
      const failMsg = `Generate failed: ${errMessage}. Try again.`;
      setLastAction(failMsg);
      saveSession(brief, count, profileEnabled, generation, seedUsed, failMsg, prompts, parsed);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleReset = () => {
    setInput("");
    setCount(DEFAULT_COUNT);
    setProfileEnabled(true);
    setGeneration(0);
    setSeedUsed(0);
    setPrompts([]);
    setParsed(null);
    setExpandedPlans({});
    const msg = "Reset — brief and current variations cleared. History kept.";
    setLastAction(msg);
    sessionStorage.removeItem(STORAGE_KEY);
    saveSession("", DEFAULT_COUNT, true, 0, 0, msg, [], null);
    briefRef.current?.focus();
  };

  const handleClearResults = () => {
    setPrompts([]);
    setExpandedPlans({});
    const msg = "Current results cleared. Brief and history kept.";
    setLastAction(msg);
    saveSession(input, count, profileEnabled, generation, seedUsed, msg, [], parsed);
  };

  const handleRefreshSuggestions = () => {
    const next = pickSuggestions((Math.random() * 1e9) >>> 0);
    setSuggestions(next);
    sessionStorage.setItem(SUGGEST_KEY, JSON.stringify(next));
    const msg = "Example briefs refreshed — click one to fill the brief box.";
    setLastAction(msg);
    saveSession(input, count, profileEnabled, generation, seedUsed, msg, prompts, parsed);
  };

  const handleApplySuggestion = (text: string) => {
    setInput(text);
    const msg = "Brief filled from an example — press Generate Styles to compile.";
    setLastAction(msg);
    saveSession(text, count, profileEnabled, generation, seedUsed, msg, prompts, parsed);
    if (briefRef.current) {
      briefRef.current.value = text;
      briefRef.current.focus();
    }
  };

  const handleCopyStyle = async (stylesText: string) => {
    const ok = await copyToClipboard(stylesText);
    showDialog(
      ok ? "ok" : "error",
      ok ? "Copied" : "Clipboard Blocked",
      ok
        ? "This style was copied to your clipboard. You can paste it into the Suno Styles field."
        : "This browser is not allowing the file to copy text. Allow clipboard access for this site in settings, or select the style text and copy it manually (Ctrl+C / Cmd+C)."
    );
  };

  const handleCopyAllPrompts = async () => {
    if (!prompts.length) return;
    const text = formatAllPromptsTxt(prompts);
    const filename = `suno-styles-${historyFileStamp()}.txt`;
    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.rel = "noopener";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);

    const ok = await copyToClipboard(text);
    showDialog(
      "ok",
      ok ? "Copied All Prompts" : "Prompts Downloaded",
      ok
        ? `${filename} was downloaded. The same pack is on your clipboard.`
        : `${filename} was saved. Clipboard access is blocked — open the text file if you need to paste.`
    );
    const msg = `Downloaded ${filename}`;
    setLastAction(msg);
    saveSession(input, count, profileEnabled, generation, seedUsed, msg, prompts, parsed);
  };

  const handleExportHistory = () => {
    if (!history.length) return;
    const filename = `suno-history-${historyFileStamp()}.json`;
    const blob = new Blob(
      [
        JSON.stringify(
          {
            exportedAt: new Date().toISOString(),
            count: history.length,
            entries: history,
          },
          null,
          2
        ),
      ],
      { type: "application/json" }
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.rel = "noopener";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);

    const msg = `Exported ${filename}`;
    setLastAction(msg);
    saveSession(input, count, profileEnabled, generation, seedUsed, msg, prompts, parsed);
  };

  const handleClearHistory = () => {
    setHistory([]);
    setOpenHistory({});
    localStorage.removeItem(HISTORY_KEY);
    const msg = "History cleared.";
    setLastAction(msg);
    saveSession(input, count, profileEnabled, generation, seedUsed, msg, prompts, parsed);
  };

  const handleDownloadOfflineHtml = () => {
    const link = document.createElement("a");
    link.href = "/suno-workbench.html";
    link.download = "suno-workbench.html";
    document.body.appendChild(link);
    link.click();
    link.remove();
    showDialog(
      "ok",
      "Offline HTML Downloaded",
      "suno-workbench.html has been saved. Double-click it locally on your desktop to run completely offline without servers or internet."
    );
  };

  // Skill actions
  const handleSelectSkill = (id: string) => {
    setSkillId(id);
    setSkillReport(null);
    setSkillError("");
    const def = skillById(id);
    if (def) {
      const initFields: Record<string, string> = {};
      def.fields.forEach((f) => {
        initFields[f.key] = f.kind === "select" && f.options?.[0] ? f.options[0].value : "";
      });
      setSkillFields(initFields);
    }
  };

  const handleRunSkill = (e: React.FormEvent) => {
    e.preventDefault();
    const def = skillById(skillId);
    if (!def) return;
    const missing = def.fields.filter(
      (f) => f.required && !String(skillFields[f.key] || "").trim()
    );
    if (missing.length) {
      setSkillError(`Fill ${missing.map((m) => m.label).join(", ")} first.`);
      setSkillReport(null);
      return;
    }
    setSkillError("");
    try {
      const report = runSkill(skillId, skillFields);
      setSkillReport(report);
    } catch {
      setSkillError("Could not run this skill on that input.");
      setSkillReport(null);
    }
  };

  const formatReportText = (r: SkillReport) => {
    const bits = [
      `# ${r.title}`,
      "",
      r.exclusion,
      "",
      ...r.sections.flatMap((s) => [`## ${s.heading}`, s.body, ""]),
    ];
    if (r.sliders?.length) {
      bits.push("## Slider Starting Points");
      r.sliders.forEach((s) => {
        bits.push(
          `${s.label}: Weirdness ${s.weirdness} · Style ${s.style} · Audio ${s.audio} — ${s.why}`
        );
      });
      bits.push("");
    }
    if (r.styles?.length) {
      bits.push("## Compiled Styles");
      r.styles.forEach((p) => bits.push(`${p.title}\n\n${p.styles}\n`));
    }
    bits.push(r.verified);
    return bits.join("\n");
  };

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--fg)] flex flex-col font-sans">
      {/* Studio Masthead Bar */}
      <header className="border-b border-[var(--border)] bg-[var(--bg-elevated)]/80 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-[76rem] mx-auto px-4 sm:px-6 py-2.5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-[var(--accent)] text-[var(--accent-fg)] font-black text-xs shadow-md">
              ⚡
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold tracking-tight text-sm text-[var(--fg)]">
                  SUNO WORKBENCH
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5 font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  CLIENT-SIDE ENGINE
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleDownloadOfflineHtml}
              className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-[var(--border)] bg-[var(--bg)] hover:bg-[var(--bg-subtle)] text-[var(--fg)] text-xs font-semibold h-8 px-3 transition-colors shadow-sm"
              title="Download 100% self-contained offline HTML file"
            >
              <span>💾</span>
              <span>Download Offline HTML</span>
            </button>

            {view === "styles" && (
              <button
                type="button"
                onClick={() => setCliOpen(!cliOpen)}
                className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-[var(--border)] bg-[var(--bg)] hover:bg-[var(--bg-subtle)] text-[var(--fg-muted)] hover:text-[var(--fg)] text-xs font-medium h-8 px-2.5 transition-colors"
              >
                <span>Terminal</span>
                <span>{cliOpen ? "▴" : "▾"}</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Windows Terminal Disclosure */}
      {view === "styles" && cliOpen && (
        <div className="border-b border-[var(--border)] bg-[var(--bg-elevated)]/90 py-4">
          <div className="max-w-[76rem] mx-auto px-4 sm:px-6">
            <p className="text-sm text-[var(--fg-muted)] mb-3">
              This offline file is the full app. The Node CLI still exists in the original project if you have it:
            </p>
            <pre className="overflow-x-auto rounded-[var(--r-md)] border border-[var(--border)] bg-[var(--bg)] p-4 font-mono text-xs text-[var(--fg-muted)] leading-relaxed">
{`npm run suno -- "Future Bass + UKG"
npm run suno -- "140 BPM dark" -n 5
npm run suno -- --no-profile "92 BPM neo-soul, male vocal"
node cli/suno-styles.mjs "Trapstep + Deep Dubstep" -n 3`}
            </pre>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main
        className="mx-auto px-2 sm:px-4 py-4 sm:py-6 flex-1 w-full flex flex-col items-center gap-6"
        style={{
          width: workbenchWidth ? `${workbenchWidth}px` : "100%",
          maxWidth: workbenchWidth ? `${workbenchWidth}px` : "76rem",
        }}
      >
        {/* Built-in Studio Console Deck with Integrated Docked Tabs & Resizable Edge Handles */}
        <div
          ref={workbenchRef}
          className={`rounded-2xl border border-[var(--border)] bg-[var(--bg-elevated)] shadow-2xl flex flex-col relative w-full overflow-hidden ${
            isResizing ? "select-none ring-2 ring-[var(--accent)]/50" : ""
          }`}
          style={{
            minHeight: workbenchHeight ? `${workbenchHeight}px` : "auto",
            height: workbenchHeight ? `${workbenchHeight}px` : "auto",
          }}
        >
          {/* Integrated Built-in Docked Tab Strip */}
          <nav
            className="flex items-stretch border-b border-[var(--border)] bg-[var(--bg)] overflow-x-auto"
            aria-label="Integrated Studio Navigation Tabs"
          >
            {/* Tab 1: Suno Workbench */}
            <button
              type="button"
              onClick={() => {
                setView("styles");
                window.location.hash = "styles";
              }}
              className={`flex-1 min-w-[210px] sm:min-w-[250px] px-5 py-3.5 text-left border-r border-[var(--border)] transition-all relative flex items-center justify-between gap-3 ${
                view === "styles"
                  ? "bg-[var(--bg-elevated)] text-[var(--fg)] shadow-sm"
                  : "bg-[var(--bg)] text-[var(--fg-muted)] hover:text-[var(--fg)] hover:bg-[var(--bg-subtle)]/60"
              }`}
            >
              {view === "styles" && (
                <span className="absolute top-0 left-0 right-0 h-[3px] bg-[var(--accent)]" />
              )}
              <div className="flex flex-col">
                <span className="font-semibold text-sm text-[var(--fg)]">
                  Suno Workbench
                </span>
                <span className="text-[11px] text-[var(--fg-subtle)] mt-0.5">
                  Styles Compiler (925–975c)
                </span>
              </div>
              <span
                className={`text-[10px] px-2 py-0.5 rounded font-mono ${
                  view === "styles"
                    ? "bg-[var(--accent)]/15 text-[var(--accent)] border border-[var(--accent)]/30 font-semibold"
                    : "bg-[var(--bg-subtle)] text-[var(--fg-subtle)]"
                }`}
              >
                258 Genres
              </span>
            </button>

            {/* Tab 2: Lyrics Studio */}
            <button
              type="button"
              onClick={() => {
                setView("lyrics");
                window.location.hash = "lyrics";
              }}
              className={`flex-1 min-w-[230px] sm:min-w-[280px] px-5 py-3.5 text-left border-r border-[var(--border)] transition-all relative flex items-center justify-between gap-3 ${
                view === "lyrics"
                  ? "bg-[var(--bg-elevated)] text-[var(--fg)] shadow-sm"
                  : "bg-[var(--bg)] text-[var(--fg-muted)] hover:text-[var(--fg)] hover:bg-[var(--bg-subtle)]/60"
              }`}
            >
              {view === "lyrics" && (
                <span className="absolute top-0 left-0 right-0 h-[3px] bg-[var(--accent)]" />
              )}
              <div className="flex flex-col">
                <span className="font-semibold text-sm text-[var(--fg)]">
                  Lyrics Studio
                </span>
                <span className="text-[11px] text-[var(--fg-subtle)] mt-0.5">
                  Modular Sequence & American Phonetics
                </span>
              </div>
              <span
                className={`text-[10px] px-2 py-0.5 rounded font-mono ${
                  view === "lyrics"
                    ? "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 font-semibold"
                    : "bg-[var(--bg-subtle)] text-[var(--fg-subtle)]"
                }`}
              >
                Lyrics & Vocal
              </span>
            </button>

            {/* Tab 3: Skills Studio */}
            <button
              type="button"
              onClick={() => {
                setView("skills");
                window.location.hash = "skills";
              }}
              className={`flex-1 min-w-[200px] sm:min-w-[240px] px-5 py-3.5 text-left transition-all relative flex items-center justify-between gap-3 ${
                view === "skills"
                  ? "bg-[var(--bg-elevated)] text-[var(--fg)] shadow-sm"
                  : "bg-[var(--bg)] text-[var(--fg-muted)] hover:text-[var(--fg)] hover:bg-[var(--bg-subtle)]/60"
              }`}
            >
              {view === "skills" && (
                <span className="absolute top-0 left-0 right-0 h-[3px] bg-[var(--accent)]" />
              )}
              <div className="flex flex-col">
                <span className="font-semibold text-sm text-[var(--fg)]">
                  Skills Studio
                </span>
                <span className="text-[11px] text-[var(--fg-subtle)] mt-0.5">
                  8 Production Playbooks & Sliders
                </span>
              </div>
              <span
                className={`text-[10px] px-2 py-0.5 rounded font-mono ${
                  view === "skills"
                    ? "bg-[var(--accent)]/15 text-[var(--accent)] border border-[var(--accent)]/30 font-semibold"
                    : "bg-[var(--bg-subtle)] text-[var(--fg-subtle)]"
                }`}
              >
                Playbooks
              </span>
            </button>
          </nav>

          {/* Integrated Console Deck Sub-header Strip */}
          <div className="px-5 sm:px-6 py-4 bg-[var(--bg-elevated)] border-b border-[var(--border)] flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[var(--fg)]">
                {view === "styles"
                  ? "Suno Styles Generator"
                  : view === "lyrics"
                  ? "Lyrics Studio"
                  : "Skills Studio"}
              </h1>
              <p className="text-xs text-[var(--fg-muted)] mt-1 max-w-2xl leading-relaxed">
                {view === "styles"
                  ? "Starts blank. Generate Styles is the only action that compiles prompts. Reset clears the brief — session history stays in the list below. Covers, lyrics, Editor, and Studio live in Skills Studio."
                  : view === "lyrics"
                  ? "Complete and expand your lyrics with exact section counts & line lengths for intro, verse, buildup, drop, chorus, breakdown, bridge, and outro — plus convert to American English phonetics with zero hyphens."
                  : "Eight installed playbooks: optimize prompts, plan covers and mashups, write lyrics, run Editor/Studio checklists, and gate rights. Styles compilation still lives on the Styles Compiler page."}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 text-xs font-mono text-[var(--fg-subtle)]">
              <span className="px-3 py-1 rounded-lg bg-[var(--bg)] border border-[var(--border)] text-[var(--fg-muted)]">
                {view === "styles"
                  ? "Exact 925–975 Chars"
                  : view === "lyrics"
                  ? "Modular Flow & American Phonetics"
                  : "8 Playbooks Ready"}
              </span>

              {/* Dynamic Size Indicator & Controls */}
              {(workbenchWidth || workbenchHeight) && (
                <span className="px-2.5 py-1 rounded-lg bg-[var(--accent)]/15 text-[var(--accent)] border border-[var(--accent)]/30 font-semibold flex items-center gap-1.5 text-[11px]">
                  <span>⤢</span>
                  <span>
                    {workbenchWidth ? `${workbenchWidth}w` : "Auto"} × {workbenchHeight ? `${workbenchHeight}h` : "Auto"}
                  </span>
                </span>
              )}

              {(workbenchWidth || workbenchHeight) && (
                <button
                  type="button"
                  onClick={handleResetSize}
                  className="px-2.5 py-1 rounded-lg bg-[var(--bg)] hover:bg-[var(--bg-subtle)] text-[var(--fg-muted)] hover:text-[var(--fg)] border border-[var(--border)] transition-colors flex items-center gap-1 text-[11px]"
                  title="Reset interface dimensions to default"
                >
                  <span>⟲</span>
                  <span>Reset Size</span>
                </button>
              )}

              <button
                type="button"
                onClick={handleToggleFullWidth}
                className="px-2.5 py-1 rounded-lg bg-[var(--bg)] hover:bg-[var(--bg-subtle)] text-[var(--fg-muted)] hover:text-[var(--fg)] border border-[var(--border)] transition-colors hidden sm:flex items-center gap-1 text-[11px]"
                title={workbenchWidth && workbenchWidth > window.innerWidth - 60 ? "Restore default width" : "Expand to full screen width"}
              >
                <span>{workbenchWidth && workbenchWidth > window.innerWidth - 60 ? "⤡" : "⤢"}</span>
                <span>{workbenchWidth && workbenchWidth > window.innerWidth - 60 ? "Default Width" : "Full Width"}</span>
              </button>
            </div>
          </div>

          {/* Content Deck Body */}
          <div className="p-5 sm:p-6 bg-[var(--bg)] flex-1 overflow-y-auto">
            {view === "styles" ? (
              <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] lg:gap-8">
            {/* Left Column: Brief & Controls */}
            <section className="bg-[var(--bg-elevated)] border border-[var(--border)] rounded-[var(--r-xl)] shadow-[var(--shadow)] p-5 flex flex-col gap-5">
              <div>
                <label htmlFor="brief" className="block text-sm font-medium mb-1.5 text-[var(--fg)]">
                  Enter Your Creative Brief Here
                </label>
                <textarea
                  id="brief"
                  ref={briefRef}
                  rows={8}
                  value={input}
                  onChange={(e) => {
                    setInput(e.target.value);
                  }}
                  placeholder="Start here — e.g. Trap + Baile Funk + Deep Dubstep, kinetic, 140 BPM"
                  className="w-full rounded-[var(--r-md)] border border-[var(--border)] bg-[var(--bg)] text-[var(--fg)] p-3 text-sm focus:border-[var(--ring)] transition-all resize-y"
                />
              </div>

              <div>
                <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                  <span className="text-sm font-medium text-[var(--fg)]">
                    Example Briefs (Click to Add to the Brief Box)
                  </span>
                  <button
                    type="button"
                    onClick={handleRefreshSuggestions}
                    className="h-8 px-2.5 rounded-[var(--r-md)] text-xs text-[var(--fg-muted)] hover:text-[var(--fg)] bg-[var(--bg)] hover:bg-[var(--bg-subtle)] border border-[var(--border)] transition-colors"
                  >
                    Refresh
                  </button>
                </div>
                <div className="flex flex-col gap-2">
                  {suggestions.map((ex, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => handleApplySuggestion(ex)}
                      className="w-full text-left whitespace-normal break-words rounded-[var(--r-md)] border border-[var(--border)] bg-[var(--bg)] p-3 text-xs leading-relaxed text-[var(--fg-muted)] hover:border-[var(--border-strong)] hover:text-[var(--fg)] transition-all"
                    >
                      {i === 0 && (
                        <span className="block text-[10px] tracking-wider uppercase text-[var(--fg-subtle)] mb-0.5">
                          Always Available
                        </span>
                      )}
                      {ex}
                    </button>
                  ))}
                </div>
              </div>

              {/* Variants and Profile */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="count" className="block text-sm font-medium mb-1.5 text-[var(--fg)]">
                    Variants
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      id="count"
                      type="range"
                      min={1}
                      max={6}
                      value={count}
                      onChange={(e) => setCount(Number(e.target.value))}
                      className="w-full accent-[var(--accent)] cursor-pointer"
                    />
                    <span className="font-mono text-sm tabular-nums w-6 text-center text-[var(--fg)]">
                      {count}
                    </span>
                  </div>
                </div>

                <div>
                  <label className="flex h-11 items-center justify-between gap-3 rounded-[var(--r-md)] border border-[var(--border)] bg-[var(--bg)] px-3 text-sm cursor-pointer select-none">
                    <span className="text-[var(--fg)] font-medium">Hybrid Bass Profile</span>
                    <input
                      type="checkbox"
                      checked={profileEnabled}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        setProfileEnabled(checked);
                        const msg = checked
                          ? "Hybrid bass profile on — used on the next Generate Styles."
                          : "Hybrid bass profile off — used on the next Generate Styles.";
                        setLastAction(msg);
                      }}
                      className="w-4 h-4 accent-[var(--accent)] rounded cursor-pointer"
                    />
                  </label>
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-wrap gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleGenerate}
                  disabled={isGenerating}
                  className="flex-1 inline-flex items-center justify-center h-11 rounded-[var(--r-md)] bg-[var(--accent)] hover:opacity-90 text-[var(--accent-fg)] font-semibold text-sm transition-all"
                >
                  {isGenerating ? "Generating..." : "Generate Styles"}
                </button>
                <button
                  type="button"
                  onClick={handleReset}
                  className="inline-flex items-center justify-center h-11 px-4 rounded-[var(--r-md)] border border-[var(--border)] bg-[var(--bg-elevated)] hover:border-red-400/40 hover:bg-red-500/10 text-[var(--fg)] text-sm font-medium transition-all"
                >
                  Reset
                </button>
              </div>

              {/* Status */}
              {lastAction && (
                <p className="text-xs text-[var(--fg-muted)] transition-opacity" role="status">
                  {lastAction}
                </p>
              )}

              {/* Parsed Intent */}
              <div className="rounded-[var(--r-md)] border border-[var(--border)] bg-[var(--bg)] p-3 text-xs text-[var(--fg-muted)]">
                <div className="flex items-center gap-1.5 font-medium text-[var(--fg)] mb-1.5">
                  <span>Parsed Intent</span>
                </div>
                {!prompts.length && !input.trim() ? (
                  <p className="text-[var(--fg-subtle)]">Waiting for a brief — nothing loaded by default.</p>
                ) : (
                  <div className="font-mono tabular-nums flex flex-col gap-1">
                    <div>
                      Genres:{" "}
                      <span className="text-[var(--fg)]">
                        {parsed?.genres?.join(" · ") || (input.trim() ? "will infer on generate" : "—")}
                      </span>
                    </div>
                    <div>
                      BPM: <span className="text-[var(--fg)]">{parsed?.bpm ?? "—"}</span> · Moods:{" "}
                      <span className="text-[var(--fg)]">
                        {(parsed?.moods || []).slice(0, 4).join(", ") || "—"}
                      </span>
                    </div>
                    <div>
                      Mode: <span className="text-[var(--fg)]">{parsed?.mode || "—"}</span> · Profile:{" "}
                      <span className="text-[var(--fg)]">{profileEnabled ? "on" : "off"}</span> · Seed:{" "}
                      <span className="text-[var(--fg)]">{seedUsed || "—"}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Trust Notes */}
              <ul className="list-none p-0 m-0 flex flex-col gap-1.5 text-xs text-[var(--fg-subtle)] pt-1">
                <li className="flex items-start gap-2">
                  <span className="w-2 h-2 rounded-full bg-[var(--ok)] mt-1 shrink-0" />
                  <span>Only Generate Styles compiles prompts — profile, examples, and sliders never do</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-2 h-2 rounded-full bg-[var(--ok)] mt-1 shrink-0" />
                  <span>Export History downloads a uniquely dated JSON file to your computer</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-2 h-2 rounded-full bg-[var(--ok)] mt-1 shrink-0" />
                  <span>96 Mateus library genres + 40 hybrid formulas · 925–975 total characters · integer BPM · no artist names</span>
                </li>
              </ul>
            </section>

            {/* Right Column: Results */}
            <section className="flex flex-col gap-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-sm font-medium text-[var(--fg-muted)]">
                  {prompts.length === 0
                    ? "No Variations Yet"
                    : `${prompts.length} Prompt${prompts.length === 1 ? "" : "s"}${
                        generation > 0 ? ` · gen ${generation}` : ""
                      }`}
                </h2>
                {prompts.length > 0 && (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleCopyAllPrompts}
                      className="h-8 px-3 rounded-[var(--r-md)] border border-[var(--border)] bg-[var(--bg)] hover:bg-[var(--bg-subtle)] text-xs text-[var(--fg-muted)] hover:text-[var(--fg)] font-medium transition-colors"
                    >
                      Copy All Prompts
                    </button>
                    <button
                      type="button"
                      onClick={handleClearResults}
                      className="h-8 px-3 rounded-[var(--r-md)] border border-[var(--border)] bg-[var(--bg)] hover:bg-red-500/10 hover:border-red-400/40 text-xs text-[var(--fg-muted)] hover:text-red-300 font-medium transition-colors"
                    >
                      Clear Results
                    </button>
                  </div>
                )}
              </div>

              {prompts.length === 0 ? (
                <div className="bg-[var(--bg-elevated)] border border-[var(--border)] rounded-[var(--r-xl)] shadow-[var(--shadow)] p-6 text-sm text-[var(--fg-muted)]">
                  <strong className="block text-[var(--fg)] text-base mb-2">Blank Canvas</strong>
                  <p>
                    Type a creative brief (or click an example to fill it), then press{" "}
                    <span className="text-[var(--fg)] font-medium">Generate Styles</span>. Nothing else compiles prompts.
                  </p>
                  <p className="text-xs text-[var(--fg-subtle)] mt-3">
                    Use Reset to wipe the brief and current results. History stays until you clear it.
                  </p>
                </div>
              ) : (
                prompts.map((p, idx) => {
                  const open = !!expandedPlans[idx];
                  const plan = p.plan || {};
                  return (
                    <article
                      key={idx}
                      className="bg-[var(--bg-elevated)] border border-[var(--border)] rounded-[var(--r-xl)] shadow-[var(--shadow)] overflow-hidden"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3 p-4 border-b border-[var(--border)]">
                        <div>
                          <h3 className="text-base font-semibold text-[var(--fg)]">
                            {toTitleCase(p.title)}
                          </h3>
                          <div className="mt-1">
                            <span className="font-mono text-xs rounded-full border border-[var(--border)] bg-[var(--bg)] px-2 py-0.5 text-[var(--fg-muted)]">
                              {p.characters} total characters
                            </span>
                          </div>
                          {p.issues?.length ? (
                            <p className="text-xs text-[var(--danger)] mt-1.5">
                              {p.issues.join(" · ")}
                            </p>
                          ) : null}
                        </div>
                        <button
                          type="button"
                          onClick={() => handleCopyStyle(p.styles)}
                          className="h-8 px-3 rounded-[var(--r-md)] border border-[var(--border)] bg-[var(--bg)] hover:bg-[var(--bg-subtle)] text-xs text-[var(--fg-muted)] hover:text-[var(--fg)] font-medium transition-colors"
                        >
                          Add Style to Clipboard
                        </button>
                      </div>

                      <div className="p-4">
                        <p className="whitespace-pre-wrap text-sm leading-relaxed text-[var(--fg-muted)]">
                          {p.styles}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          setExpandedPlans((prev) => ({ ...prev, [idx]: !prev[idx] }))
                        }
                        className="w-full flex items-center justify-between border-t border-[var(--border)] bg-transparent text-[var(--fg-muted)] hover:text-[var(--fg)] text-xs font-medium px-4 py-3 text-left transition-colors"
                      >
                        <span>
                          Sonic Plan · {plan.primaryGenre || ""}
                          {plan.secondaryGenre ? ` × ${plan.secondaryGenre}` : ""}
                          {plan.accentGenre ? ` × ${plan.accentGenre}` : ""}
                        </span>
                        <span>{open ? "▴" : "▾"}</span>
                      </button>

                      {open && (
                        <div className="grid gap-2 p-4 pt-0 grid-cols-1 sm:grid-cols-2">
                          <div className="rounded-[var(--r-sm)] border border-[var(--border)] bg-[var(--bg)] p-2.5 text-xs text-[var(--fg-muted)]">
                            <div className="text-[10px] uppercase tracking-wider text-[var(--fg-subtle)]">BPM</div>
                            <div className="text-[var(--fg)] font-mono mt-0.5">{plan.bpm}</div>
                          </div>
                          <div className="rounded-[var(--r-sm)] border border-[var(--border)] bg-[var(--bg)] p-2.5 text-xs text-[var(--fg-muted)]">
                            <div className="text-[10px] uppercase tracking-wider text-[var(--fg-subtle)]">Mood</div>
                            <div className="text-[var(--fg)] mt-0.5">{plan.moodPrimary || "—"}</div>
                          </div>
                          <div className="rounded-[var(--r-sm)] border border-[var(--border)] bg-[var(--bg)] p-2.5 text-xs text-[var(--fg-muted)]">
                            <div className="text-[10px] uppercase tracking-wider text-[var(--fg-subtle)]">Metric Feel</div>
                            <div className="text-[var(--fg)] mt-0.5">{plan.metricFeel || "—"}</div>
                          </div>
                          <div className="rounded-[var(--r-sm)] border border-[var(--border)] bg-[var(--bg)] p-2.5 text-xs text-[var(--fg-muted)]">
                            <div className="text-[10px] uppercase tracking-wider text-[var(--fg-subtle)]">Rhythm Donor</div>
                            <div className="text-[var(--fg)] mt-0.5">{plan.donors?.rhythm || "—"}</div>
                          </div>
                          <div className="rounded-[var(--r-sm)] border border-[var(--border)] bg-[var(--bg)] p-2.5 text-xs text-[var(--fg-muted)]">
                            <div className="text-[10px] uppercase tracking-wider text-[var(--fg-subtle)]">Bass Donor</div>
                            <div className="text-[var(--fg)] mt-0.5">{plan.donors?.bass || "—"}</div>
                          </div>
                          <div className="rounded-[var(--r-sm)] border border-[var(--border)] bg-[var(--bg)] p-2.5 text-xs text-[var(--fg-muted)]">
                            <div className="text-[10px] uppercase tracking-wider text-[var(--fg-subtle)]">Bass Stack</div>
                            <div className="text-[var(--fg)] mt-0.5">{(plan.bass || []).slice(0, 3).join(", ")}</div>
                          </div>
                          <div className="rounded-[var(--r-sm)] border border-[var(--border)] bg-[var(--bg)] p-2.5 text-xs text-[var(--fg-muted)]">
                            <div className="text-[10px] uppercase tracking-wider text-[var(--fg-subtle)]">Variant Axes</div>
                            <div className="text-[var(--fg)] mt-0.5">{(plan.variantAxes || []).join(" · ")}</div>
                          </div>
                          <div className="rounded-[var(--r-sm)] border border-[var(--border)] bg-[var(--bg)] p-2.5 text-xs text-[var(--fg-muted)]">
                            <div className="text-[10px] uppercase tracking-wider text-[var(--fg-subtle)]">Vocals</div>
                            <div className="text-[var(--fg)] mt-0.5">
                              {plan.vocals?.present
                                ? `${plan.vocals.presentation || "lead"} ${plan.vocals.timbre || ""} ${
                                    plan.vocals.style || ""
                                  }`.trim()
                                : "instrumental"}
                            </div>
                          </div>
                        </div>
                      )}
                    </article>
                  );
                })
              )}
            </section>
          </div>
        ) : view === "lyrics" ? (
          /* Lyrics Studio */
          <LyricsStudio onShowDialog={showDialog} copyToClipboard={copyToClipboard} />
        ) : (
          /* Skills Studio View */
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.5fr)] lg:gap-8">
            <section className="flex flex-col gap-2">
              {SKILLS.map((s) => {
                const on = s.id === skillId;
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => handleSelectSkill(s.id)}
                    className={`text-left rounded-[var(--r-md)] border p-3 transition-all ${
                      on
                        ? "border-[var(--border-strong)] bg-[var(--bg-elevated)]"
                        : "border-[var(--border)] bg-[var(--bg)] hover:border-[var(--border-strong)]"
                    }`}
                  >
                    <strong className="block text-sm font-semibold text-[var(--fg)]">{s.title}</strong>
                    <div className="text-xs text-[var(--fg-muted)] mt-1 leading-relaxed">{s.blurb}</div>
                    <div className="font-mono text-[10px] tracking-wider uppercase text-[var(--fg-subtle)] mt-1.5">
                      {s.pack}
                    </div>
                  </button>
                );
              })}
            </section>

            <section className="bg-[var(--bg-elevated)] border border-[var(--border)] rounded-[var(--r-xl)] shadow-[var(--shadow)] p-5 flex flex-col gap-5">
              {(() => {
                const def = skillById(skillId);
                if (!def) return null;
                return (
                  <>
                    <div>
                      <h2 className="text-base font-semibold text-[var(--fg)]">{def.title}</h2>
                      <p className="text-xs text-[var(--fg-muted)] mt-1">{def.blurb}</p>
                    </div>

                    <form onSubmit={handleRunSkill} className="flex flex-col gap-4">
                      {def.fields.map((f) => {
                        const val = skillFields[f.key] ?? "";
                        return (
                          <div key={f.key}>
                            <label htmlFor={`sf-${f.key}`} className="block text-xs font-medium mb-1 text-[var(--fg)]">
                              {f.label}
                            </label>
                            {f.kind === "select" ? (
                              <select
                                id={`sf-${f.key}`}
                                value={val}
                                onChange={(e) =>
                                  setSkillFields((prev) => ({ ...prev, [f.key]: e.target.value }))
                                }
                                className="w-full h-10 rounded-[var(--r-md)] border border-[var(--border)] bg-[var(--bg)] text-[var(--fg)] px-3 text-xs"
                              >
                                {(f.options || []).map((o) => (
                                  <option key={o.value} value={o.value}>
                                    {o.label}
                                  </option>
                                ))}
                              </select>
                            ) : f.kind === "textarea" ? (
                              <textarea
                                id={`sf-${f.key}`}
                                rows={f.rows || 3}
                                value={val}
                                onChange={(e) =>
                                  setSkillFields((prev) => ({ ...prev, [f.key]: e.target.value }))
                                }
                                placeholder={f.placeholder || ""}
                                className="w-full rounded-[var(--r-md)] border border-[var(--border)] bg-[var(--bg)] text-[var(--fg)] p-2.5 text-xs resize-y"
                              />
                            ) : (
                              <input
                                type="text"
                                id={`sf-${f.key}`}
                                value={val}
                                onChange={(e) =>
                                  setSkillFields((prev) => ({ ...prev, [f.key]: e.target.value }))
                                }
                                placeholder={f.placeholder || ""}
                                className="w-full h-10 rounded-[var(--r-md)] border border-[var(--border)] bg-[var(--bg)] text-[var(--fg)] px-3 text-xs"
                              />
                            )}
                          </div>
                        );
                      })}

                      {skillError && <p className="text-xs text-[var(--danger)]">{skillError}</p>}

                      <button
                        type="submit"
                        className="inline-flex items-center justify-center h-10 rounded-[var(--r-md)] bg-[var(--accent)] hover:opacity-90 text-[var(--accent-fg)] font-semibold text-xs transition-colors self-start px-5"
                      >
                        {def.runLabel}
                      </button>
                    </form>

                    {skillReport && (
                      <div className="border-t border-[var(--border)] pt-5 flex flex-col gap-4">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <h3 className="text-sm font-semibold text-[var(--fg)]">
                            {toTitleCase(skillReport.title)}
                          </h3>
                          <button
                            type="button"
                            onClick={async () => {
                              const ok = await copyToClipboard(formatReportText(skillReport));
                              showDialog(
                                ok ? "ok" : "error",
                                ok ? "Copied" : "Clipboard Blocked",
                                ok
                                  ? "The playbook is on your clipboard."
                                  : "Clipboard access blocked. Please copy manually."
                              );
                            }}
                            className="h-8 px-2.5 rounded-[var(--r-md)] border border-[var(--border)] bg-[var(--bg)] text-xs text-[var(--fg-muted)] hover:text-[var(--fg)]"
                          >
                            Add Playbook to Clipboard
                          </button>
                        </div>

                        <div className="rounded-[var(--r-md)] border border-[var(--border)] bg-[var(--bg)] p-3 text-xs text-[var(--fg-muted)] whitespace-pre-wrap leading-relaxed">
                          {skillReport.exclusion}
                        </div>

                        {skillReport.sections.map((s, i) => (
                          <article key={i} className="flex flex-col gap-1">
                            <div className="flex items-center justify-between">
                              <h4 className="text-[10px] tracking-wider uppercase font-semibold text-[var(--fg-subtle)]">
                                {s.heading}
                              </h4>
                              <button
                                type="button"
                                onClick={async () => {
                                  const ok = await copyToClipboard(s.body);
                                  showDialog(
                                    ok ? "ok" : "error",
                                    ok ? "Copied" : "Clipboard Blocked",
                                    ok ? "Section copied." : "Copy failed."
                                  );
                                }}
                                className="text-[11px] text-[var(--fg-muted)] hover:text-[var(--fg)]"
                              >
                                Copy
                              </button>
                            </div>
                            <p className="whitespace-pre-wrap text-xs text-[var(--fg-muted)] leading-relaxed">
                              {s.body}
                            </p>
                          </article>
                        ))}

                        {skillReport.sliders && skillReport.sliders.length > 0 && (
                          <div className="grid gap-2 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                            {skillReport.sliders.map((sl, i) => (
                              <div
                                key={i}
                                className="rounded-[var(--r-md)] border border-[var(--border)] bg-[var(--bg)] p-3 text-xs"
                              >
                                <strong className="block text-[var(--fg)] font-semibold">{sl.label}</strong>
                                <p className="font-mono text-[var(--fg-muted)] text-[11px] mt-1.5 leading-snug">
                                  Weirdness {sl.weirdness}
                                  <br />
                                  Style {sl.style}
                                  <br />
                                  Audio {sl.audio}
                                </p>
                                <p className="text-[11px] text-[var(--fg-subtle)] mt-2 leading-relaxed">
                                  {sl.why}
                                </p>
                              </div>
                            ))}
                          </div>
                        )}

                        {skillReport.styles && skillReport.styles.length > 0 && (
                          <div className="flex flex-col gap-2">
                            {skillReport.styles.map((p, i) => (
                              <article
                                key={i}
                                className="rounded-[var(--r-md)] border border-[var(--border)] bg-[var(--bg)] p-3 text-xs"
                              >
                                <div className="flex items-center justify-between gap-2">
                                  <strong className="text-[var(--fg)] font-semibold">{p.title}</strong>
                                  <button
                                    type="button"
                                    onClick={() => handleCopyStyle(p.styles)}
                                    className="text-[11px] text-[var(--fg-muted)] hover:text-[var(--fg)]"
                                  >
                                    Add Style to Clipboard
                                  </button>
                                </div>
                                <div className="text-[10px] text-[var(--fg-subtle)] mt-0.5">
                                  {p.characters} total characters
                                </div>
                                <p className="mt-2 text-xs text-[var(--fg-muted)] whitespace-pre-wrap leading-relaxed">
                                  {p.styles}
                                </p>
                              </article>
                            ))}
                          </div>
                        )}

                        <p className="text-[11px] text-[var(--fg-subtle)]">{skillReport.verified}</p>
                      </div>
                    )}
                  </>
                );
              })()}
            </section>
          </div>
        )}

        {/* History Section (Styles page) */}
        {view === "styles" && (
          <section className="mt-8">
            <div className="bg-[var(--bg-elevated)] border border-[var(--border)] rounded-[var(--r-xl)] shadow-[var(--shadow)] p-5 flex flex-col gap-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => setHistoryOpen(!historyOpen)}
                  className="text-sm font-semibold text-[var(--fg)] hover:text-[var(--accent)] transition-colors"
                >
                  Session History · {history.length} {historyOpen ? "▴" : "▾"}
                </button>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleExportHistory}
                    disabled={!history.length}
                    className="h-8 px-3 rounded-[var(--r-md)] border border-[var(--border)] bg-[var(--bg)] hover:bg-[var(--bg-subtle)] text-xs text-[var(--fg-muted)] hover:text-[var(--fg)] font-medium transition-colors disabled:opacity-40"
                  >
                    Export History
                  </button>
                  <button
                    type="button"
                    onClick={handleClearHistory}
                    disabled={!history.length}
                    className="h-8 px-3 rounded-[var(--r-md)] border border-[var(--border)] bg-[var(--bg)] hover:bg-red-500/10 hover:border-red-400/40 text-xs text-[var(--fg-muted)] hover:text-red-300 font-medium transition-colors disabled:opacity-40"
                  >
                    Clear History
                  </button>
                </div>
              </div>

              <p className="text-xs text-[var(--fg-subtle)] leading-relaxed">
                Every Generate Styles run is listed here. Export History downloads a dated JSON file so nothing overwrites a previous export. This offline file cannot write a logs folder; downloads are the archive.
              </p>

              {historyOpen && (
                <div className="flex flex-col gap-2">
                  {history.length === 0 ? (
                    <p className="text-xs text-[var(--fg-subtle)]">No styles generated this session yet.</p>
                  ) : (
                    [...history].reverse().map((entry) => {
                      const open = !!openHistory[entry.id];
                      return (
                        <div
                          key={entry.id}
                          className="rounded-[var(--r-md)] border border-[var(--border)] bg-[var(--bg)] overflow-hidden"
                        >
                          <button
                            type="button"
                            onClick={() =>
                              setOpenHistory((prev) => ({ ...prev, [entry.id]: !prev[entry.id] }))
                            }
                            className="w-full text-left p-3 hover:bg-[var(--bg-subtle)]/40 transition-colors"
                          >
                            <div className="text-xs font-medium text-[var(--fg)] truncate">{entry.brief}</div>
                            <div className="text-[11px] text-[var(--fg-subtle)] mt-0.5">
                              {new Date(entry.createdAt).toLocaleString()} · {entry.prompts.length} styles · seed {entry.seed}
                            </div>
                          </button>

                          {open && (
                            <div className="border-t border-[var(--border)] p-3 flex flex-col gap-3">
                              {entry.prompts.map((p, i) => (
                                <div key={i}>
                                  <div className="flex items-center justify-between gap-2">
                                    <p className="text-xs font-medium text-[var(--fg)]">
                                      {toTitleCase(p.title)}
                                    </p>
                                    <button
                                      type="button"
                                      onClick={() => handleCopyStyle(p.styles)}
                                      className="text-[11px] text-[var(--fg-muted)] hover:text-[var(--fg)]"
                                    >
                                      Add Style to Clipboard
                                    </button>
                                  </div>
                                  <p className="whitespace-pre-wrap text-xs text-[var(--fg-muted)] mt-1 leading-relaxed">
                                    {p.styles}
                                  </p>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              )}
            </div>
          </section>
        )}
          </div>

          {/* ============================================================ */}
          {/* INTERACTIVE RESIZE HANDLES (DRAG EDGES / CORNERS TO RESIZE) */}
          {/* ============================================================ */}
          {/* Right Edge Handle (Drag left/right to resize width) */}
          <div
            onPointerDown={(e) => startResize("width-right", e)}
            className="absolute top-0 right-0 bottom-0 w-3.5 cursor-ew-resize hover:bg-[var(--accent)]/30 active:bg-[var(--accent)]/50 transition-colors z-40 group flex items-center justify-center select-none"
            title="Click and drag horizontally to resize interface width"
          >
            <div className="w-1 h-12 rounded-full bg-[var(--border-strong)] group-hover:bg-[var(--accent)] transition-colors opacity-40 group-hover:opacity-100" />
          </div>

          {/* Left Edge Handle (Drag left/right to resize width) */}
          <div
            onPointerDown={(e) => startResize("width-left", e)}
            className="absolute top-0 left-0 bottom-0 w-3.5 cursor-ew-resize hover:bg-[var(--accent)]/30 active:bg-[var(--accent)]/50 transition-colors z-40 group flex items-center justify-center select-none"
            title="Click and drag horizontally to resize interface width"
          >
            <div className="w-1 h-12 rounded-full bg-[var(--border-strong)] group-hover:bg-[var(--accent)] transition-colors opacity-40 group-hover:opacity-100" />
          </div>

          {/* Bottom Edge Handle (Drag up/down to resize height) */}
          <div
            onPointerDown={(e) => startResize("height", e)}
            className="absolute bottom-0 left-0 right-0 h-3.5 cursor-ns-resize hover:bg-[var(--accent)]/30 active:bg-[var(--accent)]/50 transition-colors z-40 group flex items-center justify-center select-none"
            title="Click and drag vertically to resize interface height"
          >
            <div className="h-1 w-20 rounded-full bg-[var(--border-strong)] group-hover:bg-[var(--accent)] transition-colors opacity-40 group-hover:opacity-100" />
          </div>

          {/* Bottom-Right Corner Handle (Drag to resize width and height simultaneously) */}
          <div
            onPointerDown={(e) => startResize("both", e)}
            className="absolute bottom-0 right-0 w-6 h-6 cursor-nwse-resize hover:bg-[var(--accent)]/40 active:bg-[var(--accent)]/60 transition-colors z-50 rounded-br-2xl flex items-end justify-end p-1 select-none group"
            title="Click and drag corner to resize width and height"
          >
            <svg
              className="w-3.5 h-3.5 text-[var(--fg-subtle)] group-hover:text-[var(--accent)] transition-colors"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
            >
              <line x1="20" y1="8" x2="8" y2="20" />
              <line x1="20" y1="14" x2="14" y2="20" />
              <line x1="20" y1="20" x2="20" y2="20" />
            </svg>
          </div>

          {/* Bottom-Left Corner Handle */}
          <div
            onPointerDown={(e) => startResize("both", e)}
            className="absolute bottom-0 left-0 w-6 h-6 cursor-nesw-resize hover:bg-[var(--accent)]/40 active:bg-[var(--accent)]/60 transition-colors z-50 rounded-bl-2xl flex items-end justify-start p-1 select-none group"
            title="Click and drag corner to resize width and height"
          >
            <svg
              className="w-3.5 h-3.5 text-[var(--fg-subtle)] group-hover:text-[var(--accent)] transition-colors"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
            >
              <line x1="4" y1="8" x2="16" y2="20" />
              <line x1="4" y1="14" x2="10" y2="20" />
              <line x1="4" y1="20" x2="4" y2="20" />
            </svg>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="max-w-[76rem] mx-auto px-4 sm:px-6 py-6 text-xs text-[var(--fg-subtle)] w-full">
        Suno Workbench compiles 925–975 character Styles prompts. Lyrics Studio designs, finishes, and converts lyrics to American phonetics for Suno's Lyrics field. Lyrics stay independent.
      </footer>

      {/* Modal Dialog */}
      {modal.open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          role="alertdialog"
          aria-modal="true"
        >
          <div className="bg-[var(--bg-elevated)] border border-[var(--border)] rounded-[var(--r-xl)] shadow-[var(--shadow)] w-full max-w-md p-5 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-[var(--fg)]">{modal.title}</h2>
              <button
                type="button"
                onClick={() => setModal((prev) => ({ ...prev, open: false }))}
                className="text-sm text-[var(--fg-muted)] hover:text-[var(--fg)] p-1"
                aria-label="Close"
              >
                ✕
              </button>
            </div>
            <p className="text-xs text-[var(--fg-muted)] leading-relaxed">{modal.body}</p>
            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setModal((prev) => ({ ...prev, open: false }))}
                className="h-9 px-4 rounded-[var(--r-md)] bg-[var(--accent)] hover:opacity-90 text-[var(--accent-fg)] font-semibold text-xs transition-colors"
              >
                {modal.kind === "ok" ? "OK" : "Got It"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
