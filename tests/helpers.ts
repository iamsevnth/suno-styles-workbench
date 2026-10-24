import { PromptCandidate } from "../src/lib/suno/types.ts";

/** The prompt with its genre names removed, longest first so "Deep UKG-Dubstep" goes before "Deep UKG". */
export function withoutGenreNames(p: PromptCandidate): string {
  return [p.plan.primaryGenre, p.plan.secondaryGenre, p.plan.accentGenre]
    .filter((g): g is string => Boolean(g))
    .sort((a, b) => b.length - a.length)
    .reduce((text, g) => text.split(g).join(""), p.styles)
    .replace(/\bUKG[ -]dubstep\b/gi, "");
}
