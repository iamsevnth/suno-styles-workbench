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
  // Earlier Workbench outputs contain known boilerplate and should be recompiled, not treated as authoritative user-authored prose.
  if (/the harmonic bed uses|the sound palette centers|translation stays clear|the record unfolds as|the rhythm settles into/i.test(body)) return null;
  if (body.split(/(?<=[.!?])\s+/).filter(Boolean).length < 4) return null;
  const positive = extractConstraintIntent(body).positiveText
    .replace(/^```(?:text)?\s*/i, "")
    .replace(/\s*```$/, "")
    .replace(/\s+/g, " ").trim();
  if (!positive) return null;
  // Preserve the source's prose, but keep the Styles field to a single target BPM.
  // Source/perceived tempos belong in contextual descriptions rather than another numeric BPM.
  let text = positive.replace(/\b(\d{2,3})(?:\s*(?:to|[-\u2013])\s*(\d{2,3}))?\s*BPM\b/gi,
    (whole, low: string, high: string | undefined) =>
      high !== undefined ? `${plan.bpm} BPM` : Number(low) === plan.bpm ? whole : "the source tempo");
  // An archive header can contain the only BPM/key, while the original body has the full music directions.
  if (!new RegExp(`\\b${plan.bpm}\\s*BPM\\b`, "i").test(text)) {
    const parts = [`${plan.bpm} BPM`];
    if (plan.meter && !text.includes(plan.meter)) parts.push(plan.meter);
    if (plan.key && !text.toLowerCase().includes(plan.key.toLowerCase())) parts.push(plan.key);
    text = `${parts.join(", ")}. ${text}`;
  }
  // A previously structured, complete Styles paragraph is itself the highest-fidelity draft.
  if (text.length >= MIN_CHARS && text.length <= MAX_CHARS) return text;
  if (text.length > MAX_CHARS) {
    // Prefer minor syntactic compression rather than removing a whole production section.
    text = text.replace(/\b(?:very|really|extremely|highly|particularly)\s+/gi, "")
      .replace(/\b(?:and then|and also)\b/gi, "then")
      .replace(/,\s+and\s+/gi, ", ")
      .replace(/\b(?:somewhat|quite|especially)\s+/gi, "")
      .replace(/\s+,/g, ",");
    if (text.length > MAX_CHARS) {
      // Semantic-preserving compact wording keeps explicit bars, drops, vocals and silences intact.
      text = text.replace(/\bsupported by an?\s+/gi, "with ")
        .replace(/\binto longer sustained\b/gi, "into sustained")
        .replace(/\bstronger ad-libs\b/gi, "ad-libs");
    }
    if (text.length > MAX_CHARS) return null; // Never silently discard the source's structural content.
    if (text.length >= MIN_CHARS) return text;
  }
  // Short coherent prompts retain the source's arrangement and only receive small production closers.
  const closers = [
    "Maintain crisp transients and precise stereo definition.",
    "Keep rhythmic contrast deliberate and the low end focused.",
    "Preserve clear articulation through the section changes.",
    "Shape every transition for impact and dynamic clarity.",
  ];
  const preferredCloser = closers[Math.abs(plan.seed >>> 0) % closers.length];
  const additions = [
    "Keep transitions precise.",
    "Maintain rhythmic clarity.",
    "Preserve clean dynamic contrast.",
    preferredCloser,
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
