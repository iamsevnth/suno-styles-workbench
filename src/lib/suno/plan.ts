import { namedBpmConflict, pickByBand, pickFaithfulAccent } from "./genre-atlas.ts";
import {
  ARRANGEMENT,
  BASS_MOVES,
  BASS_TONES,
  DRUMS,
  familyKeys,
  FEELS,
  GROOVE,
  HARMONY,
  MASTER,
  MELODY,
  MIX,
  oneFamily,
  pickArc,
  pickFamily,
  pickTitleLex,
  SOUND_DESIGN,
  TITLES,
  VOCAL_ARC,
  VOCAL_INST,
  VOCAL_PROC,
  VOCAL_PROC_RAP,
  VOCAL_REGISTER,
  VOCAL_STYLE,
  VOCAL_TIMBRE,
} from "./lexicon.ts";
import {
  DNA_ARRANGE,
  DNA_BASS,
  DNA_FX,
  DNA_GROOVE,
  DNA_HARMONY,
  DNA_HOOK,
  DNA_HYBRID,
  DNA_MIX,
  DNA_PALETTE,
} from "./lexicon-dna.ts";
import { pickVocalPhrase } from "./lexicon-vocals.ts";
import { expandMood, GENRES, matchGenre } from "./ontology.ts";
import { PROFILE } from "./profile.ts";
import { mulberry32, pick } from "./rng.ts";
import { ParsedInput, SonicPlan, VocalPreferences } from "./types.ts";

export interface VariantPreset {
  axes: string[];
  bassFamily: string;
  rhythmFamily: string;
  energy: string;
  titleBank: string[];
}

export const VARIANT_PRESETS: VariantPreset[] = [
  {
    axes: ["genre hierarchy", "rhythm", "bass"],
    bassFamily: "wub",
    rhythmFamily: "ukg",
    energy: "balanced",
    titleBank: [
      "Swung Emotional Bass",
      "Garage Hybrid Lift",
      "Elastic Bass Motion",
      "Skippy Two Step",
      "London Night Swung Grid",
      "Sub-Loaded Two Step",
      "Shuffle And Chop Flow",
      "Late Night Garage Bounce",
    ],
  },
  {
    axes: ["bass architecture", "atmosphere", "arrangement"],
    bassFamily: "808",
    rhythmFamily: "trap",
    energy: "heavy",
    titleBank: [
      "Heavy 808 Pressure",
      "Monumental Trap Weight",
      "Sub Authority Drop",
      "Subsonic Atlanta Rumble",
      "Titan 808 Architecture",
      "Distorted Low-End Authority",
      "Midnight Rollers Arc",
      "Chrome Trap Bloom",
    ],
  },
  {
    axes: ["emotional profile", "vocals", "harmony"],
    bassFamily: "growl",
    rhythmFamily: "half-time",
    energy: "emotional",
    titleBank: [
      "Bittersweet Release",
      "Intimate Peak Drop",
      "Melodic Bass Bloom",
      "Prismatic Sidechain Surge",
      "Vivid Emotional Ascent",
      "Radiant Drop Explosion",
      "Lush Hybrid Rise",
      "Supersaw Bloom",
    ],
  },
  {
    axes: ["rhythm donor", "percussion", "mix"],
    bassFamily: "reese",
    rhythmFamily: "drill",
    energy: "kinetic",
    titleBank: [
      "Syncopated Street Pulse",
      "Drill Pocket Engine",
      "Sliding Bass Tension",
      "Cold Drill Pressure",
      "Gliding Slide Cadence",
      "Frostbite Sub Glide",
      "Urban Menace Rhythm",
      "Coldfront 808 Warp",
    ],
  },
  {
    axes: ["atmosphere", "sound design", "dynamic arc"],
    bassFamily: "neuro",
    rhythmFamily: "ritual",
    energy: "cinematic",
    titleBank: [
      "Cinematic Ritual Weight",
      "Processional Sub Arc",
      "Ominous Impact Field",
      "Ancient Percussion Canon",
      "Temple Sub Resonance",
      "Primal Ceremonial Descent",
      "Sacred Horn Echo",
      "Mystic Sub-Bass Horizon",
    ],
  },
  {
    axes: ["genre hierarchy", "instrumentation", "vocals"],
    bassFamily: "wub",
    rhythmFamily: "baile",
    energy: "club",
    titleBank: [
      "Kinetic Club Hybrid",
      "Physical Groove Engine",
      "Global Percussion Bass",
      "Rio Tambor Ignition",
      "Dynamic Floor Ignition",
      "Favela Bass Collision",
      "Kicking Volt Percussion",
      "Favela Rhythm Stash",
    ],
  },
  {
    axes: ["harmony", "vocals", "groove"],
    bassFamily: "808",
    rhythmFamily: "trap",
    energy: "emotional",
    titleBank: [
      "Warm Nocturnal Soul",
      "Quiet Fire Hybrid",
      "Late Night Croon",
      "Velvet Rhodes Serenade",
      "Sub-Bass Heartbeat",
      "Dusk Till Dawn Groove",
      "Neo-Soul Satin Touch",
      "Golden Hour Chords",
    ],
  },
  {
    axes: ["rhythm", "atmosphere", "mix"],
    bassFamily: "808",
    rhythmFamily: "ukg",
    energy: "kinetic",
    titleBank: [
      "Skippy Two Step",
      "Garage Hybrid Lift",
      "Elastic Bass Motion",
      "South London Rhythm Box",
      "Late Night Garage Bounce",
      "Whiplash Bass Accent",
      "Silk And Shuffler",
      "Syncopated Roller Groove",
    ],
  },
];

export function buildPlans(
  parsed: ParsedInput,
  seed: number,
  count: number,
  options: {
    variantIndex?: number;
    diversityRank?: number;
    forceDiversity?: boolean;
    attempt?: number;
  } = {}
): SonicPlan[] {
  const plans: SonicPlan[] = [];
  for (let i = 0; i < count; i++) {
    const variantIndex = options.variantIndex ?? i;
    plans.push(
      buildOnePlan(parsed, seed + i * 9973 + seed * 31, variantIndex, {
        ...options,
        diversityRank: options.diversityRank ?? i,
        forceDiversity: options.forceDiversity ?? i > 0,
        attempt: options.attempt ?? 0,
      })
    );
  }
  return plans;
}

export function buildOnePlan(
  parsed: ParsedInput,
  seed: number,
  variantIndex: number,
  options: {
    diversityRank?: number;
    forceDiversity?: boolean;
    attempt?: number;
  } = {}
): SonicPlan {
  const rng = mulberry32(seed >>> 0);
  const rank = options.diversityRank ?? variantIndex;
  const attempt = options.attempt ?? 0;

  let genres = diversifyGenres(parsed, rank, attempt, rng, seed);
  if (genres.length === 0 && parsed.profileEnabled) {
    const formula =
      PROFILE.hybridFormulas[
        Math.floor(rng() * PROFILE.hybridFormulas.length) % PROFILE.hybridFormulas.length
      ];
    genres = [formula.primary, formula.secondary];
    if (formula.accent) genres.push(formula.accent);
  } else if (genres.length === 0) {
    const p = pickByBand(rng, parsed.blendBand ?? "tame", GENRES, [], []);
    const s = pickByBand(rng, parsed.blendBand ?? "tame", GENRES, [p.name], [p.name]);
    const a = pickByBand(rng, parsed.blendBand ?? "tame", GENRES, [p.name, s.name], [p.name, s.name]);
    genres = [p.name, s.name, a.name];
  }

  if (
    parsed.genres.length === 0 &&
    parsed.moods.includes("dark") &&
    parsed.profileEnabled &&
    (parsed.blendBand ?? "tame") === "tame" &&
    (parsed.bpm == null || Math.abs(parsed.bpm - 140) <= 6)
  ) {
    const formula =
      PROFILE.hybridFormulas.find((f) => f.id === "140-ukg-trap") ?? PROFILE.hybridFormulas[3];
    genres = [formula.primary, formula.secondary, formula.accent].filter(Boolean) as string[];
  }

  const primaryGenre = genres[0];
  const secondaryGenre = genres[1];
  const accentGenre = genres[2];
  const primaryDef = matchGenre(primaryGenre);
  const families = familyKeys([primaryGenre, secondaryGenre, accentGenre]);

  const preset = pickCompatiblePreset(rng, families, parsed.moods, rank, attempt);

  let bpm = parsed.bpm;
  if (!bpm) {
    bpm =
      PROFILE.preferredBpmCenters[primaryGenre] ??
      primaryDef?.defaultBpm ??
      (parsed.profileEnabled ? 140 : 128);
    if (rank > 0) {
      const deltas = [0, 2, -2, 4, -4, 6];
      bpm = clamp(bpm + (deltas[(rank + Math.floor(rng() * 3)) % deltas.length] ?? 0), 70, 180);
    }
  }

  const moodPool =
    parsed.moods.length > 0
      ? parsed.moods
      : parsed.profileEnabled
      ? shufflePick(rng, ["dark", "cinematic", "emotional", "nocturnal", "aggressive", "kinetic"])
      : ["atmospheric"];
  const moodPrimary = moodPool[Math.floor(rng() * moodPool.length) % moodPool.length];
  const moodSecondary = parsed.moods.length
    ? moodPool.find((m) => m !== moodPrimary)
    : rng() > 0.5
    ? pick(rng, ["cinematic", "nocturnal", "emotional", "kinetic"])
    : undefined;

  const atmosphere = [...parsed.atmospheres, ...expandMood(moodPrimary).slice(0, 1)];
  if (atmosphere.length === 0) atmosphere.push(pick(rng, ["nocturnal", "club", "underground"]));
  if (parsed.atmospheres.includes("ritual") || parsed.moods.includes("ritualistic")) {
    atmosphere.unshift("ritualistic");
  }
  if (parsed.moods.length === 0 && parsed.atmospheres.length === 0 && rng() > 0.55) {
    atmosphere.push(pick(rng, ["cavernous", "neon", "industrial", "haze"]));
  }

  const feelCycle = ["half-time", "2-step", "broken", "four-on-the-floor"];
  let metricFeel = primaryDef?.metricFeel ?? "half-time";
  if (
    secondaryGenre === "UK Garage" ||
    primaryGenre === "UK Garage" ||
    preset.rhythmFamily === "ukg"
  ) {
    metricFeel = feelCycle[(rank + Math.floor(rng() * feelCycle.length)) % feelCycle.length];
  } else if (
    preset.rhythmFamily === "baile" ||
    primaryGenre === "Baile Funk" ||
    secondaryGenre === "Baile Funk"
  ) {
    metricFeel = rng() > 0.4 ? "broken" : "half-time";
  } else if (preset.rhythmFamily === "trap" || primaryGenre === "Trap") {
    metricFeel = rng() > 0.35 ? "half-time" : "broken";
  } else {
    metricFeel = feelCycle[Math.floor(rng() * feelCycle.length) % feelCycle.length];
  }
  if (parsed.grooveHints.includes("half-time")) metricFeel = "half-time";
  else if (parsed.grooveHints.includes("2-step")) metricFeel = "2-step";
  else if (parsed.grooveHints.includes("four-on-the-floor")) metricFeel = "four-on-the-floor";
  else if (parsed.grooveHints.includes("swung") || parsed.grooveHints.includes("syncopated")) {
    metricFeel = rng() > 0.5 ? "2-step" : "broken";
  }

  const lockedBass = lockedBassFamily(parsed.bassHints);
  const bassFamilies = ["wub", "808", "growl", "reese", "neuro"];
  const bassFamily = lockedBass
    ? lockedBass
    : bassFamilies[
        (bassFamilies.indexOf(preset.bassFamily) + Math.floor(rng() * 5) + rank) % 5
      ];

  const groove = buildGroove(families, preset.rhythmFamily, parsed, rng);
  const drums = buildDrums(families, parsed, rng);
  const { bass, bassBehavior } = buildBass(bassFamily, families, parsed, rng);
  const harmony = buildHarmony(families, moodPrimary, parsed, rng);
  const melody = buildMelody(families, moodPrimary, parsed, rng);
  const soundDesign = buildSoundDesign(families, moodPrimary, parsed, rng);
  const arrangement = buildArrangement(preset.energy, parsed, rng);
  const mix = buildMix(parsed, rng);
  const master = buildMaster(preset.energy, rng);
  const vocals = buildVocals(parsed, rank, rng, attempt, families);
  const instruments = selectInstruments(
    bass,
    drums,
    harmony,
    melody,
    soundDesign,
    vocals,
    parsed,
    families,
    rng
  );

  const donors = {
    rhythm: rhythmDonor(preset.rhythmFamily, primaryGenre, secondaryGenre),
    bass: bassDonor(bassFamily, primaryGenre, secondaryGenre),
    harmony:
      primaryGenre.includes("Future") || secondaryGenre === "Future Bass"
        ? "Future Bass"
        : primaryGenre,
    melody: harmony[0]?.includes("guitar") ? "R&B guitar" : primaryGenre,
    atmosphere: moodPrimary,
    vocals: vocals.present ? `${vocals.presentation ?? "lead"} vocal` : "instrumental",
  };

  const titlePhrase = pickTitle(preset.titleBank, moodPrimary, families, rng, rank, seed);
  const anchors = buildAnchors(parsed, bpm);

  const recipeId = [
    metricFeel,
    bassFamily,
    drums[0] ?? "",
    bass[1] ?? bass[0] ?? "",
    bassBehavior[0] ?? "",
    arrangement[0] ?? "",
    vocals.present ? `${vocals.presentation}-${vocals.style}-${vocals.processing?.[0] ?? ""}` : "inst",
    mix[3] ?? mix[2] ?? "",
    titlePhrase,
  ].join("|");

  return {
    bpm,
    primaryGenre,
    secondaryGenre,
    accentGenre,
    donors,
    moodPrimary,
    moodSecondary,
    atmosphere: unique(atmosphere).slice(0, 3),
    metricFeel,
    groove,
    drums,
    bass,
    bassBehavior,
    harmony,
    melody,
    instruments,
    vocals,
    arrangement,
    soundDesign,
    mix,
    master,
    titlePhrase,
    anchors,
    recipeId,
    variantAxes: [...preset.axes, `seed:${seed % 1000}`, `recipe:${recipeId.slice(0, 48)}`],
    seed,
  };
}

function rhythmDonor(family: string, primary: string, secondary?: string): string {
  if (family === "ukg" || secondary === "UK Garage" || primary === "UK Garage") return "UK Garage";
  if (family === "trap") return "Trap";
  if (family === "drill") return "Drill";
  if (family === "ritual") return "Ritual Bass";
  if (family === "baile") return "Baile Funk";
  return primary;
}

function bassDonor(family: string, primary: string, secondary?: string): string {
  if (family === "wub" || secondary?.includes("Dubstep") || primary.includes("Dubstep"))
    return "Deep Dubstep";
  if (family === "808") return "Trap";
  if (family === "neuro") return "Neuro Bass";
  if (family === "reese") return "140 Bass";
  return primary;
}

function pickCompatiblePreset(
  rng: () => number,
  families: string[],
  moods: string[],
  rank: number,
  attempt: number
): VariantPreset {
  const want = new Set<string>();
  if (families.includes("trap") || families.includes("future") || families.includes("phonk")) {
    want.add("trap");
    want.add("half-time");
  }
  if (families.includes("garage")) want.add("ukg");
  if (families.includes("drill")) want.add("drill");
  if (families.includes("baile")) want.add("baile");
  if (families.includes("cinematic") || families.includes("ritual")) want.add("ritual");
  if (families.includes("riddim") || families.includes("bass")) want.add("half-time");

  let pool = VARIANT_PRESETS.filter((p) => want.size === 0 || want.has(p.rhythmFamily));
  if (!pool.length) pool = [...VARIANT_PRESETS];

  const highEnergy = moods.some((m) =>
    /kinetic|energetic|high energy|high-energy|hype|euphoric|aggressive/.test(m)
  );
  if (highEnergy) {
    const boosted = pool.filter(
      (p) => p.energy === "kinetic" || p.energy === "club" || p.energy === "heavy"
    );
    if (boosted.length) pool = boosted;
  }
  if (families.includes("soul") && !highEnergy) {
    const soft = pool.filter((p) => p.energy === "emotional" || p.energy === "balanced");
    if (soft.length) pool = soft;
  }

  return pool[(rank + attempt + Math.floor(rng() * pool.length)) % pool.length];
}

function diversifyGenres(
  parsed: ParsedInput,
  rank: number,
  attempt: number,
  rng: () => number,
  _seed: number
): string[] {
  const wantsVariety = parsed.mandatory?.includes("__variety__") === true;
  const band = parsed.blendBand ?? (wantsVariety ? "weird" : parsed.profileEnabled ? "tame" : "tame");
  const locked = [...parsed.genres];

  if (locked.length > 0 && !wantsVariety) {
    let genres = [...locked];
    if (genres.length >= 2 && rank > 0) {
      const rot = (rank + attempt) % genres.length;
      genres = [...genres.slice(rot), ...genres.slice(0, rot)];
    }
    if (band === "unhinged" && genres.length < 3) {
      const extra = pickFaithfulAccent(rng, GENRES, locked, genres, "unhinged", parsed.bpm);
      if (extra) genres.push(extra.name);
    } else if (genres.length === 1) {
      const extra = pickFaithfulAccent(rng, GENRES, locked, genres, "tame", parsed.bpm);
      if (extra) genres.push(extra.name);
    }
    return genres.slice(0, 3);
  }

  if (band === "tame" && parsed.profileEnabled && rng() > 0.28) {
    const formula =
      PROFILE.hybridFormulas[
        Math.floor(rng() * PROFILE.hybridFormulas.length) % PROFILE.hybridFormulas.length
      ];
    const out = [formula.primary, formula.secondary, formula.accent]
      .filter((n): n is string => Boolean(n))
      .filter((n) => !namedBpmConflict(n, parsed.bpm));
    if (out.length >= 2 && rng() > 0.55) {
      const cousin = pickFaithfulAccent(rng, GENRES, out.slice(0, 2), out, band, parsed.bpm);
      if (cousin) out[2] = cousin.name;
    }
    if (out.length) return out.slice(0, 3);
  }

  const primary = pickByBand(rng, band, GENRES, [], []);
  const secondary = pickByBand(rng, band, GENRES, [primary.name], [primary.name]);
  const accent = pickByBand(
    rng,
    band,
    GENRES,
    [primary.name, secondary.name],
    [primary.name, secondary.name]
  );
  return [primary.name, secondary.name, accent.name];
}

function lockedBassFamily(hints: string[]): string | undefined {
  const h = hints.join(" ").toLowerCase();
  if (/reese/.test(h)) return "reese";
  if (/wobble|wub/.test(h)) return "wub";
  if (/growl/.test(h)) return "growl";
  if (/neuro/.test(h)) return "neuro";
  if (/808/.test(h)) return "808";
  return undefined;
}

function buildAnchors(parsed: ParsedInput, bpm: number): string[] {
  const anchors: string[] = [];
  if (parsed.bpm != null) anchors.push(`${bpm} BPM`);
  for (const g of parsed.genres) anchors.push(g);
  for (const h of parsed.grooveHints) anchors.push(h);
  for (const h of parsed.bassHints) anchors.push(h);
  for (const h of parsed.drumHints) anchors.push(h);
  for (const h of parsed.soundDesignHints) anchors.push(h);
  for (const h of parsed.instruments.slice(0, 4)) anchors.push(h);
  for (const m of parsed.moods.slice(0, 3)) anchors.push(m);
  if (parsed.key) anchors.push(parsed.key);
  if (parsed.instrumental) anchors.push("instrumental");
  if (parsed.vocals?.presentation) anchors.push(`${parsed.vocals.presentation} vocals`);
  if (parsed.vocals?.register) anchors.push(parsed.vocals.register);
  if (parsed.vocals?.style === "talk-rap") anchors.push("talk-rap");
  else if (parsed.vocals?.style === "melodic-rap") anchors.push("sung-rap");
  else if (parsed.vocals?.style === "rap") anchors.push("rap");
  else if (parsed.vocals?.style === "sung") anchors.push("sung");
  if (parsed.vocals?.language) anchors.push(parsed.vocals.language);
  return [...new Set(anchors)];
}

function pickTitle(
  bank: string[],
  mood: string,
  families: string[],
  rng: () => number,
  rank: number,
  seed: number
): string {
  const fromLex = pickTitleLex(
    rng,
    families,
    /high energy|energetic|hype/.test(mood) ? "kinetic" : mood
  );
  const moodKey = /high energy|energetic|hype/.test(mood) ? "kinetic" : mood;
  const combined = [
    ...bank,
    fromLex,
    ...(TITLES[moodKey] ?? []),
    ...families.flatMap((f) => TITLES[f] ?? []),
    ...(TITLES.general ?? []),
  ].filter((x): x is string => typeof x === "string" && x.trim().length > 0);
  const len = combined.length || 1;
  const idx = Math.abs(seed + rank * 17 + Math.floor(rng() * len)) % len;
  let phrase = combined[idx] ?? "Modern Bass Hybrid";
  const words = phrase.split(/\s+/);
  if (words.length > 6) phrase = words.slice(0, 6).join(" ");
  return phrase;
}

function buildGroove(
  families: string[],
  family: string,
  parsed: ParsedInput,
  rng: () => number
): string[] {
  const g = [...parsed.grooveHints];
  const keys = [...families];
  if (family === "ukg" && !keys.includes("garage")) keys.push("garage");
  if (family === "trap" && !keys.includes("trap")) keys.push("trap");
  if (family === "baile" && !keys.includes("baile")) keys.push("baile");
  if (family === "ritual" && !keys.includes("cinematic")) keys.push("cinematic");
  g.push(...pickFamily(rng, GROOVE, keys, 3));
  g.push(...pickFamily(rng, DNA_GROOVE, keys, 1));
  if (parsed.moods.some((m) => /kinetic|energetic|high energy|hype/.test(m))) {
    g.push(oneFamily(rng, GROOVE, ["future", "trap", "general"]));
  }
  return unique(g).slice(0, 4);
}

function buildDrums(families: string[], parsed: ParsedInput, rng: () => number): string[] {
  const d = [...parsed.drumHints];
  d.push(...pickFamily(rng, DRUMS, families, 3 + Math.floor(rng() * 2)));
  return unique(d).slice(0, 5);
}

function buildBass(
  family: string,
  families: string[],
  parsed: ParsedInput,
  rng: () => number
): { bass: string[]; bassBehavior: string[] } {
  const bass = [...parsed.bassHints];
  const behavior: string[] = [];
  const userBass = parsed.bassHints.length > 0;

  if (
    !userBass &&
    families.includes("soul") &&
    !families.includes("trap") &&
    !families.includes("bass")
  ) {
    bass.push("round electric bass");
    behavior.push(
      pick(rng, [
        "conversational bass movement around the chords",
        "warm low-end support under sparse chords",
        "melodic bass answers to the vocal phrases",
      ])
    );
    return { bass: unique(bass).slice(0, 4), bassBehavior: unique(behavior).slice(0, 3) };
  }

  if (userBass) bass.push("deep mono sub");
  else bass.unshift("deep mono sub");

  const toneBank = BASS_TONES[family] ?? BASS_TONES["808"];
  const moveBank = BASS_MOVES[family] ?? BASS_MOVES["808"];
  bass.push(pick(rng, [...toneBank]));
  behavior.push(pick(rng, [...moveBank]));

  if (rng() > 0.4) behavior.push(...pickFamily(rng, DNA_BASS, families, 1));
  if (rng() > 0.4 && !userBass) {
    const others = Object.keys(BASS_TONES).filter((f) => f !== family);
    const extra = pick(rng, others);
    if (rng() > 0.3) bass.push(pick(rng, [...BASS_TONES[extra]]));
    if (rng() > 0.35) behavior.push(pick(rng, [...BASS_MOVES[extra]]));
  }
  if (!userBass && families.includes("bass") && family !== "wub" && rng() > 0.45) {
    bass.push(pick(rng, [...BASS_TONES.wub]));
  }
  if (!userBass && families.includes("trap") && family !== "808" && rng() > 0.45) {
    bass.push(pick(rng, [...BASS_TONES["808"]]));
  }
  if (!userBass && families.includes("future") && rng() > 0.5) {
    bass.push(pick(rng, [...BASS_TONES.reese]));
  }
  if (behavior.length === 0) behavior.push("sustained sub pressure under moving mid-bass");
  return { bass: unique(bass).slice(0, 4), bassBehavior: unique(behavior).slice(0, 3) };
}

function buildHarmony(
  families: string[],
  mood: string,
  parsed: ParsedInput,
  rng: () => number
): string[] {
  const h: string[] = [];
  if (parsed.key) h.push(`${parsed.key} tonal center`);
  h.push(...pickFamily(rng, HARMONY, families, 2));
  if (rng() > 0.4) h.push(...pickFamily(rng, DNA_HARMONY, families, 1));
  if (["dark", "ominous", "melancholic", "menacing", "nocturnal", "aggressive"].includes(mood)) {
    h.push(oneFamily(rng, HARMONY, ["trap", "general"]));
  }
  return unique(h).slice(0, 3);
}

function buildMelody(
  families: string[],
  _mood: string,
  parsed: ParsedInput,
  rng: () => number
): string[] {
  if (parsed.instruments.some((i) => /guitar/i.test(i))) {
    return [pick(rng, ["sparse clean electric guitar motifs", "melodic guitar answers"])];
  }
  return pickFamily(rng, MELODY, families, 1);
}

function buildSoundDesign(
  families: string[],
  mood: string,
  parsed: ParsedInput,
  rng: () => number
): string[] {
  const s = [...parsed.soundDesignHints];
  const keys = [...families];
  if (/cinematic|ritual/.test(mood)) keys.push("cinematic");
  s.push(...pickFamily(rng, SOUND_DESIGN, keys, 2 + Math.floor(rng() * 2)));
  if (rng() > 0.45) s.push(...pickFamily(rng, DNA_PALETTE, keys, 1));
  if (rng() > 0.7) s.push(pick(rng, [...DNA_FX]));
  if (families.includes("trap") && families.includes("future") && rng() > 0.55) {
    s.push(DNA_HYBRID["trap future-bass"]);
  } else if (families.includes("trap") && families.includes("cinematic") && rng() > 0.55) {
    s.push(DNA_HYBRID["cinematic trap"]);
  } else if (families.includes("soul") && families.includes("cinematic") && rng() > 0.55) {
    s.push(DNA_HYBRID["r&b cinematic"]);
  }
  return unique(s).slice(0, 4);
}

function buildArrangement(energy: string, parsed: ParsedInput, rng: () => number): string[] {
  const a = [...parsed.arrangementHints];
  a.push(...pickArc(rng, energy));
  if (rng() > 0.4) a.push(pick(rng, [...DNA_ARRANGE]));
  if (rng() > 0.7) a.push(pick(rng, [...DNA_HOOK]));
  return unique(a).slice(0, 4);
}

function buildMix(parsed: ParsedInput, rng: () => number): string[] {
  const m = [...parsed.mixHints];
  m.push("centered mono low end", "wide harmonic upper field");
  const extras = [...MIX].sort(() => rng() - 0.5).slice(0, 3);
  m.push(...extras);
  if (rng() > 0.5) m.push(pick(rng, [...DNA_MIX]));
  return unique(m).slice(0, 5);
}

function buildMaster(energy: string, rng: () => number): string[] {
  const bank = MASTER[energy] ?? MASTER.balanced;
  return [pick(rng, [...(bank ?? MASTER.balanced)])];
}

function buildVocals(
  parsed: ParsedInput,
  rank: number,
  rng: () => number,
  attempt: number = 0,
  families: string[] = ["general"]
): VocalPreferences {
  if (parsed.instrumental) return { present: false };
  if (parsed.vocals?.present === false) return { present: false };

  const explicit = parsed.vocals;
  const genderLocked = explicit?.presentation != null;
  const styleLocked = explicit?.style != null;
  const mentioned =
    explicit?.present === true ||
    genderLocked ||
    styleLocked ||
    /\bvocal|sung|singing|singer|rap|alto|tenor|baritone|soprano|mezzo\b/i.test(parsed.raw);

  if (!mentioned && (rank + attempt) % 8 === 7) {
    return { present: false };
  }

  const genderCycle: ("female" | "male")[] = ["female", "male", "female", "male"];
  let presentation =
    explicit?.presentation ??
    genderCycle[(rank + Math.floor(rng() * 2) + attempt) % genderCycle.length];
  if (!genderLocked && rank === 0 && parsed.profileEnabled && rng() > 0.55) {
    presentation = "female";
  }

  const styleCycle: ("sung" | "rap" | "melodic-rap" | "talk-rap")[] = [
    "sung",
    "rap",
    "melodic-rap",
    "talk-rap",
    "sung",
    "melodic-rap",
  ];
  let style = explicit?.style;
  if (!style) {
    if (parsed.genres.some((g) => /Melodic Rap|Emotional Rap/i.test(g))) {
      style = pick(rng, ["melodic-rap", "sung", "talk-rap"]);
    } else if (parsed.genres.some((g) => /Drill/i.test(g))) {
      style = pick(rng, ["rap", "talk-rap", "melodic-rap"]);
    } else if (parsed.genres.some((g) => /Soul|R&B/i.test(g))) {
      style = pick(rng, ["sung", "sung", "melodic-rap"]);
    } else {
      style = styleCycle[(rank + attempt + Math.floor(rng() * 3)) % styleCycle.length];
    }
  }

  const pairPhrase = pickVocalPhrase(rng, presentation, style, families);

  return {
    present: true,
    presentation,
    register:
      explicit?.register ??
      (presentation === "female"
        ? pick(rng, [...VOCAL_REGISTER.female])
        : pick(rng, [...VOCAL_REGISTER.male])),
    timbre:
      explicit?.timbre ??
      (presentation === "female"
        ? pick(rng, [...VOCAL_TIMBRE.female])
        : pick(rng, [...VOCAL_TIMBRE.male])),
    delivery: explicit?.delivery ?? pairPhrase,
    style,
    language: explicit?.language,
    processing: explicit?.processing ?? pickNProc(rng, style),
  };
}

function pickNProc(rng: () => number, style?: string): string[] {
  const source = style === "rap" || style === "talk-rap" ? VOCAL_PROC_RAP : VOCAL_PROC;
  const copy = [...source];
  const n = 2;
  const out: string[] = [];
  while (out.length < n && copy.length) {
    const i = Math.floor(rng() * copy.length) % copy.length;
    out.push(copy.splice(i, 1)[0]);
  }
  return out;
}

function selectInstruments(
  bass: string[],
  _drums: string[],
  _harmony: string[],
  melody: string[],
  soundDesign: string[],
  vocals: VocalPreferences,
  parsed: ParsedInput,
  families: string[],
  rng: () => number
): string[] {
  const inst: string[] = [];
  if (families.includes("soul") && !families.includes("trap")) {
    inst.push(
      "Rhodes electric piano",
      "clean jazz guitar",
      "electric bass",
      "soft drum kit",
      "shaker",
      "muted synth pad"
    );
  } else {
    inst.push("deep sub bass");
    if (bass.some((b) => /wub|wobble/i.test(b))) inst.push("modulated wobble bass");
    if (bass.some((b) => /reese/i.test(b))) inst.push("Reese mid-bass");
    if (bass.some((b) => /808/i.test(b))) inst.push("sliding 808");
    inst.push("punchy electronic drums");
    inst.push(
      ...pickFamily(
        rng,
        {
          trap: ["trap hat engine"],
          future: ["supersaw chord stacks", "sidechained pads"],
          general: ["atmospheric pads"],
        },
        families,
        2
      )
    );
    if (
      melody.some((m) => /guitar/i.test(m)) ||
      parsed.instruments.some((i) => /guitar/i.test(i))
    ) {
      inst.push("clean electric guitar");
    } else if (rng() > 0.55) {
      inst.push(
        oneFamily(
          rng,
          {
            future: ["pluck motifs", "bell-like leads"],
            trap: ["cold pluck hooks"],
            general: ["short synth hooks"],
          },
          families
        )
      );
    }
    if (soundDesign.some((s) => /drone/i.test(s))) inst.push("dark drones");
    if (soundDesign.some((s) => /impact|riser/i.test(s))) inst.push("cinematic impacts");
    if (families.includes("baile")) inst.push("baile percussion kit");
    if (families.includes("drill")) inst.push(pick(rng, ["dark melodic guitar", "sliding 808"]));
    if (families.includes("phonk")) inst.push("phonk cowbell");
    if (families.includes("garage")) inst.push("skippy garage percussion");
    if (families.includes("ritual")) inst.push("ceremonial hand drums");
  }

  if (vocals.present) {
    const who =
      vocals.presentation === "female"
        ? pick(rng, [...VOCAL_INST.female])
        : vocals.presentation === "male"
        ? pick(rng, [...VOCAL_INST.male])
        : pick(rng, [...VOCAL_INST.lead]);
    inst.push(who);
    if (vocals.processing?.some((p) => /chop/i.test(p))) inst.push("vocal chops");
  }

  for (const p of parsed.instruments) {
    if (!inst.some((i) => i.toLowerCase().includes(p.toLowerCase().slice(0, 6)))) {
      inst.push(p);
    }
  }

  return unique(inst).slice(0, 9);
}

function shufflePick<T>(rng: () => number, arr: T[]): T[] {
  return [...arr].sort(() => rng() - 0.5);
}

function unique(arr: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const a of arr) {
    const k = a.toLowerCase();
    if (!seen.has(k)) {
      seen.add(k);
      out.push(a);
    }
  }
  return out;
}

function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}
