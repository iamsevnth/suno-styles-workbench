import React, { useState } from "react";
import ArrangerStudio from "./ArrangerStudio.tsx";
import { generateLyrics } from "../lib/lyrics/generator.ts";
import { convertToPhonetics } from "../lib/lyrics/phonetics.ts";
import {
  DEFAULT_MODULAR_SEQUENCE,
  GeneratedLyrics,
  ModularSectionItem,
  PhoneticResult,
  SectionType,
} from "../lib/lyrics/types.ts";
import { historyFileStamp } from "../lib/suno/title-case.ts";

interface LyricsStudioProps {
  onShowDialog: (kind: "ok" | "error", title: string, body: string) => void;
  copyToClipboard: (text: string) => Promise<boolean>;
}

const THEME_PRESETS = [
  "Nocturnal cyberpunk chase through neon rain",
  "Heavy 808 redemption in the concrete canyon",
  "Intimate bedroom R&B confession after midnight",
  "Euphoric festival sunrise after the storm",
  "Ceremonial dark ritual sub bass invocation",
  "Street drill tension on the midnight avenue",
];

const GENRE_OPTIONS = [
  "Hybrid Bass / Trapstep",
  "Melodic Future Bass",
  "Dark R&B / Soul",
  "Trap / Street Drill",
  "Modern Rap / Trap Rap",
  "Autotuned Sung-Rap",
  "Dubstep / Wobble Bass",
  "Baile Funk / Latin Club",
  "Cinematic / Ritual Bass",
  "Pop / Radio Topline",
  "Lo-Fi / Bedroom Soul",
];

const DELIVERY_OPTIONS = [
  "Mumble SoundCloud Rapper (slurred cadence, distorted 808s, hype ad-libs)",
  "Autotuned Trap Flow (hard pitch snap, robotic slides, metallic tone)",
  "Sung-Rap / Melodic Trap Hybrid (pitched bounce, melodic cadence, no choir)",
  "Lyrical Bars & Internal Rhymes (dense syllables, multi-rhymes, breath control)",
  "Talk-Rap / Conversational Spoken (deadpan West Coast / Detroit off-beat, zero singing)",
  "Fast Chopper / Double-Time Rap (rapid-fire consonants, breath-controlled sprint)",
  "UK / NY Street Drill Cadence (menacing syncopation, sliding 808 pockets)",
  "Southern Trap Bounce (triplet rolls, heavy low-end pocket, raw mic presence)",
  "Boom Bap Golden Era Flow (crisp pocket delivery, punchline emphasis)",
  "Melodic Sing-Rap Topline (melodic contours, zero pop belting, autotuned sheen)",
  "Rhythmic Fast Rap Cadence (in-the-pocket syncopated delivery)",
  "Sung Melodic to High Belt",
  "Intimate Breathy Whisper",
  "Anthemic Group Chant",
];

const SECTION_TYPE_META: Record<
  SectionType,
  { label: string; badgeColor: string; textColor: string; borderColor: string }
> = {
  intro: {
    label: "Intro",
    badgeColor: "bg-zinc-800/80 light:bg-slate-100",
    textColor: "text-zinc-300 light:text-slate-700",
    borderColor: "border-zinc-700 light:border-slate-200",
  },
  verse: {
    label: "Verse",
    badgeColor: "bg-blue-950/70 light:bg-blue-50",
    textColor: "text-blue-300 light:text-blue-700",
    borderColor: "border-blue-800/60 light:border-blue-200",
  },
  chorus: {
    label: "Chorus",
    badgeColor: "bg-amber-950/70 light:bg-amber-50",
    textColor: "text-amber-300 light:text-amber-700",
    borderColor: "border-amber-800/60 light:border-amber-200",
  },
  buildup: {
    label: "Build Up",
    badgeColor: "bg-orange-950/70 light:bg-orange-50",
    textColor: "text-orange-300 light:text-orange-700",
    borderColor: "border-orange-800/60 light:border-orange-200",
  },
  drop: {
    label: "Drop",
    badgeColor: "bg-red-950/80 light:bg-red-50",
    textColor: "text-red-300 light:text-red-700",
    borderColor: "border-red-800/70 light:border-red-200",
  },
  breakdown: {
    label: "Breakdown",
    badgeColor: "bg-purple-950/70 light:bg-purple-50",
    textColor: "text-purple-300 light:text-purple-700",
    borderColor: "border-purple-800/60 light:border-purple-200",
  },
  bridge: {
    label: "Bridge",
    badgeColor: "bg-cyan-950/70 light:bg-cyan-50",
    textColor: "text-cyan-300 light:text-cyan-700",
    borderColor: "border-cyan-800/60 light:border-cyan-200",
  },
  outro: {
    label: "Outro",
    badgeColor: "bg-zinc-800/70 light:bg-slate-100",
    textColor: "text-zinc-400 light:text-slate-700",
    borderColor: "border-zinc-700/60 light:border-slate-200",
  },
};

export default function LyricsStudio({ onShowDialog, copyToClipboard }: LyricsStudioProps) {
  const [activeSubTab, setActiveSubTab] = useState<"creator" | "phonetics">("creator");

  // Generator & Remixer inputs
  const [theme, setTheme] = useState<string>("");
  const [genre, setGenre] = useState<string>(GENRE_OPTIONS[0]);
  const [delivery, setDelivery] = useState<string>(DELIVERY_OPTIONS[0]);
  const [rhymeScheme, setRhymeScheme] = useState<"AABB" | "ABAB" | "AABBCC" | "Freeform">("AABB");
  const [draftLyrics, setDraftLyrics] = useState<string>("");
  const [instructions, setInstructions] = useState<string>("");
  const [includeTags, setIncludeTags] = useState<boolean>(true);

  // Modular ordered section sequence (Item 3)
  const [sectionSequence, setSectionSequence] = useState<ModularSectionItem[]>([
    { id: "init-intro", type: "intro", lines: 2 },
    { id: "init-verse-1", type: "verse", lines: 4 },
    { id: "init-chorus-1", type: "chorus", lines: 4 },
    { id: "init-buildup-1", type: "buildup", lines: 2 },
    { id: "init-drop-1", type: "drop", lines: 2 },
    { id: "init-buildup-2", type: "buildup", lines: 2 },
    { id: "init-drop-2", type: "drop", lines: 2 },
    { id: "init-breakdown", type: "breakdown", lines: 2 },
    { id: "init-drop-3", type: "drop", lines: 2 },
    { id: "init-outro", type: "outro", lines: 2 },
  ]);

  // Result state
  const [generatedLyrics, setGeneratedLyrics] = useState<GeneratedLyrics | null>(null);
  const [editableFullText, setEditableFullText] = useState<string>("");
  const [isGenerating, setIsGenerating] = useState<boolean>(false);

  // Phonetics tool state (Item 5)
  const [phoneticInput, setPhoneticInput] = useState<string>("");
  const [phoneticResult, setPhoneticResult] = useState<PhoneticResult | null>(null);
  const [phoneticDisplayMode, setPhoneticDisplayMode] = useState<"pure" | "interlinear" | "split">(
    "pure"
  );
  const [phoneticStyleMode, setPhoneticStyleMode] = useState<"rap" | "natural">("rap");

  // Modular sequence actions
  const addSection = (type: SectionType) => {
    const id = `s-${type}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const defaultLines = type === "verse" || type === "chorus" || type === "bridge" ? 4 : 2;
    setSectionSequence((prev) => [...prev, { id, type, lines: defaultLines }]);
  };

  const removeSection = (index: number) => {
    setSectionSequence((prev) => prev.filter((_, idx) => idx !== index));
  };

  const moveSection = (index: number, direction: "up" | "down") => {
    const targetIdx = direction === "up" ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= sectionSequence.length) return;
    setSectionSequence((prev) => {
      const copy = [...prev];
      const item = copy[index];
      copy[index] = copy[targetIdx];
      copy[targetIdx] = item;
      return copy;
    });
  };

  const duplicateSection = (index: number) => {
    setSectionSequence((prev) => {
      const copy = [...prev];
      const item = copy[index];
      const newItem: ModularSectionItem = {
        ...item,
        id: `s-${item.type}-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      };
      copy.splice(index + 1, 0, newItem);
      return copy;
    });
  };

  const updateSectionLines = (index: number, lines: number) => {
    setSectionSequence((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], lines };
      return copy;
    });
  };

  // Modular preset layouts
  const applySequencePreset = (presetName: string) => {
    if (presetName === "club-multi-drop") {
      // User requested layout: chorus -> build up -> drop -> build up -> drop -> breakdown -> drop ...
      setSectionSequence([
        { id: "p-intro", type: "intro", lines: 2 },
        { id: "p-verse-1", type: "verse", lines: 4 },
        { id: "p-chorus-1", type: "chorus", lines: 4 },
        { id: "p-buildup-1", type: "buildup", lines: 2 },
        { id: "p-drop-1", type: "drop", lines: 2 },
        { id: "p-buildup-2", type: "buildup", lines: 2 },
        { id: "p-drop-2", type: "drop", lines: 2 },
        { id: "p-breakdown", type: "breakdown", lines: 2 },
        { id: "p-buildup-3", type: "buildup", lines: 2 },
        { id: "p-drop-3", type: "drop", lines: 2 },
        { id: "p-outro", type: "outro", lines: 2 },
      ]);
    } else if (presetName === "triple-drop") {
      // 3 drops, 3 build ups, 2 choruses, 1 breakdown
      setSectionSequence([
        { id: "td-intro", type: "intro", lines: 2 },
        { id: "td-chorus-1", type: "chorus", lines: 4 },
        { id: "td-buildup-1", type: "buildup", lines: 2 },
        { id: "td-drop-1", type: "drop", lines: 2 },
        { id: "td-chorus-2", type: "chorus", lines: 4 },
        { id: "td-buildup-2", type: "buildup", lines: 2 },
        { id: "td-drop-2", type: "drop", lines: 2 },
        { id: "td-breakdown", type: "breakdown", lines: 2 },
        { id: "td-buildup-3", type: "buildup", lines: 2 },
        { id: "td-drop-3", type: "drop", lines: 2 },
        { id: "td-outro", type: "outro", lines: 2 },
      ]);
    } else if (presetName === "standard") {
      setSectionSequence(DEFAULT_MODULAR_SEQUENCE);
    } else if (presetName === "pop-anthem") {
      setSectionSequence([
        { id: "p-intro", type: "intro", lines: 2 },
        { id: "p-verse-1", type: "verse", lines: 4 },
        { id: "p-buildup-1", type: "buildup", lines: 2 },
        { id: "p-chorus-1", type: "chorus", lines: 4 },
        { id: "p-verse-2", type: "verse", lines: 4 },
        { id: "p-buildup-2", type: "buildup", lines: 2 },
        { id: "p-chorus-2", type: "chorus", lines: 4 },
        { id: "p-bridge", type: "bridge", lines: 4 },
        { id: "p-chorus-3", type: "chorus", lines: 4 },
        { id: "p-outro", type: "outro", lines: 2 },
      ]);
    } else if (presetName === "minimal") {
      setSectionSequence([
        { id: "p-intro", type: "intro", lines: 2 },
        { id: "p-verse-1", type: "verse", lines: 4 },
        { id: "p-chorus-1", type: "chorus", lines: 4 },
        { id: "p-drop-1", type: "drop", lines: 2 },
        { id: "p-outro", type: "outro", lines: 2 },
      ]);
    }
  };

  // Quick structure statistics
  const structureCounts = sectionSequence.reduce((acc, cur) => {
    acc[cur.type] = (acc[cur.type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const totalPlannedLines = sectionSequence.reduce((acc, cur) => acc + cur.lines, 0);

  // Generate / Finish Lyrics
  const handleGenerateLyrics = () => {
    if (!sectionSequence.length) {
      onShowDialog("error", "No Sections", "Please add at least one section to your song structure.");
      return;
    }

    const activeTheme =
      theme.trim() || draftLyrics.trim().slice(0, 60) || "Midnight Heavy Bass Resonance";
    setIsGenerating(true);

    try {
      const res = generateLyrics({
        theme: activeTheme,
        genre,
        mood: delivery,
        delivery,
        rhymeScheme,
        draftLyrics: draftLyrics.trim(),
        instructions: instructions.trim(),
        includePerformanceTags: includeTags,
        sectionSequence,
      });

      setGeneratedLyrics(res);
      setEditableFullText(res.fullText);
    } catch {
      onShowDialog(
        "error",
        "Generation Failed",
        "Could not generate lyrics with the current structure. Try adjusting section sequence."
      );
    } finally {
      setIsGenerating(false);
    }
  };

  // Copy full lyrics
  const handleCopyLyrics = async () => {
    if (!editableFullText) return;
    const ok = await copyToClipboard(editableFullText);
    onShowDialog(
      ok ? "ok" : "error",
      ok ? "Lyrics Copied" : "Clipboard Blocked",
      ok
        ? "Lyrics copied to clipboard! You can paste them directly into Suno's Lyrics field."
        : "Could not write to clipboard. Select the text and press Ctrl+C / Cmd+C."
    );
  };

  // Download Lyrics as .txt
  const handleDownloadLyrics = () => {
    if (!editableFullText) return;
    const filename = `suno-lyrics-${historyFileStamp()}.txt`;
    const blob = new Blob([editableFullText], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    onShowDialog("ok", "Downloaded", `${filename} has been saved.`);
  };

  // Transfer lyrics to Phonetics Converter
  const handleSendToPhonetics = (textToSend?: string) => {
    const text = textToSend || editableFullText;
    if (!text.trim()) return;
    setPhoneticInput(text);
    const converted = convertToPhonetics(text, { mode: phoneticStyleMode });
    setPhoneticResult(converted);
    setActiveSubTab("phonetics");
  };

  // Run phonetics on custom text (no hyphens, American singing/rap flow)
  const handleConvertPhonetics = () => {
    if (!phoneticInput.trim()) {
      onShowDialog("error", "Input Empty", "Paste or type some lyrics to convert to American phonetics.");
      return;
    }
    const res = convertToPhonetics(phoneticInput, { mode: phoneticStyleMode });
    setPhoneticResult(res);
  };

  const handleCopyPhonetics = async () => {
    if (!phoneticResult) return;
    const ok = await copyToClipboard(phoneticResult.fullPhonetic);
    onShowDialog(
      ok ? "ok" : "error",
      ok ? "Phonetic Lyrics Copied" : "Clipboard Blocked",
      ok
        ? "American English phonetic lyrics (without hyphens) copied to clipboard! Use this in Suno to lock authentic American vocal pronunciation ('tha', 'problee', 'droppin')."
        : "Could not write to clipboard. Select the text and copy manually."
    );
  };

  const sectionTypesList: SectionType[] = [
    "buildup",
    "drop",
    "chorus",
    "verse",
    "breakdown",
    "bridge",
    "intro",
    "outro",
  ];

  const draftLineCount = draftLyrics
    ? draftLyrics.split("\n").filter((l) => l.trim().length > 0).length
    : 0;

  return (
    <div className="flex flex-col gap-6">
      {/* Built-in Sub-navigation Rail for Lyrics Tools */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[var(--border)] pb-3">
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border)]">
          <button
            type="button"
            onClick={() => setActiveSubTab("creator")}
            className={`h-8 px-4 rounded-lg text-xs font-semibold tracking-wide transition-all ${
              activeSubTab === "creator"
                ? "bg-[var(--accent)] text-[var(--accent-fg)] shadow-md"
                : "text-[var(--fg-muted)] hover:text-[var(--fg)] hover:bg-[var(--bg-elevated)]"
            }`}
          >
            Lyrics Arranger
          </button>
          <button
            type="button"
            onClick={() => setActiveSubTab("phonetics")}
            className={`h-8 px-4 rounded-lg text-xs font-semibold tracking-wide transition-all flex items-center gap-1.5 ${
              activeSubTab === "phonetics"
                ? "bg-[var(--accent)] text-[var(--accent-fg)] shadow-md"
                : "text-[var(--fg-muted)] hover:text-[var(--fg)] hover:bg-[var(--bg-elevated)]"
            }`}
          >
            <span>American Phonetics Converter</span>
          </button>
        </div>

        <div className="text-xs text-[var(--fg-subtle)] font-mono hidden sm:flex items-center gap-3">
          <span>LEFT: Original Lyrics & Structure</span>
          <span>→</span>
          <span>RIGHT: Verified Suno Output</span>
        </div>
      </div>

      {activeSubTab === "creator" ? (
        <ArrangerStudio
          onShowDialog={onShowDialog}
          copyToClipboard={copyToClipboard}
          onSendToPhonetics={(text) => handleSendToPhonetics(text)}
        />
      ) : (
        /* ============================================================ */
        /* ITEM 5: AMERICAN PHONETICS CONVERTER (ZERO HYPHENS)           */
        /* ============================================================ */
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-8 items-start">
          {/* Input column */}
          <section className="bg-[var(--bg-elevated)] border border-[var(--border)] rounded-2xl shadow-xl p-5 sm:p-6 flex flex-col gap-5">
            <div className="border-b border-[var(--border)] pb-3">
              <span className="label-caps text-[var(--accent)]">
                Input Lyrics
              </span>
              <h2 className="text-base font-semibold text-[var(--fg)] mt-0.5">
                Paste Lyrics for American English Phonetic Conversion
              </h2>
              <p className="text-xs text-[var(--fg-subtle)] mt-1">
                Converts spelling to authentic American singer/rap pronunciation with <strong>ZERO hyphens</strong> (e.g. "tha", "problee", "droppin", "wit", "bout").
              </p>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="phonetic-in" className="label-caps text-[var(--fg)]">
                  Original Lyric Lines
                </label>
                {phoneticInput && (
                  <button
                    type="button"
                    onClick={() => setPhoneticInput("")}
                    className="text-[11px] text-[var(--fg-muted)] hover:text-red-400 light:hover:text-red-700"
                  >
                    Clear Input
                  </button>
                )}
              </div>
              <textarea
                id="phonetic-in"
                rows={16}
                value={phoneticInput}
                onChange={(e) => setPhoneticInput(e.target.value)}
                placeholder={`Paste any song lyrics here...

Example:
[Verse 1]
The rapper will probably drop the bass with style
Looking at the city from about a mile
I am going to keep on rolling tonight
Without a shadow of fear in the neon light`}
                className="w-full min-h-[360px] rounded-xl border border-[var(--border)] bg-[var(--bg)] text-[var(--fg)] p-4 text-xs font-mono resize-y leading-relaxed focus:border-[var(--ring)] focus:outline-none"
              />
            </div>

            {/* Pronunciation Cadence Mode */}
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="label-caps block mb-1.5 text-[var(--fg)]">
                  Vocal Cadence Style
                </label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setPhoneticStyleMode("rap");
                      if (phoneticInput) {
                        setPhoneticResult(convertToPhonetics(phoneticInput, { mode: "rap" }));
                      }
                    }}
                    className={`flex-1 h-9 rounded-lg border text-xs font-medium transition-all ${
                      phoneticStyleMode === "rap"
                        ? "bg-[var(--accent)] text-[var(--accent-fg)] border-[var(--accent)] font-semibold"
                        : "border-[var(--border)] bg-[var(--bg)] text-[var(--fg-muted)] hover:text-[var(--fg)]"
                    }`}
                  >
                    Rap & Singer Flow
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setPhoneticStyleMode("natural");
                      if (phoneticInput) {
                        setPhoneticResult(convertToPhonetics(phoneticInput, { mode: "natural" }));
                      }
                    }}
                    className={`flex-1 h-9 rounded-lg border text-xs font-medium transition-all ${
                      phoneticStyleMode === "natural"
                        ? "bg-[var(--accent)] text-[var(--accent-fg)] border-[var(--accent)] font-semibold"
                        : "border-[var(--border)] bg-[var(--bg)] text-[var(--fg-muted)] hover:text-[var(--fg)]"
                    }`}
                  >
                    Clear American Phonetic
                  </button>
                </div>
              </div>

              <div>
                <label className="label-caps block mb-1.5 text-[var(--fg)]">
                  Convert Action
                </label>
                <button
                  type="button"
                  onClick={handleConvertPhonetics}
                  className="btn-primary w-full h-9 rounded-lg font-bold text-xs transition-all"
                >
                  Convert to American Phonetics
                </button>
              </div>
            </div>

            {/* Quick sample loader */}
            <div className="flex items-center gap-2 pt-2 border-t border-[var(--border)]">
              <span className="text-[11px] text-[var(--fg-subtle)] font-mono">Load Sample:</span>
              <button
                type="button"
                onClick={() => {
                  const sample = `[Chorus]\nThe rhythm is probably gonna make you fall in love tonight\nGoing around the city with the bass turned high\nLooking at the lights without a single doubt\nTell me what you really want to talk about`;
                  setPhoneticInput(sample);
                  setPhoneticResult(convertToPhonetics(sample, { mode: phoneticStyleMode }));
                }}
                className="text-[11px] px-2.5 py-1 rounded-md border border-[var(--border)] bg-[var(--bg)] text-[var(--fg-muted)] hover:text-[var(--fg)]"
              >
                "The rhythm is probably gonna make you fall..."
              </button>
            </div>
          </section>

          {/* Output column */}
          <section className="bg-[var(--bg-elevated)] border border-[var(--border)] rounded-2xl shadow-xl p-5 sm:p-6 flex flex-col gap-5">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--border)] pb-3">
              <div>
                <span className="label-caps text-emerald-400 light:text-emerald-700">
                  Phonetic Output
                </span>
                <h2 className="text-base font-semibold text-[var(--fg)] mt-0.5">
                  American Phonetic Lyrics
                </h2>
              </div>

              {phoneticResult && (
                <div className="flex items-center gap-2">
                  <div className="flex items-center border border-[var(--border)] rounded-lg bg-[var(--bg)] p-0.5 text-xs">
                    <button
                      type="button"
                      onClick={() => setPhoneticDisplayMode("pure")}
                      className={`px-2.5 py-1 rounded text-[11px] font-medium transition-all ${
                        phoneticDisplayMode === "pure"
                          ? "bg-[var(--accent)] text-[var(--accent-fg)] font-semibold"
                          : "text-[var(--fg-muted)] hover:text-[var(--fg)]"
                      }`}
                    >
                      Clean Phonetic
                    </button>
                    <button
                      type="button"
                      onClick={() => setPhoneticDisplayMode("interlinear")}
                      className={`px-2.5 py-1 rounded text-[11px] font-medium transition-all ${
                        phoneticDisplayMode === "interlinear"
                          ? "bg-[var(--accent)] text-[var(--accent-fg)] font-semibold"
                          : "text-[var(--fg-muted)] hover:text-[var(--fg)]"
                      }`}
                    >
                      Side by Side
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={handleCopyPhonetics}
                    className="h-8 px-3 rounded-lg bg-[var(--accent)] text-[var(--accent-fg)] font-bold text-xs hover:opacity-90 shadow-sm"
                  >
                    Copy Phonetics
                  </button>
                </div>
              )}
            </div>

            {phoneticResult ? (
              <div className="flex flex-col gap-3">
                {phoneticDisplayMode === "pure" ? (
                  <textarea
                    rows={18}
                    readOnly
                    value={phoneticResult.fullPhonetic}
                    className="w-full min-h-[360px] rounded-xl border border-[var(--border)] bg-[var(--bg)] text-emerald-300 p-4 text-xs font-mono resize-y leading-relaxed focus:outline-none light:text-emerald-700"
                  />
                ) : (
                  <div className="flex flex-col gap-2 max-h-[460px] overflow-y-auto pr-1">
                    {phoneticResult.lines.map((l, i) => (
                      <div
                        key={i}
                        className={`p-2.5 rounded-lg border text-xs font-mono flex flex-col gap-1 ${
                          l.isTag
                            ? "bg-[var(--bg-subtle)] border-[var(--border)] text-[var(--accent)] font-bold"
                            : "bg-[var(--bg)] border-[var(--border)]"
                        }`}
                      >
                        <div className="text-[11px] text-[var(--fg-muted)] flex items-center justify-between">
                          <span>{l.original || "(blank)"}</span>
                          <span className="text-[10px] text-[var(--fg-subtle)]">orig</span>
                        </div>
                        <div className="text-emerald-300 font-semibold flex items-center justify-between light:text-emerald-700">
                          <span>{l.phonetic || "(blank)"}</span>
                          <span className="text-[10px] text-emerald-500/70 light:text-emerald-600">american phonetics</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-[var(--fg-muted)] pt-2 border-t border-[var(--border)]">
                  <span>Guaranteed 100% zero hyphens. Uses American English letters only.</span>
                  <button
                    type="button"
                    onClick={handleCopyPhonetics}
                    className="h-8 px-4 rounded-lg bg-[var(--accent)] text-[var(--accent-fg)] font-bold text-xs hover:opacity-90 shadow-sm"
                  >
                    Copy to Clipboard
                  </button>
                </div>
              </div>
            ) : (
              <div className="min-h-[360px] rounded-xl border border-[var(--border)] bg-[var(--bg)] p-6 text-xs text-[var(--fg-muted)] flex flex-col items-center justify-center text-center gap-3">
                <span className="text-2xl">🗣️</span>
                <strong className="text-[var(--fg)] text-sm">No Phonetic Conversion Yet</strong>
                <p className="max-w-md text-[var(--fg-subtle)]">
                  Paste lyrics on the left and click <strong>"Convert to American Phonetics"</strong>. The engine will transform every word into natural American singer & rapper pronunciation without using any hyphens.
                </p>
                <div className="rounded-lg border border-[var(--border)] bg-[var(--bg-elevated)] p-3 text-[11px] text-left text-[var(--fg-subtle)] max-w-sm">
                  <p className="text-[var(--fg)] font-semibold mb-1">Key Pronunciation Rules:</p>
                  <p>• "the" → <span className="text-emerald-300 font-mono light:text-emerald-700">tha</span></p>
                  <p>• "probably" → <span className="text-emerald-300 font-mono light:text-emerald-700">problee</span></p>
                  <p>• "with" → <span className="text-emerald-300 font-mono light:text-emerald-700">wit</span></p>
                  <p>• "dropping" → <span className="text-emerald-300 font-mono light:text-emerald-700">droppin</span></p>
                  <p>• "going to" → <span className="text-emerald-300 font-mono light:text-emerald-700">gonna</span></p>
                </div>
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
