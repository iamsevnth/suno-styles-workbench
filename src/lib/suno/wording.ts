/**
 * Wording shared by both renderers, from the 2026-11-23 prompt-engineering research (docs/research):
 * say what the final drop changes, tied to the hook and bass, rather than "bigger" or "louder".
 */

export const FINAL_DROP_DELTAS = [
  "a final drop that revoices the hook over displaced bass answers",
  "a final drop that shifts the bass answers to new offbeats while the hook returns",
  "a final drop that brings the hook back with a changed hat pattern and new bass responses",
  "a final drop that keeps the groove but adds a second bass response to the hook",
];

/** An arc stage that already says how a later drop differs ("harder second drop", "switch-up drop with ..."). */
export const DROP_DELTA_STAGE =
  /^(?!\s*(?:the |a )?final drop\.?\s*$).*\b(?:second|final|last|closing|switch-up|harder|bigger|heavier|new)\b.*\bdrop\b|\bdrop\b.*\b(?:switch\w*|chang\w*|revoic\w*|shift\w*)\b/i;

/** Arc stages with the final-drop change added, unless a stage already says what changes. */
export function withDropDelta(stages: string[], delta: string): string[] {
  if (!stages.length || stages.some((s) => DROP_DELTA_STAGE.test(s))) return stages;
  // An arc with no drop (drill, rap) gets no final-drop line.
  if (!stages.some((s) => /\bdrop\b/i.test(s))) return stages;
  const out = [...stages];
  const last = out.length - 1;
  if (/^(?:the |a )?final drop\.?$/i.test(out[last].trim())) out[last] = delta;
  else out.push(delta);
  return out;
}

/** True when a bass phrase already states a relationship ("growl bass answering the snare"). */
export const RELATIONAL = /\b(?:answer\w*|call\w*|respon\w*|repl\w*|trad\w*)\b/i;
