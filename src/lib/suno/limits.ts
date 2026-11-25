import type { PromptLength } from "./types.ts";

/** Detailed Styles target window; 1,000 characters remains the hard field cap. */
export const MIN_CHARS = 800;
export const MAX_CHARS = 975;
export const HARD_MAX_CHARS = 1000;

/** Tight Styles target window: shorter, denser prompts. */
export const TIGHT_MIN_CHARS = 600;
export const TIGHT_MAX_CHARS = 850;

export interface LengthWindow {
  /** Hard gate: below this the prompt fails. */
  min: number;
  /** Target ceiling the renderers aim for. */
  max: number;
  /** Hard gate: above this the prompt fails. */
  hardMax: number;
  /** The most of the prompt's characters the vocal description may take. */
  vocalShare: number;
}

export const LENGTH_WINDOWS: Record<PromptLength, LengthWindow> = {
  detailed: { min: MIN_CHARS, max: MAX_CHARS, hardMax: HARD_MAX_CHARS, vocalShare: 0.25 },
  tight: { min: TIGHT_MIN_CHARS, max: TIGHT_MAX_CHARS, hardMax: TIGHT_MAX_CHARS, vocalShare: 0.15 },
};

export function lengthWindow(length: PromptLength | undefined): LengthWindow {
  return LENGTH_WINDOWS[length ?? "detailed"];
}

/**
 * Characters the vocal description may use. The share is taken of the window's minimum, so a vocal
 * that fits its budget stays inside the cap however long the finished prompt turns out.
 */
export function vocalBudget(length: PromptLength | undefined): number {
  const w = lengthWindow(length);
  return Math.floor(w.min * w.vocalShare);
}
