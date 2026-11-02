import { bassMusicLeaks, hasConflictingBpm, moodClash, vocalInInstrumental } from "./consistency.ts";
import { familyKeys, hasDrops } from "./families.ts";
import { HARD_MAX_CHARS, MAX_CHARS, MIN_CHARS } from "./render.ts";
import { HardGates, SonicPlan } from "./types.ts";

export const ARTIST_LEAK_RE =
  /\b(taylor swift|drake|kanye|the weeknd|billie eilish|travis scott|metro boomin|skrillex|illenium|flume|deadmau5|fred again|calvin harris|beyonc[eé]|weeknd|playboi carti|future\s+hendrix|juice wrld|kendrick(?: lamar)?|j\. ?cole|griselda|earl sweatshirt|lil (?:uzi|baby|wayne)|21 savage|young thug|post malone|bad bunny|burna boy|wizkid|tory lanez|lil (?:tecca|durk|yachty|keed|peep|nas x|pump|skies)|nba youngboy|youngboy never broke again|doja cat|dua lipa|ariana grande|olivia rodrigo|sza|frank ocean|childish gambino|tyler,? the creator|a\$ap(?: rocky)?|migos|cardi b|nicki minaj|megan thee stallion|jay-?z|eminem|50 cent|snoop dogg|dr\.? dre|lana del rey|ed sheeran|adele|rihanna|bruno mars|justin bieber|selena gomez|harry styles|lorde|radiohead|nirvana|coldplay|metallica|the beatles|arctic monkeys|foo fighters|green day|linkin park|daft punk|aphex twin|boards of canada|bon iver|phoebe bridgers|noah kahan|zach bryan|morgan wallen|luke combs|chris stapleton|johnny cash|dolly parton|nujabes|j dilla|tycho|odesza|porter robinson|zedd|avicii|martin garrix|david guetta|swedish house mafia|jamie xx|four tet|chris lake|john summit|peggy gou|charlotte de witte|amelie lens|adam beyer|nina kraviz|hans zimmer|ludovico einaudi|brian eno|enya)\b/i;
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
  // Hard gate: 750..1000. 750..900 is the target the renderer aims for and the score rewards.
  const characterRange = n >= MIN_CHARS && n <= HARD_MAX_CHARS;
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

  const contradictions = findContradictions(styles, plan);
  const noContradictions = contradictions.length === 0;
  for (const c of contradictions) issues.push(`contradiction:${c}`);

  const score = scorePrompt(styles, plan, {
    noContradictions,
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
      noContradictions,
    },
    issues,
    score,
  };
}

/** Things the prompt says that cannot all be true; each entry names the clash. */
export function findContradictions(styles: string, plan: SonicPlan): string[] {
  const found: string[] = [];
  if (hasConflictingBpm(styles, plan.bpm)) found.push("conflicting_bpm");
  const instrumental = plan.vocals.present === false;
  if (vocalInInstrumental(styles, instrumental)) found.push("vocal_terms_in_instrumental");
  const sentences = styles.split(/(?<=[.;])\s+/);
  if (sentences.some((x) => moodClash(x))) found.push("mood_clash");
  const families = familyKeys([plan.primaryGenre, plan.secondaryGenre, plan.accentGenre]);
  // Native families never use bass-music wording. Hip-hop and R&B on the older path legitimately use 808s and hat rolls.
  const leaks = bassMusicLeaks(styles, plan.briefText ?? "").filter((w) => plan.native || !/^(?:808s?|hi-hat rolls?|trap hats?)$/.test(w));
  if ((plan.native || !hasDrops(families)) && leaks.length) found.push("bass_music_phrasing");
  return found;
}

/** Share of the brief's own scene, texture, instrument and unknown-genre words that appear in the prompt. */
export function briefFaithfulness(styles: string, plan: SonicPlan): number {
  const anchors = plan.native
    ? [...(plan.scenes ?? []), ...(plan.textures ?? []), ...plan.anchors]
    : plan.anchors;
  const wanted = [...new Set(anchors.map((a) => a.toLowerCase().trim()).filter((a) => a.length > 2))];
  if (!wanted.length) return 1;
  const text = styles.toLowerCase();
  const kept = wanted.filter((a) => text.includes(a)).length;
  return kept / wanted.length;
}

export function criticalGatesPass(gates: HardGates): boolean {
  return (
    gates.characterRange &&
    gates.integerBpm &&
    gates.protectedReferences &&
    gates.positivePrompting &&
    gates.stylesOnly &&
    gates.noContradictions !== false
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
  else if (n > MAX_CHARS && n <= HARD_MAX_CHARS) score += 4;
  score += Math.round(briefFaithfulness(styles, plan) * 8);
  score += gates.noContradictions === false ? -15 : 4;
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
