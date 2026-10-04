import { pick, pickN } from "./rng.ts";

export function familyKeys(genres: (string | undefined)[]): string[] {
  const keys = new Set<string>();
  for (const raw of genres) {
    if (!raw) continue;
    const n = raw.toLowerCase();
    if (/trapstep|edm trap|future trap|aggressive trap|melodic trap|cyber trap/.test(n) || /\btrap\b/.test(n))
      keys.add("trap");
    if (/future bass|melodic bass/.test(n)) keys.add("future");
    if (/drill/.test(n)) keys.add("drill");
    if (/phonk/.test(n)) keys.add("phonk");
    if (/dubstep|wobble|wubby|brostep|tearout|140 bass/.test(n)) keys.add("bass");
    if (/riddim|neuro/.test(n)) keys.add("riddim");
    if (/garage|ukg|2-step|uk bass/.test(n)) keys.add("garage");
    if (/baile|brazilian funk|favela/.test(n)) keys.add("baile");
    if (/ritual/.test(n)) keys.add("ritual");
    if (/cinematic|trailer|dark ambient/.test(n)) keys.add("cinematic");
    if (/soul|r&b|rnb|trip-hop|neo-soul|trapsoul/.test(n)) keys.add("soul");
    if (/house|techno|trance|disco/.test(n)) keys.add("house");
    if (/melodic rap|emotional rap|\brap\b/.test(n)) keys.add("rap");
    if (/dancehall|reggae|reggaeton/.test(n)) keys.add("dancehall");
    if (/experimental|breakbeat|dnb|drum and bass/.test(n)) keys.add("breaks");
    if (/\bfolk\b/.test(n)) keys.add("folk");
    if (/gospel|worship|choir/.test(n)) keys.add("gospel");
    if (/\bpop\b|hyperpop|electropop/.test(n)) keys.add("pop");
    if (/orchestral|film score|trailer/.test(n)) keys.add("cinematic");
    if (/\br&b\b|\brnb\b/.test(n)) keys.add("soul");
  }
  if (keys.size === 0) keys.add("general");
  keys.add("general");
  return [...keys];
}

export function pickFamily(
  rng: () => number,
  bank: Record<string, string[]>,
  families: string[],
  n: number
): string[] {
  const pool: string[] = [];
  for (const f of families) {
    const items = bank[f];
    if (items) pool.push(...items);
  }
  if (pool.length < n) pool.push(...(bank.general ?? []));
  const uniq = [...new Set(pool)];
  const source = uniq.length ? uniq : Object.values(bank).flat();
  return pickN(rng, source, Math.min(n, source.length));
}

export function oneFamily(
  rng: () => number,
  bank: Record<string, string[]>,
  families: string[]
): string {
  return pickFamily(rng, bank, families, 1)[0] ?? "modern bass production";
}

export const PRODUCTION: Record<string, string[]> = {
  general: [
    "bass-forward production",
    "weight-driven hybrid production",
    "club-ready bass production",
    "modern bass production",
    "drop-focused hybrid production",
    "streaming-ready bass production",
    "physical low-end production",
    "high-impact bass production",
    "night-drive bass production",
    "precision hybrid production",
  ],
  trap: [
    "808-forward trap production",
    "hat-driven trap weight production",
    "festival-trap hybrid production",
    "head-nod trap production",
  ],
  drill: [
    "sliding-drill street production",
    "cold UK-drill production",
    "syncopated drill-weight production",
  ],
  phonk: [
    "saturated phonk-haze production",
    "cowbell-grit phonk production",
    "drift-phonk night production",
  ],
  garage: [
    "swung UKG bass production",
    "skippy 2-step hybrid production",
    "140 UK bass production",
  ],
  ritual: [
    "ceremonial ritual-bass production",
    "processional dark-bass production",
  ],
  soul: [
    "warm soul-hybrid production",
    "intimate R&B-forward production",
  ],
  house: [
    "four-floor bass-house production",
    "filtered-house crossover production",
  ],
  baile: [
    "physical baile-funk hybrid production",
    "favela-percussion bass production",
  ],
  riddim: [
    "repetitive riddim-bass production",
    "neuro-mechanical bass production",
  ],
  gospel: [
    "choir-forward gospel production",
    "organ-and-choir worship production",
    "hand-clap church production",
  ],
  rap: [
    "vocal-first rap production",
    "pocket-led rap-hybrid production",
    "modern trap-rap production",
  ],
  pop: [
    "radio-pop polish production",
    "glossy topline-pop production",
  ],
  future: [
    "wide emotional future-bass production",
    "sidechained supersaw hybrid production",
    "euphoric chord-stack production",
    "lush peak-drop production",
  ],
  bass: [
    "wobble-forward bass production",
    "half-time dub-weight production",
    "neuro-mid hybrid production",
  ],
};

export const FEELS: Record<string, string[]> = {
  "half-time": [
    "spacious half-time pulse",
    "heavy half-time engine",
    "slow half-time pocket",
    "head-nod half-time frame",
    "wide-snare half-time pocket",
    "monumental half-time drop frame",
    "lazy-kick half-time weight",
    "cinematic half-time sway",
  ],
  "2-step": [
    "swung 2-step groove",
    "skippy 2-step bounce",
    "garage 2-step pulse",
    "elastic 2-step shuffle",
    "late-hat 2-step lift",
  ],
  "four-on-the-floor": [
    "four-on-the-floor pulse",
    "steady four-floor drive",
    "body-moving four-floor engine",
  ],
  broken: [
    "broken rhythmic pocket",
    "syncopated broken groove",
    "fractured dance pocket",
    "off-grid broken bounce",
    "staggered kick-snare conversation",
  ],
  "full-time": [
    "full-time driving pulse",
    "forward full-time groove",
    "double-time hat urgency over a grounded kick",
  ],
};

export const GROOVE: Record<string, string[]> = {
  trap: [
    "spacious half-time pocket",
    "head-nod weight",
    "sparse kick placement",
    "trap-weight half-time",
    "rolling hat urgency",
    "wide snare space",
    "slow head-nod engine",
    "hard kick scarcity",
    "hat flurry contrast",
    "triplet-hat pressure against empty downbeats",
    "open snare canyon before the bass answer",
    "boom-space-hat architecture",
    "stoic kick scarcity with busy upper hats",
    "club-nod trap lilt",
    "late snare crack after a long air gap",
    "tight half-time pocket with swung hats and crisp layered snares",
    "half-time trap 808 slides and crisp claps with bounce",
    "hyper-swing trap with triplet hats and rapid-fire percussion",
    "slow half-time hip-hop pocket with deep boom-bap thud under trap hats",
  ],
  drill: [
    "dark syncopated drill pocket",
    "sliding bass against sparse claps",
    "tense hat subdivisions over a slow pulse",
    "UK-drill stagger with delayed snare",
    "menacing street pocket",
    "cold open space then a sliding 808 answer",
  ],
  phonk: [
    "hypnotic cowbell pocket",
    "drift-phonk cruise groove",
    "saturated lo-fi bounce",
    "repetitive Memphis-grit nod",
  ],
  garage: [
    "swung 2-step pocket",
    "skippy syncopation",
    "elastic forward momentum",
    "UKG swing over half-time weight",
    "shuffle lift",
    "late snare chatter",
    "skippy rims against sparse kicks",
    "garage bounce under heavy subs",
  ],
  future: [
    "sidechained breathing motion",
    "supersaw pump against the kick",
    "euphoric swell into the drop pocket",
    "wide chord bounce on the backbeat",
    "emotional lift inside a heavy groove",
    "soft-then-huge dynamic pocket",
    "festival-hands groove with intimate verses",
    "uptempo future-bass pocket with intricate glitch percussion",
    "sidechained four-feel over a half-time snare",
  ],
  bass: [
    "weight before release",
    "selective silence",
    "modern bass pocket",
    "drop-gap drama",
    "wub answering a vacant snare",
  ],
  baile: [
    "highly physical syncopation",
    "body-moving baile pocket",
    "street-party bounce",
    "tight call-and-response drums",
    "tamborim chatter against half-time bass",
  ],
  ritual: [
    "processional half-time pulse",
    "hypnotic ceremonial repetition",
    "slow ritual sway",
    "hand-drum cycles under sub weight",
  ],
  cinematic: [
    "processional half-time pulse",
    "hypnotic repetition",
    "ceremonial spacing",
  ],
  soul: [
    "laid-back pocket",
    "humanized microtiming",
    "late-night sway",
    "behind-the-beat R&B drag",
  ],
  house: [
    "four-on-the-floor pump",
    "filtered-loop house bounce",
    "sidechained floor drive",
  ],
  riddim: [
    "call-and-response bass pocket",
    "minimal riddim nod",
    "mechanical repeating bass groove",
  ],
  rap: [
    "pocket-first rap bounce",
    "head-nod verse space",
    "hook-open chorus groove",
  ],
  general: [
    "disciplined spacing",
    "physical body motion",
    "pocket-first groove",
    "silence used as a drum",
  ],
};

export const DRUMS: Record<string, string[]> = {
  trap: [
    "punchy kicks",
    "sharp snares",
    "rapid trap hi-hat rolls",
    "crisp clap stacks",
    "triplet hat chokes",
    "stuttered closed-hat fills",
    "dry trap snare cracks",
    "layered 808-click kicks",
    "open-hat flicks on offbeats",
    "machine-gun 32nd hat bursts",
    "wide clap-snare fusions",
    "sparse tom fills as scene changes",
    "rolling hi-hat speed changes",
    "hard snare with long pre-delay air",
    "tight kick with short click",
  ],
  future: [
    "sidechained kick bloom",
    "bright clap stacks",
    "soft-then-hard snare lifts",
    "shimmering hat veils",
    "festival tom risers into the drop",
    "wide stereo clap throws",
  ],
  bass: [
    "hard downbeat kicks",
    "spacious snare placement",
    "impactful snare cracks",
    "sub-kick thuds",
    "half-time snare cannons",
  ],
  garage: [
    "skippy rims",
    "syncopated kicks",
    "crisp shuffled hats",
    "shuffling ghost notes",
    "late snare shuffles",
    "rim-click 2-step chatter",
  ],
  drill: [
    "sparse drill claps",
    "sliding-hat runs",
    "cold snare cracks",
    "staggered kick placement",
    "rapid closed-hat ticks",
  ],
  phonk: [
    "phonk cowbell hits",
    "crushed snare smacks",
    "lo-fi hat sizzle",
    "drift-phonk clap loops",
  ],
  ritual: [
    "ceremonial hand drums",
    "processional toms",
    "metallic industrial accents",
    "frame-drum pulses",
  ],
  soul: [
    "soft kick",
    "dry snare",
    "brushed ghost notes",
    "late shaker accents",
    "rim clicks in the pocket",
  ],
  house: [
    "four-floor kicks",
    "offbeat hats",
    "clubby clap stacks",
  ],
  rap: [
    "dry verse drums",
    "hook clap stacks",
    "pocket hat ticks",
  ],
  baile: [
    "sharp Brazilian percussion layers",
    "tight claps",
    "tamborim chatter",
    "surdo-like body hits",
  ],
  cinematic: [
    "ceremonial hand drums",
    "processional toms",
    "metallic industrial accents",
  ],
  general: [
    "tight electronic drums",
    "clean transient definition",
    "short room tails",
    "punch-first drum bus",
  ],
};

export const BASS_TONES: Record<string, string[]> = {
  "808": [
    "heavy sliding 808s",
    "long 808 tails",
    "pitch-bent 808 columns",
    "short 808 punches into long tails",
    "rounded 808 bodies with click attacks",
    "octave-jumping 808 phrases",
    "muted 808s that bloom on the drop",
    "boomy 808 slides and growls with tuned sub rumble",
    "trap 808 glide and bounce with precise pitch automation",
  ],
  wub: [
    "rounded modulated wubs",
    "soft-edged wobble bass",
    "slow LFO wubs",
    "speech-like wobble vowels",
    "wide-to-narrow wobble gestures",
    "bandpass-swept wubs",
  ],
  growl: [
    "low growls",
    "aggressive mid growls",
    "vocal-formant growls",
    "short growl stabs",
    "distorted mid-bass snarls",
  ],
  reese: [
    "Reese-style movement",
    "thick detuned Reese",
    "slow-beating Reese beds",
    "filtered Reese swells",
    "mid-bass Reese pressure",
  ],
  neuro: [
    "metallic neuro mid-bass",
    "spectral neuro bass",
    "mechanical neuro motifs",
    "bitcrushed neuro chatter",
  ],
};

export const BASS_MOVES: Record<string, string[]> = {
  "808": [
    "pitch-gliding 808 movement",
    "rhythmically active low-end phrases",
    "808 slides into drop downbeats",
    "808s that pause so hats can speak",
    "call-and-response 808 shapes",
    "808 glides that outline the hook",
    "disciplined mono sub with tight attack and clean decay",
    "sidechained synth bass that breathes with the kick",
  ],
  wub: [
    "bass call-and-response",
    "slow-to-medium wobble modulation",
    "wub answers after snare space",
    "wubs that open after vocal lines",
    "rhythmic wobble syllables",
  ],
  growl: [
    "mid-bass aggression in short phrases",
    "growl stabs between vocal gaps",
    "growls reserved for drop peaks",
  ],
  reese: [
    "thick detuned mid-bass pressure",
    "slow Reese motion under half-time",
    "Reese beds that duck under the vocal",
  ],
  neuro: [
    "shifting spectral modulation",
    "mechanical bass motifs",
    "neuro movement in short bursts",
  ],
};

export const HARMONY: Record<string, string[]> = {
  trap: [
    "uncluttered dark harmonic bed",
    "lean minor stabs",
    "sparse dark piano cells",
    "cold pentatonic bells",
    "minimal trap-key stabs",
  ],
  future: [
    "wide emotional chord stacks",
    "sidechained supersaw layers",
    "lush stacked thirds",
    "bright ninth stacks on the drop",
    "open-voiced festival chords",
    "shimmering stacked pads under the hook",
    "bittersweet major-over-minor lifts",
    "minor-key modal tension with lush emotional resolutions",
    "bright major lift reserved for the chorus",
    "hypnotic trap minor-key loops under wide future-bass stacks",
  ],
  bass: [
    "lean minor stabs",
    "held dark fifths",
    "sparse drop harmony",
  ],
  soul: [
    "warm extended soul harmony",
    "Rhodes-style voicings",
  ],
  cinematic: [
    "slow drone harmony",
    "sparse suspended tones",
  ],
  general: [
    "dark minor harmony",
    "cold minor progressions",
    "shadowy minor beds",
    "sparse dancefloor harmony",
    "minimal hook-supporting chords",
  ],
};

export const MELODY: Record<string, string[]> = {
  trap: [
    "cold pluck hooks",
    "short dark bell cells",
    "memorable sparse motifs",
    "minor pentatonic earworms",
  ],
  future: [
    "simple emotional lead motifs",
    "short euphoric lead cells",
    "soaring hook fragments",
    "wide supersaw lead answers",
    "bittersweet vocal-like synth lines",
    "chant-like short hook cells",
    "melodic lift with a soaring top-line fragment",
  ],
  bass: [
    "sparse memorable motifs",
    "short identity motifs",
    "minimal hook cells",
  ],
  soul: [
    "lyrical intimate melodic phrases",
    "soft soulful motifs",
  ],
  general: [
    "sparse memorable motifs",
    "short identity motifs",
    "few-note hooks with strong contour",
  ],
};

export const SOUND_DESIGN: Record<string, string[]> = {
  trap: [
    "tape-stop fills",
    "gunshot-style snare rooms",
    "vinyl-crackle air on verses",
    "reverse-hat lifters",
  ],
  future: [
    "supersaw white-noise risers",
    "sidechain pump artifacts as FX",
    "shimmering reverse cymbals",
    "festival impact hits",
    "crystal pitch-up transitions",
    "dark cinematic strings over punchy 808s",
    "aggressive trap brass stabs as accents only",
    "shimmering synth plucks and glassy mallets",
    "glassy electric piano under sidechained bass",
  ],
  bass: [
    "cinematic risers",
    "large impacts",
    "reverse textures",
    "filtered noise beds",
  ],
  cinematic: [
    "deep drones",
    "ceremonial ambience",
    "trailer whooshes",
  ],
  general: [
    "atmospheric transitions",
    "subtle risers",
    "short transition fills",
    "filtered noise beds",
  ],
};

export const ARRANGEMENT: Record<string, string[][]> = {
  kinetic: [
    ["groove-forward momentum", "percussion density builds", "drop-focused payoff"],
    ["club-tool intro groove", "mid-track bass showcase", "late percussion climax"],
    ["cold open hats", "full-drop hit", "breakdown then bigger second drop"],
    ["DJ-friendly 16-bar intro", "hook drop", "edit-friendly outro"],
    ["call-and-response vocal chops", "bass feature break", "final expanded drop"],
    ["energy staircase into the first drop", "half-time collapse", "double-time hat peak"],
    ["restrained verses", "massive chorus-sized lift", "stacked-ad-lib finale"],
    ["gradual tension risers", "explosive drop", "intimate bridge pivot"],
    ["verse drums thin for the vocal", "pre-chorus filter swell", "full-drop payoff"],
  ],
  club: [
    ["club-tool intro groove", "mid-track bass showcase", "late percussion climax"],
    ["filter-open intro", "peak-time drop", "stripped percussion outro"],
    ["loop-friendly groove bed", "vocal hook insert", "extended drop tool"],
  ],
  emotional: [
    ["intimate verses", "expanding harmonic releases", "emotional peak layering"],
    ["close-mic verse", "wide chorus bloom", "whispered bridge into last drop"],
    ["fragile intro motif", "stacked-harmony lift", "cathartic final chorus"],
  ],
  heavy: [
    ["narrow restrained openings", "towering half-time releases", "intimate-to-massive contrast"],
    ["sub-only tease", "full-stack impact", "silence then heavier reprise"],
  ],
  cinematic: [
    ["trailer-like tension bed", "impact punctuation", "monumental half-time release"],
    ["drone opening", "processional build", "collapse into sub weight"],
  ],
  balanced: [
    ["gradual percussion density increase", "bass tease into full release", "stripped reflective bridges"],
    ["verse pocket", "pre-drop filter", "drop then motif reprise"],
  ],
};

export const MIX: string[] = [
  "crisp drum transients",
  "snappy drum definition",
  "tight drum punch",
  "controlled saturation",
  "polished dynamic finish",
  "clean modern loudness",
  "cinematic reverb tails on atmosphere",
  "spacious delay throws on leads",
  "short club rooms on percussion",
  "wide chorus on upper pads only",
  "dry vocal verse against wet drop FX",
  "transient-first drum bus",
  "gentle multiband glue on the bass stack",
  "high-frequency air only on vocal peaks",
  "midrange pocket reserved for the lead",
  "stereo widening gated to chorus sections",
  "mono-compatible sub below 120 Hz",
  "short plate on snares, longer hall on tails",
  "parallel grit on mid-bass only",
  "sidechain pumping felt more than heard",
  "punchy radio-ready transients with controlled low-mids",
  "wide airy club mix with deep mono sub and sparkling top-end",
  "tight club punch with heavy sidechain and loudness",
  "cinematic width with long tails only on atmosphere",
  "intimate close-mic verse image against stadium chorus width",
];

export const MASTER: Record<string, string[]> = {
  kinetic: [
    "festival-ready weight",
    "club translation priority",
    "high-energy loudness with punch intact",
  ],
  club: ["dense club-ready impact", "club translation priority", "DJ-system low-end authority"],
  heavy: ["dense club-ready impact", "festival-ready weight"],
  emotional: [
    "polished dynamic finish",
    "warm midrange clarity",
    "streaming-ready polish",
    "wide but controlled peak loudness",
  ],
  cinematic: ["wide dynamic contrast", "trailer-scale impact without crushing verses"],
  balanced: ["modern polished loudness", "clear transient definition", "balanced club-stream master"],
};

export const VOCAL_REGISTER: Record<string, string[]> = {
  female: ["alto", "mezzo", "soprano", "high-mezzo", "contralto"],
  male: ["tenor", "baritone", "high tenor", "bass-baritone"],
};

export const VOCAL_TIMBRE: Record<string, string[]> = {
  female: [
    "airy",
    "breathy",
    "bright",
    "silvery",
    "crisp",
    "luminous",
    "raspy-sweet",
    "bell-like",
    "sultry",
    "velvety",
    "fierce",
    "silky",
    "ethereal",
    "husky",
    "angelic",
    "smoky",
  ],
  male: [
    "warm",
    "gritty",
    "smooth",
    "smoky",
    "round",
    "grainy",
    "raspy",
    "commanding",
    "silky",
    "raw",
    "laid-back",
    "bright",
  ],
};

export const VOCAL_STYLE: Record<string, string[]> = {
  sung: [
    "English sung lead phrasing",
    "open-throat sung hooks",
    "close-mic sung lines that bloom on the chorus",
    "belting sung peaks over intimate verses",
    "syllable-tight sung hooks",
    "anthemic chorus lead with stacked peaks",
    "silky R&B-tinged sung lead",
    "clean modern pop sung delivery",
    "soulful sung lines with light melisma",
  ],
  rap: [
    "English rhythmic rap delivery",
    "percussive rap cadence",
    "syncopated rap pocket",
    "confident rap flow with pocket precision",
    "bar-heavy rap verses into a chanted hook",
    "tight rap cadence that leaves air for the 808",
  ],
  "talk-rap": [
    "English talk-rap cadence, almost spoken",
    "dry conversational talk-rap over the pocket",
    "intimate talk-rap verses that lift into a sung hook",
    "spoken-flow rap with rhythmic consonants",
    "late-night talk-rap delivery, close and unhurried",
  ],
  "melodic-rap": [
    "English sung-rap phrasing with sung hook lift",
    "melodic-rap verses that bloom into full sung peaks",
    "half-sung cadence into belted choruses",
    "sing-rap hybrid with autotune as shine",
    "hook-sung, verse-rapped English topline",
  ],
  chops: [
    "vocal chops as hook material",
    "pitched English vocal fragments as percussion",
  ],
  hybrid: [
    "sung-rap hybrid English topline",
    "verses rapped, choruses sung",
  ],
};

export const VOCAL_ARC: Record<string, string[]> = {
  sung: [
    "moving from intimate restraint to powerful layered peaks",
    "breathy verses building to a full chorus belt",
    "starting whispered and finishing anthemic",
    "verse-dry then chorus-huge",
    "subtle melisma only on emotional peaks",
    "stacking doubles only on the hook so verses stay close",
  ],
  rap: [
    "keeping verses pocket-tight and hooks chant-wide",
    "dry rap verses exploding into stacked hook shouts",
    "leaving space after punchlines for the bass to answer",
    "double-time bars into a half-time hook",
  ],
  "talk-rap": [
    "spoken verses that lift into a sung or chanted hook",
    "staying conversational until the drop demands volume",
    "close-mic talk that widens only on the chorus",
  ],
  "melodic-rap": [
    "rapped verses blooming into sung-rap choruses",
    "half-sung cadence into full sung peaks",
    "autotune shine reserved for the hook",
  ],
  chops: [
    "chops answering the lead like a second percussionist",
  ],
  hybrid: [
    "verses rapped, choruses sung, last drop both",
  ],
};

export const VOCAL_PROC: string[] = [
  "layered harmonies",
  "subtle delay throws",
  "stacked doubles",
  "wide harmonic ad-libs",
  "tight third-above stacks on the hook",
  "octave doubles on peak syllables",
  "short slap delay in verses, longer throws on the drop",
  "light autotune as shine, not as the performance",
  "stereo chopped answers after the lead line",
  "reverb gated so lyrics stay intelligible",
  "whisper-stack under the main take",
  "formant-lifted ad-libs on the last chorus",
  "tasteful doubles and ad-libs",
  "subtle auto-tune sheen",
  "intimate close-mic presence",
  "stacked background harmonies on chorus lifts",
  "powerful belt with controlled vibrato",
];

export const VOCAL_PROC_RAP: string[] = [
  "dry verse vocal, short room only",
  "light autotune as shine, not as the performance",
  "doubles on the hook only",
  "tight delay throws on punchlines",
  "ad-lib answers panned wide",
  "consonant-forward compression so the pocket stays readable",
  "hook stacks, verse left almost mono",
  "subtle slap on the talk-rap cadence",
];

export const VOCAL_INST: Record<string, string[]> = {
  female: [
    "airy female vocal layers",
    "breathy female lead layers",
    "bright stacked female harmonies",
    "high-energy female hook stacks",
    "intimate female verse layers",
    "sultry female alto layers",
    "soaring female soprano stacks",
    "female rap doubles",
  ],
  male: [
    "intimate male vocal layers",
    "warm male lead layers",
    "gritty male hook stacks",
    "male baritone doubles",
    "commanding male rap layers",
    "smooth male tenor stacks",
    "raw male talk-rap close-mic",
  ],
  lead: ["lead vocal layers", "stacked lead doubles", "English topline layers"],
};

export const PRODUCTION_VERBS = {
  harm: [
    "keep the emotional center clear",
    "anchor the harmony",
    "hold the tonal mood",
    "support the topline without crowding bass",
    "leave a midrange pocket for the vocal",
    "bloom only on the drop so verses stay lean",
  ],
  mel: [
    ", while {m} stay sparse and memorable",
    ", with {m} used as short identity hooks",
    "; {m} answer the bass sparingly",
    ", letting {m} repeat like a chant",
    "; {m} surface only at section peaks",
  ],
  texture: [
    " Texture design uses {sd}.",
    " FX bed includes {sd}.",
    " Transitions lean on {sd}.",
    " Scene changes ride {sd}.",
    " Ear-candy is limited to {sd}.",
  ],
  mixLead: [
    "Mix priorities favor",
    "Mix favors",
    "Mix architecture prioritizes",
    "The mix keeps",
    "Balance leans on",
  ],
  form: [
    "Arrangement moves through",
    "Form uses",
    "Structure rides",
    "The record travels through",
    "Sections move from",
  ],
};

export const GENRE_GLUE: string[] = [
  "{p} and {s} hybrid with {a} accents",
  "{p} x {s} hybrid, {a} rhythmic accents",
  "{p} hybridized with {s}, colored by {a}",
  "{p} foundation, {s} harmony, {a} percussion accents",
  "{p} × {s} collision with {a} detail",
  "{p}-{s} hybrid language, {a} ornaments",
];

export const TITLES: Record<string, string[]> = {
  trap: [
    "Trap Future Voltage",
    "Hat Storm Drop",
    "808 Skyline",
    "Night Bus Pressure",
    "Chrome Trap Bloom",
    "Skyline Snare Gap",
    "Voltage Pocket",
    "Afterhours 808",
  ],
  future: [
    "Supersaw Bloom",
    "Euphoric Stack Engine",
    "Wide Chord Lift",
    "Peak Drop Halo",
    "Lush Hybrid Rise",
    "Festival Chord Arc",
    "Gloss Drop",
    "High Hands Hybrid",
  ],
  kinetic: [
    "Kinetic Club Hybrid",
    "Physical Groove Engine",
    "Body Moving Bass",
    "High Energy Frame",
    "Voltage Dance Pocket",
    "Live-Wire Drop",
  ],
  drill: [
    "Sliding Street Pocket",
    "Cold Drill Pressure",
    "Syncopated 808 Stagger",
    "Night Bus Drill",
  ],
  phonk: [
    "Phonk Haze Cruise",
    "Cowbell Night Drift",
    "Saturated Street Glow",
  ],
  garage: [
    "Swung Emotional Bass",
    "Garage Hybrid Lift",
    "Elastic Bass Motion",
    "Skippy Two Step",
  ],
  ritual: [
    "Cinematic Ritual Weight",
    "Processional Sub Arc",
    "Ominous Impact Field",
  ],
  soul: [
    "Warm Nocturnal Soul",
    "Quiet Fire Hybrid",
    "Late Night Croon",
  ],
  baile: [
    "Physical Groove Engine",
    "Favela Bass Collision",
    "Body Moving Bass",
  ],
  bass: [
    "Wub Answer Engine",
    "Half Time Sub Canon",
    "Deep Wobble Field",
  ],
  rap: [
    "Pocket First Topline",
    "Bar And Sub Engine",
    "Hook Chant System",
  ],
  general: [
    "Club Translation Engine",
    "Modern Bass Hybrid",
    "Low End Narrative",
    "Drop Architecture",
    "Night Hybrid Design",
    "Weight And Air",
    "Hook Pressure System",
    "Section Peak Engine",
  ],
};

export const PADDING: string[] = [
  "Dynamic arc moves from restrained detail into explosive half-time weight, then returns to reflective space before a final expanded release.",
  "Stereo design keeps kick, sub, and core vocal centered while pads, harmonies, and ambience widen on emotional peaks.",
  "Organic and synthetic layers trade focus across the form, preserving human warmth against engineered bass pressure.",
  "Section transitions favor rising percussion density, filtered bass teases, and spatial expansion rather than constant full-band intensity.",
  "Motivic writing favors few notes with strong identity over constant ornamental motion.",
  "Performance energy targets modern club translation with streaming-ready clarity and controlled saturation.",
  "Percussion and bass trade leadership so the track stays physical without overcrowding the midrange.",
  "Silence and negative space are treated as arrangement tools, not empty gaps.",
  "High-energy passages still leave air around the vocal so the hook stays readable on small speakers.",
  "Drop weight arrives in phrases, not as a constant wall, so each return hits harder.",
  "Hats accelerate into section peaks, then thin out so the bass and vocal can own the pocket.",
  "Chord stacks bloom with the sidechain, then recede so verses feel close and human.",
  "Ad-libs and ear-candy appear as answers, never as a second lead competing with the hook.",
  "The second drop adds one new layer only — a harmony, a wobble syllable, or a hat pattern — so the lift is audible.",
  "Low-end mono compatibility stays non-negotiable even when the upper field goes widescreen.",
  "Festival brightness is reserved for choruses; verses keep a drier, closer image.",
  "Groove humanization is light: hats can swing, kicks stay grid-true for club punch.",
  "Vocal consonants stay dry enough to cut through 808 tails and supersaw wash.",
  "Each bass phrase has a clear start and stop so the drop never turns into drone.",
  "Impact FX mark section borders; they do not sit looping under the whole hook.",
  "If energy is high, density is still scored — more motion in hats and vocals, not more competing mids.",
  "The hook motif is short enough to chant and strong enough to survive a stripped breakdown.",
  "Filter automation tells the story: darker verses, open drops, a brief closed tunnel before the last hit.",
  "Layer count stays honest: sub, mid-bass, drums, one harmonic bed, one lead, optional vocal stack.",
  "Club systems should feel the kick and sub as a single fist, with wobble or Reese living above that fist.",
  "Streaming translation needs the hook audible at low volume, not only the drop at high volume.",
  "Breakdowns subtract before they add, so the next drop feels like a decision, not a default.",
  "Harmonic rhythm stays slower than the hats; chords hold while percussion talks.",
  "Any guitar, pluck, or bell is a cameo, not a new genre.",
  "The record should still read as the named hybrid if you mute the vocal for a DJ tool edit.",
];

export const MICROS: string[] = [
  "Clear club translation remains essential.",
  "Motif identity stays simple and memorable.",
  "Dynamic contrast stays intentional rather than constant.",
  "Low-end mono compatibility anchors the mix.",
  "Upper layers expand on emotional releases.",
  "Bass phrases stay short enough to breathe.",
  "The hook must survive a phone speaker.",
  "Drop gaps are part of the groove.",
  "Energy comes from motion, not clutter.",
  "Keep the vocal pocket sacred.",
  "One new layer per lift is enough.",
  "Silence is a drum hit.",
  "Sidechain is a feel, not a gimmick.",
  "Hats talk; kicks decide.",
  "The last drop earns its extra voice.",
];

export function pickTitleLex(
  rng: () => number,
  families: string[],
  mood: string
): string {
  const pool = [
    ...(TITLES.general ?? []),
    ...families.flatMap((f) => TITLES[f] ?? []),
    ...(TITLES[mood] ?? []),
  ];
  const phrase = pick(rng, pool.length ? pool : TITLES.general);
  return phrase.split(/\s+/).slice(0, 6).join(" ");
}

export function pickArc(rng: () => number, energy: string): string[] {
  const bank = ARRANGEMENT[energy] ?? ARRANGEMENT.balanced;
  return [...pick(rng, bank ?? ARRANGEMENT.balanced)];
}
