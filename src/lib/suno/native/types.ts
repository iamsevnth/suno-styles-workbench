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
  /** Vocal style when the brief says nothing about it ("chops" for a bass-music track, "rap" for a rap one). */
  vocalStyle?: "chops" | "rap" | "melodic-rap" | "autotuned-rap" | "sung";
  /** How a rap vocal sits in this genre; used instead of `vocals` when the brief asks for rap. */
  rapVocals?: string[];
  /** Part of the bass/rap world: non-EDM wording is a hard validation failure. */
  edm?: boolean;
  /** Show the user's own wording (riddim, dnb, baile) in the opening clause instead of the catalog name. */
  keepWords?: boolean;
  /** Always show the catalog name, never the user's own spelling ("2-step garage" is still "UK Garage"). */
  keepName?: boolean;
  /** A short rhythm phrase that joins the drums when this genre is a supporting genre in a blend. */
  signature?: string;
  /** Wording the bleed gate accepts for this genre (phonk is cassette-saturated and lo-fi by nature). */
  allow?: string;
  /** Extra check on the whole brief before a match counts (plain "trap" is EDM trap unless the brief raps). */
  context?: (lowerText: string) => boolean;
  /** Section headings for genres that read better with their own words ("Bass design and chords"). */
  headings?: { bass?: string; textures?: string };
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
