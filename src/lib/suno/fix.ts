import { extractConstraintIntent, phraseExcluded } from "./intent.ts";
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
  if (source.trim().length < 690) return null;
  if (BOILERPLATE.test(source)) return null;
  const stripped = extractConstraintIntent(source).positiveText
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
  if (plan.key && !text.toLowerCase().includes(plan.key.toLowerCase())) {
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
