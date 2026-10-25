import { PhoneticLine, PhoneticResult } from "./types.ts";

export interface PhoneticOptions {
  mode?: "rap" | "natural"; // "rap" follows the AAVE & rap transcription manual (PRICE split, weak forms, -in, cluster reduction, no banned eye-dialect); "natural" gives clear American phonetic pronunciation
  lowercase?: boolean;
}

/**
 * Phonetic lexicon for African American Vernacular English (AAVE) with Southern features
 * and rap reductions, grounded in the transcription manual (Version 2.0).
 *
 * Rules:
 *  - ZERO banned strings: CH for /tʃ/ (never kh!). Never bitkhes, khayn, Watkh, Eyem, Eyed, Laddo, agayn, thraw, bownse.
 *  - PRICE split:
 *      * Before voiced consonants & open syllables: /aɪ/ -> /aː/ ("AH"):
 *        time -> tahm, mine -> mahn, side -> sahd, ride -> rahd, slide -> slahd, I -> ah, my -> mah, eyes -> ahz
 *      * Before voiceless consonants: glide kept /aɪ/ ("AI"):
 *        right -> rait, night -> nait, like -> laik, tight -> tait, ice -> ais, white -> wait, climax -> klaimaks
 *  - Weak forms & cliticization in rap:
 *      them -> em (weak form deletion: "them bitches" -> "em bichiz")
 *      you -> yuh / ya, to -> tuh / ta, of -> uh / uv, and -> an, your -> yo / yor
 *      going to / gon' -> gonna / gon', I'm going to -> ahma / I'ma, want to -> wanna, trying to -> tryna
 *  - -ing -> -in (near-categorical in rap: ridin, slidin, tryin, reachin, droppin)
 *  - Cluster reduction where consonants share voicing: first -> firs, test -> tes, hand -> han, just -> juhs
 *  - Flapping: better -> bedder, little -> liddle, bottle -> boddle
 *  - Specific lexical items: again -> uhgehn (never agayn!), through -> throo (never thraw!), bounce -> bauns (never bownse!)
 */
const RAP_FLOW_LEXICON: Record<string, string> = {
  // Manual Section 12 Corpus & Banned String Fixes
  again: "uhgehn",
  through: "throo",
  bounce: "bauns",
  bitches: "bichiz",
  bitch: "bich",
  bichiz: "bichiz",
  bich: "bich",
  chain: "chayn",
  watch: "wahch",
  reaching: "reechin",
  reach: "reech",
  touch: "tuch",
  catch: "kach",
  latto: "lahto",
  amex: "ameks",
  maybach: "maybahk",
  maybachs: "maybahks",
  fuck: "fuhk",
  all: "awl",
  said: "sed",
  how: "how",
  clap: "klap",
  shit: "shit",
  braids: "braydz",
  braid: "brayd",
  swim: "swim",
  lotto: "lahtoh",
  says: "sez",
  roles: "rohlz",
  royce: "roys",
  code: "kohd",
  climax: "klaimaks",
  smooth: "smooth",
  payback: "paybak",
  hoes: "hohz",
  hoe: "hoh",
  play: "play",
  lay: "lay",
  where: "wair",
  daddy: "dadee",
  end: "end",
  be: "bee",
  he: "hee",
  she: "shee",
  we: "wee",
  see: "see",
  off: "awf",

  // Weak forms & Function words (Section 10.1)
  the: "tha",
  thee: "thee",
  probably: "problee",
  probable: "probubul",
  going: "goin",
  gonna: "gonna",
  want: "wahnt",
  wanna: "wanna",
  trying: "trahyin",
  tryin: "trahyin",
  tryna: "tryna",
  finna: "finna",
  ima: "ahma",
  imma: "ahma",
  because: "kuz",
  cause: "kuz",
  cuz: "kuz",
  about: "baut",
  around: "raund",
  with: "wit",
  without: "witout",
  you: "yuh",
  your: "yo",
  yours: "yorz",
  to: "tuh",
  and: "an",
  for: "fer",
  of: "uh",
  what: "wut",
  was: "wuz",
  were: "wer",
  them: "em",
  give: "giv",
  gimme: "gimme",
  let: "let",
  lemme: "lemme",
  got: "gaht",
  gotta: "gotta",
  should: "shood",
  could: "kood",
  would: "wood",
  shoulda: "shooda",
  coulda: "kooda",
  woulda: "wooda",
  kinda: "kynda",
  sorta: "sorta",
  outta: "owda",
  yeah: "yea",
  yes: "yes",
  nope: "nohp",
  nah: "naw",

  // Section 7.2: PRICE monophthongization before VOICED consonants & open syllables (/aɪ/ -> /aː/ "ah")
  time: "tahm",
  times: "tahmz",
  mine: "mahn",
  side: "sahd",
  sides: "sahdz",
  ride: "rahd",
  rides: "rahdz",
  riding: "rahdin",
  ridin: "rahdin",
  slide: "slahd",
  slides: "slahdz",
  sliding: "slahdin",
  slidin: "slahdin",
  glide: "glahd",
  gliding: "glahdin",
  hide: "hahd",
  hiding: "hahdin",
  wide: "wahd",
  tide: "tahd",
  tides: "tahdz",
  i: "ah",
  my: "mah",
  eye: "ah",
  eyes: "ahz",
  line: "lahn",
  lines: "lahnz",
  fine: "fahn",
  shine: "shahn",
  shining: "shahnin",
  vibe: "vahb",
  vibes: "vahbz",
  vibing: "vahbin",
  five: "fahv",
  alive: "uhlahv",
  mind: "mahnd",
  minds: "mahndz",
  grind: "grahnd",
  grinding: "grahndin",
  sign: "sahn",
  signs: "sahnz",
  rhyme: "rahm",
  rhymes: "rahmz",
  rhyming: "rahmin",
  lie: "lah",
  lying: "lahyin",
  die: "dah",
  dying: "dahyin",
  cry: "krah",
  crying: "krahyin",
  fly: "flah",
  flying: "flahyin",
  try: "trah",

  // Section 7.2: PRICE glide PRESERVED before VOICELESS consonants (/aɪ/ -> "ai" / "ait" / "aik" / "ais")
  right: "rait",
  rights: "raits",
  night: "nait",
  nights: "naits",
  tonight: "tuhnait",
  light: "lait",
  lights: "laits",
  like: "laik",
  likes: "laiks",
  tight: "tait",
  sight: "sait",
  fight: "fait",
  fighting: "faitin",
  ice: "ais",
  white: "wait",
  bite: "bait",
  pipe: "paip",
  hype: "haip",
  strike: "straik",

  // Section 6.1: Cluster reduction (sharing voicing)
  first: "firs",
  test: "tes",
  tests: "tesiz",
  desk: "des",
  desks: "desiz",
  hand: "han",
  hands: "hanz",
  cold: "kohl",
  left: "lef",
  act: "ak",
  just: "juhs",
  past: "pas",
  west: "wes",
  best: "bes",
  fast: "fas",
  last: "las",
  lost: "lahs",

  // Section 6.8: Flapping & casual American speech
  better: "bedder",
  little: "liddle",
  bottle: "boddle",
  city: "siddee",
  pretty: "priddee",
  party: "pardee",
  body: "bahdee",
  everybody: "evrybahdee",
  somebody: "sumbahdee",
  nobody: "nobahdee",

  // Urban, Hip-Hop & Suno Vocal Terms
  brother: "brotha",
  sister: "sista",
  mother: "mutha",
  father: "fatha",
  forever: "foreva",
  together: "tagetha",
  whatever: "whateva",
  never: "neva",
  something: "sumthin",
  nothing: "nuthin",
  everything: "evrythin",
  anything: "anythin",
  someone: "sumwun",
  everyone: "evrywun",
  money: "munnee",
  people: "peepul",
  family: "famlee",
  business: "biznis",
  tomorrow: "tamorrah",
  yesterday: "yesterday",
  shawty: "shawdee",
  shorty: "shordee",
  drip: "drip",
  dripping: "drippin",
  drop: "drahp",
  dropped: "drahpt",
  dropping: "droppin",
  pop: "pahp",
  popping: "poppin",
  bopping: "bahpin",
  bop: "bahp",
  rock: "rahk",
  rocking: "rahkin",
  roll: "rohl",
  rolling: "rohlin",
  stop: "stahp",
  stopping: "stahppin",
  talk: "tawk",
  talking: "tawkin",
  walk: "wawk",
  walking: "wawkin",
  looking: "lookin",
  listen: "lisin",
  listening: "lisnin",
  call: "kawl",
  calling: "kawlin",
  fall: "fawl",
  falling: "fawlin",
  running: "runnin",
  waiting: "waitin",
  chasing: "chaysin",
  living: "livin",
  breathing: "breethin",
  screaming: "skreemin",
  shouting: "showtin",
  whispering: "whisprin",
  burning: "bernin",
  bleeding: "bleedin",

  // Audio / Bass Terms
  bass: "bays",
  sub: "sub",
  subs: "subz",
  rhythm: "rithum",
  tempo: "tempoh",
  beat: "beet",
  beats: "beetz",
  sound: "sownd",
  sounds: "sowndz",
  music: "myoozik",
  synths: "sinths",
  synth: "sinth",
  drums: "drumz",
  frequency: "freekwensee",
  groove: "groov",
  pocket: "pahkit",
  track: "trak",
  tracks: "traks",
  club: "klub",
  clubs: "klubz",
  floor: "flor",
  speaker: "speeker",
  speakers: "speekerz",
  pressure: "presher",
  tension: "tenshun",
  energy: "enerjee",
  dark: "dahrk",
  darkness: "dahrknis",
  shadow: "shadoh",
  shadows: "shadohz",
  neon: "neeon",
  street: "street",
  streets: "streets",
  heart: "hahrt",
  heartbeat: "hahrtbeet",
  soul: "sohl",
  blood: "blud",
  fire: "fyer",
  flame: "flaym",
  power: "power",
  picture: "pikcher",
  action: "akshun",
  motion: "mohshun",

  // Foreign / Baile / Latin loans
  baile: "bylee",
  favela: "fahvelah",
  funk: "fuhnk",
  brasileiro: "brahzeelayroh",
  brazil: "brahzil",
  portuguese: "porchugeez",
  faz: "fahz",
  pose: "pohzee",
  vem: "vayng",
  vai: "vy",
  toca: "tohkah",
  som: "sohng",
  ritmo: "reetmoh",
  dança: "dahnsah",
  fogo: "fohgoh",
  onda: "ohndah",
  amor: "ahmohr",
  vida: "veedah",
  corazón: "kohrahzohn",
  fuego: "fweygoh",
  dembow: "demboh",
  perreo: "pehrayoh",
  chica: "cheekah",
  loco: "lohkoh",
  mami: "mahmee",
  papi: "pahpee",
  reggaeton: "rehgaytohn",
};

// Conversational multi-word contractions in rap flow (Sections 9 & 10)
const RAP_MULTI_WORD_RULES: [RegExp, string][] = [
  [/\bgoing to\b/gi, "gonna"],
  [/\bi am going to\b/gi, "ahma"],
  [/\bi'm going to\b/gi, "ahma"],
  [/\bi'ma\b/gi, "ahma"],
  [/\bwant to\b/gi, "wanna"],
  [/\btrying to\b/gi, "tryna"],
  [/\bfixing to\b/gi, "finna"],
  [/\bout of\b/gi, "owda"],
  [/\bkind of\b/gi, "kynda"],
  [/\bsort of\b/gi, "sorta"],
  [/\bgot to\b/gi, "gotta"],
  [/\bgive me\b/gi, "gimme"],
  [/\blet me\b/gi, "lemme"],
  [/\bshould have\b/gi, "shooda"],
  [/\bcould have\b/gi, "kooda"],
  [/\bwould have\b/gi, "wooda"],
  [/\ba lot of\b/gi, "a lahda"],
  [/\bcome on\b/gi, "kamon"],
  [/\bwhat is\b/gi, "wuts"],
  [/\bwhat are\b/gi, "wuder"],
  [/\bwhat you\b/gi, "wucha"],
  [/\bdon't you\b/gi, "doncha"],
  [/\bdid you\b/gi, "didja"],
  [/\bget out\b/gi, "gedowt"],
];

/**
 * Algorithmic phonetic American English pronunciation applying
 * AAVE & Rap Transcription constraints:
 *  - PRICE split (pre-voiced -> ah; pre-voiceless -> ai)
 *  - No eye-dialect letter swaps (kh is forbidden; bitches -> bichiz; again -> uhgehn)
 *  - -ing -> -in
 *  - Flapping
 *  - Zero hyphens
 */
function algorithmicPhonetics(word: string, mode: "rap" | "natural" = "rap"): string {
  const w = word.toLowerCase();
  const clean = w.replace(/[^a-z']/g, "");
  if (!clean) return word;

  if (RAP_FLOW_LEXICON[clean]) {
    return RAP_FLOW_LEXICON[clean];
  }

  // Handle contractions
  if (clean === "don't" || clean === "dont") return "dohnt";
  if (clean === "won't" || clean === "wont") return "wohnt";
  if (clean === "can't" || clean === "cant") return "kant";
  if (clean === "ain't" || clean === "aint") return "aynt";
  if (clean === "i'm" || clean === "im") return mode === "rap" ? "ahm" : "aim";
  if (clean === "i've" || clean === "ive") return mode === "rap" ? "ahv" : "aiv";
  if (clean === "i'll" || clean === "ill") return mode === "rap" ? "ahl" : "ail";
  if (clean === "i'd" || clean === "id") return mode === "rap" ? "ahd" : "aid";
  if (clean === "you're" || clean === "youre") return mode === "rap" ? "yo" : "yoor";
  if (clean === "you've" || clean === "youve") return "yoov";
  if (clean === "you'll" || clean === "youll") return "yool";
  if (clean === "we're" || clean === "were") return "weer";
  if (clean === "they're" || clean === "theyre") return "thair";
  if (clean === "it's" || clean === "its") return "its";
  if (clean === "that's" || clean === "thats") return "thats";
  if (clean === "there's" || clean === "theres") return "thairz";
  if (clean === "what's" || clean === "whats") return "wuts";

  // Section 6.7: -ing endings in rap -> -in
  if (clean.endsWith("ing") && clean.length > 4) {
    const root = clean.slice(0, -3);
    const rootPhon = RAP_FLOW_LEXICON[root] || algorithmicPhonetics(root, mode);
    if (mode === "rap") {
      return rootPhon + "in";
    } else {
      return rootPhon + "ing";
    }
  }

  // -ed endings -> d or t
  if (clean.endsWith("ed") && clean.length > 3) {
    const root = clean.slice(0, -2);
    if (RAP_FLOW_LEXICON[root]) {
      return RAP_FLOW_LEXICON[root] + "d";
    }
  }

  // Plurals ending with s
  if (clean.endsWith("s") && clean.length > 3) {
    const root = clean.slice(0, -1);
    if (RAP_FLOW_LEXICON[root]) {
      return RAP_FLOW_LEXICON[root] + "z";
    }
  }

  // Section 7.2: PRICE Rule for unrecognized words
  // e.g., C-i-C-e pattern
  if (/([bdfghjklmnprstvwz])i([dmbvzlnr])e\b/.test(clean)) {
    // Pre-voiced: glide flattens to "ah" in rap mode
    if (mode === "rap") {
      return clean.replace(/([bdfghjklmnprstvwz])i([dmbvzlnr])e\b/, "$1ah$2");
    } else {
      return clean.replace(/([bdfghjklmnprstvwz])i([dmbvzlnr])e\b/, "$1y$2");
    }
  }

  if (/([bdfghjklmnprstvwz])i([tkpsfc])e\b/.test(clean)) {
    // Pre-voiceless: glide /aɪ/ strictly preserved!
    return clean.replace(/([bdfghjklmnprstvwz])i([tkpsfc])e\b/, "$1ai$2");
  }

  // Regular phonetic substitutions (guaranteeing CH for affricate, NEVER kh!)
  let p = clean
    .replace(/tion\b/g, "shun")
    .replace(/sion\b/g, "zhun")
    .replace(/cious\b/g, "shus")
    .replace(/tious\b/g, "shus")
    .replace(/ture\b/g, "cher")
    .replace(/ph/g, "f")
    .replace(/ck/g, "k")
    .replace(/qu/g, "kw")
    .replace(/wr/g, "r")
    .replace(/kn/g, "n")
    .replace(/igh/g, "ai")
    .replace(/eigh/g, "ay")
    .replace(/ough/g, "aw")
    .replace(/augh/g, "aw")
    .replace(/ee/g, "ee")
    .replace(/oo/g, "oo")
    .replace(/ea/g, "ee")
    .replace(/ai/g, "ay")
    .replace(/oa/g, "oh")
    .replace(/ow\b/g, "oh")
    .replace(/ou/g, "ow")
    .replace(/oi/g, "oy")
    .replace(/oy/g, "oy")
    .replace(/aw/g, "aw")
    .replace(/au/g, "aw")
    .replace(/wh/g, "w")
    .replace(/tch/g, "___CH___")
    .replace(/ch/g, "___CH___")
    .replace(/sh/g, "___SH___")
    .replace(/th/g, "___TH___")
    .replace(/c([eiy])/g, "s$1")
    .replace(/ck/g, "k")
    .replace(/c/g, "k")
    .replace(/___CH___/g, "ch")
    .replace(/___SH___/g, "sh")
    .replace(/___TH___/g, "th")
    .replace(/x/g, "ks")
    .replace(/q/g, "k");

  // Vowel with silent e
  if (/([bdfghjklmnprstvwz])([aeou])([bdfghjklmnprstvwz])e\b/.test(p)) {
    p = p.replace(/([bdfghjklmnprstvwz])a([bdfghjklmnprstvwz])e\b/, "$1ay$2");
    p = p.replace(/([bdfghjklmnprstvwz])o([bdfghjklmnprstvwz])e\b/, "$1oh$2");
    p = p.replace(/([bdfghjklmnprstvwz])u([bdfghjklmnprstvwz])e\b/, "$1oo$2");
  }

  // Intervocalic flapping (Section 6.8)
  if (mode === "rap") {
    p = p.replace(/([aeiouy])tt([aeiouy])/g, "$1dd$2");
  }

  // Strip any accidental hyphens
  return p.replace(/-/g, "");
}

/**
 * Converts a single token into American English Phonetics
 */
export function wordToAmericanPhonetic(rawWord: string, mode: "rap" | "natural" = "rap"): string {
  const match = rawWord.match(/^([^A-Za-z0-9']*)([A-Za-z0-9']+)([^A-Za-z0-9']*)$/);
  if (!match) return rawWord.replace(/-/g, "");

  const [, leading, core, trailing] = match;
  const lower = core.toLowerCase();

  let phonetic = RAP_FLOW_LEXICON[lower];
  if (!phonetic) {
    phonetic = algorithmicPhonetics(core, mode);
  }

  // Guarantee no hyphens remain
  phonetic = phonetic.replace(/-/g, "");

  // Maintain capitalization
  if (core === core.toUpperCase() && core.length > 1) {
    phonetic = phonetic.toUpperCase();
  } else if (core[0] === core[0].toUpperCase()) {
    phonetic = phonetic.charAt(0).toUpperCase() + phonetic.slice(1);
  }

  return `${leading}${phonetic}${trailing}`.replace(/-/g, "");
}

/**
 * Converts a line of lyrics into American English Phonetics
 * Preserves section tags like [Verse 1], [Chorus], [Drop]
 */
export function lineToAmericanPhonetic(
  line: string,
  mode: "rap" | "natural" = "rap"
): { original: string; phonetic: string; isTag: boolean } {
  const trimmed = line.trim();
  if (!trimmed) {
    return { original: line, phonetic: "", isTag: false };
  }

  // Section tags stay untouched
  if (/^\[.*\]$/.test(trimmed)) {
    return { original: line, phonetic: line, isTag: true };
  }

  // Parenthetical cues
  if (/^\(.*\)$/.test(trimmed)) {
    const inner = trimmed.slice(1, -1);
    const converted = inner
      .split(/\s+/)
      .map((w) => wordToAmericanPhonetic(w, mode))
      .join(" ");
    return { original: line, phonetic: `(${converted})`.replace(/-/g, ""), isTag: false };
  }

  // Apply connected speech multi-word substitutions in rap flow mode (Section 10)
  let processedLine = line;
  if (mode === "rap") {
    for (const [re, rep] of RAP_MULTI_WORD_RULES) {
      processedLine = processedLine.replace(re, rep);
    }
  }

  // Process individual words
  const converted = processedLine
    .split(/(\s+)/)
    .map((token) => (/^\s+$/.test(token) ? token : wordToAmericanPhonetic(token, mode)))
    .join("");

  const noHyphens = converted.replace(/-/g, "");
  return { original: line, phonetic: noHyphens, isTag: false };
}

/**
 * Converts full lyric text to American English Phonetics without hyphens
 */
export function convertToPhonetics(
  text: string,
  options: PhoneticOptions = { mode: "rap" }
): PhoneticResult {
  const mode = options.mode || "rap";
  const lines = text.split("\n");
  const processedLines: PhoneticLine[] = lines.map((l) => lineToAmericanPhonetic(l, mode));
  const fullPhonetic = processedLines.map((l) => l.phonetic).join("\n");

  return {
    fullOriginal: text,
    fullPhonetic,
    lines: processedLines,
  };
}

// Aliases for compatibility
export const wordToPhonetic = wordToAmericanPhonetic;
export const lineToPhonetic = lineToAmericanPhonetic;
