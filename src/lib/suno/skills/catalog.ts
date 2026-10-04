export interface SkillField {
  key: string;
  label: string;
  kind: "text" | "textarea" | "select";
  rows?: number;
  required?: boolean;
  placeholder?: string;
  options?: { value: string; label: string }[];
}

export interface SkillDefinition {
  id: string;
  pack: string;
  title: string;
  blurb: string;
  runLabel: string;
  fields: SkillField[];
}

export const SKILLS: SkillDefinition[] = [
  {
    id: "optimizer",
    pack: "suno-prompt-optimizer",
    title: "Prompt Optimizer",
    blurb:
      "Diagnose a prompt that missed: ambiguity, contradictions, missing production, over-constraint. Get a short prompt, expanded prompt, slider moves, and A/B tests.",
    runLabel: "Optimize Prompt",
    fields: [
      {
        key: "current",
        label: "Current Prompt",
        kind: "textarea",
        rows: 6,
        required: true,
        placeholder: "Paste the Styles or short prompt that already ran.",
      },
      {
        key: "failed",
        label: "What Failed",
        kind: "textarea",
        rows: 3,
        placeholder: "Too generic, weak drop, wrong vocal, ignored bass, chaotic structure…",
      },
      {
        key: "desired",
        label: "Desired Outcome",
        kind: "textarea",
        rows: 3,
        placeholder: "What the next take should sound like.",
      },
      {
        key: "sample",
        label: "Owned Sample Notes (Optional)",
        kind: "textarea",
        rows: 2,
        placeholder:
          "BPM, key, groove, instrumentation — only facts you heard. Do not claim unheard audio.",
      },
    ],
  },
  {
    id: "covers",
    pack: "suno-covers-influences",
    title: "Covers and Influences",
    blurb:
      "Plan faithful, hybrid, and radical restyles with v6 / v6-wild, Max Mode, Variety, Personalize, and Weirdness / Style / Audio Influence ranges.",
    runLabel: "Plan Cover",
    fields: [
      {
        key: "source",
        label: "Source (Owned or Authorized)",
        kind: "textarea",
        rows: 3,
        required: true,
        placeholder:
          "Describe YOUR recording or authorized upload — groove, vocal, structure. Do not paste a commercial title as if it were cleared.",
      },
      {
        key: "rights",
        label: "Rights Status",
        kind: "select",
        options: [
          { value: "owned", label: "I own this recording" },
          { value: "licensed", label: "Licensed / authorized" },
          { value: "pd", label: "Public domain (verified)" },
          { value: "unknown", label: "Unknown / third-party commercial" },
        ],
      },
      {
        key: "preserve",
        label: "Preserve",
        kind: "text",
        placeholder: "groove, contour, lyric theme, vocal identity…",
      },
      {
        key: "change",
        label: "Change",
        kind: "text",
        placeholder: "genre, drum architecture, bass, era, mix…",
      },
      {
        key: "target",
        label: "Target Style",
        kind: "text",
        placeholder: "e.g. Cinematic Trapstep + Deep Dubstep, 140 BPM, dark",
      },
    ],
  },
  {
    id: "mashups",
    pack: "suno-mashups-samples",
    title: "Mashups and Samples",
    blurb:
      "Align two authorized sources: tempo, key, phrase length, masking, stems, and transition plan. Short-snippet inspiration stays abstract when rights are unclear.",
    runLabel: "Plan Mashup",
    fields: [
      {
        key: "trackA",
        label: "Anchor Track",
        kind: "textarea",
        rows: 3,
        required: true,
        placeholder: "Owned/authorized source A — BPM, key, role (drums, vocal, bed).",
      },
      {
        key: "trackB",
        label: "Secondary Track or Snippet",
        kind: "textarea",
        rows: 3,
        required: true,
        placeholder: "Owned/authorized source B or short snippet notes.",
      },
      {
        key: "rights",
        label: "Rights Status",
        kind: "select",
        options: [
          { value: "owned", label: "Both sources owned / authorized" },
          { value: "mixed", label: "Only one source is cleared" },
          { value: "unknown", label: "Unknown / commercial recordings" },
        ],
      },
      {
        key: "goal",
        label: "Goal",
        kind: "text",
        placeholder: "vocal over new bed, A/B drop mash, snippet as rhythm only…",
      },
    ],
  },
  {
    id: "lyrics",
    pack: "suno-lyrics-remixer",
    title: "Lyrics Remixer",
    blurb:
      "Original, hook-only, verse/chorus, or rewrite lyrics with production notes. Named artists trigger an Exclusion Section — no copyrighted lyric dumps, no living-voice clones.",
    runLabel: "Write Lyrics",
    fields: [
      {
        key: "theme",
        label: "Theme / Intent",
        kind: "textarea",
        rows: 3,
        required: true,
        placeholder: "Story, image, POV, emotional turn.",
      },
      {
        key: "form",
        label: "Form",
        kind: "select",
        options: [
          { value: "hook", label: "Hook only" },
          { value: "verse-chorus", label: "Verse / chorus" },
          { value: "full", label: "Full song" },
          { value: "rewrite", label: "Rewrite my lyrics" },
        ],
      },
      {
        key: "sourceLyrics",
        label: "Your Lyrics (Optional Rewrite)",
        kind: "textarea",
        rows: 5,
        placeholder: "Paste YOUR words to remix. Do not paste copyrighted lyrics from memory.",
      },
      {
        key: "named",
        label: "Named Artist or Song (If Any)",
        kind: "text",
        placeholder: "Leave blank unless you need a high-level inspired-by translation.",
      },
      {
        key: "delivery",
        label: "Delivery",
        kind: "text",
        placeholder: "male tenor sung, melodic-rap, intimate female, gang chorus…",
      },
    ],
  },
  {
    id: "editor",
    pack: "suno-editor-workflows",
    title: "Song Editor",
    blurb:
      "Waveform-level steps: reorder, Quick Replace, lyric rewrite, add section, split/crop, fades, stems. Baseline verified 2026-09-01 — re-check Help Center for current labels.",
    runLabel: "Build Editor Plan",
    fields: [
      {
        key: "edit",
        label: "Edit Type",
        kind: "select",
        options: [
          { value: "replace", label: "Quick Replace / remake a section" },
          { value: "lyrics", label: "Rewrite lyrics in a section" },
          { value: "reorder", label: "Reorder sections" },
          { value: "add", label: "Add a section" },
          { value: "split", label: "Split / crop / delete" },
          { value: "fade", label: "Fades and transition cleanup" },
          { value: "stems", label: "Stem extraction" },
          { value: "extend", label: "Extend the song" },
        ],
      },
      {
        key: "symptom",
        label: "Audible Symptom",
        kind: "textarea",
        rows: 3,
        required: true,
        placeholder: "Weak chorus, click at bar 32, lyric mismatch, too long intro…",
      },
    ],
  },
  {
    id: "studio",
    pack: "suno-studio-workflows",
    title: "Studio Workflows",
    blurb:
      "Studio 2.0 session plans: track layout, take lanes, mix order, sidechain, export map. Genre templates for trap/EDM, lo-fi, pop, rock, cinematic hybrid.",
    runLabel: "Build Session Plan",
    fields: [
      {
        key: "template",
        label: "Template",
        kind: "select",
        options: [
          { value: "trap", label: "EDM / trap" },
          { value: "lofi", label: "Lo-fi" },
          { value: "pop", label: "Pop" },
          { value: "rock", label: "Rock" },
          { value: "cinematic", label: "Hybrid cinematic / electronic" },
        ],
      },
      {
        key: "bpm",
        label: "BPM (Optional)",
        kind: "text",
        placeholder: "140",
      },
      {
        key: "key",
        label: "Key / Mode (Optional)",
        kind: "text",
        placeholder: "A minor",
      },
      {
        key: "goal",
        label: "Session Goal",
        kind: "textarea",
        rows: 3,
        required: true,
        placeholder: "Finish a 140 trap drop, print stems for a DAW, record a live vocal…",
      },
    ],
  },
  {
    id: "rights",
    pack: "suno-rights-safety",
    title: "Rights and Safety",
    blurb:
      "Classify the request, apply lyric/voice/sampling/commercial guardrails, and emit an Exclusion Section plus safe substitutes. Guidance, not legal advice.",
    runLabel: "Classify Rights",
    fields: [
      {
        key: "request",
        label: "What You Want to Make",
        kind: "textarea",
        rows: 4,
        required: true,
        placeholder: "Describe the cover, sample, voice, lyric, or release plan.",
      },
      {
        key: "named",
        label: "Named Artist, Song, or Voice",
        kind: "text",
        placeholder: "Optional. Triggers the full Exclusion Section.",
      },
      {
        key: "material",
        label: "Material Type",
        kind: "select",
        options: [
          { value: "original", label: "Original / user-owned" },
          { value: "named-style", label: "Named artist or style reference" },
          { value: "song-recreate", label: "Specific-song recreation" },
          { value: "lyrics", label: "Copyrighted lyrics" },
          { value: "voice", label: "Living-artist voice / Voice model" },
          { value: "sample", label: "Third-party sample / stem / master" },
          { value: "pd", label: "Claimed public domain" },
          { value: "commercial", label: "Commercial release / ownership" },
          { value: "unknown", label: "Rights unknown" },
        ],
      },
    ],
  },
  {
    id: "current",
    pack: "suno-current-source",
    title: "Current Source",
    blurb:
      "Official-source map and 2026-09-13 snapshot for the v6 family (v6 / v6-wild / v6-mini), Advanced Create (Max Mode, Variety, Personalize), Studio 2.0, Editor, stems, Voices, Terms.",
    runLabel: "Show Current Snapshot",
    fields: [
      {
        key: "topic",
        label: "Topic",
        kind: "select",
        options: [
          { value: "overview", label: "Source map + how to verify" },
          { value: "v6", label: "v6 / v6-wild / v6-mini" },
          { value: "studio", label: "Studio 2.0" },
          { value: "editor", label: "Song Editor" },
          { value: "sliders", label: "Advanced Create + sliders" },
          { value: "stems", label: "Stems / split" },
          { value: "voices", label: "Voices / Custom Models" },
          { value: "terms", label: "Terms / downloads / commercial" },
        ],
      },
    ],
  },
];

export function skillById(id: string): SkillDefinition | undefined {
  return SKILLS.find((s) => s.id === id);
}
