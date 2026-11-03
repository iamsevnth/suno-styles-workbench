import type { SonicPlan } from "./types.ts";

/** Major musical axes. Titles, recipe ids, seeds and verbal padding are excluded. */
export interface SemanticAxes {
  rhythm: string;
  bass: string;
  soundDesign: string;
  arrangement: string;
  vocals: string;
}

const clean = (text: string | undefined): string => (text ?? "").toLowerCase()
  .replace(/\s+/g, " ").replace(/[.,;:!?]+$/g, "").trim();

export function semanticAxes(plan: SonicPlan): SemanticAxes {
  const s = plan.native?.sections;
  const v = plan.vocals;
  return {
    rhythm: clean(s?.drums?.[0] ?? plan.drums[0]),
    bass: clean(s?.bass?.[0] ?? plan.bass[0] ?? plan.bassBehavior[0]),
    soundDesign: clean(s?.textures?.[0] ?? plan.soundDesign[0]),
    arrangement: clean(s?.arrangement?.[0] ?? plan.arrangement[0]),
    vocals: clean(s?.vocal?.[0] ?? (v.present === false ? "instrumental" :
      [v.presentation ?? "lead", v.register ?? "", v.style ?? "sung", v.delivery ?? "", v.processing?.[0] ?? ""].join("|"))),
  };
}

export type SemanticAxis = keyof SemanticAxes;
export const SEMANTIC_AXES: SemanticAxis[] = ["rhythm", "bass", "soundDesign", "arrangement", "vocals"];

export function changedMusicalAxes(a: SonicPlan, b: SonicPlan): SemanticAxis[] {
  const left = semanticAxes(a), right = semanticAxes(b);
  return SEMANTIC_AXES.filter(axis => left[axis] !== right[axis]);
}

export function semanticDistance(a: SonicPlan, b: SonicPlan): number {
  return changedMusicalAxes(a, b).length;
}

export function semanticFingerprint(plan: SonicPlan): string {
  const a = semanticAxes(plan);
  return [plan.primaryGenre, a.rhythm, a.bass, a.soundDesign, a.arrangement, a.vocals].join("|");
}
