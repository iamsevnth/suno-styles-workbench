import { parseUserInput } from "./parse.ts";
import { buildPlans } from "./plan.ts";
import { hasConflictingBpm } from "./consistency.ts";
import { formatTitle, HARD_MAX_CHARS, renderStyles, trimKeepingInstruments } from "./render.ts";
import { hashString } from "./rng.ts";
import { GenerateResult, PromptCandidate, SonicPlan } from "./types.ts";
import { allHardGatesPass, criticalGatesPass, validatePrompt } from "./validate.ts";

export function generateStylesPrompts(
  input: string,
  options: {
    count?: number;
    profileEnabled?: boolean;
    seed?: number;
    mode?: "minimal" | "standard" | "advanced" | "reference" | "rewrite" | "variants";
    avoidFingerprints?: string[];
  } = {}
): GenerateResult {
  const parsed = parseUserInput(input, {
    count: options.count,
    profileEnabled: options.profileEnabled ?? true,
    mode: options.mode,
  });

  const count = Math.min(12, Math.max(1, options.count ?? parsed.count ?? 3));
  const seed =
    options.seed !== undefined
      ? options.seed
      : hashString(`${input}|${count}|${parsed.profileEnabled}`) ^ 2654435769;

  const prompts: PromptCandidate[] = [];
  const peerTexts: string[] = [];
  const peerPlans: SonicPlan[] = [];
  const usedRecipes = new Set<string>(options.avoidFingerprints ?? []);

  for (let i = 0; i < count; i++) {
    let best: PromptCandidate | null = null;

    for (let attempt = 0; attempt < 14; attempt++) {
      const planSeed = seed + i * 9973 + attempt * 10007 + attempt * attempt * 17;
      const plan = buildPlans(parsed, planSeed, 1, {
        variantIndex: i + attempt * count,
        forceDiversity: attempt > 0 || i > 0,
        diversityRank: i,
        attempt,
      })[0];

      let styles = renderStyles(plan);
      if (usedRecipes.has(plan.recipeId)) {
        continue;
      }

      let validation = validatePrompt(styles, plan, peerTexts, peerPlans);
      let repairs = 0;
      while (!criticalGatesPass(validation.hardGates) && repairs < 6) {
        repairs++;
        const before = styles;
        if (!validation.hardGates.characterRange) {
          styles = forceCharacterWindow(styles, plan.bpm);
        }
        if (!validation.hardGates.positivePrompting) {
          styles = styles
            .replace(/\b(avoid|exclude|excluding|don't|do not|never use)\b/gi, "favor")
            .replace(/\bwithout\b/gi, "using only");
        }
        if (!validation.hardGates.protectedReferences) {
          styles = styles.replace(
            /\bin the style of\b[^.]*/gi,
            "with original production character"
          );
        }
        if (validation.hardGates.noContradictions === false && hasConflictingBpm(styles, plan.bpm)) {
          // Any tempo other than the plan's becomes a plain reference to the set tempo.
          styles = styles.replace(/\b(\d{2,3})\s*BPM\b/gi, (m, n) => (Number(n) === plan.bpm ? m : "the set tempo"));
        }
        if (!validation.hardGates.integerBpm) {
          styles = renderStyles(plan);
          if (!new RegExp(`\\b${plan.bpm}\\s*BPM\\b`, "i").test(styles)) {
            styles = `${plan.bpm} BPM ${styles}`.replace(/\s+/g, " ").trim();
            styles = forceCharacterWindow(styles, plan.bpm);
          }
        }
        validation = validatePrompt(styles, plan, peerTexts, peerPlans);
        if (styles === before) break;
      }

      const characters = styles.length;
      const candidate: PromptCandidate = {
        title: formatTitle(plan.seed, plan.bpm, plan.key, characters),
        seed: plan.seed,
        key: plan.key,
        phrase: plan.titlePhrase,
        bpm: plan.bpm,
        characters,
        styles,
        plan,
        score: validation.score,
        hardGates: validation.hardGates,
        issues: validation.issues,
      };

      if (allHardGatesPass(candidate.hardGates)) {
        best = candidate;
        break;
      }
      if (criticalGatesPass(candidate.hardGates)) {
        if (!best || candidate.score > best.score) best = candidate;
        if (!candidate.hardGates.uniqueness) continue;
        break;
      }
      if (!best || candidate.score > best.score) best = candidate;
    }

    if (!best) {
      const plan = buildPlans(parsed, seed + i * 13, 1, { variantIndex: i })[0];
      const styles = forceCharacterWindow(renderStyles(plan), plan.bpm);
      const validation = validatePrompt(styles, plan, peerTexts, peerPlans);
      best = {
        title: formatTitle(plan.seed, plan.bpm, plan.key, styles.length),
        seed: plan.seed,
        key: plan.key,
        phrase: plan.titlePhrase,
        bpm: plan.bpm,
        characters: styles.length,
        styles,
        plan,
        score: validation.score,
        hardGates: validation.hardGates,
        issues: validation.issues,
      };
    }

    prompts.push(best);
    peerTexts.push(best.styles);
    peerPlans.push(best.plan);
    if (best.plan.recipeId) usedRecipes.add(best.plan.recipeId);
  }

  return { prompts, parsed };
}

/**
 * Repairs a prompt that missed a hard gate: the tempo must be named and the text must fit the Styles field.
 * A prompt that is too short is never padded; the renderer adds real detail or the prompt stays short.
 */
function forceCharacterWindow(text: string, bpm: number): string {
  let t = text.replace(/\s+/g, " ").trim();
  if (!new RegExp(`\\b${bpm}\\s*BPM\\b`, "i").test(t)) t = `${bpm} BPM ${t}`;
  if (t.length > HARD_MAX_CHARS) t = trimKeepingInstruments(t, HARD_MAX_CHARS);
  return t;
}
