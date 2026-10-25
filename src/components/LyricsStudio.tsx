import React, { useState } from "react";
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
  "Baile Funk / Latin Club",
  "Cinematic / Ritual Bass",
  "Pop / Radio Topline",
  "Lo-Fi / Bedroom Soul",
];

const DELIVERY_OPTIONS = [
  "Mumble SoundCloud Rapper (slurred cadence, distorted 808s, hype ad-libs)",
  "Autotuned Trap Flow (hard pitch snap, robotic slides, metallic tone)",
  "Sung-Rap / Melodic Trap Hybrid (Drake/Juice WRLD cadence, pitched bounce, no choir)",
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
    badgeColor: "bg-zinc-800/80",
    textColor: "text-zinc-300",
    borderColor: "border-zinc-700",
  },
  verse: {
    label: "Verse",
    badgeColor: "bg-blue-950/70",
    textColor: "text-blue-300",
    borderColor: "border-blue-800/60",
  },
  chorus: {
    label: "Chorus",
    badgeColor: "bg-amber-950/70",
    textColor: "text-amber-300",
    borderColor: "border-amber-800/60",
  },
  buildup: {
    label: "Build Up",
    badgeColor: "bg-orange-950/70",
    textColor: "text-orange-300",
    borderColor: "border-orange-800/60",
  },
  drop: {
    label: "Drop",
    badgeColor: "bg-red-950/80",
    textColor: "text-red-300",
    borderColor: "border-red-800/70",
  },
  breakdown: {
    label: "Breakdown",
    badgeColor: "bg-purple-950/70",
    textColor: "text-purple-300",
    borderColor: "border-purple-800/60",
  },
  bridge: {
    label: "Bridge",
    badgeColor: "bg-cyan-950/70",
    textColor: "text-cyan-300",
    borderColor: "border-cyan-800/60",
  },
  outro: {
    label: "Outro",
    badgeColor: "bg-zinc-800/70",
    textColor: "text-zinc-400",
    borderColor: "border-zinc-700/60",
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
            Lyrics Creator & Remixer
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
          <span>LEFT: Inputs & Modular Sequence</span>
          <span>→</span>
          <span>RIGHT: Execute & Suno Output</span>
        </div>
      </div>

      {activeSubTab === "creator" ? (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1.15fr)] lg:gap-8 items-start">
          {/* ============================================================ */}
          {/* LEFT COLUMN: All Inputs, Draft Lyrics, and Modular Sequencer */}
          {/* ============================================================ */}
          <section className="bg-[var(--bg-elevated)] border border-[var(--border)] rounded-2xl shadow-xl p-5 sm:p-6 flex flex-col gap-6">
            {/* Header info */}
            <div className="border-b border-[var(--border)] pb-3">
              <span className="label-caps text-[var(--accent)]">
                Stage 1 • Inputs & Configuration
              </span>
              <h2 className="text-base font-semibold text-[var(--fg)] mt-0.5">
                Song Theme, Draft Workspace & Modular Layout
              </h2>
            </div>

            {/* Song Theme */}
            <div>
              <label htmlFor="lyric-theme" className="label-caps block mb-1.5 text-[var(--fg)]">
                Song Theme & Core Narrative
              </label>
              <input
                id="lyric-theme"
                type="text"
                value={theme}
                onChange={(e) => setTheme(e.target.value)}
                placeholder="e.g. Nocturnal cyberpunk chase through neon rain"
                className="w-full h-10 rounded-lg border border-[var(--border)] bg-[var(--bg)] text-[var(--fg)] px-3 text-xs focus:border-[var(--ring)] focus:outline-none"
              />
              <div className="flex flex-col gap-1.5 mt-2.5 w-full">
                {THEME_PRESETS.map((p, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setTheme(p)}
                    className="w-full text-xs rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-[var(--fg-muted)] hover:text-[var(--fg)] hover:border-[var(--border-strong)] hover:bg-[var(--bg-subtle)] transition-all text-left flex items-center justify-between group"
                  >
                    <span className="truncate pr-2">{p}</span>
                    <span className="text-[10px] text-[var(--fg-subtle)] group-hover:text-[var(--accent)] font-mono shrink-0">Use</span>
                  </button>
                ))}
              </div>
            </div>

            {/* DRAFT LYRICS WORKSPACE */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between mb-1 gap-2">
                <label htmlFor="draft-lyrics" className="label-caps text-[var(--fg)] shrink-0">
                  Draft Lyrics Workspace
                </label>
                <div className="flex items-center gap-2">
                  {draftLyrics && (
                    <>
                      <span className="font-mono text-[10px] text-emerald-400 bg-emerald-950/40 border border-emerald-800/50 px-2 py-0.5 rounded">
                        {draftLineCount} lines ({draftLyrics.length} chars)
                      </span>
                      <button
                        type="button"
                        onClick={() => setDraftLyrics("")}
                        className="text-[11px] text-[var(--fg-muted)] hover:text-red-400 transition-colors"
                      >
                        Clear
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Taller default textarea: rows=16, min-h-[380px] */}
              <textarea
                id="draft-lyrics"
                rows={16}
                value={draftLyrics}
                onChange={(e) => setDraftLyrics(e.target.value)}
                placeholder={`Paste your rough verses, hook ideas, scratchpad lines, or full draft lyrics here.

The engine will:
• Preserve your written words and rhyming anchors
• Match vocal cadence and genre delivery
• Complete missing sections in your custom modular sequence (Intro, Verse, Buildup, Drop, Chorus, Breakdown, Bridge, Outro)
• Fill in rhyming continuations where needed`}
                className="w-full min-h-[360px] sm:min-h-[420px] rounded-xl border border-[var(--border)] bg-[var(--bg)] text-[var(--fg)] p-4 text-xs font-mono resize-y leading-relaxed focus:border-[var(--ring)] focus:outline-none"
              />
            </div>

            {/* Genre Vibe - Individual full width line */}
            <div className="w-full">
              <label htmlFor="genre-select" className="label-caps block mb-1.5 text-[var(--fg)]">
                Genre Vibe
              </label>
              <select
                id="genre-select"
                value={genre}
                onChange={(e) => setGenre(e.target.value)}
                className="w-full h-10 rounded-lg border border-[var(--border)] bg-[var(--bg)] text-[var(--fg)] px-3 text-xs focus:border-[var(--ring)] focus:outline-none"
              >
                {GENRE_OPTIONS.map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </select>
            </div>

            {/* Vocal Delivery & Cadence - Individual full width line */}
            <div className="w-full">
              <label htmlFor="delivery-select" className="label-caps block mb-1.5 text-[var(--fg)]">
                Vocal Delivery & Cadence
              </label>
              <select
                id="delivery-select"
                value={delivery}
                onChange={(e) => setDelivery(e.target.value)}
                className="w-full h-10 rounded-lg border border-[var(--border)] bg-[var(--bg)] text-[var(--fg)] px-3 text-xs focus:border-[var(--ring)] focus:outline-none"
              >
                {DELIVERY_OPTIONS.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>

            {/* Rhyme Scheme - Individual full width line */}
            <div className="w-full">
              <label htmlFor="rhyme-scheme" className="label-caps block mb-1.5 text-[var(--fg)]">
                Rhyme Scheme
              </label>
              <select
                id="rhyme-scheme"
                value={rhymeScheme}
                onChange={(e) => setRhymeScheme(e.target.value as "AABB" | "ABAB" | "Freeform")}
                className="w-full h-10 rounded-lg border border-[var(--border)] bg-[var(--bg)] text-[var(--fg)] px-3 text-xs focus:border-[var(--ring)] focus:outline-none"
              >
                <option value="AABB">AABB (Couplets - punchy & catchy)</option>
                <option value="ABAB">ABAB (Alternating - classic flow)</option>
                <option value="Freeform">Freeform / Cadence-Driven</option>
              </select>
            </div>

            {/* Suno Performance Tags - Individual full width line */}
            <div className="w-full">
              <label className="flex h-11 items-center justify-between gap-3 rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3.5 text-xs cursor-pointer select-none">
                <div className="flex flex-col">
                  <span className="text-[var(--fg)] font-semibold">Suno Performance Tags</span>
                  <span className="text-[10px] text-[var(--fg-subtle)] font-mono">Include section markers and delivery cues.</span>
                </div>
                <input
                  type="checkbox"
                  checked={includeTags}
                  onChange={(e) => setIncludeTags(e.target.checked)}
                  className="w-4 h-4 accent-[var(--accent)] rounded cursor-pointer shrink-0"
                />
              </label>
            </div>

            {/* ============================================================ */}
            {/* ITEM 3: MODULAR SONG STRUCTURE BUILDER (CUSTOM ORDER & COUNTS) */}
            {/* ============================================================ */}
            <div className="border border-[var(--border)] rounded-xl p-4 sm:p-5 bg-[var(--bg)] flex flex-col gap-4">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--border)] pb-3">
                <div>
                  <span className="label-caps text-[var(--fg)] block">
                    Modular Song Structure Order (Custom Sequence)
                  </span>
                  <span className="text-[11px] text-[var(--fg-subtle)]">
                    Re-order (▲ ▼), duplicate, and organize sections into any sequence (e.g. 3 drops, 3 build ups, 2 choruses, 1 breakdown).
                  </span>
                </div>

                {/* Preset sequence shortcuts */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[10px] text-[var(--fg-subtle)]">Presets:</span>
                  <button
                    type="button"
                    onClick={() => applySequencePreset("club-multi-drop")}
                    className="text-[10px] px-2.5 py-1 rounded border border-orange-800/60 bg-orange-950/40 hover:text-[var(--fg)] text-orange-300 font-medium"
                    title="User Requested: Chorus -> Build Up -> Drop -> Build Up -> Drop -> Breakdown -> Drop"
                  >
                    Club Multi-Drop
                  </button>
                  <button
                    type="button"
                    onClick={() => applySequencePreset("triple-drop")}
                    className="text-[10px] px-2.5 py-1 rounded border border-red-800/60 bg-red-950/40 hover:text-[var(--fg)] text-red-300 font-medium"
                    title="3 Drops + 3 Buildups + 2 Choruses + 1 Breakdown"
                  >
                    3 Drops & 3 Buildups
                  </button>
                  <button
                    type="button"
                    onClick={() => applySequencePreset("standard")}
                    className="text-[10px] px-2 py-1 rounded border border-[var(--border)] bg-[var(--bg-elevated)] hover:text-[var(--fg)] text-[var(--fg-muted)]"
                  >
                    Standard
                  </button>
                  <button
                    type="button"
                    onClick={() => applySequencePreset("pop-anthem")}
                    className="text-[10px] px-2 py-1 rounded border border-[var(--border)] bg-[var(--bg-elevated)] hover:text-[var(--fg)] text-[var(--fg-muted)]"
                  >
                    Pop Anthem
                  </button>
                </div>
              </div>

              {/* Add section buttons for all 8 section types */}
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="label-caps mr-1">
                  + Add Section:
                </span>
                {sectionTypesList.map((type) => {
                  const meta = SECTION_TYPE_META[type];
                  return (
                    <button
                      key={type}
                      type="button"
                      onClick={() => addSection(type)}
                      className={`h-7 px-2.5 rounded-md border ${meta.borderColor} ${meta.badgeColor} ${meta.textColor} hover:brightness-125 text-xs font-medium transition-all shadow-sm flex items-center gap-1`}
                    >
                      <span>+</span>
                      <span>{meta.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Ordered section list */}
              <div className="flex flex-col gap-2 max-h-[320px] overflow-y-auto pr-1">
                {sectionSequence.map((sec, idx) => {
                  const meta = SECTION_TYPE_META[sec.type];
                  return (
                    <div
                      key={sec.id}
                      className="flex items-center justify-between gap-2 p-2.5 rounded-lg border border-[var(--border)] bg-[var(--bg-elevated)] text-xs shadow-sm hover:border-[var(--border-strong)] transition-colors"
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="font-mono text-[11px] text-[var(--fg-subtle)] w-5 text-right font-medium">
                          {idx + 1}.
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded text-[11px] font-semibold border ${meta.borderColor} ${meta.badgeColor} ${meta.textColor}`}
                        >
                          {meta.label}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        {/* Lines count */}
                        <div className="flex items-center gap-1 font-mono text-[11px]">
                          <span className="text-[10px] text-[var(--fg-subtle)]">lines:</span>
                          <select
                            value={sec.lines}
                            onChange={(e) => updateSectionLines(idx, parseInt(e.target.value, 10))}
                            className="h-6 px-1.5 rounded bg-[var(--bg)] border border-[var(--border)] text-[var(--fg)] focus:outline-none"
                          >
                            {[2, 4, 6, 8, 12, 16].map((l) => (
                              <option key={l} value={l}>
                                {l}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Move Up / Move Down buttons */}
                        <div className="flex items-center border border-[var(--border)] rounded bg-[var(--bg)]">
                          <button
                            type="button"
                            disabled={idx === 0}
                            onClick={() => moveSection(idx, "up")}
                            className="h-6 w-6 inline-flex items-center justify-center text-[10px] text-[var(--fg-muted)] hover:text-[var(--fg)] hover:bg-[var(--bg-subtle)] disabled:opacity-20 disabled:cursor-not-allowed border-r border-[var(--border)]"
                            title="Move section up in order"
                          >
                            ▲
                          </button>
                          <button
                            type="button"
                            disabled={idx === sectionSequence.length - 1}
                            onClick={() => moveSection(idx, "down")}
                            className="h-6 w-6 inline-flex items-center justify-center text-[10px] text-[var(--fg-muted)] hover:text-[var(--fg)] hover:bg-[var(--bg-subtle)] disabled:opacity-20 disabled:cursor-not-allowed"
                            title="Move section down in order"
                          >
                            ▼
                          </button>
                        </div>

                        {/* Duplicate button */}
                        <button
                          type="button"
                          onClick={() => duplicateSection(idx)}
                          className="h-6 px-2 text-[11px] rounded border border-[var(--border)] bg-[var(--bg)] text-[var(--fg-muted)] hover:text-[var(--fg)] hover:bg-[var(--bg-subtle)]"
                          title="Duplicate this section"
                        >
                          + Duplicate
                        </button>

                        {/* Remove button */}
                        <button
                          type="button"
                          onClick={() => removeSection(idx)}
                          className="h-6 w-6 inline-flex items-center justify-center text-[11px] rounded border border-red-900/40 bg-[var(--bg)] text-red-400 hover:bg-red-500/20"
                          title="Delete section from sequence"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Visual sequence flow order strip */}
              <div className="pt-2 border-t border-[var(--border)] flex flex-col gap-1.5">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="label-caps">
                    Active Layout Sequence ({sectionSequence.length} sections · {totalPlannedLines} lines):
                  </span>
                  <div className="flex items-center gap-1.5 text-[10px] font-mono text-[var(--fg-muted)]">
                    {Object.entries(structureCounts).map(([type, cnt]) => (
                      <span key={type} className="px-1.5 py-0.5 rounded bg-[var(--bg-elevated)] border border-[var(--border)]">
                        {cnt} {type === "buildup" ? "Buildup" : type}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="text-[11px] font-mono p-2 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border)] overflow-x-auto whitespace-nowrap text-[var(--fg-muted)]">
                  {sectionSequence.map((s, i) => (
                    <span key={s.id} className="inline-flex items-center">
                      <span className={SECTION_TYPE_META[s.type]?.textColor || "text-[var(--fg)]"}>
                        {SECTION_TYPE_META[s.type]?.label || s.type}
                      </span>
                      {i < sectionSequence.length - 1 && (
                        <span className="text-zinc-600 mx-1.5 font-bold">→</span>
                      )}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Special Instructions */}
            <div>
              <label htmlFor="instructions" className="label-caps block mb-1.5 text-[var(--fg)]">
                Special Instructions (Metaphors, Story Turns, Imagery)
              </label>
              <input
                id="instructions"
                type="text"
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                placeholder="e.g. Leave dramatic silence before drop, mention broken glass, keep chorus punchy and repeatable"
                className="w-full h-10 rounded-lg border border-[var(--border)] bg-[var(--bg)] text-[var(--fg)] px-3 text-xs focus:border-[var(--ring)] focus:outline-none"
              />
            </div>
          </section>

          {/* ============================================================ */}
          {/* RIGHT COLUMN: EXECUTE TRIGGER AT THE TOP (Item 4) & OUTPUT   */}
          {/* ============================================================ */}
          <section className="flex flex-col gap-4">
            {/* ITEM 4: EXECUTE TRIGGER AT THE VERY TOP OF THE RIGHT COLUMN */}
            <div className="bg-[var(--bg-elevated)] border-2 border-[var(--accent)]/40 rounded-2xl shadow-2xl p-5 flex flex-col gap-3.5 bg-gradient-to-b from-[var(--bg-elevated)] to-[var(--bg-subtle)]">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-col">
                  <span className="label-caps text-[var(--accent)] flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                    <span>Stage 2 • Execute Engine</span>
                  </span>
                  <span className="text-xs text-[var(--fg-muted)] mt-0.5">
                    {draftLyrics.trim()
                      ? "Finish and extend your draft according to the modular sequence on the left."
                      : "Compile fresh lyrics matching your theme and modular section sequence."}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setTheme("");
                      setDraftLyrics("");
                      setInstructions("");
                      setGeneratedLyrics(null);
                      setEditableFullText("");
                    }}
                    className="h-10 px-3.5 rounded-lg border border-[var(--border)] bg-[var(--bg)] text-xs text-[var(--fg-muted)] hover:text-[var(--fg)] transition-colors"
                  >
                    Reset
                  </button>

                  {/* Primary Trigger Button at top right */}
                  <button
                    type="button"
                    onClick={handleGenerateLyrics}
                    disabled={isGenerating}
                    className="h-10 px-6 rounded-lg bg-[var(--accent)] hover:opacity-90 active:scale-[0.98] text-[var(--accent-fg)] font-bold text-xs tracking-wide transition-all shadow-lg flex items-center gap-2"
                  >
                    {isGenerating ? (
                      <>
                        <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                        <span>Compiling Lyrics...</span>
                      </>
                    ) : (
                      <>
                        <span>⚡</span>
                        <span>
                          {draftLyrics.trim()
                            ? "Finish & Complete My Lyrics"
                            : "Generate Full Lyrics"}
                        </span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Status summary pill */}
              <div className="flex items-center justify-between text-[11px] font-mono text-[var(--fg-subtle)] border-t border-[var(--border)]/60 pt-2.5">
                <span>Target: {sectionSequence.length} modular sections ({totalPlannedLines} lines)</span>
                <span>Mode: {draftLyrics.trim() ? "Draft Continuation & Polish" : "Full Track Synthesis"}</span>
              </div>
            </div>

            {/* Results Action Header */}
            <div className="flex flex-wrap items-center justify-between gap-3 px-1">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold text-[var(--fg)]">
                  {generatedLyrics ? generatedLyrics.title : "Generated Lyrics Output"}
                </h3>
                {generatedLyrics && (
                  <span className="font-mono text-xs rounded-full border border-[var(--border)] bg-[var(--bg-elevated)] px-2.5 py-0.5 text-[var(--fg-muted)]">
                    {generatedLyrics.totalLines} lines · {generatedLyrics.sections.length} sections
                  </span>
                )}
              </div>

              {editableFullText && (
                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    type="button"
                    onClick={handleCopyLyrics}
                    className="h-8 px-3 rounded-lg border border-[var(--border)] bg-[var(--bg-elevated)] text-xs font-semibold text-[var(--fg)] hover:bg-[var(--bg-subtle)] shadow-sm transition-colors"
                  >
                    Copy Lyrics
                  </button>
                  <button
                    type="button"
                    onClick={handleDownloadLyrics}
                    className="h-8 px-3 rounded-lg border border-[var(--border)] bg-[var(--bg-elevated)] text-xs font-medium text-[var(--fg-muted)] hover:text-[var(--fg)] transition-colors"
                  >
                    Download .txt
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSendToPhonetics()}
                    className="h-8 px-3 rounded-lg border border-emerald-500/50 bg-emerald-950/40 text-xs font-semibold text-emerald-300 hover:bg-emerald-900/60 transition-colors flex items-center gap-1.5"
                    title="Send these lyrics to the American Phonetics converter (no hyphens)"
                  >
                    <span>American Phonetics →</span>
                  </button>
                </div>
              )}
            </div>

            {/* Output Editor Container */}
            {editableFullText ? (
              <div className="bg-[var(--bg-elevated)] border border-[var(--border)] rounded-2xl shadow-xl p-5 flex flex-col gap-3.5">
                <div className="flex items-center justify-between text-xs text-[var(--fg-subtle)] font-mono pb-2 border-b border-[var(--border)]">
                  <span>Suno-Ready Lyrics Editor (Editable)</span>
                  <span>Ready to Paste into Suno</span>
                </div>

                <textarea
                  rows={22}
                  value={editableFullText}
                  onChange={(e) => setEditableFullText(e.target.value)}
                  className="w-full font-mono text-xs leading-relaxed text-[var(--fg)] bg-[var(--bg)] rounded-xl border border-[var(--border)] p-4 resize-y focus:border-[var(--ring)] focus:outline-none"
                />

                <div className="flex flex-wrap items-center justify-between gap-3 pt-2 text-xs text-[var(--fg-muted)]">
                  <span>Organized in your exact custom modular sequence order.</span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleSendToPhonetics()}
                      className="h-8 px-3 rounded-lg border border-emerald-500/50 bg-emerald-950/40 text-emerald-300 text-xs font-semibold hover:bg-emerald-900/60"
                    >
                      Convert to American Phonetics
                    </button>
                    <button
                      type="button"
                      onClick={handleCopyLyrics}
                      className="h-8 px-4 rounded-lg bg-[var(--accent)] text-[var(--accent-fg)] font-bold text-xs hover:opacity-90 shadow-sm"
                    >
                      Copy to Clipboard
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-[var(--bg-elevated)] border border-[var(--border)] rounded-2xl shadow-xl p-8 text-sm text-[var(--fg-muted)] flex flex-col gap-4">
                <div>
                  <strong className="block text-[var(--fg)] text-base">Lyrics Workspace Ready</strong>
                  <p className="mt-1">
                    Click{" "}
                    <span className="text-[var(--accent)] font-semibold">
                      "Finish & Complete My Lyrics"
                    </span>{" "}
                    at the top of this section to synthesize your lyrics.
                  </p>
                </div>

                <div className="rounded-xl border border-[var(--border)] bg-[var(--bg)] p-4 text-xs text-[var(--fg-subtle)] flex flex-col gap-2">
                  <p className="label-caps text-[var(--fg)]">
                    How it Works:
                  </p>
                  <p>• <strong>Inputs on the Left</strong>: Enter theme, paste your draft verses/notes in the tall workspace, and arrange your modular sequence.</p>
                  <p>• <strong>Custom Ordering</strong>: Arrange multiple drops and build-ups in any sequence you choose (e.g. Chorus → Build Up → Drop → Build Up → Drop → Breakdown → Drop).</p>
                  <p>• <strong>Execute on the Right</strong>: Click the trigger at the top right to get Suno-ready lyrics formatted with tags.</p>
                  <p>• <strong>Phonetics Tab</strong>: Convert any lyrics to authentic American English phonetics without hyphens (e.g., "tha", "problee", "droppin").</p>
                </div>
              </div>
            )}
          </section>
        </div>
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
                    className="text-[11px] text-[var(--fg-muted)] hover:text-red-400"
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
                  className="w-full h-9 rounded-lg bg-[var(--accent)] text-[var(--accent-fg)] font-bold text-xs hover:opacity-90 shadow-sm transition-all"
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
                <span className="label-caps text-emerald-400">
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
                    className="w-full min-h-[360px] rounded-xl border border-[var(--border)] bg-[var(--bg)] text-emerald-300 p-4 text-xs font-mono resize-y leading-relaxed focus:outline-none"
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
                        <div className="text-emerald-300 font-semibold flex items-center justify-between">
                          <span>{l.phonetic || "(blank)"}</span>
                          <span className="text-[10px] text-emerald-500/70">american phonetics</span>
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
                  <p>• "the" → <span className="text-emerald-300 font-mono">tha</span></p>
                  <p>• "probably" → <span className="text-emerald-300 font-mono">problee</span></p>
                  <p>• "with" → <span className="text-emerald-300 font-mono">wit</span></p>
                  <p>• "dropping" → <span className="text-emerald-300 font-mono">droppin</span></p>
                  <p>• "going to" → <span className="text-emerald-300 font-mono">gonna</span></p>
                </div>
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
