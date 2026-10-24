import { allStyles } from "./ontology.ts";

/**
 * Sound families are the keys every phrase bank is organized by. A genre's
 * families come from two places: the `family` field the genre library already
 * stores, and name patterns that catch hybrids ("Cinematic Trap" is trap AND
 * cinematic).
 */

const FAMILIES_BY_LIBRARY_FAMILY: Record<string, string[]> = {
  afro: ["afro"],
  ambient: ["ambient"],
  bass: ["bass"],
  brazilian: ["baile"],
  breaks: ["breaks"],
  caribbean: ["dancehall"],
  drill: ["drill"],
  edm: ["house"],
  experimental: ["breaks"],
  garage: ["garage"],
  gospel: ["gospel"],
  hiphop: ["rap"],
  house: ["house"],
  hybrid: ["bass"],
  latin: ["latin"],
  phonk: ["phonk"],
  pop: ["pop"],
  rap: ["rap"],
  rnb: ["soul"],
  score: ["cinematic"],
  soul: ["soul"],
  trap: ["trap"],
  world: ["bass"],
};

const FAMILIES_BY_NAME: [RegExp, string][] = [
  [/trapstep|edm trap|future trap|aggressive trap|melodic trap|cyber trap|\btrap\b/, "trap"],
  [/future bass|melodic bass/, "future"],
  [/drill/, "drill"],
  [/phonk/, "phonk"],
  [/dubstep|wobble|wubby|brostep|tearout|140 bass|deathstep|psydub/, "bass"],
  [/riddim/, "riddim"],
  [/\bneuro\b/, "bass"],
  [/garage|ukg|2-step|uk bass|bassline|uk funky|grime/, "garage"],
  [/baile|brazilian|favela/, "baile"],
  [/ritual/, "ritual"],
  [/cinematic|trailer|dark ambient|orchestral|film score/, "cinematic"],
  [/soul|r&b|rnb|trip-hop|pluggnb/, "soul"],
  [/house|techno|trance|disco|bounce|big room|complextro/, "house"],
  [/melodic rap|emotional rap|\brap\b|hip-hop|hip hop|\bgrime\b|\bplugg|\brage\b|\bopium\b|digicore/, "rap"],
  [/dancehall|\breggae\b/, "dancehall"],
  [/reggaeton|dembow|moombah|tropical/, "latin"],
  [/afro|amapiano|gqom/, "afro"],
  [
    /breakbeat|breaks|jungle|dnb|drum and bass|footwork|juke|jersey|baltimore|glitch|wonky|drumstep|crossbreed/,
    "breaks",
  ],
  [/\bfolk\b/, "folk"],
  [/gospel|worship|choir|holy/, "gospel"],
  [/\bpop\b|hyperpop|electropop|bubblegum/, "pop"],
  [/ambient|drone|downtempo/, "ambient"],
];

const LIBRARY_FAMILY_OF = new Map(allStyles().map((g) => [g.name.toLowerCase(), g.family]));

/** Families for the genres in a plan, in first-seen order; "general" only when nothing else matches. */
export function familyKeys(genres: (string | undefined)[]): string[] {
  const keys = new Set<string>();
  for (const raw of genres) {
    if (!raw) continue;
    const name = raw.toLowerCase();
    for (const key of FAMILIES_BY_LIBRARY_FAMILY[LIBRARY_FAMILY_OF.get(name) ?? ""] ?? []) keys.add(key);
    for (const [pattern, key] of FAMILIES_BY_NAME) {
      if (pattern.test(name)) keys.add(key);
    }
  }
  if (keys.size === 0) keys.add("general");
  return [...keys];
}

/** Families whose records are built around drops; everything else (songs, scores, world grooves) is not. */
const DROP_FAMILIES = new Set([
  "bass",
  "riddim",
  "future",
  "trap",
  "garage",
  "breaks",
  "house",
  "phonk",
  "drill",
  "baile",
  "ritual",
]);

export function hasDrops(families: string[]): boolean {
  return families.some((f) => DROP_FAMILIES.has(f));
}

// "One-drop" is a reggae rhythm, not an EDM drop.
const DROP_WORDING = /(?<!one-)\bdrops?\b|\bdrop-|(?<!one)-drop\b/i;

/** A phrase fits the plan unless it talks about drops in a genre that has none. */
export function fitsFamilies(phrase: string, families: string[]): boolean {
  return hasDrops(families) || !DROP_WORDING.test(phrase);
}

/** Wub, growl, Reese and neuro tones belong to bass music; other families have their own bass sounds. */
const BASS_FAMILIES_BY_FAMILY: Record<string, string[]> = {
  bass: ["wub", "growl", "reese", "neuro", "808"],
  riddim: ["wub", "growl", "neuro"],
  future: ["808", "reese"],
  garage: ["garage", "reese", "wub"],
  breaks: ["rolling", "reese", "neuro"],
  trap: ["808"],
  drill: ["808"],
  phonk: ["808"],
  rap: ["808"],
  baile: ["808"],
  ritual: ["wub", "808", "drone"],
  soul: ["live"],
  gospel: ["live"],
  pop: ["synth", "live"],
  house: ["house"],
  afro: ["logdrum"],
  latin: ["latin"],
  dancehall: ["dancehall"],
  ambient: ["drone"],
  cinematic: ["drone"],
  folk: ["live"],
  general: ["808"],
};

export function allowedBassFamilies(families: string[]): string[] {
  const allowed = new Set(families.flatMap((f) => BASS_FAMILIES_BY_FAMILY[f] ?? []));
  return allowed.size ? [...allowed] : ["808"];
}

/** Bass families that sit on a separate sub layer; live, synth and drone basses carry their own low end. */
const SUB_LAYER_BASS = new Set(["808", "wub", "growl", "reese", "neuro", "rolling", "garage", "house", "logdrum"]);

export function needsSubLayer(bassFamily: string): boolean {
  return SUB_LAYER_BASS.has(bassFamily);
}
