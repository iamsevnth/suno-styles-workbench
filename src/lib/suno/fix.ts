import { extractConstraintIntent, splitPromptHeader } from "./intent.ts";
import { MAX_CHARS, MIN_CHARS, FINAL_PAD } from "./render.ts";
import type { ParsedInput, SonicPlan } from "./types.ts";

/**
 * Fix mode is conservative by design: protect a complete user's production
 * instructions instead of re-sampling every clause from the genre lexicon.
 */
export function repairExistingPrompt(raw: string, parsed: ParsedInput, plan: SonicPlan): string | null {
  const { body } = splitPromptHeader(raw);
  if (body.trim().length < 700) return null;
  const positive = extractConstraintIntent(body).positiveText
    .replace(/^```(?:text)?\s*/i, "")
    .replace(/\s*```$/, "")
    .replace(/\s+/g, " ").trim();
  if (!positive) return null;
  let text = positive;
  // A previously structured, complete Styles paragraph is itself the highest-fidelity draft.
  if (text.length >= MIN_CHARS && text.length <= MAX_CHARS) return text;
  if (text.length > MAX_CHARS) {
    // Prefer minor syntactic compression rather than removing a whole production section.
    text = text.replace(/\b(?:very|really|extremely|highly|particularly)\s+/gi, "")
      .replace(/\b(?:and then|and also)\b/gi, "then")
      .replace(/\s+,/g, ",");
    if (text.length > MAX_CHARS) return null; // Never silently discard the source's structural content.
    if (text.length >= MIN_CHARS) return text;
  }
  // Preserve source passages while adding only details already present in the parsed plan.
  const additions = [
    ...((parsed.arrangementCues ?? []).filter((cue) => /drop2|silence|motif/.test(cue.kind)).map((cue) => cue.detail + ".")),
    ...plan.mix.slice(0, 2).map((phrase) => `Mix focus: ${phrase}.`),
    ...plan.soundDesign.slice(0, 2).map((phrase) => `Texture detail: ${phrase}.`),
    FINAL_PAD,
  ];
  const seen = text.toLowerCase();
  for (const addition of additions) {
    if (text.length >= MIN_CHARS) break;
    const key = addition.replace(/^(?:Mix focus: |Texture detail: )/i, "").replace(/[.!]$/, "").toLowerCase();
    if (seen.includes(key) || text.toLowerCase().includes(key)) continue;
    if (text.length + addition.length + 1 <= MAX_CHARS) text += " " + addition;
  }
  return text.length >= MIN_CHARS && text.length <= MAX_CHARS ? text : null;
}
