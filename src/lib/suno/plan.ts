import { bpmNotes, checkBlendBpm, dedupeByConcept, reconcileMoods } from "./blend.ts";
import { namedBpmConflict, pickByBand, pickFaithfulAccent } from "./genre-atlas.ts";
import {
  ARRANGEMENT,
  BASS_MOVES,
  BASS_TONES,
  DRUMS,
  FAMILY_ARRANGEMENT,
  FAMILY_MASTER,
  FAMILY_MIX,
  FAMILY_MOODS,
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
import {
  allowedBassFamilies,
  briefAsksForGarage,
  familyKeys,
  fitsFamilies,
  hasDrops,
  isGarageGenre,
  needsSubLayer,
} from "./families.ts";
import { pickVocalParts } from "./lexicon-vocals.ts";
import { VARIANT_PRESETS, VariantPreset } from "./presets.ts";
import { expandMood, GENRES, matchGenre } from "./ontology.ts";
import { PROFILE } from "./profile.ts";
import { mulberry32, pick } from "./rng.ts";
import { ParsedInput, SonicPlan, VocalPreferences } from "./types.ts";

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
  const rngSeed = seed >>> 0;
  const rng = mulberry32(rngSeed);
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
    const pool = briefAsksForGarage(parsed.raw, parsed.genres) ? GENRES : GENRES.filter((g) => !isGarageGenre(g.name));
    const p = pickByBand(rng, parsed.blendBand ?? "tame", pool, [], []);
    const s = pickByBand(rng, parsed.blendBand ?? "tame", pool, [p.name], [p.name]);
    const a = pickByBand(rng, parsed.blendBand ?? "tame", pool, [p.name, s.name], [p.name, s.name]);
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
    // Blended genres with different home tempos meet in the middle, weighted toward the primary.
    if (secondaryGenre && !families.includes("ukg")) {
      bpm = checkBlendBpm([primaryGenre, secondaryGenre, accentGenre].filter((g): g is string => Boolean(g)), undefined).compromise;
    }
    // UKG is a 140 BPM style, so every UKG variation keeps 140 unless the brief names a tempo.
    if (rank > 0 && !familyKeys([primaryGenre]).includes("ukg")) {
      const deltas = [0, 2, -2, 4, -4, 6];
      bpm = clamp(bpm + (deltas[(rank + Math.floor(rng() * 3)) % deltas.length] ?? 0), 70, 180);
    }
  }

  // Moods: the brief's own, else the hybrid bass profile's (bass-music plans only), else the genre's.
  const familyMoods = [...new Set(families.flatMap((f) => FAMILY_MOODS[f] ?? []))];
  const useProfileMoods = parsed.profileEnabled && (hasDrops(families) || familyMoods.length === 0);
  const moodPool =
    parsed.moods.length > 0
      ? parsed.moods
      : useProfileMoods
      ? shufflePick(rng, ["dark", "cinematic", "emotional", "nocturnal", "aggressive", "kinetic"])
      : familyMoods.length
      ? shufflePick(rng, familyMoods)
      : ["atmospheric"];
  // A brief's own moods are reconciled into one phrase, so "dark and aggressive" and "emotional" read as
  // "dark and aggressive with an emotional edge" instead of two competing moods.
  const reconciled = parsed.moods.length ? reconcileMoods(parsed.moods) : undefined;
  const moodPrimary = reconciled?.primary ?? moodPool[Math.floor(rng() * moodPool.length) % moodPool.length];
  const moodSecondary = reconciled
    ? reconciled.secondary
    : rng() > 0.5
    ? moodPool.find((m) => m !== moodPrimary)
    : undefined;

  const atmosphere = [...parsed.atmospheres, ...expandMood(moodPrimary).slice(0, 1)];
  if (atmosphere.length === 0) {
    atmosphere.push(pick(rng, useProfileMoods ? ["nocturnal", "club", "underground"] : ["spacious", "warm", "intimate"]));
  }
  if (parsed.atmospheres.includes("ritual") || parsed.moods.includes("ritualistic")) {
    atmosphere.unshift("ritualistic");
  }
  if (useProfileMoods && parsed.moods.length === 0 && parsed.atmospheres.length === 0 && rng() > 0.55) {
    atmosphere.push(pick(rng, ["cavernous", "neon", "industrial", "haze"]));
  }

  // Each genre has a home feel; only garage, Brazilian funk and trap rotate between idiomatic feels.
  // UKG dubstep stays half-time: its skip lives in the hat and shaker topline, not the kick pattern.
  const garageFeels = ["half-time", "2-step", "broken", "four-on-the-floor"];
  let metricFeel = primaryDef?.metricFeel ?? "half-time";
  if (families.includes("ukg") && !families.includes("garage")) {
    metricFeel = "half-time";
  } else if (families.includes("garage") || preset.rhythmFamily === "garage") {
    metricFeel = garageFeels[(rank + Math.floor(rng() * garageFeels.length)) % garageFeels.length];
  } else if (
    preset.rhythmFamily === "baile" ||
    primaryGenre === "Baile Funk" ||
    secondaryGenre === "Baile Funk"
  ) {
    metricFeel = rng() > 0.4 ? "broken" : "half-time";
  } else if (families.includes("trap") && !families.includes("soul")) {
    metricFeel = rng() > 0.35 ? "half-time" : "broken";
  }
  // Ambient music floats rather than grooves.
  if (families.includes("ambient") && !hasDrops(families)) metricFeel = "free";
  if (parsed.grooveHints.includes("half-time")) metricFeel = "half-time";
  else if (parsed.grooveHints.includes("2-step")) metricFeel = "2-step";
  else if (parsed.grooveHints.includes("four-on-the-floor")) metricFeel = "four-on-the-floor";
  else if (
    (parsed.grooveHints.includes("swung") || parsed.grooveHints.includes("syncopated")) &&
    !(families.includes("ukg") && !families.includes("garage"))
  ) {
    // In UKG ("UKG-Swung Drill"), swing and syncopation live in the hat topline over half-time drums.
    metricFeel = rng() > 0.5 ? "2-step" : "broken";
  }

  const lockedBass = lockedBassFamily(parsed.bassHints);
  const bassFamilies = allowedBassFamilies(families);
  const presetIndex = Math.max(0, bassFamilies.indexOf(preset.bassFamily));
  const bassFamily =
    lockedBass ??
    bassFamilies[(presetIndex + Math.floor(rng() * bassFamilies.length) + rank) % bassFamilies.length];

  const groove = buildGroove(families, preset.rhythmFamily, parsed, rng, metricFeel);
  const drums = buildDrums(families, parsed, rng);
  const { bass, bassBehavior } = buildBass(bassFamily, families, parsed, rng);
  const harmony = buildHarmony(families, moodPrimary, parsed, rng);
  const melody = buildMelody(families, moodPrimary, parsed, rng);
  const soundDesign = buildSoundDesign(families, moodPrimary, parsed, rng);
  const arrangement = buildArrangement(preset.energy, families, parsed, rng);
  const mix = buildMix(families, parsed, rng);
  const master = buildMaster(preset.energy, families, rng);
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
    key: parsed.key,
    primaryGenre,
    secondaryGenre,
    accentGenre,
    donors,
    moodPrimary,
    moodSecondary,
    moodPhrase: reconciled?.phrase,
    bpmNotes: bpmNotes([primaryGenre, secondaryGenre, accentGenre].filter((g): g is string => Boolean(g)), bpm),
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
    seed: rngSeed,
  };
}

function rhythmDonor(family: string, primary: string, secondary?: string): string {
  if (family === "garage" || secondary === "UK Garage" || primary === "UK Garage") return "UK Garage";
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
  if (families.includes("garage")) want.add("garage");
  if (families.includes("ukg")) {
    want.add("trap");
    want.add("half-time");
  }
  if (families.includes("drill")) want.add("drill");
  if (families.includes("baile")) want.add("baile");
  if (families.includes("cinematic") || families.includes("ritual")) want.add("ritual");
  if (families.includes("riddim") || families.includes("bass")) want.add("half-time");
  if (["soul", "gospel", "pop", "folk"].some((f) => families.includes(f)) || (families.includes("rap") && !families.includes("trap"))) {
    want.add("song");
  }
  if (families.includes("house") || families.includes("breaks")) want.add("club");
  if (["afro", "latin", "dancehall"].some((f) => families.includes(f))) want.add("world");
  if (families.includes("ambient")) want.add("ambient");

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
  // UK garage only appears when the brief asks for it ("UK garage", "garage", "2-step").
  const garageOk = briefAsksForGarage(parsed.raw, parsed.genres);
  const allowed = (g: { name: string }) => garageOk || !isGarageGenre(g.name);
  const pool = GENRES.filter(allowed);

  if (locked.length > 0 && !wantsVariety) {
    let genres = [...locked];
    // The first-named genre is the primary in every variation; only the supporting genres trade places.
    if (genres.length >= 3 && rank > 0) {
      const rest = genres.slice(1);
      const rot = (rank + attempt) % rest.length;
      genres = [genres[0], ...rest.slice(rot), ...rest.slice(0, rot)];
    }
    if (band === "unhinged" && genres.length < 3) {
      const extra = pickFaithfulAccent(rng, pool, locked, genres, "unhinged", parsed.bpm, allowed);
      if (extra) genres.push(extra.name);
    } else if (genres.length === 1) {
      // The accent must share the brief's drop-or-song character: an ambient brief gets no bass-music accent.
      const lockedFamilies = familyKeys(locked);
      const lockedHasDrops = hasDrops(lockedFamilies);
      // UKG and UK garage never stand in for each other, and a UKG brief keeps its trap drums and
      // sub pressure: its accent may add trap but not wobble, riddim or other bass-music families.
      const sameCharacter = (g: { name: string }) => {
        if (!allowed(g)) return false;
        const families = familyKeys([g.name]);
        if (hasDrops(families) !== lockedHasDrops) return false;
        if (lockedFamilies.includes("ukg")) {
          return families.every((f) => f === "ukg" || f === "trap" || lockedFamilies.includes(f));
        }
        return !(lockedFamilies.includes("garage") && families.includes("ukg"));
      };
      const extra = pickFaithfulAccent(rng, pool, locked, genres, "tame", parsed.bpm, sameCharacter);
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
      .filter((n) => !namedBpmConflict(n, parsed.bpm) && allowed({ name: n }));
    if (out.length >= 2 && rng() > 0.55) {
      const cousin = pickFaithfulAccent(rng, pool, out.slice(0, 2), out, band, parsed.bpm, allowed);
      if (cousin) out[2] = cousin.name;
    }
    if (out.length) return out.slice(0, 3);
  }

  const primary = pickByBand(rng, band, pool, [], []);
  const secondary = pickByBand(rng, band, pool, [primary.name], [primary.name]);
  const accent = pickByBand(
    rng,
    band,
    pool,
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
  // Only the moods the reconciled phrase keeps are anchors; a dropped contradiction is not a requirement.
  const mood = reconcileMoods(parsed.moods);
  for (const m of parsed.moods) if (mood && new RegExp(`\\b${m}\\b`, "i").test(mood.phrase)) anchors.push(m);
  if (parsed.key) anchors.push(parsed.key);
  if (parsed.instrumental) anchors.push("instrumental");
  if (parsed.vocals?.presentation) {
    if (
      parsed.vocals?.style === "rap" ||
      parsed.vocals?.style === "talk-rap" ||
      parsed.vocals?.style === "melodic-rap" ||
      parsed.vocals?.style === "mumble-rap" ||
      parsed.vocals?.style === "autotuned-rap" ||
      parsed.vocals?.style === "lyrical-rap"
    ) {
      anchors.push(`${parsed.vocals.presentation} rap flow`);
    } else {
      anchors.push(`${parsed.vocals.presentation} vocals`);
    }
  }
  if (parsed.vocals?.register) anchors.push(parsed.vocals.register);
  if (parsed.vocals?.style === "talk-rap") anchors.push("talk-rap");
  else if (parsed.vocals?.style === "melodic-rap") anchors.push("melodic-rap");
  else if (parsed.vocals?.style === "mumble-rap") anchors.push("mumble-rap");
  else if (parsed.vocals?.style === "autotuned-rap") anchors.push("autotuned-rap");
  else if (parsed.vocals?.style === "lyrical-rap") anchors.push("lyrical-rap");
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
  ].filter((x): x is string => typeof x === "string" && x.trim().length > 0 && fitsFamilies(x, families));
  const len = combined.length || 1;
  const idx = Math.abs(seed + rank * 17 + Math.floor(rng() * len)) % len;
  let phrase = combined[idx] ?? "Modern Bass Hybrid";
  const words = phrase.split(/\s+/);
  if (words.length > 6) phrase = words.slice(0, 6).join(" ");
  return phrase;
}

/** Bare groove adjectives from the brief ("swung") become phrases that read as part of a sentence. */
const GROOVE_HINT_PHRASES: Record<string, string> = {
  swung: "swung groove",
  syncopated: "syncopated accents",
  "head-nod": "head-nod pocket",
};

function buildGroove(
  families: string[],
  family: string,
  parsed: ParsedInput,
  rng: () => number,
  metricFeel: string
): string[] {
  // The metric feel (half-time, 2-step, four-on-the-floor) is already named by the drum sentence's feel phrase.
  const g = parsed.grooveHints
    .filter((h) => h !== metricFeel)
    .map((h) => GROOVE_HINT_PHRASES[h] ?? h);
  const keys = [...families];
  if (family === "garage" && !keys.includes("garage") && !keys.includes("ukg")) keys.push("garage");
  if (family === "trap" && !keys.includes("trap")) keys.push("trap");
  if (family === "baile" && !keys.includes("baile")) keys.push("baile");
  if (family === "ritual" && !keys.includes("cinematic")) keys.push("cinematic");
  g.push(...pickFamily(rng, GROOVE, keys, 3));
  g.push(...pickFamily(rng, DNA_GROOVE, keys, 1));
  if (parsed.moods.some((m) => /kinetic|energetic|high energy|hype/.test(m))) {
    g.push(oneFamily(rng, GROOVE, families));
  }
  return dedupeByConcept(unique(g)).slice(0, 4);
}

/** UKG's defining layer: every UKG prompt names its skippy hi-hat and shaker topline. */
const UKG_TOPLINE = /skipp|shuffl|syncopated/i;

function buildDrums(families: string[], parsed: ParsedInput, rng: () => number): string[] {
  const d = [...parsed.drumHints];
  d.push(...pickFamily(rng, DRUMS, families, 5 + Math.floor(rng() * 2)));
  if (families.includes("ukg") && !d.some((x) => UKG_TOPLINE.test(x))) {
    d.splice(parsed.drumHints.length, 0, pick(rng, DRUMS.ukg.filter((x) => UKG_TOPLINE.test(x))));
  }
  // Synonymous drum parts ("sharp snares" beside "accelerating snare rolls") collapse to the first named.
  return dedupeByConcept(unique(d)).slice(0, 5);
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

  const fits = (x: string) => fitsFamilies(x, families);
  const fitting = (bank: string[]) => (bank.filter(fits).length ? bank.filter(fits) : bank);
  const tone = pick(rng, fitting(BASS_TONES[family] ?? BASS_TONES["808"]));
  if (needsSubLayer(family) && !/\bsub\b/i.test(tone)) {
    if (userBass) bass.push("deep mono sub");
    else bass.unshift("deep mono sub");
  }
  bass.push(tone);
  behavior.push(pick(rng, fitting(BASS_MOVES[family] ?? BASS_MOVES["808"])));

  const hasBassDna = families.some((f) => DNA_BASS[f]);
  if (hasBassDna && rng() > 0.4) behavior.push(...pickFamily(rng, DNA_BASS, families, 1));

  // A second bass color, only from families this plan actually contains.
  const otherFamilies = allowedBassFamilies(families).filter((f) => f !== family);
  if (!userBass && otherFamilies.length && rng() > 0.4) {
    const extra = pick(rng, otherFamilies);
    if (rng() > 0.3) bass.push(pick(rng, fitting(BASS_TONES[extra])));
    if (rng() > 0.35) behavior.push(pick(rng, fitting(BASS_MOVES[extra])));
  }
  if (behavior.length === 0) behavior.push("sustained low end under the moving parts");
  // 808, "sliding 808" and "portamento bass slides" are one sound; a mono sub is named once.
  const seenBass = new Set<string>();
  const bassOut = dedupeByConcept(unique(bass), seenBass).slice(0, 3);
  // The first movement is always kept; later ones must add something the bass line has not said.
  const [firstMove, ...laterMoves] = unique(behavior);
  const behaviorOut = [firstMove, ...dedupeByConcept(laterMoves, new Set(seenBass))].filter(Boolean).slice(0, 3);
  return { bass: bassOut, bassBehavior: behaviorOut.length ? behaviorOut : ["sustained low end under the moving parts"] };
}

const DARK_HARMONY = /dark|minor|cold|shadow|eerie|tense|haunting|brooding|ominous|sinister/i;

/** The harmony bank narrowed to dark voicings, used when the mood is dark. */
const DARK_HARMONY_BANK: Record<string, string[]> = Object.fromEntries(
  Object.entries(HARMONY).map(([family, phrases]) => [family, phrases.filter((x) => DARK_HARMONY.test(x))])
);

function buildHarmony(
  families: string[],
  mood: string,
  parsed: ParsedInput,
  rng: () => number
): string[] {
  const isRap =
    parsed.vocals?.style === "rap" ||
    parsed.vocals?.style === "talk-rap" ||
    parsed.vocals?.style === "melodic-rap" ||
    parsed.vocals?.style === "sung-rap" ||
    parsed.vocals?.style === "sing-rap" ||
    parsed.vocals?.style === "mumble-rap" ||
    parsed.vocals?.style === "soundcloud-rap" ||
    parsed.vocals?.style === "autotuned-rap" ||
    parsed.vocals?.style === "lyrical-rap" ||
    families.includes("rap") ||
    families.includes("drill");

  const h: string[] = [...parsed.harmonyHints];
  if (parsed.key) h.push(`${parsed.key} tonal center`);
  // Rap harmony comes from rap, trap and drill banks only, so sung-chorus voicings stay out.
  const rapFamilies = ["rap", ...families.filter((f) => f === "trap" || f === "drill")];
  const harmFamilies = isRap ? rapFamilies : families;
  h.push(...pickFamily(rng, HARMONY, harmFamilies, 2));
  if (rng() > 0.4) {
    const raw = pickFamily(rng, DNA_HARMONY, harmFamilies, 1);
    const filtered = isRap
      ? raw.filter((x) => !/harmonies|soaring|stacked harmonies|soulful lifts/i.test(x))
      : raw;
    h.push(...(filtered.length ? filtered : ["minimal trap-key stabs"]));
  }
  if (["dark", "ominous", "melancholic", "menacing", "nocturnal", "aggressive"].includes(mood)) {
    h.push(oneFamily(rng, DARK_HARMONY_BANK, harmFamilies));
  }
  return unique(h).slice(0, 3);
}

function buildMelody(
  families: string[],
  _mood: string,
  parsed: ParsedInput,
  rng: () => number
): string[] {
  const isRap =
    parsed.vocals?.style === "rap" ||
    parsed.vocals?.style === "talk-rap" ||
    parsed.vocals?.style === "melodic-rap" ||
    parsed.vocals?.style === "sung-rap" ||
    parsed.vocals?.style === "sing-rap" ||
    parsed.vocals?.style === "mumble-rap" ||
    parsed.vocals?.style === "soundcloud-rap" ||
    parsed.vocals?.style === "autotuned-rap" ||
    parsed.vocals?.style === "lyrical-rap" ||
    families.includes("rap") ||
    families.includes("drill");

  // 1. If user explicitly specified instruments, honor them and vary their tone/texture
  if (parsed.explicitInstruments?.length) {
    if (parsed.explicitInstruments.includes("guitar")) {
      return [
        pick(rng, [
          "warm tape-saturated electric guitar motifs",
          "sparse clean electric guitar answers",
          "ambient reverb-drenched guitar swells",
          "delicate fingerpicked guitar phrases",
          "rhythmic muted electric guitar riffs",
        ]),
      ];
    }
    if (parsed.explicitInstruments.includes("Rhodes electric piano")) {
      return [
        pick(rng, [
          "warm Rhodes electric piano motifs",
          "tape-saturated Rhodes chord melodies",
          "ambient chorus-modulated Rhodes lines",
          "sparse neo-soul Rhodes phrases",
        ]),
      ];
    }
    if (parsed.explicitInstruments.includes("chopped sample")) {
      return [
        pick(rng, [
          "MPC-style chopped soul-sample stabs",
          "pitched sample fragments with short retriggers",
          "filtered sample-loop hook fragments",
          "resampled vocal and soul chops with raw sampler edges",
          "finger-played sample slices with compact phrase tails",
        ]),
      ];
    }
    if (parsed.explicitInstruments.includes("piano")) {
      return [
        pick(rng, [
          "intimate felt-piano melodic answers",
          "sparse acoustic piano motifs",
          "reverb-drenched piano hook fragments",
          "warm dynamic piano phrasing",
        ]),
      ];
    }
    if (parsed.explicitInstruments.includes("synth") || parsed.explicitInstruments.includes("synth plucks")) {
      return [
        pick(rng, [
          "delicate synth pluck hooks",
          "shimmering analog synth lead lines",
          "warm filtered synth bell motifs",
          "sine-wave melodic answers",
        ]),
      ];
    }
    if (parsed.explicitInstruments.includes("strings")) {
      return [
        pick(rng, [
          "cinematic legato string melodies",
          "warm bowed cello counterpoint",
          "expressive string section answers",
        ]),
      ];
    }
    if (parsed.explicitInstruments.includes("brass")) {
      return [
        pick(rng, [
          "muted trumpet melodic accents",
          "warm vintage brass melodies",
          "expressive horn counter-melodies",
        ]),
      ];
    }
    if (parsed.explicitInstruments.includes("flute")) {
      return [
        pick(rng, [
          "breathy wooden flute melodies",
          "reverb-washed bamboo flute motifs",
          "analog synth flute leads",
        ]),
      ];
    }
    if (parsed.explicitInstruments.includes("bells") || parsed.explicitInstruments.includes("mallets")) {
      return [
        pick(rng, [
          "crystalline synth bell cells",
          "resonant kalimba melodic motifs",
          "warm vibraphone melodic answers",
        ]),
      ];
    }
  }

  // 2. If user mentions "melodic" or no explicit instrument specified:
  // Never exclusively default to a single instrument! Draw dynamically from a genre-tailored diverse palette:
  const melodicPalette = isRap
    ? [
        "warm Rhodes electric piano motifs",
        "crystalline synth bell cells",
        "lush filtered keyboard melodies",
        "sparse neo-soul electric piano chords",
        "cold pluck hooks",
        "ambient filtered guitar swells",
        "delicate sine-wave lead melodies",
        "resonant kalimba melodic cells",
        "detuned tape synth phrases",
        "warm analog bell-lead motifs",
      ]
    : [
        "warm Rhodes electric piano motifs",
        "simple emotional lead motifs",
        "lush analog synth pad melodies",
        "crystalline bell-like leads",
        "sparse clean electric guitar motifs",
        "few-note hooks with strong contour",
        "lyrical intimate melodic phrases",
        "soft soulful keys",
        "ambient resonant mallets",
      ];

  return [pick(rng, melodicPalette)];
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
  if (rng() > 0.7) s.push(pick(rng, DNA_FX.filter((x) => fitsFamilies(x, families))));
  if (families.includes("trap") && families.includes("future") && rng() > 0.55) {
    s.push(DNA_HYBRID["trap future-bass"]);
  } else if (families.includes("trap") && families.includes("cinematic") && rng() > 0.55) {
    s.push(DNA_HYBRID["cinematic trap"]);
  } else if (families.includes("soul") && families.includes("cinematic") && rng() > 0.55) {
    s.push(DNA_HYBRID["r&b cinematic"]);
  }
  return dedupeByConcept(unique(s)).slice(0, 4);
}

function buildArrangement(energy: string, families: string[], parsed: ParsedInput, rng: () => number): string[] {
  const a = [...parsed.arrangementHints];
  a.push(...pickArc(rng, energy, families));
  const isRap =
    parsed.vocals?.style === "rap" ||
    parsed.vocals?.style === "talk-rap" ||
    parsed.vocals?.style === "melodic-rap" ||
    parsed.vocals?.style === "sung-rap" ||
    parsed.vocals?.style === "sing-rap" ||
    parsed.vocals?.style === "mumble-rap" ||
    parsed.vocals?.style === "soundcloud-rap" ||
    parsed.vocals?.style === "autotuned-rap" ||
    parsed.vocals?.style === "lyrical-rap" ||
    parsed.genres.some((g) => /rap|trap|drill|boom bap|hip hop/i.test(g));

  if (rng() > 0.4) {
    const raw = pick(rng, DNA_ARRANGE.filter((x) => fitsFamilies(x, families)));
    if (isRap && /harmonies|soaring|belt/i.test(raw)) {
      a.push("tight verse-to-chorus transition with rhythmic handoff and minimal trap motif");
    } else {
      a.push(raw);
    }
  }
  if (rng() > 0.7) {
    if (isRap) {
      const rapHooks = [
        "rhythmic chant hook with crowd shouts and 808 sub drops",
        "hypnotic hook repetition with pitch-bent autotuned ad-libs",
        "staccato punchline hook with wide stereo hype doubles",
        "catchy single-note synth hook locked dead-center in the 808 pocket",
        "earworm chanted refrain with layered ad-lib calls and unison doubles",
        "menacing drill slide hook with syncopated triplet pauses",
        "repetitive melodic trap sung-rap hook riding distorted 808 slides",
        "deadpan spoken hook with crisp punchline pauses and heavy bass answers",
      ];
      a.push(pick(rng, rapHooks.filter((x) => fitsFamilies(x, families))));
    } else {
      a.push(pick(rng, DNA_HOOK.filter((x) => fitsFamilies(x, families))));
    }
  }
  const familySafe = hasDrops(families)
    ? a
    : a.filter((x) => !/(?<!one-)\bdrops?\b|\bdrop-|(?<!one)-drop\b/i.test(x));
  return unique(familySafe).slice(0, 4);
}

function buildMix(families: string[], parsed: ParsedInput, rng: () => number): string[] {
  const m = [...parsed.mixHints];
  m.push("centered mono low end", "wide harmonic upper field");
  const familyMix = families.flatMap((f) => FAMILY_MIX[f] ?? []);
  if (familyMix.length) m.push(...[...familyMix].sort(() => rng() - 0.5).slice(0, 2));
  const fits = (x: string) => fitsFamilies(x, families);
  m.push(...MIX.filter(fits).sort(() => rng() - 0.5).slice(0, familyMix.length ? 1 : 3));
  if (rng() > 0.5) m.push(pick(rng, DNA_MIX.filter(fits)));
  return unique(m).slice(0, 5);
}

/** The family's own mastering language when it has some; otherwise the energy bank. */
function buildMaster(energy: string, families: string[], rng: () => number): string[] {
  const familyMasters = families.flatMap((f) => FAMILY_MASTER[f] ?? []);
  if (familyMasters.length) return [pick(rng, familyMasters)];
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

  const styleCycle: (
    | "sung"
    | "rap"
    | "melodic-rap"
    | "talk-rap"
    | "mumble-rap"
    | "autotuned-rap"
    | "lyrical-rap"
  )[] = [
    "sung",
    "rap",
    "melodic-rap",
    "talk-rap",
    "autotuned-rap",
    "lyrical-rap",
    "mumble-rap",
    "melodic-rap",
  ];
  const isRapFamily = families.some((f) => f === "rap" || f === "trap" || f === "drill" || f === "phonk");
  const asksForSinging =
    /\b(vocals?|singer|singing|sung|croon|belt|falsetto|choir|soprano|mezzo|alto|contralto|tenor|baritone)\b/i.test(
      parsed.raw
    ) &&
    !/\b(rap|rapper|rapping|bars|flow)\b/i.test(parsed.raw);

  let style = explicit?.style;
  if (!style) {
    if (/Soul|R&B/i.test(parsed.genres[0] ?? "")) {
      // The brief leads with R&B or soul and names no rap style: keep the lead sung.
      style = "sung";
    } else if (asksForSinging && isRapFamily) {
      // "female vocals" over trap reads as a sung topline far more often than a rap verse.
      style = pick(rng, ["sung", "sung", "melodic-rap"]);
    } else if (parsed.genres.some((g) => /Melodic Rap|Emotional Rap/i.test(g))) {
      style = pick(rng, ["melodic-rap", "autotuned-rap", "rap"]);
    } else if (parsed.genres.some((g) => /Drill/i.test(g))) {
      style = pick(rng, ["rap", "lyrical-rap", "talk-rap"]);
    } else if (parsed.genres.some((g) => /Trap/i.test(g))) {
      style = pick(rng, ["rap", "autotuned-rap", "mumble-rap", "melodic-rap", "talk-rap"]);
    } else if (parsed.genres.some((g) => /Hip-Hop|Boom Bap|Grime|UK Rap/i.test(g))) {
      style = pick(rng, ["lyrical-rap", "rap", "talk-rap"]);
    } else if (parsed.genres.some((g) => /Soul|R&B/i.test(g))) {
      style = pick(rng, ["sung", "sung", "melodic-rap"]);
    } else if (isRapFamily) {
      style = styleCycle[(rank + attempt + Math.floor(rng() * 3)) % styleCycle.length];
    } else {
      // House, pop, gospel, world and ambient leads are sung unless the brief asks for rap.
      style = "sung";
    }
  }

  const { phrase: pairPhrase, modifier: pairDetail } = pickVocalParts(rng, presentation, style, families);

  const roomNuances = [
    "centered punchy presence with close-mic intimacy",
    "spacious stereo imaging with airy high-end shimmer and subtle plate reflections",
    "intimate dry-lead placement with warm tape saturation and focused punch",
    "reverb-drenched atmospheric space with delicate delay throws",
    "tight acoustic staging with crisp articulation and stereo doubles",
    "front-and-center vocal authority with polished harmonic presence",
  ];
  const texture = roomNuances[(rank + attempt + Math.floor(rng() * 2)) % roomNuances.length];

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
    deliveryDetail: explicit?.delivery ? undefined : pairDetail,
    briefVoice:
      explicit?.timbre || explicit?.register
        ? [explicit.timbre, explicit.presentation ?? presentation, explicit.register].filter(Boolean).join(" ")
        : undefined,
    style,
    language: explicit?.language,
    processing: explicit?.processing ?? pickNProc(rng, style, families),
    processingFromBrief: explicit?.processing != null,
    rawDescription: explicit?.rawDescription,
    descriptors: explicit?.descriptors,
    textureVariations: [texture],
    detail: vocalDetail(explicit),
  };
}

/** Vocal traits the brief named itself; four or more earn the vocal a longer sentence. */
const DETAILED_VOCAL_TRAITS = 4;

function vocalDetail(explicit: VocalPreferences | undefined): "compact" | "detailed" {
  if (!explicit) return "compact";
  const traits = new Set(
    [
      explicit.register,
      explicit.timbre,
      explicit.delivery,
      explicit.language,
      ...(explicit.descriptors ?? []),
      ...(explicit.processing ?? []),
    ].filter((t): t is string => Boolean(t))
  );
  const words = explicit.rawDescription?.trim().split(/\s+/).length ?? 0;
  return traits.size >= DETAILED_VOCAL_TRAITS || words >= 10 ? "detailed" : "compact";
}

function pickNProc(rng: () => number, style: string | undefined, families: string[]): string[] {
  const isRap =
    style === "rap" ||
    style === "talk-rap" ||
    style === "melodic-rap" ||
    style === "sung-rap" ||
    style === "sing-rap" ||
    style === "mumble-rap" ||
    style === "soundcloud-rap" ||
    style === "autotuned-rap" ||
    style === "lyrical-rap";
  const source = isRap ? VOCAL_PROC_RAP : VOCAL_PROC;
  const copy = source.filter((x) => fitsFamilies(x, families));
  const n = 2;
  const out: string[] = [];
  while (out.length < n && copy.length) {
    const i = Math.floor(rng() * copy.length) % copy.length;
    out.push(copy.splice(i, 1)[0]);
  }
  return out;
}

const INSTRUMENT_TEXTURES: Record<string, string[]> = {
  guitar: [
    "clean electric guitar",
    "warm tape-saturated electric guitar",
    "ambient reverb-drenched guitar",
    "sparse fingerpicked acoustic guitar",
    "chorused neo-soul guitar chords",
    "muted electric guitar riffs",
  ],
  "Rhodes electric piano": [
    "warm Rhodes electric piano",
    "tape-saturated Rhodes electric piano",
    "ambient chorus-modulated Rhodes",
    "crystalline bell-like Rhodes keys",
    "filtered neo-soul Rhodes chords",
    "felt-treated vintage Rhodes",
  ],
  piano: [
    "intimate felt acoustic piano",
    "reverb-drenched grand piano",
    "sparse dynamic acoustic piano",
    "tape-warmed upright piano",
    "bright close-mic piano chords",
  ],
  "808 bass": [
    "sliding 808 sub bass",
    "saturated harmonic 808",
    "deep clean tuned 808",
    "punchy low-end 808 glide",
    "warm analog 808 foundation",
  ],
  synth: [
    "warm analog poly-synths",
    "shimmering detuned synthesizer",
    "filtered analog synth chords",
    "wide stereo synth leads",
  ],
  pads: [
    "lush atmospheric pads",
    "drifting ambient pads",
    "warm filtered analog pads",
    "reverb-washed harmonic pad bed",
  ],
  strings: [
    "expressive legato strings",
    "cinematic orchestral strings",
    "warm bowed cello and violin swells",
    "lush analog synth string bed",
  ],
  brass: [
    "warm vintage horn swells",
    "muted trumpet accents",
    "crisp brass stabs with tape delay",
    "expressive brass section",
  ],
  flute: [
    "breathy wooden flute melodies",
    "reverb-washed bamboo flute",
    "intimate acoustic flute lines",
  ],
  saxophone: [
    "smoky tenor saxophone phrases",
    "intimate close-mic saxophone",
    "warm soulful saxophone counterpoint",
  ],
  bells: [
    "crystalline synth bells",
    "short resonant bell cells",
    "ambient metallic bells",
  ],
  "synth plucks": [
    "cold synth plucks",
    "delicate sine-wave plucks",
    "analog filtered pluck hooks",
  ],
  mallets: [
    "resonant kalimba melodies",
    "warm vibraphone chords",
    "wooden marimba accents",
  ],
  harp: [
    "delicate acoustic harp glissandos",
    "ambient reverb-washed harp arpeggios",
  ],
  organ: [
    "warm Hammond B3 organ chords",
    "vintage rotary organ swells",
  ],
  "hand percussion": [
    "ceremonial hand percussion",
    "organic woodblock and shaker textures",
    "warm djembe and conga polyrhythms",
  ],
  "vocal chops": [
    "ambient pitched vocal chops",
    "stereo-panned vocal chops",
    "warm pitched vocal fragments",
  ],
};

/** Drum kits by family, in priority order; the first family the plan contains wins. */
const KIT_BY_FAMILY: [string, string[]][] = [
  ["rap", ["hard-hitting hip-hop drums"]],
  ["soul", ["soft drum kit", "organic shaker"]],
  ["gospel", ["live church drum kit", "tambourine"]],
  ["pop", ["tight pop drum kit", "handclaps"]],
  ["ukg", ["trap drum kit", "skippy hi-hat and shaker topline"]],
  ["garage", ["skippy garage percussion kit"]],
  ["baile", ["baile percussion kit"]],
  ["ritual", ["ceremonial hand percussion"]],
  ["house", ["909 drum machine", "shakers"]],
  ["breaks", ["chopped breakbeat kit"]],
  ["afro", ["congas and shakers", "talking drum"]],
  ["latin", ["dembow drum kit", "timbales"]],
  ["dancehall", ["riddim drum machine", "rimshots"]],
  ["ambient", ["soft hand percussion"]],
  ["cinematic", ["taiko drums", "orchestral timpani"]],
];

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
  const isRap =
    vocals.style === "rap" ||
    vocals.style === "talk-rap" ||
    vocals.style === "melodic-rap" ||
    vocals.style === "sung-rap" ||
    vocals.style === "sing-rap" ||
    vocals.style === "mumble-rap" ||
    vocals.style === "soundcloud-rap" ||
    vocals.style === "autotuned-rap" ||
    vocals.style === "lyrical-rap" ||
    families.includes("rap") ||
    families.includes("drill");

  const inst: string[] = [];

  // 1. If user specified explicit instruments, preserve ALL of them with varied textures
  if (parsed.explicitInstruments && parsed.explicitInstruments.length > 0) {
    for (const exp of parsed.explicitInstruments) {
      const textures = INSTRUMENT_TEXTURES[exp];
      if (textures && textures.length) {
        inst.push(pick(rng, textures));
      } else {
        inst.push(exp);
      }
    }
  }

  // 2. Add the bass instrument if the user did not name one
  if (!inst.some((i) => /808|sub|bass/i.test(i))) {
    const bassTone = bass.find((b) => b !== "deep mono sub");
    if (bass.some((b) => /808/i.test(b)) || families.includes("trap") || families.includes("drill")) {
      inst.push(pick(rng, ["sliding 808 sub bass", "deep tuned 808", "saturated 808 low end"]));
    } else if (bass.some((b) => /wub|wobble/i.test(b))) {
      inst.push("modulated wobble bass");
    } else if (bass.some((b) => /reese/i.test(b))) {
      inst.push("Reese mid-bass");
    } else {
      inst.push(bassTone ?? "deep sub bass");
    }
  }

  // 3. Add the drum kit that belongs to the genre
  if (!inst.some((i) => /drums?|percussion|kit|hats|taiko|timpani|congas|shakers/i.test(i))) {
    // Trap-family plans, and rap vocals over non-hip-hop genres, keep the trap kit.
    const usesTrapKit =
      !families.includes("ukg") &&
      (families.some((f) => f === "trap" || f === "drill" || f === "phonk") || (isRap && !families.includes("rap")));
    const familyKit = usesTrapKit ? undefined : KIT_BY_FAMILY.find(([family]) => families.includes(family));
    if (familyKit) {
      inst.push(...familyKit[1]);
    } else {
      inst.push(pick(rng, ["punchy electronic drums", "crisp trap drum kit", "tight rhythm kit"]));
      if (families.includes("trap") || isRap) inst.push("rapid trap hi-hats");
    }
  }

  // 4. If no explicit instruments were provided, complement with melodic & harmonic textures
  if (!parsed.explicitInstruments || parsed.explicitInstruments.length === 0) {
    // Add instrument matching melodic selection
    const mel = melody[0] ?? "";
    if (/rhodes/i.test(mel)) {
      inst.push(pick(rng, INSTRUMENT_TEXTURES["Rhodes electric piano"]));
    } else if (/piano/i.test(mel)) {
      inst.push(pick(rng, INSTRUMENT_TEXTURES["piano"]));
    } else if (/guitar/i.test(mel)) {
      inst.push(pick(rng, INSTRUMENT_TEXTURES["guitar"]));
    } else if (/bell/i.test(mel)) {
      inst.push(pick(rng, INSTRUMENT_TEXTURES["bells"]));
    } else if (/pluck/i.test(mel)) {
      inst.push(pick(rng, INSTRUMENT_TEXTURES["synth plucks"]));
    } else if (/kalimba|mallet/i.test(mel)) {
      inst.push(pick(rng, INSTRUMENT_TEXTURES["mallets"]));
    } else if (/pad/i.test(mel)) {
      inst.push(pick(rng, INSTRUMENT_TEXTURES["pads"]));
    } else {
      inst.push(
        pick(
          rng,
          isRap
            ? ["warm Rhodes electric piano", "crystalline synth bells", "lush filtered keyboard chords"]
            : ["atmospheric pads", "warm analog synths", "ambient keys"]
        )
      );
    }

    if (rng() > 0.4 && !inst.some((i) => /pad/i.test(i))) {
      inst.push("atmospheric pads");
    }
  }

  // 5. Sound design textures
  if (soundDesign.some((s) => /drone/i.test(s)) && !inst.some((i) => /drone/i.test(i))) {
    inst.push("dark drones");
  }
  if (soundDesign.some((s) => /impact|riser/i.test(s)) && !inst.some((i) => /impact/i.test(i))) {
    inst.push("cinematic impacts");
  }
  if (families.includes("phonk") && !inst.some((i) => /cowbell/i.test(i))) {
    inst.push("phonk cowbell");
  }

  // 6. Any other remaining user instruments from parsed.instruments
  for (const p of parsed.instruments) {
    if (!inst.some((i) => i.toLowerCase().includes(p.toLowerCase().slice(0, 5)))) {
      inst.push(p);
    }
  }

  // NOTICE: NO inst.push(who) — vocals are never added to the instrument list!
  return unique(inst).slice(0, 8);
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
