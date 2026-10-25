export interface ParsedInput {
  raw: string;
  count: number;
  genres: string[];
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
  arrangementHints: string[];
  mixHints: string[];
  soundDesignHints: string[];
  drafts: string[];
  references: string[];
  mandatory: string[];
  instrumental: boolean;
  profileEnabled: boolean;
  blendBand?: "tame" | "weird" | "unhinged";
  mode: "minimal" | "standard" | "advanced" | "reference" | "rewrite" | "variants";
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
}

export interface PromptCandidate {
  title: string;
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
