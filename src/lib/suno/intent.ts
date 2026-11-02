/**
 * Structured musical intent, extracted before any keyword-based compiler hints.
 * Negative constraints are never allowed to seed positive groove/instrument hints.
 */
export type TempoRole = "target" | "range" | "source" | "feel" | "approximate";
export interface TempoMention {
  value: number;
  upper?: number;
  role: TempoRole;
  raw: string;
}
export interface ArrangementCue {
  kind: "intro" | "verse" | "build" | "drop1" | "drop2" | "breakdown" | "silence" | "outro" | "motif";
  bars?: number;
  detail: string;
}
export interface ConstraintIntent {
  positiveText: string;
  exclusions: string[];
}

const EXCLUSION_CLAUSE = /(^|[,;.\n]\s*)(?:please\s+)?(?:do\s+not(?:\s+use)?|don't(?:\s+use)?|never(?:\s+use)?|exclude|avoid|without|no)\s+([^,;.\n]+)/gim;

export function extractConstraintIntent(raw: string): ConstraintIntent {
  const exclusions: string[] = [];
  const positiveText = raw.replace(EXCLUSION_CLAUSE, (_match, boundary: string, clause: string) => {
    const cleaned = clause.trim().replace(/^(?:any|the|a)\s+/i, "").replace(/\s+(?:please|at all)$/i, "");
    if (cleaned) exclusions.push(cleaned);
    return boundary && /^\s*[,;.]/.test(boundary) ? boundary[0] + " " : " ";
  }).replace(/\s+([,;.])/g, "$1").replace(/(?:[,;]\s*){2,}/g, ", ").trim();
  return { positiveText, exclusions: [...new Set(exclusions)] };
}

export function parseTempoIntent(raw: string): { bpm?: number; mentions: TempoMention[] } {
  const mentions: TempoMention[] = [];
  const re = /\b(\d{2,3})(?:\s*(?:to|[-–])\s*(\d{2,3}))?\s*BPM\b/gi;
  for (const match of raw.matchAll(re)) {
    const before = raw.slice(Math.max(0, match.index! - 65), match.index!).toLowerCase();
    const after = raw.slice(match.index! + match[0].length, match.index! + match[0].length + 35).toLowerCase();
    const upper = match[2] ? Number(match[2]) : undefined;
    const range = upper !== undefined && upper >= Number(match[1]);
    const role: TempoRole =
      /(?:source|original|reference|sample|loop|from|remix(?:ing)?)\s*(?:tempo|at|near|around|of)?\s*$/.test(before) ||
      /^\s*(?:source|original|reference|sample|loop)\b/.test(after)
        ? "source"
        : /(?:perceived|feel|feels|half[- ]?time|double[- ]?time)\s*(?:at|of)?\s*$/.test(before) ||
          /^\s*(?:half[- ]?time|double[- ]?time|feel|perceived)\b/.test(after)
        ? "feel"
        : /(?:near|around|approximately|approx\.?|about)\s*$/.test(before)
        ? "approximate"
        : range ? "range" : "target";
    mentions.push({ value: Number(match[1]), upper: range ? upper : undefined, role, raw: match[0] });
  }
  const preferred = mentions.find((m) => m.role === "target" || m.role === "range") ??
    mentions.find((m) => m.role === "approximate") ??
    mentions.find((m) => m.role === "feel") ??
    mentions[0];
  const n = preferred ? (preferred.upper === undefined ? preferred.value : Math.round((preferred.value + preferred.upper) / 2)) : undefined;
  return { bpm: n === undefined ? undefined : Math.min(200, Math.max(60, n)), mentions };
}

export function parseKeyIntent(raw: string): string | undefined {
  const match = raw.match(/\b([A-G])(?:\s*(?:[- ]\s*)?(sharp|flat)|\s*(#|♯|b|♭))?\s*(minor|major|min|maj|phrygian|dorian|aeolian|ionian|lydian|mixolydian|locrian)\b/i);
  if (!match) return undefined;
  const accidental = /sharp/i.test(match[2] ?? "") || /[#♯]/.test(match[3] ?? "") ? "#" :
    /flat/i.test(match[2] ?? "") || /[b♭]/.test(match[3] ?? "") ? "b" : "";
  const rawMode = match[4].toLowerCase();
  const mode = rawMode === "min" ? "minor" : rawMode === "maj" ? "major" : rawMode;
  return match[1].toUpperCase() + accidental + " " + mode;
}

export function parseMeterIntent(raw: string): string | undefined {
  const match = raw.match(/\b(2|3|4|5|6|7|9|12)\s*\/\s*(2|4|8|16)\b/);
  return match ? match[1] + "/" + match[2] : undefined;
}

export function splitPromptHeader(raw: string): { body: string; header: string } {
  const lines = raw.trim().split(/\r?\n/);
  if (lines.length < 2) return { body: raw.trim(), header: "" };
  const first = lines[0].trim();
  const isHeader = /\b\d{2,3}\s*BPM\b/i.test(first) &&
    (/\|/.test(first) || /^(?:seed|id|prompt|style)\s*[#:\-]/i.test(first)) &&
    first.length < 180;
  return isHeader ? { body: lines.slice(1).join("\n").trim(), header: first } : { body: raw.trim(), header: "" };
}

export function parseArrangementCues(raw: string): ArrangementCue[] {
  const cues: ArrangementCue[] = [];
  const seen = new Set<string>();
  const push = (kind: ArrangementCue["kind"], detail: string, bars?: number) => {
    const clean = detail.trim().replace(/[.!?,;]+$/, "");
    const signature = kind + ":" + clean.toLowerCase();
    if (clean && !seen.has(signature)) { seen.add(signature); cues.push({ kind, detail: clean, bars }); }
  };
  const sentences = raw.split(/(?<=[.!?;])\s+|\n+/);
  for (const sentence of sentences) {
    const parts = sentence.split(/(?=\b(?:Drop\s*[12]|(?:pre[- ]?)?build|breakdown|full[- ]beat silence|one[- ]beat silence|fake[- ]?out|reverse pickup)\b)/i);
    for (const fragment of parts) {
      const text = fragment.trim();
      if (!text) continue;
      const bars = text.match(/\b(\d{1,2})[- ]bar\b|\b(\d{1,2})\s+bars?\b/i);
      const barCount = bars ? Number(bars[1] ?? bars[2]) : undefined;
      if (/\bdrop\s*2\b|\bsecond drop\b/i.test(text)) push("drop2", text, barCount);
      else if (/\bdrop\s*1\b|\bfirst drop\b/i.test(text)) push("drop1", text, barCount);
      else if (/\b(?:full[- ]beat|one[- ]beat|single[- ]beat) silence\b|\bfake[- ]?out\b|\breload\b/i.test(text)) push("silence", text, barCount);
      else if (/\bbreakdown\b|\bbridge\b/i.test(text)) push("breakdown", text, barCount);
      else if (/\bbuilds?\b|\briser\b/i.test(text)) push("build", text, barCount);
      else if (/\boutro\b/i.test(text)) push("outro", text, barCount);
      else if (/\bmotif\b/i.test(text)) push("motif", text, barCount);
      else if (/\bintro\b/i.test(text)) push("intro", text, barCount);
      else if (/\bverses?\b/i.test(text)) push("verse", text, barCount);
    }
  }
  return cues;
}
