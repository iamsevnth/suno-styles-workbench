export type SectionType =
  | "intro"
  | "verse"
  | "chorus"
  | "buildup"
  | "drop"
  | "breakdown"
  | "bridge"
  | "outro";

export interface SectionConfig {
  enabled: boolean;
  count: number;
  lines: number;
  customPrompt?: string;
}

export type StructureMap = Record<SectionType, SectionConfig>;

export interface ModularSectionItem {
  id: string;
  type: SectionType;
  lines: number;
  customLabel?: string;
}

export const DEFAULT_STRUCTURE: StructureMap = {
  intro: { enabled: true, count: 1, lines: 2 },
  verse: { enabled: true, count: 2, lines: 4 },
  buildup: { enabled: true, count: 2, lines: 2 },
  drop: { enabled: true, count: 2, lines: 2 },
  chorus: { enabled: true, count: 2, lines: 4 },
  breakdown: { enabled: true, count: 1, lines: 2 },
  bridge: { enabled: true, count: 1, lines: 4 },
  outro: { enabled: true, count: 1, lines: 2 },
};

export const DEFAULT_MODULAR_SEQUENCE: ModularSectionItem[] = [
  { id: "s-intro-1", type: "intro", lines: 2 },
  { id: "s-verse-1", type: "verse", lines: 4 },
  { id: "s-buildup-1", type: "buildup", lines: 2 },
  { id: "s-drop-1", type: "drop", lines: 2 },
  { id: "s-chorus-1", type: "chorus", lines: 4 },
  { id: "s-verse-2", type: "verse", lines: 4 },
  { id: "s-buildup-2", type: "buildup", lines: 2 },
  { id: "s-drop-2", type: "drop", lines: 2 },
  { id: "s-breakdown-1", type: "breakdown", lines: 2 },
  { id: "s-bridge-1", type: "bridge", lines: 4 },
  { id: "s-chorus-2", type: "chorus", lines: 4 },
  { id: "s-outro-1", type: "outro", lines: 2 },
];

export interface LyricsGenParams {
  theme: string;
  genre?: string;
  mood?: string;
  delivery?: string;
  rhymeScheme?: "AABB" | "ABAB" | "AABBCC" | "Freeform";
  draftLyrics?: string;
  instructions?: string;
  includePerformanceTags?: boolean;
  structure?: StructureMap;
  sectionSequence?: ModularSectionItem[];
  seed?: number;
}

export interface GeneratedSection {
  type: SectionType;
  label: string;
  tag: string;
  lines: string[];
  performanceNote?: string;
}

export interface GeneratedLyrics {
  title: string;
  theme: string;
  sections: GeneratedSection[];
  fullText: string;
  totalLines: number;
  seed: number;
}

export interface PhoneticLine {
  original: string;
  phonetic: string;
  isTag: boolean;
}

export interface PhoneticResult {
  fullOriginal: string;
  fullPhonetic: string;
  lines: PhoneticLine[];
}
