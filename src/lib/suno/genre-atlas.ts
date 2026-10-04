export interface GenreDef {
  name: string;
  aliases: string[];
  family: string;
  defaultBpm: number;
  metricFeel: string;
  tags: string[];
  tier: number;
  cluster?: string;
}

function s(
  name: string,
  opts: {
    family: string;
    cluster: string;
    bpm: number;
    feel?: string;
    aliases?: string[];
    tier?: number;
  }
): GenreDef {
  return {
    name,
    aliases: opts.aliases ?? [name.toLowerCase()],
    family: opts.family,
    defaultBpm: opts.bpm,
    metricFeel: opts.feel ?? "half-time",
    tags: [opts.cluster],
    tier: opts.tier ?? 3,
    cluster: opts.cluster,
  };
}

export const ATLAS_EXTRA: GenreDef[] = [
  // Gospel / church
  s("Gospel", { family: "gospel", cluster: "gospel", bpm: 90, feel: "full-time", aliases: ["gospel", "gospel music"] }),
  s("Southern Gospel", { family: "gospel", cluster: "gospel", bpm: 88, feel: "full-time" }),
  s("Gospel Choir", { family: "gospel", cluster: "gospel", bpm: 92, feel: "full-time", aliases: ["choir gospel", "mass choir"] }),
  s("Worship", { family: "gospel", cluster: "gospel", bpm: 74, feel: "full-time", aliases: ["worship music", "ccm"] }),
  s("Holy Trap", { family: "gospel", cluster: "gospel", bpm: 140, aliases: ["holy trap", "church trap"] }),
  // Modern R&B
  s("Alt R&B", { family: "rnb", cluster: "soulRnB", bpm: 98, aliases: ["alternative r&b", "alt rnb"] }),
  s("Dark R&B", { family: "rnb", cluster: "soulRnB", bpm: 92, aliases: ["dark rnb"] }),
  s("Trap R&B", { family: "rnb", cluster: "soulRnB", bpm: 140, aliases: ["trap rnb", "r&b trap"] }),
  s("Experimental R&B", { family: "rnb", cluster: "soulRnB", bpm: 100 }),
  s("Bedroom R&B", { family: "rnb", cluster: "soulRnB", bpm: 88 }),
  s("808 R&B", { family: "rnb", cluster: "soulRnB", bpm: 130, aliases: ["808 rnb"] }),
  s("Contemporary R&B", { family: "rnb", cluster: "soulRnB", bpm: 96, aliases: ["modern r&b", "modern rnb"] }),
  s("Indie R&B", { family: "rnb", cluster: "soulRnB", bpm: 102 }),
  s("Digital R&B", { family: "rnb", cluster: "soulRnB", bpm: 108 }),
  s("Hyper R&B", { family: "rnb", cluster: "soulRnB", bpm: 140 }),
  s("Sexy R&B", { family: "rnb", cluster: "soulRnB", bpm: 94 }),
  s("Afro R&B", { family: "rnb", cluster: "soulRnB", bpm: 104 }),
  s("Rage R&B", { family: "rnb", cluster: "soulRnB", bpm: 140 }),
  // Modern hip-hop / rap
  s("Rage", { family: "rap", cluster: "trapHop", bpm: 144, aliases: ["rage rap", "rage music"] }),
  s("Opium", { family: "rap", cluster: "trapHop", bpm: 140, aliases: ["opium rap"] }),
  s("Melodic Rage", { family: "rap", cluster: "trapHop", bpm: 142 }),
  s("Autotune Rap", { family: "rap", cluster: "trapHop", bpm: 140, aliases: ["auto-tune rap"] }),
  s("Emo Rap", { family: "rap", cluster: "trapHop", bpm: 138 }),
  s("Digicore", { family: "rap", cluster: "pop", bpm: 150 }),
  s("NYC Drill", { family: "rap", cluster: "trapHop", bpm: 140, aliases: ["new york drill", "brooklyn drill"] }),
  s("Sample Drill", { family: "rap", cluster: "trapHop", bpm: 142 }),
  s("UK Rap", { family: "rap", cluster: "ukg140", bpm: 140, aliases: ["uk hip hop", "british rap"] }),
  s("Afro Trap", { family: "rap", cluster: "trapHop", bpm: 110 }),
  s("Sexy Drill", { family: "rap", cluster: "trapHop", bpm: 140 }),
  s("Melodic Hip-Hop", { family: "rap", cluster: "trapHop", bpm: 128, aliases: ["melodic hip hop", "melodic hiphop"] }),
  s("SoundCloud Rap", { family: "rap", cluster: "trapHop", bpm: 140, aliases: ["soundcloud rap"] }),
  s("Modern Trap Rap", { family: "rap", cluster: "trapHop", bpm: 140, aliases: ["modern trap", "trap rap"] }),
  s("Whisper Rap", { family: "rap", cluster: "trapHop", bpm: 130 }),
  s("Detroit Trap", { family: "rap", cluster: "trapHop", bpm: 130 }),
  s("Hip-Hop", { family: "rap", cluster: "trapHop", bpm: 96, aliases: ["hip hop", "hiphop"] }),
  s("Cloud Rap", { family: "rap", cluster: "trapHop", bpm: 140, aliases: ["cloud-rap"] }),
  s("Plugg", { family: "rap", cluster: "trapHop", bpm: 140 }),
  s("Pluggnb", { family: "rap", cluster: "soulRnB", bpm: 140, aliases: ["pluggnB", "plugg n b"] }),
  s("Grime", { family: "rap", cluster: "ukg140", bpm: 140 }),
  s("Jersey Club", { family: "breaks", cluster: "trapHop", bpm: 134, feel: "broken", aliases: ["jersey"] }),
  s("Baltimore Club", { family: "breaks", cluster: "trapHop", bpm: 130, feel: "broken" }),
  // Orchestral / trailer
  s("Orchestral", { family: "score", cluster: "cinematicRitual", bpm: 90, feel: "full-time", aliases: ["orchestra"] }),
  s("Film Score", { family: "score", cluster: "cinematicRitual", bpm: 88, feel: "full-time", aliases: ["filmscore", "soundtrack score"] }),
  s("Trailer Music", { family: "score", cluster: "cinematicRitual", bpm: 80, aliases: ["epic trailer", "trailer"] }),
  // Pop
  s("Pop", { family: "pop", cluster: "pop", bpm: 118, feel: "full-time" }),
  s("Dance Pop", { family: "pop", cluster: "pop", bpm: 124, feel: "four-on-the-floor" }),
  s("Electropop", { family: "pop", cluster: "pop", bpm: 120, feel: "four-on-the-floor" }),
  s("Hyperpop", { family: "pop", cluster: "pop", bpm: 150, feel: "full-time", aliases: ["hyper-pop"] }),
  s("Bubblegum Bass", { family: "pop", cluster: "hybridBass", bpm: 140, aliases: ["bubblegum bass"] }),
  s("Alt Pop", { family: "pop", cluster: "pop", bpm: 114, feel: "full-time", aliases: ["alt-pop"] }),
  // House / club
  s("Deep House", { family: "house", cluster: "houseClub", bpm: 122, feel: "four-on-the-floor" }),
  s("Tech House", { family: "house", cluster: "houseClub", bpm: 126, feel: "four-on-the-floor" }),
  s("Future House", { family: "house", cluster: "houseClub", bpm: 126, feel: "four-on-the-floor" }),
  s("Slap House", { family: "house", cluster: "houseClub", bpm: 126, feel: "four-on-the-floor" }),
  s("G-House", { family: "house", cluster: "houseClub", bpm: 124, feel: "four-on-the-floor", aliases: ["ghouse", "g house"] }),
  s("Trap House", { family: "house", cluster: "trapHop", bpm: 128, feel: "four-on-the-floor" }),
  s("Afro House", { family: "house", cluster: "houseClub", bpm: 120, feel: "four-on-the-floor" }),
  s("Speed Garage", { family: "garage", cluster: "ukg140", bpm: 136, feel: "2-step" }),
  s("Bassline", { family: "garage", cluster: "ukg140", bpm: 135, feel: "four-on-the-floor" }),
  s("UK Funky", { family: "garage", cluster: "ukg140", bpm: 130, feel: "broken" }),
  s("Breakbeat", { family: "breaks", cluster: "breaks", bpm: 132, feel: "broken", aliases: ["breaks"] }),
  s("UK Breaks", { family: "breaks", cluster: "breaks", bpm: 134, feel: "broken" }),
  s("Jungle", { family: "breaks", cluster: "breaks", bpm: 170, feel: "broken" }),
  s("Drum and Bass", { family: "breaks", cluster: "breaks", bpm: 174, feel: "broken", aliases: ["dnb", "drum & bass", "drum n bass"] }),
  s("Liquid DnB", { family: "breaks", cluster: "breaks", bpm: 172, feel: "broken", aliases: ["liquid drum and bass"] }),
  s("Neurofunk", { family: "breaks", cluster: "breaks", bpm: 174, feel: "broken" }),
  s("Jump Up", { family: "breaks", cluster: "breaks", bpm: 174, feel: "broken", aliases: ["jump-up"] }),
  s("Halftime DnB", { family: "breaks", cluster: "breaks", bpm: 174, aliases: ["half-time dnb", "halftime drum and bass"] }),
  s("Drumstep", { family: "breaks", cluster: "dubstep", bpm: 170, feel: "broken" }),
  s("Crossbreed", { family: "breaks", cluster: "dubstep", bpm: 170, feel: "broken" }),
  s("Footwork", { family: "breaks", cluster: "breaks", bpm: 160, feel: "broken" }),
  s("Juke", { family: "breaks", cluster: "breaks", bpm: 160, feel: "broken" }),
  s("Hard Techno", { family: "house", cluster: "houseClub", bpm: 148, feel: "four-on-the-floor" }),
  s("Industrial Techno", { family: "house", cluster: "houseClub", bpm: 140, feel: "four-on-the-floor" }),
  // Afro / Brazilian
  s("Afrobeats", { family: "afro", cluster: "world", bpm: 110, feel: "full-time" }),
  s("Amapiano", { family: "afro", cluster: "world", bpm: 112, feel: "full-time" }),
  s("Gqom", { family: "afro", cluster: "world", bpm: 127, feel: "broken" }),
  s("Moombahton", { family: "latin", cluster: "world", bpm: 108, feel: "full-time" }),
  s("Dembow", { family: "latin", cluster: "world", bpm: 98, feel: "full-time" }),
  s("Mid-East Bass", { family: "world", cluster: "hybridBass", bpm: 140, aliases: ["middle eastern bass", "levantine bass"] }),
  s("Brazilian Bass", { family: "bass", cluster: "brazilian", bpm: 126, feel: "four-on-the-floor" }),
  // Bass / heavier EDM
  s("Colour Bass", { family: "bass", cluster: "hybridBass", bpm: 150, aliases: ["color bass"] }),
  s("Tearout", { family: "bass", cluster: "dubstep", bpm: 140 }),
  s("Deep Tearout", { family: "bass", cluster: "dubstep", bpm: 140 }),
  s("Briddim", { family: "bass", cluster: "dubstep", bpm: 145 }),
  s("Melodic Riddim", { family: "bass", cluster: "dubstep", bpm: 145 }),
  s("Heavy Riddim", { family: "bass", cluster: "dubstep", bpm: 150 }),
  s("Deathstep", { family: "bass", cluster: "dubstep", bpm: 140 }),
  s("Wave", { family: "bass", cluster: "hybridBass", bpm: 140 }),
  s("Hardwave", { family: "bass", cluster: "hybridBass", bpm: 150 }),
  s("Wave Trap", { family: "bass", cluster: "trapHop", bpm: 140 }),
  s("Midtempo Bass", { family: "bass", cluster: "hybridBass", bpm: 110, aliases: ["midtempo"] }),
  s("Midtempo Neuro", { family: "bass", cluster: "hybridBass", bpm: 110 }),
  s("Complextro", { family: "bass", cluster: "hybridBass", bpm: 128, feel: "four-on-the-floor" }),
  s("Moombahcore", { family: "bass", cluster: "hybridBass", bpm: 110 }),
  s("Space Bass", { family: "bass", cluster: "hybridBass", bpm: 140 }),
  s("Melodic Bass", { family: "bass", cluster: "hybridBass", bpm: 140 }),
  s("Dark Melodic Bass", { family: "bass", cluster: "hybridBass", bpm: 140 }),
  s("Euphoric Bass", { family: "bass", cluster: "hybridBass", bpm: 140 }),
  s("Kawaii Bass", { family: "bass", cluster: "hybridBass", bpm: 150 }),
  s("Future Bounce", { family: "bass", cluster: "hybridBass", bpm: 128, feel: "four-on-the-floor" }),
  s("Neurohop", { family: "bass", cluster: "hybridBass", bpm: 110 }),
  s("Heavy Neuro", { family: "bass", cluster: "hybridBass", bpm: 140 }),
  s("Psydub", { family: "bass", cluster: "dubstep", bpm: 140 }),
  s("Glitch Hop", { family: "experimental", cluster: "hybridBass", bpm: 110, aliases: ["glitch-hop"] }),
  s("Wonky", { family: "experimental", cluster: "hybridBass", bpm: 140, feel: "broken" }),
  s("Purple Sound", { family: "garage", cluster: "ukg140", bpm: 140, aliases: ["purple"] }),
  s("Hybrid Trap", { family: "trap", cluster: "trapHop", bpm: 140 }),
  s("Chill Trap", { family: "trap", cluster: "trapHop", bpm: 130 }),
  s("Twerk Trap", { family: "trap", cluster: "trapHop", bpm: 100 }),
  s("Rage Trap", { family: "trap", cluster: "trapHop", bpm: 144 }),
  s("Mainstage Trap", { family: "trap", cluster: "trapHop", bpm: 140, aliases: ["mainstage edm trap"] }),
  s("Festival Bass", { family: "bass", cluster: "hybridBass", bpm: 140 }),
  s("Big Room Bass", { family: "bass", cluster: "hybridBass", bpm: 128, feel: "four-on-the-floor" }),
  s("Festival Dubstep", { family: "bass", cluster: "dubstep", bpm: 140 }),
  s("Melodic Trapstep", { family: "hybrid", cluster: "hybridBass", bpm: 142 }),
  s("Dark Trapstep", { family: "hybrid", cluster: "hybridBass", bpm: 142 }),
  s("Garage Dubstep", { family: "bass", cluster: "ukg140", bpm: 140 }),
  s("140 Grime", { family: "rap", cluster: "ukg140", bpm: 140 }),
  s("140 Halftime", { family: "bass", cluster: "ukg140", bpm: 140, aliases: ["140 half-time"] }),
  s("4x4 Garage", { family: "garage", cluster: "ukg140", bpm: 130, feel: "four-on-the-floor", aliases: ["4x4 ukg"] }),
  s("Future Riddim", { family: "bass", cluster: "dubstep", bpm: 145 }),
  s("Cinematic Riddim", { family: "bass", cluster: "cinematicRitual", bpm: 140 }),
  s("Trap Riddim", { family: "bass", cluster: "trapHop", bpm: 140 }),
  s("Phonk House", { family: "house", cluster: "trapHop", bpm: 126, feel: "four-on-the-floor" }),
  s("Drift House", { family: "house", cluster: "trapHop", bpm: 140 }),
  s("Organic Bass", { family: "bass", cluster: "hybridBass", bpm: 140 }),
  s("Liquid Bass", { family: "bass", cluster: "hybridBass", bpm: 140 }),
  s("Amapiano Bass", { family: "bass", cluster: "world", bpm: 112 }),
  s("Afro Tech", { family: "house", cluster: "houseClub", bpm: 122, feel: "four-on-the-floor" }),
  s("Melbourne Bounce", { family: "bass", cluster: "hybridBass", bpm: 128, feel: "four-on-the-floor" }),
  s("Tropical Bass", { family: "bass", cluster: "hybridBass", bpm: 108 }),
  s("Dark Club Bass", { family: "bass", cluster: "hybridBass", bpm: 140 }),
  s("Industrial Bass", { family: "bass", cluster: "hybridBass", bpm: 140 }),
  s("Trailer Bass", { family: "bass", cluster: "cinematicRitual", bpm: 140 }),
  s("Hybrid Dubstep", { family: "bass", cluster: "dubstep", bpm: 140 }),
  s("Deep Hybrid Trap", { family: "trap", cluster: "trapHop", bpm: 140 }),
  s("EDM Drill", { family: "trap", cluster: "trapHop", bpm: 140 }),
  s("Bass Drill", { family: "trap", cluster: "ukg140", bpm: 140 }),
  s("Future Drill", { family: "trap", cluster: "trapHop", bpm: 140 }),
  s("Melodic EDM Trap", { family: "trap", cluster: "trapHop", bpm: 140 }),
  s("Dark EDM Trap", { family: "trap", cluster: "trapHop", bpm: 140 }),
  s("Cinematic EDM Trap", { family: "trap", cluster: "cinematicRitual", bpm: 140 }),
  s("Wobble Trap", { family: "trap", cluster: "dubstep", bpm: 140 }),
  s("808 Dubstep", { family: "bass", cluster: "dubstep", bpm: 140 }),
  s("UKG Riddim", { family: "bass", cluster: "ukg140", bpm: 140 }),
  s("Baile Riddim", { family: "bass", cluster: "brazilian", bpm: 140 }),
  s("Baile Trapstep", { family: "hybrid", cluster: "brazilian", bpm: 140 }),
  s("Phonk Riddim", { family: "bass", cluster: "trapHop", bpm: 140 }),
  s("Phonk Dubstep", { family: "bass", cluster: "dubstep", bpm: 140 }),
  s("Cyber Trapstep", { family: "hybrid", cluster: "hybridBass", bpm: 144 }),
  s("Neuro Trap", { family: "trap", cluster: "hybridBass", bpm: 140 }),
  s("Neuro Dubstep", { family: "bass", cluster: "dubstep", bpm: 140 }),
  s("Tearout Trap", { family: "trap", cluster: "dubstep", bpm: 140 }),
  s("Colour Trap", { family: "trap", cluster: "hybridBass", bpm: 150 }),
  s("Hardwave Trap", { family: "trap", cluster: "hybridBass", bpm: 150 }),
  s("Midtempo Trap", { family: "trap", cluster: "hybridBass", bpm: 110 }),
  s("Ambient", { family: "ambient", cluster: "cinematicRitual", bpm: 70, feel: "full-time" }),
  s("Drone", { family: "ambient", cluster: "cinematicRitual", bpm: 60, feel: "full-time" }),
  s("Trip-Hop", { family: "soul", cluster: "cinematicRitual", bpm: 90, aliases: ["triphop", "trip hop"] }),
  s("Downtempo", { family: "ambient", cluster: "cinematicRitual", bpm: 90, feel: "full-time" }),
  s("Neo-Soul", { family: "soul", cluster: "soulRnB", bpm: 88, aliases: ["neosoul", "neo soul"] }),
];

export const CLUSTER_OF: Record<string, string> = {
  "Future Bass": "hybridBass",
  Trap: "trapHop",
  "EDM Trap": "trapHop",
  Trapstep: "hybridBass",
  Dubstep: "dubstep",
  "Deep Dubstep": "dubstep",
  "Melodic Dubstep": "dubstep",
  "140 Bass": "ukg140",
  "UK Garage": "ukg140",
  "UK Bass": "ukg140",
  Drill: "trapHop",
  "Cinematic Bass": "cinematicRitual",
  "Ritual Bass": "cinematicRitual",
  "Experimental Bass": "hybridBass",
  Phonk: "trapHop",
  "Brazilian Phonk": "brazilian",
  "Baile Funk": "brazilian",
  "Favela Funk": "brazilian",
  "Melodic Rap": "trapHop",
  "Emotional Rap": "trapHop",
  "Emotional R&B": "soulRnB",
  Soul: "soulRnB",
  Trapsoul: "soulRnB",
  "Bass House": "houseClub",
  "Gospel Trap": "gospel",
  Dancehall: "world",
  Reggaeton: "world",
  "French Filtered House": "houseClub",
  Riddim: "dubstep",
  Brostep: "dubstep",
  "Neuro Bass": "hybridBass",
  EDM: "hybridBass",
};

for (const n of ATLAS_EXTRA) {
  if (n.cluster) CLUSTER_OF[n.name] = n.cluster;
}

export const TAME_NEIGHBORS: Record<string, string[]> = {
  hybridBass: ["trapHop", "ukg140", "dubstep", "cinematicRitual", "pop"],
  trapHop: ["hybridBass", "soulRnB", "brazilian", "ukg140"],
  ukg140: ["hybridBass", "trapHop", "dubstep", "houseClub"],
  dubstep: ["hybridBass", "ukg140", "cinematicRitual"],
  brazilian: ["trapHop", "hybridBass", "world"],
  soulRnB: ["trapHop", "gospel", "pop", "hybridBass"],
  houseClub: ["ukg140", "pop", "hybridBass"],
  cinematicRitual: ["hybridBass", "dubstep", "gospel"],
  gospel: ["soulRnB", "trapHop"],
  pop: ["soulRnB", "houseClub", "hybridBass"],
  world: ["brazilian", "houseClub", "trapHop"],
  breaks: ["hybridBass", "ukg140", "dubstep"],
};

export const WEIRD_NEIGHBORS: Record<string, string[]> = {
  hybridBass: ["gospel", "soulRnB", "breaks", "world"],
  trapHop: ["gospel", "houseClub", "cinematicRitual", "breaks"],
  dubstep: ["gospel", "soulRnB", "breaks", "pop"],
  gospel: ["dubstep", "hybridBass", "cinematicRitual", "houseClub"],
  breaks: ["gospel", "trapHop", "dubstep"],
  pop: ["dubstep", "cinematicRitual", "trapHop"],
  world: ["dubstep", "gospel", "cinematicRitual"],
  ukg140: ["gospel", "soulRnB", "pop"],
  brazilian: ["gospel", "dubstep", "cinematicRitual"],
  soulRnB: ["dubstep", "breaks", "ukg140"],
  houseClub: ["gospel", "trapHop", "cinematicRitual"],
  cinematicRitual: ["gospel", "soulRnB", "pop"],
};

export function namedBpmConflict(name: string, bpm?: number): boolean {
  if (!bpm) return false;
  const nums = [...name.matchAll(/\b(\d{2,3})\b/g)].map((m) => parseInt(m[1], 10));
  return nums.some((n) => n >= 70 && n <= 200 && Math.abs(n - bpm) > 6);
}

export function clusterOf(name: string): string {
  if (CLUSTER_OF[name]) return CLUSTER_OF[name];
  const hit = ATLAS_EXTRA.find((x) => x.name === name);
  if (hit && hit.cluster) return hit.cluster;
  const n = name.toLowerCase();
  if (/gospel|worship/.test(n)) return "gospel";
  if (/\br&b\b|\brnb\b|soul|trapsoul/.test(n)) return "soulRnB";
  if (/dubstep|riddim|brostep|tearout|deathstep|wobble|wubby/.test(n)) return "dubstep";
  if (/ukg|garage|\b140\b/.test(n)) return "ukg140";
  if (/trap|drill|phonk|rage|plugg/.test(n)) return "trapHop";
  if (/baile|favela|brazilian/.test(n)) return "brazilian";
  if (/house|techno|disco/.test(n)) return "houseClub";
  if (/cinematic|ritual|trailer|orchestral|ambient|drone/.test(n)) return "cinematicRitual";
  if (/future bass|edm|\bbass\b|neuro|wave|complextro/.test(n)) return "hybridBass";
  if (/\brap\b|hip-hop|hip hop/.test(n)) return "trapHop";
  return "hybridBass";
}

export function blendDistance(a: string, b: string): "tame" | "weird" | "unhinged" {
  const ca = clusterOf(a);
  const cb = clusterOf(b);
  if (ca === cb) return "tame";
  if (TAME_NEIGHBORS[ca]?.includes(cb)) return "tame";
  if (WEIRD_NEIGHBORS[ca]?.includes(cb)) return "weird";
  return "unhinged";
}

export function inferBlendBand(
  raw: string,
  genres: string[],
  variety: boolean,
  profile: boolean
): "tame" | "weird" | "unhinged" {
  let t = raw.toLowerCase();
  const named = [...genres].sort((a, b) => b.length - a.length);
  for (const g of named) {
    const esc = g.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    t = t.replace(new RegExp(`\\b${esc}\\b`, "gi"), " ");
  }
  if (/\bunhinged\b|\bchaotic\b|\bnonsensical\b|\bimpossible\b|\binsane\b|\bchaos\b|\bmax weird/.test(t)) {
    return "unhinged";
  }
  if (/\bweird\b|\bwild\b|\bexperimental\b|\bstrange\b|\bleftfield\b|\bodd\b|\bbizarre\b|\boff-kilter\b/.test(t)) {
    return "weird";
  }
  if (/\btame\b|\bcoherent\b|\bsafe blend\b|\bblend well\b|\bclassic hybrid\b|\bkeep it tight\b/.test(t)) {
    return "tame";
  }
  if (genres.length >= 2) {
    let worst: "tame" | "weird" | "unhinged" = "tame";
    for (let i = 0; i < genres.length; i++) {
      for (let j = i + 1; j < genres.length; j++) {
        const d = blendDistance(genres[i], genres[j]);
        if (d === "unhinged") worst = "unhinged";
        else if (d === "weird" && worst === "tame") worst = "weird";
      }
    }
    if (worst !== "tame") return worst;
  }
  if (variety) return "weird";
  if (profile) return "tame";
  return "tame";
}

export function pickFaithfulAccent(
  rng: () => number,
  identity: GenreDef[],
  locked: string[],
  exclude: string[],
  band: "tame" | "weird" | "unhinged",
  bpm?: number
): GenreDef | undefined {
  const universe = [...identity, ...ATLAS_EXTRA];
  const skip = new Set([...locked, ...exclude].map((s) => s.toLowerCase()));
  let pool = universe.filter(
    (g) => !skip.has(g.name.toLowerCase()) && !namedBpmConflict(g.name, bpm)
  );
  if (!locked.length) return pool[Math.floor(rng() * pool.length) % Math.max(1, pool.length)];

  if (band === "tame") {
    const clusters = new Set(locked.map(clusterOf));
    pool = pool.filter((g) => clusters.has(clusterOf(g.name)));
  } else if (band === "weird") {
    pool = pool.filter((g) =>
      locked.some((l) => {
        const d = blendDistance(l, g.name);
        return d === "tame" || d === "weird";
      })
    );
  }
  if (!pool.length) return undefined;
  return pool[Math.floor(rng() * pool.length) % pool.length];
}

export function pickByBand(
  rng: () => number,
  band: "tame" | "weird" | "unhinged",
  identity: GenreDef[],
  locked: string[],
  exclude: string[] = []
): GenreDef {
  const universe = [...identity, ...ATLAS_EXTRA];
  const skip = new Set([...locked, ...exclude].map((s) => s.toLowerCase()));
  const pool = universe.filter((g) => !skip.has(g.name.toLowerCase()));
  if (!pool.length) return universe[0];

  const lockedClusters = locked.map(clusterOf);
  const scored = pool.filter((g) => {
    if (!locked.length) {
      if (band === "tame") {
        return (
          (g.tier ?? 3) <= 2 ||
          clusterOf(g.name) === "hybridBass" ||
          clusterOf(g.name) === "trapHop"
        );
      }
      return true;
    }
    const distances = locked.map((l) => blendDistance(l, g.name));
    if (band === "tame") return distances.every((d) => d === "tame");
    if (band === "weird") return distances.some((d) => d === "tame" || d === "weird");
    return true;
  });

  const use = scored.length ? scored : pool;
  if (band === "unhinged") {
    return use[Math.floor(rng() * use.length) % use.length];
  }

  const weighted: GenreDef[] = [];
  for (const item of use) {
    const ident = identity.some((x) => x.name === item.name);
    const same = lockedClusters.includes(clusterOf(item.name));
    const w = band === "tame" ? (ident ? 5 : same ? 3 : 1) : ident ? 2 : 3;
    for (let i = 0; i < w; i++) weighted.push(item);
  }
  return weighted[Math.floor(rng() * weighted.length) % weighted.length];
}
