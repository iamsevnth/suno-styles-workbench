import { PromptCandidate } from "../src/lib/suno/types.ts";

/** The prompt with its genre names removed, longest first so "Deep UKG-Dubstep" goes before "Deep UKG". */
export function withoutGenreNames(p: PromptCandidate): string {
  // Tempo-named genres as the prompt writes them ("138 UKG Dubstep", "Deep 141 Bass") go first, so
  // removing "140 UKG" never leaves a stray "Dubstep" behind.
  const stripped = p.styles.replace(/\b(?:deep[ -])?(?:1[34]\d )?UKG[ -]dubstep\b|\b(?:deep[ -])?1[34]\d (?:UKG|Bass)\b/gi, "");
  return [p.plan.primaryGenre, p.plan.secondaryGenre, p.plan.accentGenre]
    .filter((g): g is string => Boolean(g))
    .sort((a, b) => b.length - a.length)
    .reduce((text, g) => text.split(g).join(""), stripped);
}
