import { AMBIENT, CINEMATIC } from "./atmosphere.ts";
import { BASS, DRILL, FUTURE, PHONK, RIDDIM, RITUAL, TRAP } from "./bass-music.ts";
import { BREAKS, GARAGE, HOUSE } from "./club.ts";
import { GOSPEL, POP, RAP, SOUL } from "./song.ts";
import { FamilyLexicon } from "./types.ts";
import { AFRO, BAILE, DANCEHALL, LATIN } from "./world.ts";

export { BASS_SOUNDS } from "./bass-sounds.ts";
export type { BassLexicon, FamilyLexicon } from "./types.ts";

/** Genre vocabulary by sound family; keys match families.ts. */
export const GENRE_LEXICON: Record<string, FamilyLexicon> = {
  afro: AFRO,
  ambient: AMBIENT,
  baile: BAILE,
  bass: BASS,
  breaks: BREAKS,
  cinematic: CINEMATIC,
  dancehall: DANCEHALL,
  drill: DRILL,
  future: FUTURE,
  garage: GARAGE,
  gospel: GOSPEL,
  house: HOUSE,
  latin: LATIN,
  phonk: PHONK,
  pop: POP,
  rap: RAP,
  riddim: RIDDIM,
  ritual: RITUAL,
  soul: SOUL,
  trap: TRAP,
};

type ListField = Exclude<keyof FamilyLexicon, "arrangement">;

/** Appends one field of every family's vocabulary to an existing phrase bank. */
export function withGenreVocabulary(bank: Record<string, string[]>, field: ListField): Record<string, string[]> {
  const merged: Record<string, string[]> = { ...bank };
  for (const [family, lexicon] of Object.entries(GENRE_LEXICON)) {
    merged[family] = [...new Set([...(merged[family] ?? []), ...lexicon[field]])];
  }
  return merged;
}

/** One field of every family's vocabulary, for banks that are new (mix, master, padding, arrangement). */
export function genreField<K extends keyof FamilyLexicon>(field: K): Record<string, FamilyLexicon[K]> {
  return Object.fromEntries(Object.entries(GENRE_LEXICON).map(([family, lexicon]) => [family, lexicon[field]]));
}
