import type { ParsedInput } from "../types.ts";
import type { NativeSub } from "./types.ts";
import { phraseExcluded } from "../intent.ts";

export type VariationMode = "precision" | "exploration" | "ab";
export type NativeFocus = "rhythm" | "bass" | "sound-design" | "arrangement";
export interface NativeIdentity {
  id: string;
  label: string;
  focus: NativeFocus;
}

/**
 * Identity profiles do NOT add genres or introduce another sound library.
 * They selectively emphasize existing phrases from the matched v5 native bank.
 */
export function applyNativeIdentity(
  primary: NativeSub,
  sections: Record<string, string[]>,
  parsed: ParsedInput,
  rank: number,
  mode: VariationMode = "precision",
): { identity: NativeIdentity; sections: Record<string, string[]> } {
  const axes: NativeFocus[] = ["bass", "rhythm", "sound-design", "arrangement"];
  const i = mode === "exploration" ? (rank * 3 + 1) % axes.length : rank % axes.length;
  const focus = axes[i];
  const keys: Record<NativeFocus, keyof NativeSub> = {
    bass: "bass", rhythm: "drums", "sound-design": "textures", arrangement: "arrangement",
  };
  const sectionKey: Record<NativeFocus, string> = {
    bass: "bass", rhythm: "drums", "sound-design": "textures", arrangement: "arrangement",
  };
  const locked = {
    bass: parsed.bassHints.length > 0,
    rhythm: parsed.drumHints.length > 0,
    "sound-design": (parsed.textures ?? []).length > 0 || parsed.soundDesignHints.length > 0,
    arrangement: parsed.arrangementHints.length > 0 || (parsed.arrangementCues ?? []).length > 0,
  };
  const next = { ...sections };
  // Protect the first phrase of every explicitly specified source clause.
  if (!locked[focus]) {
    const section = sectionKey[focus];
    const current = sections[section] ?? [];
    // Identity may only promote phrases already cleared by the native bank's
    // exclusion and genre-bleed filters; never inject filtered-out material.
    const candidates = ((primary[keys[focus]] as string[] | undefined) ?? [])
      .filter(x => current.includes(x) && !phraseExcluded(x, parsed.exclusions));
    const chosen = candidates[(rank + i) % candidates.length];
    if (chosen && current.includes(chosen)) {
      next[section] = [chosen, ...current.filter(x => x !== chosen)];
    } else if (chosen) {
      next[section] = [chosen, ...current];
    }
  }
  return {
    identity: {
      id: primary.id + ":" + focus,
      label: primary.name + " — " + focus + " focus",
      focus,
    },
    sections: next,
  };
}

/** A/B uses *only* another bass articulation from the existing, matched v5 native bank. */
export function alternateNativeBass(
  primary: NativeSub, current: string, exclusions: string[] | undefined,
): string | undefined {
  return primary.bass.find(x => x !== current && !phraseExcluded(x, exclusions));
}
