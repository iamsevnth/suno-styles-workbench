import { ATLAS_EXTRA, GenreDef } from "./genre-atlas.ts";

function g(
  name: string,
  opts: {
    family: string;
    bpm: number;
    aliases?: string[];
    tags?: string[];
    tier?: number;
    feel?: string;
  }
): GenreDef {
  return {
    name,
    aliases: opts.aliases ?? [name.toLowerCase()],
    family: opts.family,
    defaultBpm: opts.bpm,
    metricFeel: opts.feel ?? "half-time",
    tags: opts.tags ?? [],
    tier: opts.tier ?? 2,
  };
}

export const GENRES: GenreDef[] = [
  g("Future Bass", {
    family: "bass",
    bpm: 136,
    aliases: ["futurebass", "future-bass", "future bass"],
    tags: ["emotional", "wide chords", "sidechain"],
    tier: 1,
  }),
  g("Trap", {
    family: "trap",
    bpm: 140,
    aliases: ["trap music", "trap"],
    tags: ["808", "hi-hats", "sparse"],
    tier: 1,
  }),
  g("EDM Trap", {
    family: "trap",
    bpm: 140,
    aliases: ["edm trap", "festival trap"],
    tags: ["festival", "808", "drops"],
    tier: 1,
  }),
  g("Trapstep", {
    family: "hybrid",
    bpm: 142,
    aliases: ["trap step", "trapstep"],
    tags: ["trap drums", "dubstep bass"],
    tier: 1,
  }),
  g("Dubstep", {
    family: "bass",
    bpm: 140,
    aliases: ["dub step", "dubstep"],
    tags: ["wobble", "growl", "half-time"],
    tier: 1,
  }),
  g("Deep Dubstep", {
    family: "bass",
    bpm: 140,
    aliases: ["deep-dubstep", "deep dubstep", "deep wobble"],
    tags: ["sub", "wubs", "space"],
    tier: 1,
  }),
  g("Melodic Dubstep", {
    family: "bass",
    bpm: 140,
    aliases: ["melodic-dubstep", "melodic dubstep"],
    tags: ["emotional", "melodic"],
    tier: 1,
  }),
  g("140 Bass", {
    family: "bass",
    bpm: 140,
    aliases: ["140 bass music", "140 uk bass", "deep 140", "140 bass"],
    tags: ["uk", "sub", "club"],
    tier: 1,
  }),
  g("UK Garage", {
    family: "garage",
    bpm: 134,
    aliases: ["ukg", "uk garage", "garage", "2-step", "2step", "deep ukg"],
    tags: ["swing", "shuffle", "skippy"],
    tier: 1,
  }),
  g("UK Bass", {
    family: "bass",
    bpm: 140,
    aliases: ["uk bass", "uk-bass"],
    tags: ["uk", "sub", "half-time"],
    tier: 1,
  }),
  g("Drill", {
    family: "drill",
    bpm: 142,
    aliases: ["uk drill", "drill trap", "trap drill", "drill"],
    tags: ["sliding bass", "syncopation", "dark"],
    tier: 1,
  }),
  g("Cinematic Bass", {
    family: "hybrid",
    bpm: 140,
    aliases: ["cinematic bass", "dark cinematic bass"],
    tags: ["impacts", "tension", "dramatic"],
    tier: 1,
  }),
  g("Ritual Bass", {
    family: "hybrid",
    bpm: 140,
    aliases: ["ritual bass", "dark ritual bass"],
    tags: ["ceremonial", "drones", "hypnotic"],
    tier: 1,
  }),
  g("Experimental Bass", {
    family: "bass",
    bpm: 140,
    aliases: ["experimental bass", "dark experimental bass"],
    tags: ["glitch", "granular", "asymmetric"],
    tier: 1,
  }),
  g("Melodic Future Bass", {
    family: "bass",
    bpm: 138,
    aliases: ["melodic future bass"],
    tags: ["emotional", "melodic"],
    tier: 1,
  }),
  g("High-Octane Future Bass", {
    family: "bass",
    bpm: 142,
    aliases: ["high octane future bass", "high-octane future bass"],
    tags: ["energetic", "festival"],
    tier: 1,
  }),
  g("Dark Future Bass", {
    family: "bass",
    bpm: 136,
    aliases: ["dark future bass"],
    tags: ["dark", "sub weight"],
    tier: 1,
  }),
  g("Aggressive Trap", {
    family: "trap",
    bpm: 140,
    aliases: ["aggressive trap", "hard trap"],
    tags: ["aggressive", "distorted"],
    tier: 2,
  }),
  g("Melodic Trap", {
    family: "trap",
    bpm: 140,
    aliases: ["melodic trap"],
    tags: ["melodic", "emotional"],
    tier: 2,
  }),
  g("Dark Trap", {
    family: "trap",
    bpm: 140,
    aliases: ["dark trap"],
    tags: ["dark", "sparse", "menacing"],
    tier: 2,
  }),
  g("Future Trap", {
    family: "trap",
    bpm: 140,
    aliases: ["future trap"],
    tags: ["future", "808", "melodic"],
    tier: 2,
  }),
  g("Minimal Dark Trap", {
    family: "trap",
    bpm: 140,
    aliases: ["minimal dark trap"],
    tags: ["minimal", "dark", "sparse"],
    tier: 2,
  }),
  g("Cyber Trap", {
    family: "trap",
    bpm: 140,
    aliases: ["cyber trap"],
    tags: ["metallic", "digital", "glitch"],
    tier: 2,
  }),
  g("Experimental Trap", {
    family: "trap",
    bpm: 140,
    aliases: ["experimental trap"],
    tags: ["experimental", "asymmetric"],
    tier: 2,
  }),
  g("Cinematic Trap", {
    family: "trap",
    bpm: 140,
    aliases: ["cinematic trap"],
    tags: ["cinematic", "impacts", "dark"],
    tier: 2,
  }),
  g("Ritual Bass Trap", {
    family: "trap",
    bpm: 140,
    aliases: ["ritual bass trap"],
    tags: ["ritual", "trap", "ceremonial"],
    tier: 2,
  }),
  g("Occult Cinematic Trap", {
    family: "trap",
    bpm: 140,
    aliases: ["occult cinematic trap"],
    tags: ["occult", "cinematic", "drones"],
    tier: 2,
  }),
  g("Phonk-Infused Trap", {
    family: "trap",
    bpm: 140,
    aliases: ["phonk-infused trap", "phonk trap"],
    tags: ["phonk", "trap", "grit"],
    tier: 2,
  }),
  g("Future Bass Trap", {
    family: "trap",
    bpm: 140,
    aliases: ["future bass trap", "fb trap"],
    tags: ["future bass", "trap"],
    tier: 2,
  }),
  g("Emotional Rap Trap", {
    family: "trap",
    bpm: 140,
    aliases: ["emotional rap trap"],
    tags: ["emotional", "rap", "trap"],
    tier: 2,
  }),
  g("Soul-Sampled Trap", {
    family: "trap",
    bpm: 140,
    aliases: ["soul-sampled trap", "soul sampled trap"],
    tags: ["soul", "chopped", "trap"],
    tier: 2,
  }),
  g("Chopped-Soul Trap", {
    family: "trap",
    bpm: 140,
    aliases: ["chopped-soul trap", "chopped soul trap"],
    tags: ["chopped soul", "trap"],
    tier: 2,
  }),
  g("R&B Guitar Trap", {
    family: "trap",
    bpm: 140,
    aliases: ["r&b guitar trap", "rnb guitar trap", "guitar trap"],
    tags: ["guitar", "r&b", "trap"],
    tier: 2,
  }),
  g("Brazilian Funk Trap", {
    family: "trap",
    bpm: 140,
    aliases: ["brazilian funk trap", "baile trap"],
    tags: ["baile", "trap"],
    tier: 2,
  }),
  g("Trap-Dubstep", {
    family: "trap",
    bpm: 140,
    aliases: ["trap-dubstep", "trap dubstep"],
    tags: ["trap", "dubstep"],
    tier: 2,
  }),
  g("UKG Trap", {
    family: "trap",
    bpm: 140,
    aliases: ["ukg trap", "garage trap"],
    tags: ["ukg", "trap", "swing"],
    tier: 2,
  }),
  g("Gospel Trap", {
    family: "trap",
    bpm: 140,
    aliases: ["gospel trap"],
    tags: ["gospel", "choir", "808"],
    tier: 3,
  }),
  g("Dirty South Bass", {
    family: "trap",
    bpm: 140,
    aliases: ["dirty south bass", "dirty south"],
    tags: ["southern", "808", "bounce"],
    tier: 3,
  }),
  g("Aggressive Trapstep", {
    family: "hybrid",
    bpm: 142,
    aliases: ["aggressive trapstep"],
    tags: ["aggressive", "trapstep"],
    tier: 2,
  }),
  g("Cinematic Trapstep", {
    family: "hybrid",
    bpm: 142,
    aliases: ["cinematic trapstep"],
    tags: ["cinematic", "massive drops"],
    tier: 2,
  }),
  g("Future Trapstep", {
    family: "hybrid",
    bpm: 142,
    aliases: ["future trapstep"],
    tags: ["future", "trapstep"],
    tier: 2,
  }),
  g("Bass-Heavy Trapstep", {
    family: "hybrid",
    bpm: 142,
    aliases: ["bass-heavy trapstep", "bass heavy trapstep"],
    tags: ["sub-heavy", "trapstep"],
    tier: 2,
  }),
  g("Trapstep Drill", {
    family: "hybrid",
    bpm: 142,
    aliases: ["trapstep drill"],
    tags: ["trapstep", "drill"],
    tier: 2,
  }),
  g("Melodic Drill", {
    family: "drill",
    bpm: 142,
    aliases: ["melodic drill"],
    tags: ["melodic", "guitar", "dark"],
    tier: 2,
  }),
  g("Drill Trap", {
    family: "drill",
    bpm: 142,
    aliases: ["drill trap"],
    tags: ["drill", "trap"],
    tier: 2,
  }),
  g("Cinematic Drill Trap", {
    family: "drill",
    bpm: 142,
    aliases: ["cinematic drill trap", "cinematic drill"],
    tags: ["cinematic", "drill"],
    tier: 2,
  }),
  g("Dark Luxury Trap", {
    family: "drill",
    bpm: 140,
    aliases: ["dark luxury trap", "dark luxury drill"],
    tags: ["luxury", "dark", "polished"],
    tier: 2,
  }),
  g("UKG-Swung Drill", {
    family: "drill",
    bpm: 140,
    aliases: ["ukg-swung drill", "ukg swung drill", "uk garage drill"],
    tags: ["ukg", "drill", "swing"],
    tier: 2,
  }),
  g("Dark Late-Night Drill Trap", {
    family: "drill",
    bpm: 142,
    aliases: ["dark late-night drill trap"],
    tags: ["nocturnal", "drill"],
    tier: 2,
  }),
  g("Cinematic Street Trap Drill", {
    family: "drill",
    bpm: 142,
    aliases: ["cinematic street trap drill"],
    tags: ["cinematic", "street", "drill"],
    tier: 2,
  }),
  g("Guitar-Led Melodic Drill", {
    family: "drill",
    bpm: 142,
    aliases: ["guitar-led melodic drill", "guitar melodic drill"],
    tags: ["guitar", "melodic drill"],
    tier: 2,
  }),
  g("Bass-Heavy Trapstep Drill", {
    family: "drill",
    bpm: 142,
    aliases: ["bass-heavy trapstep drill"],
    tags: ["trapstep", "drill", "sub"],
    tier: 2,
  }),
  g("Cinematic Dubstep", {
    family: "bass",
    bpm: 140,
    aliases: ["cinematic dubstep"],
    tags: ["cinematic", "impacts"],
    tier: 2,
  }),
  g("Minimal Dubstep", {
    family: "bass",
    bpm: 140,
    aliases: ["minimal dubstep"],
    tags: ["sparse", "space", "sub"],
    tier: 2,
  }),
  g("Riddim", {
    family: "bass",
    bpm: 140,
    aliases: ["riddim dubstep", "riddim"],
    tags: ["call-response", "mechanical"],
    tier: 2,
  }),
  g("Cyber Riddim", {
    family: "bass",
    bpm: 140,
    aliases: ["cyber riddim"],
    tags: ["cyber", "riddim", "metallic"],
    tier: 2,
  }),
  g("Brostep", {
    family: "bass",
    bpm: 140,
    aliases: ["brostep", "aggressive dubstep"],
    tags: ["growl", "aggressive"],
    tier: 2,
  }),
  g("Wobble Dubstep", {
    family: "bass",
    bpm: 140,
    aliases: ["wobble dubstep", "deep-wobble dubstep", "deep wobble dubstep", "wubz dubstep", "wubby dubstep", "wubby 140 dubstep", "wobble 140 dubstep", "wobble 140"],
    tags: ["wobble", "wubs"],
    tier: 2,
  }),
  g("Deep-Wobble Dubstep", {
    family: "bass",
    bpm: 140,
    aliases: ["deep-wobble dubstep"],
    tags: ["deep wobble", "sub"],
    tier: 2,
  }),
  g("140 UKG", {
    family: "hybrid",
    bpm: 140,
    aliases: ["140 ukg", "140 uk garage", "140 ukg bass"],
    tags: ["ukg", "140", "swing"],
    tier: 2,
  }),
  g("Deep UKG", {
    family: "garage",
    bpm: 134,
    aliases: ["deep ukg"],
    tags: ["deep", "ukg"],
    tier: 2,
  }),
  g("Half-Time UKG", {
    family: "hybrid",
    bpm: 140,
    aliases: ["half-time ukg", "halftime ukg"],
    tags: ["ukg", "half-time"],
    tier: 2,
  }),
  g("UKG-Influenced Deep Bass", {
    family: "hybrid",
    bpm: 140,
    aliases: ["ukg-influenced deep bass"],
    tags: ["ukg", "deep bass"],
    tier: 2,
  }),
  g("Deep 140 Bass", {
    family: "bass",
    bpm: 140,
    aliases: ["deep 140 bass", "deep 140"],
    tags: ["140", "sub"],
    tier: 2,
  }),
  g("Wubby 140", {
    family: "bass",
    bpm: 140,
    aliases: ["wubby 140", "wobble 140", "deep-wobble 140"],
    tags: ["wubs", "140"],
    tier: 2,
  }),
  g("Deep UKG-Dubstep", {
    family: "hybrid",
    bpm: 140,
    aliases: ["deep ukg-dubstep", "ukg dubstep"],
    tags: ["ukg", "deep dubstep"],
    tier: 2,
  }),
  g("Future Garage", {
    family: "garage",
    bpm: 130,
    aliases: ["future garage"],
    tags: ["atmospheric", "2-step"],
    tier: 2,
  }),
  g("Neuro Bass", {
    family: "bass",
    bpm: 140,
    aliases: ["neuro", "neurofunk bass", "neuro bass", "cyber bass"],
    tags: ["metallic", "modulated", "mechanical"],
    tier: 2,
  }),
  g("Deep Bass", {
    family: "bass",
    bpm: 140,
    aliases: ["deep bass"],
    tags: ["sub", "club", "weight"],
    tier: 2,
  }),
  g("EDM Bass", {
    family: "bass",
    bpm: 140,
    aliases: ["edm bass", "edm bass music"],
    tags: ["edm", "bass", "drops"],
    tier: 2,
  }),
  g("Dark EDM Bass", {
    family: "bass",
    bpm: 140,
    aliases: ["dark edm bass"],
    tags: ["dark", "edm", "bass"],
    tier: 2,
  }),
  g("Futuristic Bass", {
    family: "bass",
    bpm: 140,
    aliases: ["futuristic bass"],
    tags: ["futuristic", "synthetic"],
    tier: 2,
  }),
  g("Festival Trap", {
    family: "bass",
    bpm: 140,
    aliases: ["festival trap"],
    tags: ["festival", "trap"],
    tier: 2,
  }),
  g("EDM", {
    family: "edm",
    bpm: 128,
    feel: "four-on-the-floor",
    aliases: ["edm", "electronic dance"],
    tags: ["festival", "energy"],
    tier: 3,
  }),
  g("Phonk", {
    family: "phonk",
    bpm: 140,
    aliases: ["memphis phonk", "phonk"],
    tags: ["grit", "saturation", "cowbell"],
    tier: 2,
  }),
  g("Brazilian Phonk", {
    family: "phonk",
    bpm: 135,
    aliases: ["brazilian phonk", "br phonk"],
    tags: ["baile", "phonk grit"],
    tier: 2,
  }),
  g("Memphis Phonk", {
    family: "phonk",
    bpm: 140,
    aliases: ["memphis phonk drift"],
    tags: ["memphis", "grit"],
    tier: 2,
  }),
  g("Drift Phonk", {
    family: "phonk",
    bpm: 140,
    aliases: ["drift phonk"],
    tags: ["drift", "phonk"],
    tier: 2,
  }),
  g("Baile Funk", {
    family: "brazilian",
    bpm: 130,
    feel: "full-time",
    aliases: ["brazilian funk", "favela funk", "baile", "funk brasileiro", "baile funk"],
    tags: ["syncopation", "physical", "percussion"],
    tier: 2,
  }),
  g("Favela Funk", {
    family: "brazilian",
    bpm: 130,
    feel: "full-time",
    aliases: ["favela funk"],
    tags: ["physical", "percussion", "kinetic"],
    tier: 2,
  }),
  g("Melodic Rap", {
    family: "hiphop",
    bpm: 140,
    aliases: ["melodic hip hop", "melodic hip-hop", "melodic rap"],
    tags: ["topline", "emotional"],
    tier: 2,
  }),
  g("Emotional Rap", {
    family: "hiphop",
    bpm: 140,
    aliases: ["emotional rap"],
    tags: ["emotional", "rap"],
    tier: 2,
  }),
  g("Mainstream Melodic Rap", {
    family: "hiphop",
    bpm: 140,
    aliases: ["mainstream melodic rap", "moody mainstream melodic rap", "glossy mainstream melodic rap", "mainstream melodic hip-hop"],
    tags: ["mainstream", "melodic"],
    tier: 3,
  }),
  g("Emotional R&B", {
    family: "rnb",
    bpm: 92,
    feel: "full-time",
    aliases: ["r&b", "rnb", "emotional r&b", "neo-soul", "neosoul", "neo soul"],
    tags: ["warm", "intimate", "guitar"],
    tier: 2,
  }),
  g("Pop R&B", {
    family: "rnb",
    bpm: 100,
    feel: "full-time",
    aliases: ["pop r&b", "pop rnb"],
    tags: ["polished", "melodic"],
    tier: 3,
  }),
  g("Upbeat R&B", {
    family: "rnb",
    bpm: 105,
    feel: "full-time",
    aliases: ["upbeat r&b", "upbeat rnb"],
    tags: ["upbeat", "soulful"],
    tier: 3,
  }),
  g("Soul", {
    family: "rnb",
    bpm: 90,
    feel: "full-time",
    aliases: ["soul"],
    tags: ["warm", "organic", "human"],
    tier: 2,
  }),
  g("Trapsoul", {
    family: "rnb",
    bpm: 100,
    feel: "full-time",
    aliases: ["trap soul", "trapsoul"],
    tags: ["soulful", "808", "intimate"],
    tier: 3,
  }),
  g("Dark Ambient", {
    family: "ambient",
    bpm: 80,
    feel: "broken",
    aliases: ["dark ambient"],
    tags: ["drones", "space", "suspense"],
    tier: 2,
  }),
  g("Ritual Drone", {
    family: "ambient",
    bpm: 80,
    feel: "broken",
    aliases: ["ritual drone"],
    tags: ["drones", "ceremonial"],
    tier: 2,
  }),
  g("Dark Cinematic Ambient", {
    family: "ambient",
    bpm: 80,
    feel: "broken",
    aliases: ["dark cinematic ambient"],
    tags: ["cinematic", "drones"],
    tier: 2,
  }),
  g("Bass House", {
    family: "house",
    bpm: 126,
    feel: "four-on-the-floor",
    aliases: ["bass-house", "bass house"],
    tags: ["club", "bounce"],
    tier: 3,
  }),
  g("Dancehall", {
    family: "caribbean",
    bpm: 100,
    feel: "full-time",
    aliases: ["dancehall"],
    tags: ["riddim", "bounce"],
    tier: 3,
  }),
  g("Tropical Dancehall", {
    family: "caribbean",
    bpm: 100,
    feel: "full-time",
    aliases: ["tropical dancehall"],
    tags: ["tropical", "bounce"],
    tier: 3,
  }),
  g("Reggaeton", {
    family: "latin",
    bpm: 95,
    feel: "full-time",
    aliases: ["reggaeton", "dembow"],
    tags: ["dembow", "percussion"],
    tier: 3,
  }),
  g("French Filtered House", {
    family: "house",
    bpm: 122,
    feel: "four-on-the-floor",
    aliases: ["french house", "filtered house", "french filtered house"],
    tags: ["filter", "disco"],
    tier: 3,
  }),
];

export function allStyles(): GenreDef[] {
  return [...GENRES, ...ATLAS_EXTRA];
}

export function genreNamesLongestFirst(): string[] {
  return allStyles()
    .map((x) => x.name)
    .sort((a, b) => b.length - a.length);
}

export const MOOD_MAP: Record<string, string[]> = {
  dark: ["minor-key weight", "low-register layers", "restrained brightness", "dense low end"],
  brooding: ["slow tension", "shadowed midrange", "restrained motion"],
  menacing: ["hard edges", "predatory pulse", "distorted pressure"],
  sinister: ["cold menace", "threatening low end", "shadowed harmony"],
  ominous: ["foreboding drones", "distant impacts", "held tension"],
  nocturnal: ["subdued brightness", "deep ambience", "intimate spatial cues"],
  shadowy: ["dim midrange", "veiled pads", "soft darkness"],
  gritty: ["saturated texture", "lo-fi edges", "raw midrange"],
  dystopian: ["cold digital air", "industrial grit", "bleak space"],
  dangerous: ["predatory pressure", "sharp transients", "tense space"],
  predatory: ["stalking pulse", "hard low end", "controlled aggression"],
  aggressive: ["hard transients", "distorted bass texture", "dense rhythmic impact"],
  apocalyptic: ["collapsing scale", "ruinous low end", "vast dread"],
  emotional: ["expressive harmony", "memorable melodic material", "dynamic breathing room"],
  melancholic: ["bittersweet minor progressions", "vulnerable lead lines"],
  bittersweet: ["warm melancholy", "intimate delivery", "soft tension"],
  vulnerable: ["exposed melody", "close intimacy", "fragile dynamics"],
  intimate: ["close-mic warmth", "soft space", "personal scale"],
  yearning: ["reaching melody", "held tension", "emotional lift"],
  reflective: ["quiet space", "sparse harmony", "inward motion"],
  soulful: ["warm extended harmony", "expressive guitar or keys", "humanized groove"],
  heartbroken: ["aching minor lines", "fragile vocal space"],
  nostalgic: ["warm memory texture", "soft filtered harmony"],
  cathartic: ["emotional release", "soaring peaks", "dramatic lift"],
  euphoric: ["wide harmonic release", "rising energy", "luminous upper layers"],
  soaring: ["ascending harmony", "open sky upper layers"],
  uplifting: ["bright release", "hopeful motion"],
  triumphant: ["anthemic lift", "victorious peak"],
  anthemic: ["crowd-scale melody", "wide chorus energy"],
  explosive: ["sudden peak energy", "impactful release"],
  liberating: ["open motion", "unburdened lift"],
  cinematic: ["dramatic depth", "tension beds", "impacts", "rises", "wide dynamic arc"],
  epic: ["monumental scale", "wide spatial field"],
  monumental: ["massive scale", "architectural weight"],
  dramatic: ["heightened contrast", "story tension"],
  tense: ["held pressure", "unresolved harmony"],
  suspenseful: ["delayed payoff", "creeping motion"],
  immersive: ["surrounding atmosphere", "deep space"],
  expansive: ["wide field", "open arrangement"],
  atmospheric: ["ambient depth", "environmental texture"],
  ritualistic: ["ceremonial percussion", "processional repetition", "drones", "resonant space"],
  ceremonial: ["processional pulse", "hand percussion", "hypnotic ostinati"],
  occult: ["esoteric darkness", "hidden ritual weight"],
  hypnotic: ["repetitive trance", "locked groove"],
  ancient: ["timeless drones", "primal pulse"],
  mystical: ["drones", "modal color", "resonant percussion", "atmospheric depth"],
  tribal: ["organic percussion", "primal rhythm"],
  primal: ["raw physical pulse", "elemental weight"],
  spiritual: ["resonant space", "elevated atmosphere"],
  entrancing: ["looping focus", "mesmeric motion"],
  processional: ["slow ceremonial advance", "ritual spacing"],
  futuristic: ["metallic digital timbres", "glitches", "mechanical modulation"],
  cybernetic: ["metallic modulation", "digital glitches", "synthetic transients"],
  mechanical: ["machine motion", "precise transients"],
  digital: ["synthetic edges", "quantized texture"],
  neon: ["glowing upper layers", "night-city sheen"],
  synthetic: ["artificial timbre", "designed texture"],
  kinetic: ["physical groove", "forward propulsion", "body-moving percussion"],
  energetic: ["physical bounce", "forward drive", "high-energy pocket"],
  "high energy": ["physical bounce", "festival drive", "high-energy pocket"],
  "high-energy": ["physical bounce", "festival drive", "high-energy pocket"],
  hype: ["festival drive", "peak-time bounce", "crowd-scale energy"],
  heavy: ["dense low end", "physical weight"],
  bouncy: ["springy groove", "elastic bounce"],
  swaggering: ["confident pocket", "rolling motion"],
  luxurious: ["sleek sparse arrangement", "polished texture", "controlled warmth"],
  sleek: ["polished edges", "minimal excess"],
  seductive: ["close intimacy", "smooth motion", "late-night warmth"],
  polished: ["refined finish", "clean detail"],
  moody: ["shadowed emotion", "late-night color"],
  expensive: ["controlled luxury", "high-end polish"],
  controlled: ["disciplined dynamics", "restrained power"],
  minimal: ["sparse arrangement", "essential elements only"],
  raw: ["unvarnished texture", "direct impact"],
  organic: ["humanized motion", "living texture"],
  warm: ["rounded midrange", "soft harmonic glow"],
  cold: ["distant brightness", "clinical space"],
};

export function matchGenre(raw: string): GenreDef | undefined {
  const original = raw
    .trim()
    .toLowerCase()
    .replace(/\b\d{2,3}\s*bpm\b/g, "")
    .replace(/\s+/g, " ")
    .trim();
  if (!original || original.length < 3) return undefined;
  const ranked = allStyles().sort((a, b) => b.name.length - a.name.length);
  for (const genre of ranked) {
    if (genre.name.toLowerCase() === original) return genre;
    if (genre.aliases.some((a) => a === original)) return genre;
  }
  for (const genre of ranked) {
    const name = genre.name.toLowerCase();
    if (name.length >= 4 && includesPhrase(original, name)) return genre;
    const aliases = [...genre.aliases].sort((a, b) => b.length - a.length);
    for (const a of aliases) {
      if (a.length >= 4 && includesPhrase(original, a)) return genre;
    }
  }
  const stripped = original
    .replace(
      /\b(dark|heavy|aggressive|minimal|emotional|cinematic|warm|intimate|organic|restrained|melodic|future|deep|high-octane|high octane|bass-heavy|bass heavy)\b/g,
      " "
    )
    .replace(/\s+/g, " ")
    .trim();
  if (stripped && stripped !== original) {
    for (const genre of ranked) {
      if (genre.name.toLowerCase() === stripped) return genre;
      if (genre.aliases.some((a) => a === stripped)) return genre;
    }
    for (const genre of ranked) {
      const name = genre.name.toLowerCase();
      if (name.length >= 4 && includesPhrase(stripped, name)) return genre;
      for (const a of genre.aliases) {
        if (a.length >= 4 && includesPhrase(stripped, a)) return genre;
      }
    }
  }
  return undefined;
}

function includesPhrase(hay: string, needle: string): boolean {
  return ` ${hay} `.includes(` ${needle} `);
}

export function expandMood(mood: string): string[] {
  const key = mood.toLowerCase().trim();
  return MOOD_MAP[key] ?? [mood];
}
