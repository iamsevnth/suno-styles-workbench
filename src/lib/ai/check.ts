/**
 * Gate for on-device AI rewording. The AI only proposes new wording for a prompt the deterministic
 * engine already built; this check decides whether that wording may be shown. It never repairs
 * the text: anything that fails is discarded, with the reasons.
 */
import type { PromptCandidate } from "../suno/types.ts";
import { briefFaithfulness, criticalGatesPass, validatePrompt } from "../suno/validate.ts";
import { HARD_MAX_CHARS, MIN_CHARS } from "../suno/render.ts";

export interface AiCheck {
  ok: boolean;
  /** The cleaned text (fences, quotes and labels removed). */
  text: string;
  /** Plain-language reasons the text was rejected; empty when ok. */
  problems: string[];
}

/** Removes the wrapping a chat model tends to add: code fences, quotes, "Styles:" labels. */
export function cleanAiText(raw: string): string {
  let t = raw.trim();
  t = t.replace(/^```[a-z]*\s*/i, "").replace(/\s*```$/, "");
  t = t.replace(/^(?:here(?:'s| is)[^:\n]*:|styles?(?: prompt)?:|rewritten(?: prompt)?:)\s*/i, "");
  t = t.replace(/^["“”']+|["“”']+$/g, "");
  return t.replace(/\s+/g, " ").trim();
}

const GATE_TEXT: Record<string, string> = {
  characterRange: `length outside ${MIN_CHARS}–${HARD_MAX_CHARS} characters`,
  integerBpm: "the tempo (BPM) is missing or changed",
  protectedReferences: "it names an artist or says \"in the style of\"",
  positivePrompting: "it uses negative wording (no, avoid, without)",
  stylesOnly: "it contains lyrics or section tags",
  noContradictions: "it contradicts itself (tempo, vocals or mood)",
  noGenreBleed: "it adds wording from outside the genre",
  noExcludedConcepts: "it mentions something the brief excludes",
};

export function checkAiRewrite(raw: string, original: PromptCandidate): AiCheck {
  const text = cleanAiText(raw);
  const problems: string[] = [];
  if (!text) return { ok: false, text, problems: ["the model returned nothing"] };
  const result = validatePrompt(text, original.plan);
  if (!criticalGatesPass(result.hardGates)) {
    for (const [gate, pass] of Object.entries(result.hardGates)) {
      if (pass === false && GATE_TEXT[gate]) problems.push(GATE_TEXT[gate]);
    }
  }
  // It must keep at least as many of the brief's own words (scenes, textures, instruments) as the original.
  if (briefFaithfulness(text, original.plan) < briefFaithfulness(original.styles, original.plan)) {
    problems.push("it dropped words from your brief that the original kept");
  }
  if (text.toLowerCase() === original.styles.toLowerCase()) problems.push("it is the same as the original");
  return { ok: problems.length === 0, text, problems };
}

/** The instruction given to the on-device model. */
export function rewordInstruction(original: PromptCandidate): string {
  return [
    "You rewrite music-style prompts for Suno. Rewrite the prompt below with new wording and sentence order.",
    `Keep every musical fact: the tempo written exactly as "${original.bpm} BPM", every genre name, instrument, vocal detail, mood and production detail.`,
    "Do not add new instruments, genres or effects.",
    `Write between ${MIN_CHARS} and 975 characters.`,
    "Describe only what to hear: never write no, avoid, without or don't.",
    "No artist names, no lyrics, no section tags in brackets.",
    "Return only the rewritten prompt, with no title, quotes or explanation.",
  ].join(" ");
}
