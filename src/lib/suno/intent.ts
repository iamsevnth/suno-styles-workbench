/**
 * Musical intent is extracted before hint and genre classification. Exclusions are
 * stored separately: a negative phrase must not seed a positive sound-bank hint.
 */
export type TempoRole = "target" | "range" | "source" | "feel";
export interface TempoMention { value: number; upper?: number; role: TempoRole; raw: string }
export interface ArrangementCue {
  kind: "drop2" | "silence" | "motif" | "bar-count";
  detail: string;
  bars?: number;
}
export interface ConstraintIntent { positiveText: string; exclusions: string[] }

const NEGATION = /\b(?:do\s+not(?:\s+use)?|don't(?:\s+use)?|never(?:\s+use)?|exclude|avoiding|avoid|without|no)\s+/gi;
const CONTINUE = /,\s*(?=(?:female|male|instrumental|[0-9]{2,3}\s*BPM|please|use|keep|make|include|feature|add|begin|open|lead\s+with|introduce|then|instead|however|but|with|while|over)\b)/i;
const NOT_A_LIST = /^(?:let|losing|masking|flattening|changing|turning|sacrificing|forgetting|removing)\b/i;

/** Split comma-separated prohibitions, without discarding following positive clauses. */
export function extractConstraintIntent(raw: string): ConstraintIntent {
  const exclusions: string[] = [];
  let positive = "";
  let cursor = 0;
  NEGATION.lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = NEGATION.exec(raw))) {
    if (match.index < cursor) continue;
    const remaining = raw.slice(NEGATION.lastIndex);
    if (NOT_A_LIST.test(remaining)) continue;
    const stops: number[] = [remaining.length];
    for (const re of [/[.!?;\n]/, /:/, CONTINUE, /,\s*(?:no|never|exclude|avoiding|avoid|without|do\s+not|don't)\b/i]) {
      const idx = remaining.search(re);
      if (idx >= 0) stops.push(idx);
    }
    const length = Math.min(...stops);
    const phrase = remaining.slice(0, length).trim();
    if (!phrase) continue;
    const items = phrase.split(/,\s*|\s+(?:and|or)\s+/i).map(x => x.trim())
      .map(x => x.replace(/^(?:any|the|a)\s+/i, "")).filter(Boolean);
    if (!items.length) continue;
    exclusions.push(...items);
    positive += raw.slice(cursor, match.index);
    cursor = NEGATION.lastIndex + length;
    NEGATION.lastIndex = cursor;
  }
  positive += raw.slice(cursor);
  return {
    positiveText: positive.replace(/\s+,/g, ",").replace(/,\s*([.;])/g, "$1")
      .replace(/\s+([.;])/g, "$1").replace(/(?:[,;]\s*){2,}/g, ", ")
      .replace(/\s{2,}/g, " ").trim(),
    exclusions: [...new Set(exclusions)],
  };
}

export function parseTempoIntent(raw: string): { bpm?: number; mentions: TempoMention[] } {
  const mentions: TempoMention[] = [];
  const re = /\b([0-9]{2,3})(?:\s*(?:to|[-–])\s*([0-9]{2,3}))?\s*BPM\b/gi;
  for (const m of raw.matchAll(re)) {
    const prior = raw.slice(Math.max(0, (m.index ?? 0) - 85), m.index ?? 0).toLowerCase();
    const next = raw.slice((m.index ?? 0) + m[0].length, (m.index ?? 0) + m[0].length + 35).toLowerCase();
    const source = /\b(?:source|original|reference|sample|loop)\b[^.;,\n]{0,55}\b(?:at|of|near|around)\s*$/.test(prior);
    const feel = /\b(?:perceived|half[- ]?time|double[- ]?time|feel|feels)\b[^.;,\n]{0,35}\b(?:at|of|near|around)\s*$/.test(prior) ||
      /^\s*(?:half[- ]?time|double[- ]?time|feel|perceived)\b/.test(next);
    const upper = m[2] == null ? undefined : Number(m[2]);
    const role: TempoRole = source ? "source" : feel ? "feel" : upper === undefined ? "target" : "range";
    mentions.push({ value: Number(m[1]), upper, role, raw: m[0] });
  }
  const choice = mentions.find(x => x.role === "target" || x.role === "range") ??
    mentions.find(x => x.role === "feel") ?? mentions[0];
  const value = choice?.upper == null ? choice?.value : Math.round((choice.value + choice.upper) / 2);
  return { bpm: value == null ? undefined : Math.min(200, Math.max(60, value)), mentions };
}

export function parseKeyIntent(raw: string): string | undefined {
  const m = raw.match(/\b([A-G])(?:\s*(?:[- ]\s*)?(sharp|flat)|\s*([#♯b♭]))?\s*(minor|major|min|maj|phrygian|dorian|aeolian|ionian|lydian|mixolydian|locrian)\b/i);
  if (!m) return undefined;
  if (m[0].toLowerCase() === "a minor" && /^\s+key\b/i.test(raw.slice((m.index ?? 0) + m[0].length))) return undefined;
  const accidental = /sharp/i.test(m[2] ?? "") || /[#♯]/.test(m[3] ?? "") ? "#" :
    /flat/i.test(m[2] ?? "") || /[b♭]/.test(m[3] ?? "") ? "b" : "";
  const mode = m[4].toLowerCase().replace(/^min$/, "minor").replace(/^maj$/, "major");
  return m[1].toUpperCase() + accidental + " " + mode;
}

export function parseMeterIntent(raw: string): string | undefined {
  const m = raw.match(/\b(2|3|4|5|6|7|9|12)\s*\/\s*(2|4|8|16)\b/);
  return m ? m[1] + "/" + m[2] : undefined;
}

export function parseArrangementCues(raw: string): ArrangementCue[] {
  const cues: ArrangementCue[] = [];
  const seen = new Set<string>();
  for (const phrase of raw.split(/(?<=[.!?;])\s+|\n+/)) {
    const text = phrase.trim();
    if (!text) continue;
    const bar = text.match(/\b([0-9]{1,2})[- ]bar\b|\b([0-9]{1,2})\s+bars?\b|\b(one|two|four|eight|sixteen)[- ]bar(?:s)?\b/i);
    const words: Record<string, number> = { one: 1, two: 2, four: 4, eight: 8, sixteen: 16 };
    const bars = bar ? Number(bar[1] ?? bar[2]) || words[bar[3]?.toLowerCase()] : undefined;
    const kind: ArrangementCue["kind"] | undefined =
      /\b(?:drop\s*2|second drop)\b/i.test(text) ? "drop2" :
      /\b(?:silence|fake[- ]?out|blackout|reload)\b/i.test(text) ? "silence" :
      /\bmotif\b/i.test(text) ? "motif" : bars ? "bar-count" : undefined;
    if (kind && !seen.has(kind + ":" + text)) {
      seen.add(kind + ":" + text);
      cues.push({ kind, detail: text, bars });
    }
  }
  return cues;
}

/** Match forbidden production phrases, not incidental letter substrings. */
export function phraseExcluded(phrase: string, exclusions: string[] | undefined): boolean {
  if (!exclusions?.length) return false;
  const normalized = phrase.toLowerCase().replace(/[-–]/g, " ");
  return exclusions.some(x => {
    const term = x.toLowerCase().replace(/^(?:any|the|a)\s+/i, "").replace(/[-–]/g, " ").trim();
    if (term.length < 3) return false;
    if (/^four on the floor$|^four to the floor$/.test(term)) {
      return /\bfour (?:on|to) the floor\b/.test(normalized);
    }
    return (" " + normalized + " ").includes(" " + term + " ");
  });
}
