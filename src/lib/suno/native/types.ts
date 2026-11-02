/**
 * Native genre families: genres the bass-music library does not cover (techno, house, lo-fi, folk, rock,
 * metal, country, synthwave, pop, ambient and cinematic). Each sub-genre carries its own phrase banks, so a
 * folk brief is never described with 808 and drop language.
 */
export interface NativeSub {
  id: string;
  /** Display name used in the opening clause ("Melodic techno"). */
  name: string;
  /** Lower-case matcher for the brief; the earliest match in the brief decides the primary genre. */
  match: RegExp;
  /** Ontology genre names (lower case) this sub-genre takes over from the bass-music library. */
  claims?: string[];
  /** Fewest, most and usual BPM. */
  bpm: [number, number, number];
  /** Free-text rhythmic feel for the plan ("four-on-the-floor", "free"). */
  feel: string;
  /** Moods used when the brief names none. */
  moods: string[];
  /** Whether the genre sings by default when the brief says nothing about vocals. */
  vocal: "sung" | "none";
  /** Lead (hero) parts, used when the brief names no instrument. */
  leads: string[];
  drums: string[];
  bass: string[];
  harmony: string[];
  /** Textures and effects. */
  textures: string[];
  /** Supporting instruments. */
  extras: string[];
  /** How the voice is delivered (phrases that follow "female lead vocal, ..."). */
  vocals: string[];
  /** Production era or colour. */
  eras: string[];
  arrangement: string[];
  mix: string[];
  endings: string[];
}

export type SubBanks = Partial<Omit<NativeSub, "id" | "name" | "match">>;
