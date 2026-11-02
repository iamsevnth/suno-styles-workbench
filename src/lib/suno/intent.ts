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

const NEGATION = /\b(?:do\s+not(?:\s+use)?|don't(?:\s+use)?|never(?:\s+use)?|exclude|avoiding|avoid|without|no)\s+/gi;
const POSITIVE_CONTINUATION = /,\s*(?=(?:female|male|instrumental|\d{2,3}\s*BPM|please|use|keep|make|include|feature|add|begin|open|lead\s+with|introduce|then|instead|however|but|with|while|over)\b)/i;

/** An exclusion comma-list is one scope, not only its first item. */
export function extractConstraintIntent(raw: string): ConstraintIntent {
  // Preserve the positive intent in common negative idioms, never invert it to loudness.
  raw = raw.replace(/\bavoid flattening the groove with constant maximal loudness\b/gi,
    "keep the groove dynamic with controlled loudness");
  const exclusions: string[] = [];
  let positive = "";
  let cursor = 0;
  NEGATION.lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = NEGATION.exec(raw))) {
    const start = match.index;
    if (start < cursor) continue;
    const after = raw.slice(NEGATION.lastIndex);
    // "Never let" and "without losing" are creative hierarchy guidance, not exclusion lists.
    if (/^let\b|^(?:losing|masking|flattening|changing|turning|sacrificing)\b/i.test(after)) continue;
    const nextBoundary = after.search(/[;.\n]/);
    const clause = after.slice(0, nextBoundary < 0 ? undefined : nextBoundary);
    const nextNegation = clause.search(/,\s*(?:no|never|exclude|avoiding|avoid|without|do\s+not|don't)\b/i);
    // A colon after an excluded noun introduces positive guidance ("Avoid noise: keep the motif clear").
    const colon = clause.indexOf(":");
    const positiveStart = clause.search(POSITIVE_CONTINUATION);
    const boundaries = [nextBoundary < 0 ? after.length : nextBoundary];
    if (nextNegation >= 0) boundaries.push(nextNegation);
    if (colon >= 0) boundaries.push(colon);
    if (positiveStart >= 0) boundaries.push(positiveStart);
    const length = Math.min(...boundaries);
    const content = after.slice(0, length).trim().replace(/^any\s+|^the\s+|^a\s+/i, "");
    const items = content.split(/,\s*|\s+(?:and|or)\s+/i)
      .map((item) => item.replace(/^or\s+|^and\s+/i, "").trim())
      .filter(Boolean);
    if (!items.length) continue;
    positive += raw.slice(cursor, start);
    exclusions.push(...items);
    cursor = NEGATION.lastIndex + length;
    NEGATION.lastIndex = cursor;
  }
  positive += raw.slice(cursor);
  positive = positive.replace(/\s+,/g, ",").replace(/,\s*([.;])/g, "$1")
    .replace(/\s+([.;])/g, "$1").replace(/(?:[,;]\s*){2,}/g, ", ")
    .replace(/;\s*\./g, ".").replace(/([.!?])\s*:\s*/g, "$1 ")
    .replace(/\s{2,}/g, " ").trim();
  return { positiveText: positive, exclusions: [...new Set(exclusions)] };
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
      const bars = text.match(/\b(\d{1,2})[- ]bar\b|\b(\d{1,2})\s+bars?\b|\b(one|two|four|eight|sixteen|thirty[- ]two)[- ]bar(?:s)?\b/i);
      const words: Record<string, number> = { one: 1, two: 2, four: 4, eight: 8, sixteen: 16, "thirty-two": 32 };
      const barCount = bars ? Number(bars[1] ?? bars[2]) || words[bars[3]?.toLowerCase()] : undefined;
      if (/\bdrop\s*2\b|\bsecond drop\b/i.test(text)) push("drop2", text, barCount);
      else if (/\bdrop\s*1\b|\bfirst drop\b/i.test(text)) push("drop1", text, barCount);
      else if (/\b(?:full[- ]beat|one[- ]beat|single[- ]beat|hard) silence\b|\b(?:full|one|single)\s+beat\s+of\s+silence\b|\b(?:full[- ]beat|one[- ]beat)\s+blackout\b|\bfake[- ]?out\b|\breload\b|\bcut(?:s)?\s+to\s+silence\b/i.test(text)) push("silence", text, barCount);
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
