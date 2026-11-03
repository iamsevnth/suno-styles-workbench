import { extractConstraintIntent, phraseExcluded, parseKeyIntent } from "./intent.ts";
import type { SonicPlan } from "./types.ts";
import { MIN_CHARS, MAX_CHARS } from "./limits.ts";

export type FixStrategy = "preserved" | "compressed" | "expanded";

/** Fix mode edits user text conservatively and never truncates musical facts. */
export interface FixResult { text: string; strategy: FixStrategy }
const BOILERPLATE = /\b(?:the harmonic bed uses|the sound palette centers|translation stays clear|the record unfolds as|the rhythm settles into|the instrumentation is built around)\b/i;

/**
 * Prefer the complete user-authored source over generated filler. If the user
 * text cannot fit safely, return null to fall back to the legacy compiler.
 */
export function repairExistingPrompt(source: string, plan: SonicPlan): FixResult | null {
  // Preserve short but already well-structured musical briefs before rebuilding them.
  if (source.trim().length < 550) return null;
  if (BOILERPLATE.test(source)) return null;
  // Normalize descriptions of absent material into affirmative musical intent.
  // These transformations do not introduce new vocals or instruments.
  const safeSource = source
    .replace(/\bavoid flattening ([^.!,;]+?) with constant maximal loudness\b/gi,
      (_whole, target: string) => "maintain the dynamics of " + target + " with controlled loudness")
    .replace(/\breplacing (?:the )?vocals? with\b/gi, "centering")
    .replace(/\bmissing lyrics? hook\b/gi, "absent hook");
  const stripped = extractConstraintIntent(safeSource).positiveText
    .replace(/^```(?:text)?\s*/i, "").replace(/\s*```$/, "")
    .replace(/\s+/g, " ").trim();
  const sentences = stripped.split(/(?<=[.!?])\s+/).filter(Boolean);
  if (sentences.length < 3 || !stripped) return null;

  // Contextual source/perceived tempos should not become a second target BPM.
  let text = stripped.replace(/\b([0-9]{2,3})(?:\s*(?:to|[-–])\s*([0-9]{2,3}))?\s*BPM\b/gi,
    (whole, low: string, high?: string) => {
      if (high) return String(plan.bpm) + " BPM";
      return Number(low) === plan.bpm ? whole : "the reference tempo";
    });
  const expected = new RegExp("\\b" + plan.bpm + "\\s*BPM\\b", "i");
  if (!expected.test(text)) {
    text = String(plan.bpm) + " BPM. " + text;
  }
  // The original may spell an accidental as C-sharp instead of C#; those are
  // equivalent musical keys and must not be printed twice.
  if (plan.key && parseKeyIntent(text)?.toLowerCase() !== plan.key.toLowerCase()) {
    text = text.replace(expected, plan.bpm + " BPM, " + plan.key);
  }
  if (plan.meter && !text.includes(plan.meter)) {
    text = text.replace(expected, plan.bpm + " BPM, " + plan.meter);
  }

  if (phraseExcluded(text, plan.exclusions)) return null;
  if (text.length >= MIN_CHARS && text.length <= MAX_CHARS) {
    return { text, strategy: text === stripped ? "preserved" : "compressed" };
  }

  if (text.length > MAX_CHARS) {
    const compressed = text.replace(/\b(?:very|really|extremely|particularly|especially)\s+/gi, "")
      .replace(/\b(?:and then|and also)\b/gi, "then")
      .replace(/,\s+and\s+/gi, ", ").replace(/\s{2,}/g, " ").trim();
    if (compressed.length >= MIN_CHARS && compressed.length <= MAX_CHARS &&
        !phraseExcluded(compressed, plan.exclusions)) {
      return { text: compressed, strategy: "compressed" };
    }
    return null;
  }

  // Add only already-planned production information; no invented genre or vocal direction.
  const closers = [
    ...plan.mix.slice(0, 2).map(x => "Mix focus: " + x + "."),
    ...plan.arrangement.slice(0, 2).map(x => "Arrangement detail: " + x + "."),
    ...plan.soundDesign.slice(0, 2).map(x => "Texture detail: " + x + "."),
  ];
  for (const addition of closers) {
    if (text.length >= MIN_CHARS) break;
    if (phraseExcluded(addition, plan.exclusions) || text.toLowerCase().includes(addition.toLowerCase().replace(/^.*?: /, "").replace(/[.]$/, ""))) continue;
    if (text.length + addition.length + 1 <= MAX_CHARS) text += " " + addition;
  }
  return text.length >= MIN_CHARS && text.length <= MAX_CHARS ? { text, strategy: "expanded" } : null;
}


/**
 * Conservative, text-only warnings for source details a Fix fallback may omit.
 * These are review flags, not proof of semantic equivalence or musical quality.
 * Exclusions are checked separately and never counted as required positive text.
 */
export function fixSourceOmissions(source: string, styles: string): string[] {
  const positive = extractConstraintIntent(source).positiveText;
  const warnings = new Set<string>();
  const markers: Array<[string, RegExp]> = [
    ["Drop 2", /\b(?:drop\s*2|second[- ]drop)\b/i],
    ["silence/fakeout", /\b(?:silenc\w*|silent|fake[- ]?out|blackout|reload)\b/i],
    ["motif", /\bmotifs?\b/i],
    ["alto register", /\balto\b/i],
    ["soprano register", /\bsoprano\b/i],
    ["tenor register", /\btenor\b/i],
    ["baritone register", /\bbaritone\b/i],
    ["autotune", /\bauto[- ]?tun(?:e|ed|ing)\b/i],
    ["Rhodes", /\brhodes\b/i],
    ["flute", /\bflutes?\b/i],
    ["acoustic guitar", /\bacoustic[- ]guitars?\b/i],
    ["electric guitar", /\belectric[- ]guitars?\b/i],
  ];
  for (const [label, pattern] of markers) {
    if (pattern.test(positive) && !pattern.test(styles)) {
      warnings.add("Check source retention: " + label);
    }
  }

  const words: Record<string, number> = { one: 1, two: 2, four: 4, eight: 8, sixteen: 16 };
  for (const m of positive.matchAll(/\b(\d{1,2}|one|two|four|eight|sixteen)[- ]bars?\b/gi)) {
    const number = Number(m[1]) || words[m[1].toLowerCase()];
    if (!number) continue;
    const equivalents = [String(number), ...Object.keys(words).filter(w => words[w] === number)];
    const retained = equivalents.some(w => new RegExp("\\b" + w + "[- ]bars?\\b", "i").test(styles));
    if (!retained) warnings.add("Check source retention: " + number + "-bar timing");
  }
  return [...warnings];
}
