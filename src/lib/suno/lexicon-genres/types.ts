/**
 * Everything the compiler can say about one sound family, kept together so a
 * genre's vocabulary is written and reviewed in one place. Each field feeds the
 * phrase bank of the same name in lexicon.ts.
 */
export interface FamilyLexicon {
  /** Moods used when the brief names none; words from MOOD_MAP in ontology.ts. */
  moods: string[];
  /** Production style, finishes the opening sentence: "... with dark atmosphere and {production}." */
  production: string[];
  /** Groove and body feel. */
  groove: string[];
  /** Drum kit and programming details. */
  drums: string[];
  /** Harmonic bed and chord language. */
  harmony: string[];
  /** Melodic hooks and lead material (plural nouns read best). */
  melody: string[];
  /** Textures, transitions and ear-candy. */
  soundDesign: string[];
  /** Mix priorities. */
  mix: string[];
  /** Mastering character. */
  master: string[];
  /** Three-stage song forms. */
  arrangement: string[][];
  /** Whole descriptive sentences used to fill the character window. */
  padding: string[];
  /** Display titles for prompt cards (not part of the prompt text). */
  titles: string[];
}

/** Tone and movement phrases for one bass family (808, house, live, log drum...). */
export interface BassLexicon {
  tones: string[];
  moves: string[];
}
