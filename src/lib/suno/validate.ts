import { MAX_CHARS, MIN_CHARS } from "./render.ts";
import { HardGates, SonicPlan } from "./types.ts";

export const ARTIST_LEAK_RE =
  /\b(taylor swift|drake|kanye|the weeknd|billie eilish|travis scott|metro boomin|skrillex|illenium|flume|deadmau5|fred again|calvin harris|beyonc[eé]|weeknd|playboi carti|future\s+hendrix)\b/i;
export const NEGATIVE_RE =
  /\b(avoid|exclude|excluding|without\s+(?:any|the|a)\b|don't|do not|never\s+use|no\s+(?:vocals|drums|bass|guitars?|synths?)\b)/i;
export const LYRICS_RE =
  /\b(verse\s*1|chorus:|bridge:|lyrics:|rhyme scheme|write lyrics|\[verse\]|\[chorus\])\b/i;

export interface ValidationResult {
  hardGates: HardGates;
  issues: string[];
  score: number;
}

export function validatePrompt(
  styles: string,
  plan: SonicPlan,
  peerTexts: string[] = [],
  peerPlans: SonicPlan[] = []
): ValidationResult {
  const issues: string[] = [];
  const n = styles.length;
  const characterRange = n >= MIN_CHARS && n <= MAX_CHARS;
  if (!characterRange) issues.push(`character_count:${n}`);

  const bpmRe = new RegExp(`\\b${plan.bpm}\\s*BPM\\b`, "i");
  const integerBpm = bpmRe.test(styles);
  if (!integerBpm) issues.push("missing_or_wrong_bpm");

  const protectedReferences = !ARTIST_LEAK_RE.test(styles) && !/\bin the style of\b/i.test(styles);
  if (!protectedReferences) issues.push("protected_reference");

  const positivePrompting = !NEGATIVE_RE.test(styles);
  if (!positivePrompting) issues.push("negative_prompting");

  const stylesOnly = !LYRICS_RE.test(styles);
  if (!stylesOnly) issues.push("lyrics_content");

  let uniqueness = true;
  if (peerTexts.length > 0 || peerPlans.length > 0) {
    uniqueness = isStructurallyUnique(plan, styles, peerPlans, peerTexts);
    if (!uniqueness) issues.push("insufficient_variant_diversity");
  }

  const score = scorePrompt(styles, plan, {
    characterRange,
    integerBpm,
    protectedReferences,
    positivePrompting,
    stylesOnly,
    uniqueness,
  });

  return {
    hardGates: {
      characterRange,
      integerBpm,
      protectedReferences,
      positivePrompting,
      stylesOnly,
      uniqueness,
    },
    issues,
    score,
  };
}

export function criticalGatesPass(gates: HardGates): boolean {
  return (
    gates.characterRange &&
    gates.integerBpm &&
    gates.protectedReferences &&
    gates.positivePrompting &&
    gates.stylesOnly
  );
}

export function allHardGatesPass(gates: HardGates): boolean {
  return Object.values(gates).every(Boolean);
}

export function isStructurallyUnique(
  plan: SonicPlan,
  styles: string,
  peerPlans: SonicPlan[],
  peerTexts: string[]
): boolean {
  for (const peer of peerPlans) {
    if (planFingerprint(plan) === planFingerprint(peer)) {
      return false;
    }
  }
  if (peerPlans.length > 0) {
    const minPlanDist = Math.min(...peerPlans.map((p) => planDistance(plan, p)));
    if (minPlanDist >= 3) return true;
  }
  for (const p of peerTexts) {
    if (structuredSimilarity(styles, p) > 0.88) return false;
  }
  return true;
}

export function planFingerprint(p: SonicPlan): string {
  return (
    p.recipeId ||
    [
      p.primaryGenre,
      p.secondaryGenre ?? "",
      p.accentGenre ?? "",
      p.metricFeel,
      p.moodPrimary,
      p.bass.slice(0, 2).join(","),
      p.vocals.present ? `${p.vocals.presentation}-${p.vocals.style}` : "inst",
      p.donors.rhythm ?? "",
      p.donors.bass ?? "",
      p.variantAxes.join("|"),
    ].join("::")
  );
}

export function planDistance(a: SonicPlan, b: SonicPlan): number {
  let d = 0;
  if (a.recipeId && b.recipeId && a.recipeId !== b.recipeId) d += 4;
  if (a.primaryGenre !== b.primaryGenre) d += 2;
  if (a.secondaryGenre !== b.secondaryGenre) d += 1;
  if (a.accentGenre !== b.accentGenre) d += 1;
  if (a.metricFeel !== b.metricFeel) d += 2;
  if (a.moodPrimary !== b.moodPrimary) d += 1;
  if ((a.donors.rhythm ?? "") !== (b.donors.rhythm ?? "")) d += 1;
  if ((a.donors.bass ?? "") !== (b.donors.bass ?? "")) d += 1;
  if (a.bass[0] !== b.bass[0]) d += 1;
  if (a.bass[1] !== b.bass[1]) d += 1;
  if (a.drums[0] !== b.drums[0]) d += 1;
  if (a.bassBehavior[0] !== b.bassBehavior[0]) d += 1;
  if (a.vocals.present !== b.vocals.present) d += 2;
  else if (a.vocals.presentation !== b.vocals.presentation) d += 1;
  else if (a.vocals.style !== b.vocals.style) d += 1;
  else if ((a.vocals.processing?.[0] ?? "") !== (b.vocals.processing?.[0] ?? "")) d += 1;
  if (a.arrangement[0] !== b.arrangement[0]) d += 1;
  if (a.mix[a.mix.length - 1] !== b.mix[b.mix.length - 1]) d += 1;
  if (a.titlePhrase !== b.titlePhrase) d += 1;
  return d;
}

export function scorePrompt(styles: string, plan: SonicPlan, gates: HardGates): number {
  let score = 0;
  score += 12;
  if (plan.primaryGenre) score += 3;
  score += plan.secondaryGenre ? 10 : 7;
  score += Math.min(8, 2 + plan.soundDesign.length + plan.atmosphere.length);
  score += Math.min(8, 2 + plan.groove.length + plan.drums.length);
  score += Math.min(8, 2 + plan.bass.length + plan.bassBehavior.length);
  score += plan.moodPrimary ? 6 : 2;
  score += Math.min(6, plan.instruments.length);
  score += Math.min(5, plan.mix.length);
  const n = styles.length;
  if (n >= MIN_CHARS && n <= MAX_CHARS) score += 8;
  else if (n >= 800 && n <= 1000) score += 4;
  const sentences = styles.split(/(?<=\.)\s+/).filter(Boolean).length;
  score += sentences >= 4 && sentences <= 8 ? 5 : 2;
  score += gates.uniqueness ? 6 : 0;
  score += gates.characterRange ? 5 : 0;
  score += gates.protectedReferences ? 5 : 0;
  score += gates.positivePrompting ? 5 : 0;
  return Math.min(100, score);
}

function structuredSimilarity(a: string, b: string): number {
  const ta = new Set(tokenize(a));
  const tb = new Set(tokenize(b));
  let inter = 0;
  for (const t of ta) if (tb.has(t)) inter++;
  const union = ta.size + tb.size - inter || 1;
  return inter / union;
}

function tokenize(s: string): string[] {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 3);
}
