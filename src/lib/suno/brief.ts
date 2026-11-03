/**
 * Phrases the brief itself supplied: scenes, textures, instrument descriptions and genre words the
 * library does not know. They travel into the prompt in the user's own words, so nothing the user
 * wrote is silently swapped for a template phrase.
 */

export interface BriefPhrases {
  scenes: string[];
  textures: string[];
  /** Instruments with their modifiers, e.g. "acoustic guitar", "felt piano". Never rewritten. */
  instrumentPhrases: string[];
  /** Genre-like words the ontology and the native catalog both miss. */
  unknownGenres: string[];
}

const INSTRUMENT_NOUNS = [
  "acoustic guitar", "classical guitar", "electric guitar", "bass guitar", "slide guitar", "lap steel", "pedal steel", "guitars?",
  "grand piano", "upright piano", "piano", "rhodes", "wurlitzer", "organ", "hammond", "harpsichord", "accordion", "harmonica",
  "saxophone", "sax", "trumpet", "trombone", "flugelhorn", "french horn", "horns?", "flute", "clarinet", "oboe", "bassoon",
  "violins?", "violas?", "cellos?", "double bass", "upright bass", "strings", "string quartet", "harp", "banjo", "mandolin",
  "fiddle", "ukulele", "sitar", "oud", "kalimba", "marimba", "vibraphone", "glockenspiel", "xylophone", "celeste", "music box",
  "synths?", "synthesizers?", "analog synth", "arpeggiator", "pads?", "plucks?", "choir", "drum machine", "drum kit", "drums",
  "brushes", "congas?", "bongos?", "tambourine", "shakers?", "handclaps?", "claps", "808", "303",
];
const INSTRUMENT_MODS = [
  "acoustic", "electric", "nylon-string", "nylon", "steel-string", "fingerpicked", "fingerstyle", "strummed", "clean", "distorted",
  "overdriven", "fuzzy", "crunchy", "jangly", "twangy", "soft", "warm", "muted", "upright", "felt", "analog", "analogue", "mellow",
  "jazzy", "dusty", "soaring", "dreamy", "airy", "gentle", "lush", "bright", "detuned", "arpeggiated", "plucked", "bowed", "grand",
  "soulful", "smooth", "slow", "lo-fi", "vintage", "tape", "sparse", "minimal", "heavy", "chiming", "ringing", "hollow-body",
];
const INSTRUMENT_RE = new RegExp(
  `\\b(?:(?:${INSTRUMENT_MODS.join("|")})\\s+){0,2}(?:${INSTRUMENT_NOUNS.join("|")})\\b`,
  "gi"
);

const TEXTURE_RE = new RegExp(
  `\\b(?:${[
    "vinyl crackle", "vinyl noise", "vinyl hiss", "tape hiss", "tape saturation", "tape wobble", "tape warmth", "cassette warmth",
    "crackle", "rain sounds?", "rain ambience", "rain ambiance", "rain on (?:the )?window", "field recordings?", "room tone",
    "room noise", "white noise", "ocean waves", "birdsong", "crickets", "city ambience", "street noise", "fireplace crackle",
    "reverb[- ]drenched", "reverb[- ]soaked", "spacious reverb", "long reverb", "slapback", "tape delay", "wide stereo",
    "sidechain(?:ed)? pads?", "lush reverb", "analog warmth", "analogue warmth", "bit[- ]?crushed", "granular textures?",
  ].join("|")})\\b`,
  "gi"
);

const SCENE_WORDS = [
  "garage band", "golden hour", "late[- ]night", "road trip", "night drive", "coffee shop", "coffee house", "study music", "study session", "living room",
  "small town", "back road", "dance floor", "city skyline", "sunset", "sunrise", "sunny", "dusk", "dawn", "midnight", "twilight",
  "misty", "mist", "warehouse", "lighthouse", "farm", "barn", "attic", "cabin", "harbor", "alley", "subway", "airport", "rainy", "rain", "stormy", "snowy", "foggy", "cloudy", "summer", "winter", "autumn", "fall", "spring", "rooftop", "beach",
  "ocean", "seaside", "desert", "highway", "forest", "mountain", "mountains", "lakeside", "countryside", "city", "downtown",
  "street", "streets", "bedroom", "cafe", "campfire", "porch", "train", "diner", "kitchen", "skyline",
  "morning", "evening", "afternoon", "night", "sunday", "weekend", "neon", "space", "galaxy", "sky", "studying", "homework",
  "day", "drive", "party", "club", "bar", "balcony", "garden", "river",
];
const SCENE_WORD_RE = SCENE_WORDS.join("|");
const SCENE_RE = new RegExp(`\\b(?:(?:${SCENE_WORD_RE})(?:[ -]|\\b)){1,3}`, "gi");
// Words that look like scene words but are really moods, genres or measurements in a brief.
const SCENE_STOP = new Set(["night", "day", "space", "party", "club", "fall", "spring", "bar", "street", "drive", "sky"]);

const UNKNOWN_GENRE_SUFFIX =
  /(?:pop|rock|wave|core|step|hop|house|soul|funk|disco|reggae|ska|blues|gospel|trap|drill|metal|punk|jazz|folk|techno|trance|bass|grime|garage|rap|r&b|emo|dance|beat|beats|bop|bossa|salsa|cumbia|samba|flamenco|swing|afro\w*|k-?pop|j-?pop|grunge|dub|jungle|breaks|bounce|gaze|fi|tronica|hall|rave|synth|surf)$/i;
const GENRE_STOP_WORDS = new Set([
  "instrumental", "vocal", "vocals", "female", "male", "bpm", "mood", "song", "track", "beat", "beats", "music", "generate",
  "make", "create", "variants", "prompts", "prompt", "sound", "style", "vibe", "vibes",
]);

function unique(items: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const item of items) {
    const key = item.toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      out.push(item);
    }
  }
  return out;
}

const clean = (s: string) => s.trim().replace(/[\s-]+$/g, "").replace(/\s+/g, " ").toLowerCase();

export function extractInstrumentPhrases(text: string): string[] {
  const hits = [...text.matchAll(INSTRUMENT_RE)].map((m) => clean(m[0]));
  // A bare "drums" or "synth" is covered by the style, only described instruments are carried.
  const described = hits.filter((h) => h.includes(" ") || /^(?:rhodes|wurlitzer|banjo|mandolin|fiddle|ukulele|sitar|oud|kalimba|marimba|vibraphone|harp|accordion|harmonica|saxophone|trumpet|flute|clarinet|cellos?|violins?)$/.test(h));
  // Drop a phrase that is only the tail of a longer one ("guitar" inside "acoustic guitar").
  const kept = described.filter((h) => !described.some((o) => o !== h && o.endsWith(` ${h}`)));
  return unique(kept).slice(0, 4);
}

export function extractTextures(text: string): string[] {
  return unique([...text.matchAll(TEXTURE_RE)].map((m) => clean(m[0]))).slice(0, 3);
}

export function extractScenes(text: string): string[] {
  const scenes: string[] = [];
  for (const m of text.matchAll(SCENE_RE)) {
    const phrase = clean(m[0]);
    const words = phrase.split(/[\s]+/);
    if (words.length === 1 && SCENE_STOP.has(words[0])) continue;
    if (words.every((w) => SCENE_STOP.has(w))) continue;
    scenes.push(phrase.replace(/-/g, " ").replace(/\blate night\b/, "late-night"));
  }
  return unique(scenes).slice(0, 2);
}

/** Splits a brief into genre-sized chunks: "ambient, lo-fi + sunset" becomes three. */
function chunksOf(text: string): string[] {
  return text
    .replace(/\b\d{2,3}\s*bpm\b/gi, ",")
    .split(/\s*(?:,|;|\+|\/|\||\s&\s|\sx\s|\s×\s|\band\b|\bwith\b|\bfeaturing\b|\bplus\b|\.)\s*/i)
    .map((c) => c.trim())
    .filter(Boolean);
}

/**
 * Genre-like words the library does not know. A chunk counts when it is short and ends in a genre
 * suffix ("vaporfunk", "tropical house-pop"), and is not already explained by a known genre or mood.
 */
export function extractUnknownGenres(text: string, isKnown: (chunk: string) => boolean): string[] {
  const found: string[] = [];
  for (const chunk of chunksOf(text)) {
    const words = chunk.toLowerCase().split(/\s+/).filter(Boolean);
    if (words.length === 0 || words.length > 3) continue;
    const last = words[words.length - 1].replace(/[^a-z0-9&-]/g, "");
    if (GENRE_STOP_WORDS.has(last)) continue;
    // A genre name has no function or voice words in it ("pressure with bounce", "male rap").
    if (words.some((w) => GENRE_STOP_WORDS.has(w) || /^(?:with|and|the|a|an|of|on|in|for|to|sub|hard|rap|lead|no|not|avoid|without|dont|don't|never|muddy|weak)$/.test(w))) continue;
    // Bare sound words are not genres on their own.
    if (words.length === 1 && /^(?:bounce|dance|synth|bass|hall|rave|swing|breaks|step|hop|core|wave|fi|dub|gaze|beat|beats)$/.test(last)) continue;
    if (!UNKNOWN_GENRE_SUFFIX.test(last) && !/-?(?:genre|style)$/.test(last)) continue;
    if (words.some((w) => /^\d/.test(w))) continue;
    // "warehouse" and "lighthouse" end in "house" but are places, not genres.
    if (/^(?:ware|farm|light|coffee|club|town|green|power|play|tree|boat|dog|school|court|opera|station)house$/.test(last)) continue;
    if (isKnown(chunk)) continue;
    found.push(chunk.replace(/\s+/g, " "));
  }
  return unique(found).slice(0, 2);
}

export function extractBriefPhrases(text: string, isKnownGenre: (chunk: string) => boolean): BriefPhrases {
  return {
    scenes: extractScenes(text),
    textures: extractTextures(text),
    instrumentPhrases: extractInstrumentPhrases(text),
    unknownGenres: extractUnknownGenres(text, isKnownGenre),
  };
}
