export interface ParsedInput {
  raw: string;
  count: number;
  genres: string[];
  /** Genres the blend resolver merged or dropped, and tempo conflicts, as readable notes. */
  genreNotes?: string[];
  bpm?: number;
  key?: string;
  moods: string[];
  atmospheres: string[];
  instruments: string[];
  explicitInstruments?: string[];
  vocals?: VocalPreferences;
  grooveHints: string[];
  bassHints: string[];
  drumHints: string[];
  harmonyHints: string[];
  arrangementHints: string[];
  mixHints: string[];
  soundDesignHints: string[];
  drafts: string[];
  references: string[];
  mandatory: string[];
  instrumental: boolean;
  /** Scene words from the brief ("sunset rooftop"), carried into the prompt as written. */
  scenes?: string[];
  /** Textures the brief named ("vinyl crackle"). */
  textures?: string[];
  /** Instruments with their modifiers ("acoustic guitar"), never rewritten. */
  instrumentPhrases?: string[];
  /** Genre-like words found in neither the ontology nor the native catalog; passed through verbatim. */
  unknownGenres?: string[];
  /** Set when a native (non-bass) family handles the brief. */
  native?: NativeRoute;
  profileEnabled: boolean;
  blendBand?: "tame" | "weird" | "unhinged";
  mode: "minimal" | "standard" | "advanced" | "reference" | "rewrite" | "variants";
}

export interface NativeRoute {
  /** Catalog ids of the primary and (optional) secondary sub-genre; "general" for unknown genres. */
  primary: string;
  secondary?: string;
  /** The user's own genre words when the library has no entry for them. */
  verbatim?: string;
  /** The user's own spelling of the matched sub-genres ("lo-fi jazz hop"), used for the opening clause. */
  labels?: { primary?: string; secondary?: string };
}

/** The native pipeline's section banks, already rotated for this variant. */
export interface NativeParts {
  genreLabel: string;
  sections: Record<string, string[]>;
  scenes: string[];
  textures: string[];
}

export interface VocalPreferences {
  present?: boolean;
  presentation?: "female" | "male" | "lead";
  register?: string;
  timbre?: string;
  delivery?: string;
  style?:
    | "sung"
    | "rap"
    | "talk-rap"
    | "melodic-rap"
    | "sung-rap"
    | "sing-rap"
    | "mumble-rap"
    | "soundcloud-rap"
    | "autotuned-rap"
    | "lyrical-rap"
    | "chops"
    | "hybrid";
  language?: string;
  processing?: string[];
  rawDescription?: string;
  descriptors?: string[];
  textureVariations?: string[];
  /** An optional extra trait for the generated vocal phrase, used only when the vocal sentence has room. */
  deliveryDetail?: string;
  /** The tone, gender and register the brief named, in that order ("breathy female alto"). */
  briefVoice?: string;
  /** True when the brief itself named the vocal processing (autotune, slapback); false when it was planned. */
  processingFromBrief?: boolean;
  /**
   * How much of the Styles text the vocal may take. "compact" when the brief only names the basics
   * ("male rap", "female vocals"), so the characters go to the production; "detailed" when the
   * brief describes the voice at length.
   */
  detail?: "compact" | "detailed";
}

export interface SonicPlan {
  bpm: number;
  key?: string;
  primaryGenre: string;
  secondaryGenre?: string;
  accentGenre?: string;
  donors: {
    rhythm?: string;
    bass?: string;
    harmony?: string;
    melody?: string;
    atmosphere?: string;
    vocals?: string;
  };
  moodPrimary: string;
  moodSecondary?: string;
  /** The reconciled mood as one phrase ("dark and aggressive with an emotional edge"), when the brief named moods. */
  moodPhrase?: string;
  /** Tempo conflicts between the requested BPM and the blended genres. */
  bpmNotes?: string[];
  atmosphere: string[];
  metricFeel: string;
  groove: string[];
  drums: string[];
  bass: string[];
  bassBehavior: string[];
  harmony: string[];
  melody: string[];
  instruments: string[];
  vocals: VocalPreferences;
  arrangement: string[];
  soundDesign: string[];
  mix: string[];
  master: string[];
  titlePhrase: string;
  anchors: string[];
  recipeId: string;
  /** Present when the plan came from the native (non-bass) pipeline. */
  native?: NativeParts;
  /** The brief as typed, so the validator can tell which words the user asked for. */
  briefText?: string;
  /** Genre words the library does not know, carried verbatim into the opening clause. */
  unknownGenres?: string[];
  scenes?: string[];
  textures?: string[];
  variantAxes: string[];
  seed: number;
}

export interface HardGates {
  characterRange: boolean;
  integerBpm: boolean;
  protectedReferences: boolean;
  positivePrompting: boolean;
  stylesOnly: boolean;
  uniqueness: boolean;
  /** No conflicting BPMs, vocal terms in instrumentals, mood clashes or bass-music phrasing in other genres. */
  noContradictions?: boolean;
}

export interface PromptCandidate {
  title: string;
  seed: number;
  key?: string;
  phrase: string;
  bpm: number;
  characters: number;
  styles: string;
  plan: SonicPlan;
  score: number;
  hardGates: HardGates;
  issues: string[];
}

export interface GenerateResult {
  prompts: PromptCandidate[];
  parsed: ParsedInput;
}

export interface HistoryPromptItem {
  title: string;
  seed?: number;
  key?: string;
  styles: string;
  characters: number;
  bpm: number;
  score: number;
  primaryGenre?: string;
  secondaryGenre?: string;
  accentGenre?: string;
  recipeId?: string;
}

export interface HistoryEntry {
  id: string;
  createdAt: string;
  brief: string;
  seed: number;
  profileEnabled: boolean;
  prompts: HistoryPromptItem[];
}
