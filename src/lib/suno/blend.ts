/**
 * The assembly layer's shared rules: how a brief's genres become one primary plus at most two
 * supporting influences (each with a role), how competing moods become one coherent phrase, how
 * synonymous sonic elements merge, and how the tempo is checked against the blended genres.
 *
 * Everything here is pure and data-driven, so parse.ts, plan.ts and render.ts apply the same rules.
 */
import { familyKeys } from "./families.ts";
import { matchGenre } from "./ontology.ts";

/* -------------------------------------------------------------------------------------------- */
/* Re-ingested output: strip the compiler's own boilerplate before reading intent.               */
/* -------------------------------------------------------------------------------------------- */

/**
 * Fix mode re-reads prompts the compiler wrote earlier. Its filler sentences are not user intent
 * ("The production keeps Melodic Future Bass ... front and center" is an anchor echo, not a request for
 * Melodic Future Bass), so they are removed before genres, moods and instruments are extracted.
 */
const TEMPLATE_BOILERPLATE: RegExp[] = [
  /\bThe production keeps\b[^.;\n]*?\bfront and center\b[.,;]?/gi,
  /\bTranslation stays clear on every playback system\b[.,;]?/gi,
  /\bStrong motif identity and disciplined low-end hierarchy keep the production coherent\b[.,;]?/gi,
];

/** Lead-ins the vocal sentence writer uses; quoting one back would stack "features Vocals center on". */
const VOCAL_LEAD_INS =
  /^(?:the\s+)?(?:vocal performance features|vocal delivery showcases|lead vocals deliver|lead vocals feature|vocals center on|vocals centre on|topline features)\s+/i;

export function stripTemplateBoilerplate(text: string): string {
  let t = text;
  for (const re of TEMPLATE_BOILERPLATE) t = t.replace(re, " ");
  return t.replace(/\s+,/g, ",").replace(/,\s*,/g, ",").replace(/\s+/g, " ").trim();
}

export function stripVocalLeadIn(description: string): string {
  return description.replace(VOCAL_LEAD_INS, "").trim();
}

/* -------------------------------------------------------------------------------------------- */
/* Genre blend: one primary, at most two supporting genres, no duplicates.                       */
/* -------------------------------------------------------------------------------------------- */

export const MAX_BLEND_GENRES = 3;

function words(name: string): string[] {
  return name.toLowerCase().split(/[\s-]+/).filter(Boolean);
}

/** True when `broad` is a whole-word run inside `specific` ("Trap" inside "Aggressive Trap"). */
export function isBroaderGenre(broad: string, specific: string): boolean {
  const b = words(broad);
  const s = words(specific);
  if (b.length >= s.length) return false;
  for (let i = 0; i + b.length <= s.length; i++) {
    if (b.every((w, j) => s[i + j] === w)) return true;
  }
  return false;
}

export interface GenreBlend {
  /** Primary first, then supporting genres in the order the brief named them. */
  genres: string[];
  /** Genres removed from the brief and why, for the UI and for tests. */
  notes: string[];
}

/**
 * Resolve the genres a brief named into a blend: de-duplicate by name and by hierarchy (a broad genre
 * named next to its own sub-genre adds nothing), keep the first-named genre as the primary, and cap the
 * rest at two supporting influences.
 */
export function resolveGenreBlend(named: string[]): GenreBlend {
  const notes: string[] = [];
  const kept: string[] = [];
  for (const raw of named) {
    const name = matchGenre(raw)?.name ?? raw;
    if (kept.some((k) => k.toLowerCase() === name.toLowerCase())) {
      notes.push(`Dropped repeated genre "${name}".`);
      continue;
    }
    kept.push(name);
  }
  // A broad genre next to one of its own sub-genres is redundant ("Trap" beside "Aggressive Trap").
  const result: string[] = [];
  for (const name of kept) {
    const specific = kept.find((other) => other !== name && isBroaderGenre(name, other));
    if (specific) {
      notes.push(`Merged "${name}" into the more specific "${specific}".`);
      continue;
    }
    result.push(name);
  }
  if (result.length > MAX_BLEND_GENRES) {
    for (const extra of result.slice(MAX_BLEND_GENRES)) {
      notes.push(`Dropped "${extra}": a blend keeps one primary and two supporting genres.`);
    }
  }
  return { genres: result.slice(0, MAX_BLEND_GENRES), notes };
}

/** What a supporting genre contributes to the record, by sound family. */
const ROLE_BY_FAMILY: [string, (name: string) => string][] = [
  ["ukg", (n) => `${n} hat skip and sub pressure`],
  ["garage", (n) => `${n} swing in the drums`],
  ["riddim", (n) => `${n} wub answers`],
  ["bass", (n) => `${n} bass movement`],
  ["future", (n) => `${n} chord lift`],
  ["trap", (n) => `${n} half-time drums and 808 weight`],
  ["drill", (n) => `${n} sliding bass and hat patterns`],
  ["phonk", (n) => `${n} cowbell and drift character`],
  ["house", (n) => `${n} club pulse`],
  ["breaks", (n) => `${n} chopped break edits`],
  ["baile", (n) => `${n} percussion`],
  ["afro", (n) => `${n} percussion`],
  ["latin", (n) => `${n} percussion`],
  ["dancehall", (n) => `${n} percussion`],
  ["ritual", (n) => `${n} ceremonial atmosphere`],
  ["cinematic", (n) => `${n} dramatic atmosphere`],
  ["ambient", (n) => `${n} atmosphere`],
  ["soul", (n) => `${n} harmony and vocal warmth`],
  ["gospel", (n) => `${n} harmony and vocal warmth`],
  ["pop", (n) => `${n} hook writing`],
  ["rap", (n) => `${n} cadence and drums`],
  ["folk", (n) => `${n} acoustic color`],
];

/** One short noun phrase naming the supporting genre's role ("UKG Dubstep hat skip and sub pressure"). */
export function genreRole(name: string, primary: string): string {
  const primaryFamilies = familyKeys([primary]);
  const families = familyKeys([name]);
  // A sibling of the primary (EDM Trap beside Trap) only adds flavor; it must not reuse the primary's role.
  const sameFamily = families.every((f) => primaryFamilies.includes(f));
  if (!sameFamily) {
    for (const [family, role] of ROLE_BY_FAMILY) {
      if (families.includes(family) && !primaryFamilies.includes(family)) return role(name);
    }
  }
  return `${name} accents`;
}

/** "145 BPM Aggressive Trap with UKG Dubstep hat skip and sub pressure". */
export function genreClause(primary: string, supporting: string[]): string {
  const roles = supporting.slice(0, MAX_BLEND_GENRES - 1).map((g) => genreRole(g, primary));
  if (roles.length === 0) return primary;
  if (roles.length === 1) return `${primary} with ${roles[0]}`;
  return `${primary} with ${roles[0]}, plus ${roles[1]}`;
}

/* -------------------------------------------------------------------------------------------- */
/* Mood reconciliation: one coherent phrase instead of two competing ones.                       */
/* -------------------------------------------------------------------------------------------- */

const INTENSE_MOODS = new Set([
  "dark", "brooding", "menacing", "sinister", "ominous", "nocturnal", "shadowy", "gritty", "dystopian",
  "dangerous", "predatory", "aggressive", "apocalyptic", "tense", "heavy", "raw", "explosive", "primal",
]);
const TENDER_MOODS = new Set([
  "emotional", "melancholic", "bittersweet", "vulnerable", "intimate", "yearning", "reflective", "soulful",
  "heartbroken", "nostalgic", "cathartic", "warm", "euphoric", "soaring", "uplifting", "triumphant",
  "liberating", "seductive",
]);

export interface MoodResolution {
  /** The mood the record leads with. */
  primary: string;
  /** The mood that softens or colors it, when the brief named a competing one. */
  secondary?: string;
  /** A single readable phrase: "dark and aggressive with an emotional edge". */
  phrase: string;
}

const article = (word: string) => (/^[aeiou]/i.test(word) ? "an" : "a");

/**
 * Moods arrive in the order the brief used them. When the brief mixes intense moods (dark, aggressive)
 * with tender ones (emotional, warm), the group named first leads and the other becomes an "edge", so the
 * phrase never asks for two opposite energies at once. Scale words (cinematic, atmospheric) stay as
 * modifiers because they do not conflict with either.
 */
export function reconcileMoods(moods: string[]): MoodResolution | undefined {
  const ordered = [...new Set(moods.map((m) => m.toLowerCase()))];
  if (ordered.length === 0) return undefined;
  const intense = ordered.filter((m) => INTENSE_MOODS.has(m));
  const tender = ordered.filter((m) => TENDER_MOODS.has(m));
  const scale = ordered.filter((m) => !INTENSE_MOODS.has(m) && !TENDER_MOODS.has(m));

  let lead: string[];
  let edge: string | undefined;
  if (intense.length && tender.length) {
    const intenseFirst = ordered.indexOf(intense[0]) <= ordered.indexOf(tender[0]);
    if (intenseFirst) {
      lead = intense.slice(0, 2);
      edge = tender[0];
    } else {
      lead = tender.slice(0, 2);
      edge = intense[0];
    }
  } else {
    lead = (intense.length ? intense : tender.length ? tender : scale).slice(0, 2);
  }
  const modifier = scale.find((m) => !lead.includes(m));
  const terms = modifier ? [modifier, ...lead] : lead;
  let phrase = `${terms.slice(0, -1).join(", ")}${terms.length > 1 ? " and " : ""}${terms[terms.length - 1]}`;
  if (edge) phrase += ` with ${article(edge)} ${edge} edge`;
  return { primary: lead[0], secondary: edge ?? lead[1] ?? modifier, phrase };
}

/* -------------------------------------------------------------------------------------------- */
/* Concepts: merge synonymous sonic elements so one sound is named once.                          */
/* -------------------------------------------------------------------------------------------- */

/** Concept keys, tested in order; a phrase can carry several ("808 sub bass" is both 808 and sub). */
const CONCEPTS: [string, RegExp][] = [
  ["808", /\b808s?\b|\bportamento\b|\bbass (?:slides?|glides?)\b|\b(?:glides?|slides?)\b/i],
  ["sub", /\bsub(?:s|-bass| bass)?\b/i],
  ["wobble", /\bwobbl\w*|\bwubs?\b|\blfo\b/i],
  ["reese", /\breese\b/i],
  ["neuro", /\bneuro\w*/i],
  ["growl", /\bgrowls?\b/i],
  ["pads", /\bpads?\b/i],
  ["hats", /\bhi-?hats?\b|\bhats?\b|\bclosed-hat\b/i],
  ["snare", /\bsnares?\b/i],
  ["kick", /\bkicks?\b/i],
  ["clap", /\bclaps?\b/i],
  ["rim", /\brims?(?:hots?)?\b/i],
  ["shaker", /\bshakers?\b/i],
  ["tom", /\btoms?\b/i],
  ["percussion", /\bdjembe|conga|percussion|bongo|timbales?|woodblock\b/i],
  ["risers", /\brisers?\b|\bimpacts?\b|\bwhite-noise\b|\bnoise lifts?\b/i],
  ["chops", /\bvocal chops?\b|\bvocal fragments?\b/i],
  ["keys", /\brhodes\b|\bpiano\b|\bkeys\b|\bkeyboard\b/i],
  ["guitar", /\bguitars?\b/i],
  ["strings", /\bstrings?\b|\bcello|\bviolin/i],
  ["bells", /\bbells?\b/i],
  ["plucks", /\bplucks?\b/i],
  ["drones", /\bdrones?\b/i],
];

export function conceptsOf(phrase: string): Set<string> {
  const out = new Set<string>();
  for (const [key, re] of CONCEPTS) if (re.test(phrase)) out.add(key);
  return out;
}

/**
 * Keep each concept once. A phrase is dropped when everything it names has already been named, so
 * "sliding 808", "tuned 808 slides" and "saturated harmonic 808" collapse to whichever came first.
 * `seen` is shared across calls so later sections do not repeat earlier ones; phrases that name no known
 * concept are always kept unless they are exact repeats. `protect` phrases (the brief's own words) are kept.
 */
export function dedupeByConcept(phrases: string[], seen: Set<string> = new Set(), protect = 0): string[] {
  const out: string[] = [];
  const exact = new Set<string>();
  phrases.forEach((phrase, index) => {
    const key = phrase.trim().toLowerCase();
    if (!key || exact.has(key)) return;
    const concepts = conceptsOf(phrase);
    const redundant = concepts.size > 0 && [...concepts].every((c) => seen.has(c));
    if (redundant && index >= protect) return;
    exact.add(key);
    for (const c of concepts) seen.add(c);
    out.push(phrase);
  });
  return out;
}

const FILLER_WORDS = new Set(["with", "and", "the", "for", "that", "only", "over", "into", "above", "under", "stays", "keeps"]);

/**
 * Drop a phrase that mostly restates an earlier one even when the wording differs: "wide harmonic field" and
 * "wide harmonic upper field" share two content words, so the second adds nothing.
 */
export function dedupeSimilar(phrases: string[]): string[] {
  const words = (p: string) => (p.toLowerCase().match(/[a-z0-9]{3,}/g) ?? []).filter((w) => !FILLER_WORDS.has(w));
  const kept: { phrase: string; words: Set<string> }[] = [];
  for (const phrase of phrases) {
    const w = new Set(words(phrase));
    const repeat = kept.some((k) => {
      const shared = [...w].filter((x) => k.words.has(x)).length;
      return shared >= 2 && shared >= Math.min(w.size, k.words.size) * 0.66;
    });
    if (!repeat) kept.push({ phrase, words: w });
  }
  return kept.map((k) => k.phrase);
}

/** True when every concept in `phrase` is already named in `text`, or the phrase appears literally. */
export function isCovered(text: string, phrase: string): boolean {
  const esc = phrase.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  if (new RegExp(`(?:^|[^a-z0-9])${esc}(?:$|[^a-z0-9])`, "i").test(text)) return true;
  const concepts = conceptsOf(phrase);
  if (concepts.size === 0) return false;
  const present = conceptsOf(text);
  return [...concepts].every((c) => present.has(c));
}

/* -------------------------------------------------------------------------------------------- */
/* Tempo check across the blend.                                                                  */
/* -------------------------------------------------------------------------------------------- */

/** Fold a tempo to the half-time reading nearest the target (a 70 BPM trap record feels like 140). */
function nearestFeel(bpm: number, target: number): number {
  return [bpm, bpm * 2, bpm / 2].reduce((best, c) => (Math.abs(c - target) < Math.abs(best - target) ? c : best), bpm);
}

export interface BpmCheck {
  /** Blended genres whose home tempo sits far from the requested one. */
  conflicts: { genre: string; home: number }[];
  /** A tempo every blended genre can live with. */
  compromise: number;
}

/**
 * Compare a tempo with the home tempos of every genre in the blend. Half- and double-time readings count
 * as agreement. `compromise` is the primary's tempo, pulled toward the supporting genres when they sit more
 * than `tolerance` BPM away, which the compiler uses when the brief gave no tempo.
 */
export function checkBlendBpm(genres: string[], bpm: number | undefined, tolerance = 12): BpmCheck {
  const homes = genres
    .map((g) => ({ genre: g, home: matchGenre(g)?.defaultBpm }))
    .filter((x): x is { genre: string; home: number } => typeof x.home === "number");
  if (homes.length === 0) return { conflicts: [], compromise: bpm ?? 140 };
  const primaryHome = homes[0].home;
  const target = bpm ?? primaryHome;
  const conflicts = homes.filter((h) => Math.abs(nearestFeel(h.home, target) - target) > tolerance);
  let compromise = primaryHome;
  if (bpm == null && homes.length > 1) {
    const folded = homes.map((h) => nearestFeel(h.home, primaryHome));
    const weights = folded.map((_, i) => (i === 0 ? 2 : 1));
    const avg = folded.reduce((s, v, i) => s + v * weights[i], 0) / weights.reduce((s, w) => s + w, 0);
    if (Math.abs(avg - primaryHome) > 1) compromise = Math.round(avg);
  }
  return { conflicts, compromise: bpm ?? compromise };
}

export function bpmNotes(genres: string[], bpm: number): string[] {
  return checkBlendBpm(genres, bpm).conflicts.map(
    (c) => `${bpm} BPM is far from ${c.genre}'s usual ${c.home} BPM; the blend may pull against the tempo.`
  );
}

/* -------------------------------------------------------------------------------------------- */
/* Sentence case.                                                                                 */
/* -------------------------------------------------------------------------------------------- */

/** Words that keep their capitals wherever they appear. */
const KEEP_CAPS = new Set(["BPM", "UKG", "UK", "EDM", "R&B", "DnB", "MPC", "LFO", "FM", "808", "909", "Rhodes", "Hammond", "B3"]);

/**
 * Lowercase a capital that is not starting a sentence. Genre names the plan carries and the acronyms above
 * are kept; the rest is fragment capitalization ("..., Sliding 808" or "..., The production").
 */
export function sentenceCase(text: string, keep: string[] = []): string {
  const protectedWords = new Set([...KEEP_CAPS, ...keep.flatMap((k) => k.split(/\s+/))]);
  return text.replace(/([,;:—]\s+)([A-Z][A-Za-z-]*)/g, (m, lead: string, word: string) =>
    protectedWords.has(word) ? m : `${lead}${word.charAt(0).toLowerCase()}${word.slice(1)}`
  );
}

/** "a, b and c": commas between items, "and" before the last; "plus" when an item already holds an "and". */
export function joinList(items: string[]): string {
  const list = items.filter(Boolean);
  if (list.length <= 1) return list[0] ?? "";
  const joiner = list.some((i) => /\band\b/i.test(i)) ? "plus" : "and";
  return `${list.slice(0, -1).join(", ")} ${joiner} ${list[list.length - 1]}`;
}
