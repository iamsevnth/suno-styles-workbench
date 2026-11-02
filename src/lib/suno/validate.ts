import { MAX_CHARS, MIN_CHARS } from "./render.ts";
import { HardGates, SonicPlan } from "./types.ts";

export const ARTIST_LEAK_RE =
  /\b(taylor swift|drake|kanye|the weeknd|billie eilish|travis scott|metro boomin|skrillex|illenium|flume|deadmau5|fred again|calvin harris|beyonc[eé]|weeknd|playboi carti|future\s+hendrix|juice wrld|kendrick(?: lamar)?|j\. ?cole|griselda|earl sweatshirt|lil (?:uzi|baby|wayne)|21 savage|young thug|post malone|bad bunny|burna boy|wizkid)\b/i;
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
  const bpmNumbers = [...styles.matchAll(/\b(\d{2,3})\s*BPM\b/gi)].map((m) => Number(m[1]));
  const integerBpm = bpmRe.test(styles) && bpmNumbers.every((n) => n === plan.bpm);
  if (!integerBpm) issues.push("missing_or_wrong_bpm");

  const protectedReferences = !ARTIST_LEAK_RE.test(styles) && !/\bin the style of\b/i.test(styles);
  if (!protectedReferences) issues.push("protected_reference");

  const positivePrompting = !NEGATIVE_RE.test(styles);
  if (!positivePrompting) issues.push("negative_prompting");

  const stylesOnly = !LYRICS_RE.test(styles);
  if (!stylesOnly) issues.push("lyrics_content");

  const exclusionLeakage = (plan.exclusions ?? []).filter((x) => {
    const normalized = x.trim().toLowerCase();
    return normalized.length >= 3 && styles.toLowerCase().includes(normalized);
  });
  const instrumentalLeakage = !plan.vocals.present && /\b(?:for the vocal|female vocals|male vocals|lead vocal(?:s)?|vocal pocket)\b/i.test(styles);
  const coherence = exclusionLeakage.length === 0 && !instrumentalLeakage;
  if (!coherence) issues.push(exclusionLeakage.length ? "excluded_concept_in_styles" : "instrumental_vocal_leakage");

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
    coherence,
  });

  return {
    hardGates: {
      characterRange,
      integerBpm,
      protectedReferences,
      positivePrompting,
      stylesOnly,
      uniqueness,
      coherence,
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
    gates.stylesOnly &&
    gates.coherence !== false
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
  // In A/B Lab, exactly one selected musical dimension changes; textual similarity is intentional.
  if (plan.variationMode === "ab" && peerPlans.length) {
    return peerPlans.every((peer) => majorAxisDistance(plan, peer) === 1);
  }
  // Titles, arbitrary seed IDs and recipe IDs are never evidence of musical variation.
  for (const peer of peerPlans) {
    if (majorAxisDistance(plan, peer) < 2) return false;
  }
  for (const peer of peerTexts) {
    if (structuredSimilarity(styles, peer) > 0.91) return false;
  }
  return true;
}

export function planFingerprint(p: SonicPlan): string {
  return [
    p.primaryGenre,
    p.sonicIdentity ?? "",
    p.metricFeel,
    p.groove[0] ?? "",
    p.bass[0] ?? "",
    p.bassBehavior[0] ?? "",
    p.harmony[0] ?? "",
    p.arrangement[0] ?? "",
    p.vocals.present ? p.vocals.style ?? "sung" : "instrumental",
  ].join("::");
}

/** Distinct musical architectures, not generated text decorations. */
export function majorAxisDistance(a: SonicPlan, b: SonicPlan): number {
  const axes: [unknown, unknown][] = [
    [a.sonicIdentity, b.sonicIdentity],
    [a.metricFeel, b.metricFeel],
    [a.groove[0], b.groove[0]],
    [a.drums[0], b.drums[0]],
    [a.bass[0], b.bass[0]],
    [a.bassBehavior[0], b.bassBehavior[0]],
    [a.harmony[0], b.harmony[0]],
    [a.arrangement[0], b.arrangement[0]],
    [a.soundDesign[0], b.soundDesign[0]],
    [a.vocals.present ? a.vocals.style : "instrumental", b.vocals.present ? b.vocals.style : "instrumental"],
    [a.mix[0], b.mix[0]],
  ];
  return axes.filter(([left, right]) => left !== right).length;
}

export function planDistance(a: SonicPlan, b: SonicPlan): number {
  return majorAxisDistance(a, b);
}

export function scorePrompt(styles: string, plan: SonicPlan, gates: HardGates): number {
  let score = 0;
  score += 12;
  if (plan.primaryGenre) score += 3;
  score += 7; // Single-genre fidelity is not worse than gratuitous hybridization.
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
  score += gates.coherence !== false ? 4 : 0;
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
