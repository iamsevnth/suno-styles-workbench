import type { SectionType } from "./types.ts";

/**
 * Every lyric output is an exact substring of a user-supplied source line.
 * Structural tags are metadata, never passed through the lyric provenance audit.
 */
export type InputMode = "whole" | "sections";
export type ArrangementMode = "whole" | "chop";

export const ARRANGEMENT_SECTION_TYPES: SectionType[] = [
  "intro", "verse", "chorus", "buildup", "drop", "breakdown", "bridge", "outro",
];

export interface SourceSection {
  id: string;
  type: SectionType;
  text: string;
  locked?: boolean;
}
export interface SourceLine {
  id: string;
  sectionId: string;
  sectionType: SectionType;
  sourceLineNumber: number;
  text: string;
}
export interface TargetSection {
  id: string;
  type: SectionType;
  bars: number;
  sourceId?: string;
  mode: ArrangementMode;
}
export interface LyricSpan {
  sourceId: string;
  lineId: string;
  sourceLineNumber: number;
  start: number;
  end: number;
  text: string;
  repeated: boolean;
}
export interface ArrangedSection {
  id: string;
  type: SectionType;
  bars: number;
  lines: LyricSpan[];
}
export interface ArrangementOptions {
  seed: number;
  preserveRhyme: boolean;
  targetBpm: number;
  sourceBpm?: number;
}
export interface ArrangementResult {
  sections: ArrangedSection[];
  fullText: string;
  sourceLineCount: number;
  repeatedSlots: number;
  warnings: string[];
  verified: boolean;
  seed: number;
}
export interface ArrangerProject {
  version: 1;
  mode: InputMode;
  wholeText: string;
  sections: SourceSection[];
  targets: TargetSection[];
  options: ArrangementOptions;
}
export const LOCAL_PROJECT_KEY = "suno-workbench:lyrics-arrangement:v1";

const LABELS: Record<SectionType, string> = {
  intro: "Intro",
  verse: "Verse",
  chorus: "Chorus",
  buildup: "Build Up",
  drop: "Drop",
  breakdown: "Breakdown",
  bridge: "Bridge",
  outro: "Outro",
};

export const sectionLabel = (type: SectionType): string => LABELS[type];

function typeFromTag(input: string): SectionType | null {
  const tag = input.trim().toLowerCase().replace(/[\d|:].*$/, "").replace(/[-_]/g, " ").trim();
  if (/^(?:pre\s*chorus|build\s*up|build|buildup)$/.test(tag)) return "buildup";
  if (/^(?:hook|refrain|chorus)$/.test(tag)) return "chorus";
  if (/^verse$/.test(tag)) return "verse";
  if (/^intro$/.test(tag)) return "intro";
  if (/^drop$/.test(tag)) return "drop";
  if (/^(?:breakdown|break)$/.test(tag)) return "breakdown";
  if (/^bridge$/.test(tag)) return "bridge";
  if (/^outro$/.test(tag)) return "outro";
  return null;
}

export function parseWholeSong(input: string): SourceSection[] {
  const sections: SourceSection[] = [];
  let type: SectionType = "verse";
  let lines: string[] = [];
  let segment = 1;
  const flush = () => {
    if (!lines.some(x => x.trim())) return;
    sections.push({ id: "whole-" + segment++, type, text: lines.join("\n") });
    lines = [];
  };
  for (const raw of input.replace(/\r\n?/g, "\n").split("\n")) {
    const tag = raw.trim().match(/^\[([^\]]{1,80})\]$/);
    const recognized = tag ? typeFromTag(tag[1]) : null;
    if (recognized) {
      flush();
      type = recognized;
    } else if (!raw.trim()) {
      flush();
    } else {
      lines.push(raw.trim());
    }
  }
  flush();
  return sections;
}

export function sourceLines(sections: SourceSection[]): SourceLine[] {
  if (sections.length > 80) throw new Error("Limit source material to 80 sections.");
  const result: SourceLine[] = [];
  const seen = new Set<string>();
  for (const section of sections) {
    if (!section.id || seen.has(section.id) || !LABELS[section.type]) {
      throw new Error("Source sections must have unique IDs and supported types.");
    }
    seen.add(section.id);
    if (section.text.length > 100000) throw new Error("Source section exceeds the 100,000-character limit.");
    section.text.replace(/\r\n?/g, "\n").split("\n").forEach((line, index) => {
      const lyric = line.trim();
      if (lyric) result.push({
        id: section.id + ":" + (index + 1),
        sectionId: section.id,
        sectionType: section.type,
        sourceLineNumber: index + 1,
        text: lyric,
      });
    });
  }
  if (result.length > 3000) throw new Error("Limit source material to 3,000 lyric lines.");
  return result;
}

function wordsWithOffsets(line: string): Array<{ start: number; end: number }> {
  const tokens: Array<{ start: number; end: number }> = [];
  for (const match of line.matchAll(/\S+/g)) {
    tokens.push({ start: match.index ?? 0, end: (match.index ?? 0) + match[0].length });
  }
  return tokens;
}

interface Candidate {
  line: SourceLine;
  start: number;
  end: number;
  text: string;
}
function fragments(line: SourceLine, mode: ArrangementMode): Candidate[] {
  const words = wordsWithOffsets(line.text);
  if (mode === "whole" || words.length <= 6) {
    return [{ line, start: 0, end: line.text.length, text: line.text }];
  }
  const chunks: Candidate[] = [];
  for (let i = 0; i < words.length; i += 6) {
    const start = words[i].start;
    const end = words[Math.min(words.length - 1, i + 5)].end;
    chunks.push({ line, start, end, text: line.text.slice(start, end) });
  }
  return chunks;
}

function random(seed: number): () => number {
  let state = Math.trunc(seed) >>> 0;
  return () => {
    state += 0x6D2B79F5;
    let x = state;
    x = Math.imul(x ^ (x >>> 15), x | 1);
    x ^= x + Math.imul(x ^ (x >>> 7), x | 61);
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
  };
}
function shuffle<T>(items: T[], rnd: () => number): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

/** Orthographic end-rhyme approximation; not a pronunciation or singability guarantee. */
export function approximateRhymeKey(line: string): string {
  const last = (line.toLowerCase().match(/[a-z']+/g) ?? []).at(-1)?.replace(/'s$/, "") ?? "";
  return last.match(/[aeiouy]+[^aeiouy]*$/)?.[0] ?? last.slice(-3);
}

export function estimatedSyllables(line: string): number {
  const tokens = line.toLowerCase().match(/[a-z]+(?:'[a-z]+)?/g) ?? [];
  return tokens.reduce((sum, token) => {
    const sansE = token.length > 3 ? token.replace(/e$/, "") : token;
    const groups = sansE.match(/[aeiouy]+/g)?.length ?? 1;
    return sum + Math.max(1, groups);
  }, 0);
}

export function suggestTargets(sections: SourceSection[]): TargetSection[] {
  const nonEmpty = sections.filter(s => s.text.trim());
  if (!nonEmpty.length) return [];
  // A single chorus can supply a short Build Up plus a longer Drop without writing new words.
  if (nonEmpty.length === 1 && nonEmpty[0].type === "chorus") {
    const count = Math.min(64, Math.max(1, sourceLines(nonEmpty).length));
    return [
      { id: "suggest-build", type: "buildup", bars: Math.min(8, count), sourceId: nonEmpty[0].id, mode: "chop" },
      { id: "suggest-drop", type: "drop", bars: Math.min(16, count), sourceId: nonEmpty[0].id, mode: "whole" },
    ];
  }
  return nonEmpty.slice(0, 30).map((s, i) => ({
    id: "suggest-" + (i + 1),
    type: s.type,
    bars: Math.min(64, Math.max(1, sourceLines([s]).length)),
    sourceId: s.id,
    mode: "whole" as ArrangementMode,
  }));
}

function checkTargets(targets: TargetSection[]): void {
  if (!targets.length || targets.length > 40) throw new Error("Add between 1 and 40 target sections.");
  const ids = new Set<string>();
  let total = 0;
  for (const section of targets) {
    if (!section.id || ids.has(section.id) || !LABELS[section.type]) throw new Error("Invalid target section.");
    ids.add(section.id);
    if (section.mode !== "whole" && section.mode !== "chop") throw new Error("Unsupported transformation mode.");
    if (!Number.isInteger(section.bars) || section.bars < 1 || section.bars > 64) {
      throw new Error("Each target must contain 1–64 bar slots.");
    }
    total += section.bars;
  }
  if (total > 512) throw new Error("Total arrangement cannot exceed 512 bar slots.");
}

export function verifyArrangement(sections: SourceSection[], result: ArrangementResult): boolean {
  let source: SourceLine[];
  try { source = sourceLines(sections); } catch { return false; }
  const byId = new Map(source.map(x => [x.id, x]));
  for (const block of result.sections) {
    if (block.bars !== block.lines.length || block.bars < 1) return false;
    for (const line of block.lines) {
      const original = byId.get(line.lineId);
      if (!original || original.sectionId !== line.sourceId ||
          original.sourceLineNumber !== line.sourceLineNumber) return false;
      if (!Number.isInteger(line.start) || !Number.isInteger(line.end) ||
          line.start < 0 || line.end > original.text.length || line.end <= line.start) return false;
      if (original.text.slice(line.start, line.end) !== line.text) return false;
    }
  }
  return result.fullText === renderArrangement(result.sections);
}

export function renderArrangement(sections: ArrangedSection[]): string {
  return sections.map(block => [
    "[" + sectionLabel(block.type) + "]",
    ...block.lines.map(line => line.text),
  ].join("\n")).join("\n\n");
}

export function arrangeLyrics(
  sections: SourceSection[],
  targets: TargetSection[],
  options: ArrangementOptions,
): ArrangementResult {
  checkTargets(targets);
  if (!Number.isSafeInteger(options.seed)) throw new Error("Seed must be a whole number.");
  if (!Number.isFinite(options.targetBpm) || options.targetBpm < 40 || options.targetBpm > 240) {
    throw new Error("Target BPM must be 40–240.");
  }
  if (options.sourceBpm !== undefined &&
      (!Number.isFinite(options.sourceBpm) || options.sourceBpm < 40 || options.sourceBpm > 240)) {
    throw new Error("Source BPM must be 40–240.");
  }
  const originalLines = sourceLines(sections);
  if (!originalLines.length) throw new Error("Paste lyrics before arranging.");
  const seenFragments = new Set<string>();
  const result: ArrangedSection[] = [];
  const warnings: string[] = [];
  let repeatedSlots = 0;
  const rnd = random(options.seed);

  for (const target of targets) {
    const chosen = target.sourceId
      ? originalLines.filter(line => line.sectionId === target.sourceId)
      : originalLines.filter(line => line.sectionType === target.type);
    const pool = chosen.length ? chosen : (target.sourceId ? [] : originalLines);
    if (!pool.length) throw new Error("A target references a missing or empty source section.");
    const candidates = pool.flatMap(line => fragments(line, target.mode));
    const locked = pool.every(line => sections.find(s => s.id === line.sectionId)?.locked);
    // Preserve adjacent rhyme pairs when requested; shuffle paired groups instead
    // of breaking up every line. No spelling-based rhyme assumption is guaranteed.
    const groupSize = options.preserveRhyme ? 2 : 1;
    const groups: Candidate[][] = [];
    for (let i = 0; i < candidates.length; i += groupSize) {
      groups.push(candidates.slice(i, i + groupSize));
    }
    const ordered = (locked ? groups : shuffle(groups, rnd)).flat();
    const lines: LyricSpan[] = [];
    for (let slot = 0; slot < target.bars; slot++) {
      const item = ordered[slot % ordered.length];
      const key = item.line.id + ":" + item.start + ":" + item.end;
      const repeated = seenFragments.has(key);
      if (repeated) repeatedSlots++;
      seenFragments.add(key);
      lines.push({
        sourceId: item.line.sectionId,
        lineId: item.line.id,
        sourceLineNumber: item.line.sourceLineNumber,
        start: item.start,
        end: item.end,
        text: item.text,
        repeated,
      });
    }
    if (target.bars > candidates.length) {
      warnings.push(sectionLabel(target.type) + " reuses " +
        (target.bars - candidates.length) + " source phrase slot(s) to fill the requested arrangement.");
    }
    result.push({ id: target.id, type: target.type, bars: target.bars, lines });
  }
  const overall = result.flatMap(block => block.lines);
  const density = overall.reduce((sum, line) => sum + estimatedSyllables(line.text), 0) / overall.length;
  warnings.push("Estimated " + density.toFixed(1) + " syllables per planned bar slot at " +
    options.targetBpm + " BPM (" + (240 / options.targetBpm).toFixed(2) +
    " seconds per 4/4 bar). One lyric line/fragment is assigned to one slot; actual musical bar placement requires listening.");
  if (options.sourceBpm && options.targetBpm > options.sourceBpm * 1.2) {
    warnings.push("The destination tempo is over 20% faster than the optional source tempo. Delivery may need shorter phrases, rests, or half-time interpretation.");
  }
  if (options.preserveRhyme) {
    warnings.push("Adjacent source phrase pairs are kept together where possible. Rhyme is only approximated from spelling; phonetic, stressed, and internal rhymes are not guaranteed.");
  }
  const arranged: ArrangementResult = {
    sections: result,
    fullText: renderArrangement(result),
    sourceLineCount: originalLines.length,
    repeatedSlots,
    warnings,
    verified: false,
    seed: options.seed,
  };
  arranged.verified = verifyArrangement(sections, arranged);
  if (!arranged.verified) throw new Error("Source integrity verification failed.");
  return arranged;
}

export function parseProjectJSON(json: string): ArrangerProject {
  if (json.length > 500000) throw new Error("Project exceeds the size limit.");
  const value: unknown = JSON.parse(json);
  if (!value || typeof value !== "object") throw new Error("Invalid project.");
  const project = value as Partial<ArrangerProject>;
  if (project.version !== 1 || (project.mode !== "whole" && project.mode !== "sections") ||
      typeof project.wholeText !== "string" ||
      !Array.isArray(project.sections) || !Array.isArray(project.targets) ||
      !project.options || typeof project.options !== "object") throw new Error("Unsupported project format.");
  const sec = project.sections as SourceSection[];
  for (const s of sec) {
    if (!s || typeof s.id !== "string" || typeof s.text !== "string" ||
        !ARRANGEMENT_SECTION_TYPES.includes(s.type) ||
        (s.locked !== undefined && typeof s.locked !== "boolean")) {
      throw new Error("Invalid source section in project.");
    }
  }
  const targets = project.targets as TargetSection[];
  checkTargets(targets);
  for (const t of targets) if (t.sourceId !== undefined && typeof t.sourceId !== "string") {
    throw new Error("Invalid source reference in project.");
  }
  if (project.wholeText.length > 100000) throw new Error("Whole-song input is too large.");
  sourceLines(sec);
  const options = project.options as ArrangementOptions;
  if (!Number.isSafeInteger(options.seed) || typeof options.preserveRhyme !== "boolean" ||
      !Number.isFinite(options.targetBpm) || options.targetBpm < 40 || options.targetBpm > 240 ||
      (options.sourceBpm !== undefined && (!Number.isFinite(options.sourceBpm) ||
       options.sourceBpm < 40 || options.sourceBpm > 240))) {
    throw new Error("Invalid project settings.");
  }
  return project as ArrangerProject;
}
