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

/** Words that say what is different about a drop ("harder", "switch-up", "new melody", "extra hats"). */
const CHANGE = /\b(?:harder|heavier|bigger|switch\w*|revoic\w*|shift\w*|new|different|chang\w*|extra|more|adds?|added|doubl\w*|displac\w*|transform\w*|variation|flip\w*|stripped|second pattern)\b/i;
/** A drop that comes later in the record by name ("second drop", "final drop", "last drop", "switch-up drop"). */
const LATER = /\b(?:second|final|last|closing|another|2nd|switch-up)\b[^,]*\bdrop\b/i;
/** Closing stages the final-drop line goes in front of. */
const CLOSING = /^(?:an?\s+|the\s+)?(?:outro|ending|end|fade[- ]?out|closing)\b|\boutro\b/i;

/**
 * True when a later drop in the arc says what changes. Naming a "second drop" is not enough: a change word
 * ("harder", "switch-up", "new melody") has to say how it differs from the first.
 */
export function arcHasDropChange(stages: string[]): boolean {
  const drops = stages.map((s, i) => ({ s, i })).filter(({ s }) => /\bdrop\b/i.test(s));
  return drops.some(({ s }, k) => (k > 0 || LATER.test(s)) && CHANGE.test(s));
}

/** Arc stages with the final-drop change added, unless a later drop already says what changes. */
export function withDropDelta(stages: string[], delta: string): string[] {
  if (!stages.length || arcHasDropChange(stages)) return stages;
  // An arc with no drop (drill, rap) gets no final-drop line.
  if (!stages.some((s) => /\bdrop\b/i.test(s))) return stages;
  const out = [...stages];
  // A later drop named without saying how it differs ("second drop", "final drop") becomes the delta.
  for (let i = out.length - 1; i > 0; i--) {
    if (/^(?:the |a |an )?(?:second|final|last|closing|another) drop\.?$/i.test(out[i].trim())) {
      out[i] = delta;
      return out;
    }
  }
  // Otherwise the delta goes after the last drop-side stage and before an outro or ending.
  let at = out.length;
  while (at > 0 && CLOSING.test(out[at - 1].trim())) at--;
  out.splice(at, 0, delta);
  return out;
}

/** The final-drop lines a plan may use: none that names something the brief excludes ("no hook", "no hats"). */
export function allowedDeltas(excluded: (phrase: string) => boolean): string[] {
  return FINAL_DROP_DELTAS.filter((d) => !excluded(d));
}

/** True when a bass phrase already states a relationship ("growl bass answering the snare"). */
export const RELATIONAL = /\b(?:answer\w*|call\w*|respon\w*|repl\w*|trad\w*)\b/i;
