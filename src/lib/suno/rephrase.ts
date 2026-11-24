/**
 * Rephrase: new wording for a prompt the Workbench wrote, with no AI. The same sonic plan is rendered again
 * with different sentence frames, connectors, phrase order and equivalent bank phrases, so every musical
 * fact stays. A rewording is offered only when it passes every check the original passed.
 */
import { renderStyles } from "./render.ts";
import type { PromptCandidate } from "./types.ts";
import { briefFaithfulness, criticalGatesPass, validatePrompt } from "./validate.ts";

export interface Rephrased {
  text: string;
  /** The wording number used; pass it back to get the next one. */
  wording: number;
}

/** How many wordings to try before reporting that no other wording passes the checks. */
const ATTEMPTS = 24;

/** Rephrase applies to prompts the engine wrote; a pasted prompt kept by Fix mode has no plan to re-render. */
export function canRephrase(candidate: PromptCandidate): boolean {
  return !candidate.fixStrategy || candidate.fixStrategy === "recompiled";
}

/**
 * The next wording after `after` (0 is the prompt as generated) that differs from every text in `seen` and
 * passes the checks: length window, tempo, no artists, positive wording, no contradictions, nothing excluded,
 * and at least as many of the brief's own words as the original kept.
 */
export function rephrase(candidate: PromptCandidate, after = 0, seen: string[] = []): Rephrased | null {
  if (!canRephrase(candidate)) return null;
  const plan = candidate.plan;
  const keep = briefFaithfulness(candidate.styles, plan);
  const known = new Set([candidate.styles, ...seen].map((t) => t.toLowerCase()));
  for (let wording = after + 1; wording <= after + ATTEMPTS; wording++) {
    const text = renderStyles(plan, wording);
    if (known.has(text.toLowerCase())) continue;
    if (!criticalGatesPass(validatePrompt(text, plan).hardGates)) continue;
    if (briefFaithfulness(text, plan) < keep) continue;
    return { text, wording };
  }
  return null;
}
