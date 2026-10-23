export interface VocalPair {
  archetype: string;
  male: string;
  female: string;
  styles: string[];
  families: string[];
}

export const VOCAL_PAIRS: VocalPair[] = [
  // RAPPER ARCHETYPES (MUMBLE, AUTOTUNED, LYRICAL, TALK-RAP, SUNG-RAP, DRILL, SOUTHERN TRAP, CHOPPER)
  { archetype: "mumble", male: "SoundCloud mumble male rap flow", female: "hypnotic female mumble rap delivery", styles: ["mumble-rap", "soundcloud-rap"], families: ["trap", "drill", "rap", "general"] },
  { archetype: "mumble", male: "slurred male trap rapper flow", female: "slurred female trap rap cadence", styles: ["mumble-rap", "soundcloud-rap"], families: ["trap", "rap"] },
  { archetype: "mumble", male: "spaced-out SoundCloud male cloud rapper", female: "lo-fi ethereal female mumble rapper", styles: ["mumble-rap", "soundcloud-rap"], families: ["trap", "rap", "general"] },
  { archetype: "mumble", male: "lazy-drawl SoundCloud male trap flow", female: "repetitive hypnotic female mumble flow", styles: ["mumble-rap", "soundcloud-rap"], families: ["trap", "rap"] },
  { archetype: "mumble", male: "heavy-bass riding male mumble rapper", female: "triplet-cadence female mumble trap flow", styles: ["mumble-rap", "soundcloud-rap"], families: ["trap", "rap", "drill"] },
  { archetype: "mumble", male: "high-register playful male mumble rapper", female: "animated high-energy female mumble rap lead", styles: ["mumble-rap", "soundcloud-rap"], families: ["trap", "rap"] },
  { archetype: "mumble", male: "druggy haze SoundCloud male trap delivery", female: "soft slurred female cloud rap flow", styles: ["mumble-rap", "soundcloud-rap"], families: ["trap", "rap", "phonk"] },

  { archetype: "autotuned", male: "hard-tuned melodic male trap rap", female: "pitch-snapped female autotuned rap", styles: ["rap", "autotuned-rap", "melodic-rap", "sung-rap"], families: ["trap", "future", "rap", "general"] },
  { archetype: "autotuned", male: "robotic autotuned male rapper", female: "futuristic autotuned female rap lead", styles: ["rap", "autotuned-rap"], families: ["trap", "rap", "future"] },
  { archetype: "autotuned", male: "metallic fast-retune male trap flow", female: "hyper-processed female autotuned cadence", styles: ["rap", "autotuned-rap"], families: ["trap", "rap", "future"] },
  { archetype: "autotuned", male: "dark atmospheric autotuned male lead", female: "saturated autotuned female trap vocalist", styles: ["rap", "autotuned-rap", "melodic-rap"], families: ["trap", "rap", "cinematic"] },
  { archetype: "autotuned", male: "pitch-corrected rage-trap male rapper", female: "high-octane autotuned female rage flow", styles: ["rap", "autotuned-rap"], families: ["trap", "rap"] },
  { archetype: "autotuned", male: "emotive autotuned male hook rapper", female: "piercing autotuned female rap cadence", styles: ["rap", "autotuned-rap", "sung-rap"], families: ["trap", "rap", "soul"] },
  { archetype: "autotuned", male: "relentless driving autotuned street flow", female: "laser-precise autotuned female rap topline", styles: ["rap", "autotuned-rap"], families: ["trap", "rap"] },

  { archetype: "melodic", male: "emotive autotuned male sung-rap", female: "catchy rhythmic female sung-rap", styles: ["rap", "melodic-rap", "sung-rap", "autotuned-rap"], families: ["trap", "future", "rap", "soul", "general"] },
  { archetype: "melodic", male: "smooth nocturnal male sung-rap", female: "infectious female sung-rap trap flow", styles: ["rap", "melodic-rap", "sung-rap"], families: ["trap", "soul", "rap", "general"] },
  { archetype: "melodic", male: "emotive heart-wrenching male sung-rap", female: "melodic emo-trap female sung-rap", styles: ["rap", "melodic-rap", "sung-rap", "autotuned-rap"], families: ["trap", "rap", "soul"] },
  { archetype: "melodic", male: "melodic trap male sing-rap delivery", female: "rhythmic female sing-rap hybrid", styles: ["rap", "melodic-rap", "sung-rap"], families: ["trap", "rap", "future"] },
  { archetype: "melodic", male: "bouncy Atlanta male sung-rap pocket", female: "silky Southern female sung-rap flow", styles: ["rap", "melodic-rap", "sung-rap"], families: ["trap", "rap"] },
  { archetype: "melodic", male: "bouncy dynamic pitched male rap flow", female: "melodic street female sung-rap", styles: ["rap", "melodic-rap", "sung-rap"], families: ["trap", "rap"] },
  { archetype: "melodic", male: "reverb-washed atmospheric male sung-rap", female: "hypnotic late-night female sung-rap cadence", styles: ["rap", "melodic-rap", "sung-rap", "autotuned-rap"], families: ["trap", "rap", "cinematic"] },

  { archetype: "lyrical", male: "bar-heavy technical male rapper", female: "razor-sharp lyrical female rap flow", styles: ["rap", "lyrical-rap"], families: ["rap", "drill", "trap", "general"] },
  { archetype: "lyrical", male: "fast-cadence male lyrical rapper", female: "breathless female chopper rap flow", styles: ["rap", "lyrical-rap"], families: ["rap", "drill", "general"] },
  { archetype: "lyrical", male: "dense multi-syllable male lyricist", female: "intricate rhyme-scheme female lyricist", styles: ["rap", "lyrical-rap"], families: ["rap", "trap", "general"] },
  { archetype: "lyrical", male: "boom-bap street poet male lyricist", female: "sharp-tongued underground female lyricist", styles: ["rap", "lyrical-rap"], families: ["rap", "general"] },
  { archetype: "lyrical", male: "complex breath-control male chopper rapper", female: "rapid-fire staccato female bar spitter", styles: ["rap", "lyrical-rap"], families: ["rap", "trap"] },
  { archetype: "lyrical", male: "gritty East Coast male bar-heavy rapper", female: "devastating punchline female lyrical MC", styles: ["rap", "lyrical-rap"], families: ["rap", "drill"] },
  { archetype: "lyrical", male: "raw gritty street male lyricist", female: "uncompromising technical female lyricist", styles: ["rap", "lyrical-rap"], families: ["rap", "general"] },

  { archetype: "talk", male: "deadpan conversational male talk-rap", female: "cool conversational female talk-rap", styles: ["rap", "talk-rap"], families: ["rap", "trap", "general"] },
  { archetype: "talk", male: "rhythmic spoken-word male rap flow", female: "unhurried spoken-cadence female rap", styles: ["rap", "talk-rap"], families: ["rap", "cinematic", "general"] },
  { archetype: "talk", male: "West Coast swagger male talk-rap cadence", female: "laid-back West Coast female talk-rap", styles: ["rap", "talk-rap"], families: ["rap", "trap", "general"] },
  { archetype: "talk", male: "Detroit-style offbeat male talk-rap", female: "punchline-heavy Michigan female talk-rap", styles: ["rap", "talk-rap"], families: ["rap", "trap"] },
  { archetype: "talk", male: "cynical street narrative male talk-rap", female: "monotone sharp-tongued female talk-rap", styles: ["rap", "talk-rap"], families: ["rap", "cinematic"] },
  { archetype: "talk", male: "whispered close-mic male talk-rap delivery", female: "intimate spoken-flow female talk-rap", styles: ["rap", "talk-rap"], families: ["rap", "general"] },

  { archetype: "drill", male: "menacing UK/NY male drill flow", female: "aggressive road-rap female drill flow", styles: ["rap", "drill", "lyrical-rap"], families: ["drill", "trap", "rap"] },
  { archetype: "drill", male: "sliding-808 male drill cadence", female: "frenetic syncopated female drill rapper", styles: ["rap", "drill"], families: ["drill", "trap"] },
  { archetype: "street", male: "gritty Southern male trap flow", female: "fierce high-energy female trap flow", styles: ["rap", "trap", "lyrical-rap"], families: ["trap", "drill", "rap"] },
  { archetype: "street", male: "Memphis phonk male rap delivery", female: "haunting Memphis female phonk flow", styles: ["rap", "phonk", "trap"], families: ["phonk", "trap", "rap"] },
  { archetype: "street", male: "Houston chopped male rap cadence", female: "syrupy chopped female trap flow", styles: ["rap", "trap"], families: ["trap", "rap"] },

  // SUNG ARCHETYPES (POWER, SMOOTH, RAW, MODERN, ANTHEMIC)
  { archetype: "power", male: "bold male baritone", female: "sultry female alto", styles: ["sung"], families: ["general", "soul"] },
  { archetype: "power", male: "powerful male tenor with rasp", female: "soaring female soprano with breathy edge", styles: ["sung"], families: ["future", "soul", "general"] },
  { archetype: "power", male: "commanding male baritone", female: "empowering female belt", styles: ["sung"], families: ["future", "soul", "general"] },
  { archetype: "power", male: "aggressive male rock shout", female: "fierce female rock belt", styles: ["sung"], families: ["general"] },
  // SMOOTH / SOULFUL
  { archetype: "smooth", male: "warm male crooner", female: "intimate female crooner", styles: ["sung"], families: ["soul", "future", "general"] },
  { archetype: "smooth", male: "smooth male R&B lead", female: "silky smooth female R&B lead", styles: ["sung"], families: ["soul"] },
  { archetype: "smooth", male: "soulful male ad-libs", female: "soulful female ad-libs", styles: ["sung"], families: ["soul", "future"] },
  { archetype: "smooth", male: "tender acoustic male folk voice", female: "intimate lo-fi female whisper", styles: ["sung"], families: ["soul", "general"] },
  { archetype: "smooth", male: "warm vintage male croon", female: "rich resonant female contralto", styles: ["sung"], families: ["soul", "cinematic"] },
  // EMOTIONAL / RAW
  { archetype: "raw", male: "raw emotional male vocals", female: "passionate emotional female vocals", styles: ["sung"], families: ["soul", "future", "cinematic"] },
  { archetype: "raw", male: "breathy intimate male whisper", female: "ethereal female whisper", styles: ["sung"], families: ["soul", "cinematic", "future"] },
  { archetype: "raw", male: "dark brooding male baritone", female: "dark brooding female alto", styles: ["sung"], families: ["cinematic", "ritual"] },
  { archetype: "raw", male: "gruff bluesy male growl", female: "smoky bluesy female growl", styles: ["sung"], families: ["soul", "phonk"] },
  // MODERN / CLEAN
  { archetype: "modern", male: "modern clean male pop vocal", female: "modern clean female pop vocal", styles: ["sung"], families: ["future", "house", "general"] },
  { archetype: "modern", male: "bright youthful male tenor", female: "bright youthful female soprano", styles: ["sung"], families: ["future", "house"] },
  { archetype: "modern", male: "playful male falsetto", female: "playful female soprano", styles: ["sung"], families: ["future", "soul"] },
  // ANTHEMIC / CHORUS
  { archetype: "anthemic", male: "anthemic male chorus lead", female: "anthemic female chorus lead", styles: ["sung"], families: ["future", "house", "general"] },
  { archetype: "anthemic", male: "stacked male harmonies", female: "stacked female harmonies", styles: ["sung"], families: ["future", "soul"] },
  { archetype: "anthemic", male: "cinematic dramatic male narration", female: "haunting atmospheric female vocal", styles: ["sung"], families: ["cinematic", "ritual"] },
];

export const VOCAL_MALE_ONLY = [
  "commanding urban male rap",
  "hyper-confident male trap flow",
  "slurred SoundCloud male mumble-rap",
  "hard-tuned autotuned male rap flow",
  "bar-heavy technical male lyricist",
  "deadpan conversational male talk-rap flow",
  "aggressive UK drill male road-rap",
  "rapid-fire male chopper rap delivery",
  "melodic trap male sung-rap topline",
  "gritty Southern male trap flow",
  "Griselda-style gutter male lyricist",
  "Detroit offbeat male punchline rapper",
  "Travis Scott-style atmospheric male autotune lead",
  "Juice WRLD-inspired emotive male sung-rap",
  "Drake-style nocturnal male sing-rap delivery",
  "raw unprocessed male battle rapper",
  "sub-bass locked male boom-bap MC",
  "distorted rage-trap male hype delivery",
  "Houston syrupy chopped male trap flow",
  "Memphis phonk male rap delivery",
  "laid-back male reggae vocal",
  "gritty urban male delivery",
  "soaring operatic male tenor",
  "deep resonant male bass",
  "tender heartfelt male ballad voice",
  "raw unprocessed male indie vocal",
  "cinematic brooding male spoken-word",
  "powerful gospel-tinged male lead",
];

export const VOCAL_FEMALE_ONLY = [
  "fierce contemporary female rap",
  "hypnotic female SoundCloud mumble flow",
  "pitch-snapped female autotuned trap delivery",
  "razor-sharp technical female lyricist",
  "cool deadpan female talk-rap delivery",
  "aggressive female drill rap cadence",
  "melodic female trap sung-rap topline",
  "slurred lo-fi female mumble delivery",
  "breathless female chopper rap flow",
  "Detroit offbeat female punchline rapper",
  "gritty Southern female trap flow",
  "hyper-processed female rage-rap vocal",
  "intimate close-mic female talk-rap",
  "infectious female sing-rap hybrid topline",
  "raw underground female battle MC",
  "unfiltered female street drill road-rap",
  "empowering female diva belt",
  "dreamy ethereal female soprano",
  "sultry jazz female alto",
  "haunting cinematic female vocal",
  "playful bubbly female pop",
  "powerful gospel female choir lead",
  "intimate bedroom female whisper",
  "smoky torch-song female delivery",
  "angelic layered female harmonies",
];

export const VOCAL_MODIFIERS = [
  "with tasteful doubles and ad-libs",
  "clean modern articulation",
  "emotional dynamic range",
  "wide stereo harmonies",
  "subtle auto-tune sheen",
  "raw unprocessed edge",
  "polished radio-ready tone",
  "gritty lo-fi warmth",
  "cinematic reverb tail",
  "intimate close-mic presence",
  "powerful belt with controlled vibrato",
  "breathy verses building to full chorus",
  "confident flow with rhythmic precision",
  "stacked background harmonies on chorus lifts",
  "subtle melisma on emotional peaks",
];

export const VOCAL_MODIFIERS_RAP = [
  "with hard-hitting ad-libs and crowd chant doubles",
  "with punchline delay throws and rhythmic double-tracking",
  "with hard auto-tune snap and metallic sheen",
  "with aggressive mic presence and zero vocal harmonies",
  "with slurred soundcloud cadence and distorted 808 ad-libs",
  "with razor-sharp consonant articulation and breathless delivery",
  "with rhythmic ad-lib echoes panned wide",
  "with deadpan spoken swagger and syncopated cadence",
  "with infectious melodic trap cadence and autotuned hooks",
  "with pitched-down demon doubles on hook drops",
  "with crisp staccato punchlines and dynamic pauses",
  "with raw street energy and upfront compression",
  "with zero singing, locked strictly to the drum grid",
  "with stuttering triplet flow and heavy 808 pocket sync",
  "with distorted hype ad-libs and crowd callouts",
  "with instantaneous auto-tune retune speed and pitch snaps",
  "with dense internal rhyming schemes and breath control",
  "with telephone-filtered intro bars and bone-dry verses",
  "with Detroit-style off-beat punchlines and sudden rests",
  "with syncopated drill triplets and sliding sub-bass pockets",
  "with sung-rap melodic bounce and autotuned vibrato tails",
  "with aggressive 1176 vocal compression and tape saturation",
  "with wide stereo whisper doubles framing the mono lead",
  "with hyperactive ad-lib screams ('aye', 'yeah', 'skrrt')",
];

export const VOCAL_GENRE_PAIRS: Record<string, { male: string; female: string }> = {
  trap: { male: "confident male rap flow", female: "silky female rap flow" },
  drill: { male: "menacing UK drill male rap flow", female: "aggressive female drill road-rap" },
  rap: { male: "bar-heavy male rap flow", female: "razor-sharp female rap flow" },
  phonk: { male: "gritty urban male delivery", female: "fierce contemporary female rap" },
  cinematic: { male: "cinematic dramatic male narration", female: "haunting atmospheric female vocal" },
  ritual: { male: "cinematic dramatic male narration", female: "haunting atmospheric female vocal" },
  soul: { male: "smooth male R&B lead", female: "silky smooth female R&B lead" },
  future: { male: "modern clean male pop vocal", female: "modern clean female pop vocal" },
  house: { male: "modern clean male pop vocal", female: "modern clean female pop vocal" },
  garage: { male: "warm male crooner", female: "intimate female crooner" },
};

export function pickVocalPhrase(
  rng: () => number,
  presentation: string | undefined,
  style: string | undefined,
  families: string[]
): string {
  const gender = presentation === "male" ? "male" : "female";
  const isRap =
    style === "rap" ||
    style === "talk-rap" ||
    style === "melodic-rap" ||
    style === "sung-rap" ||
    style === "sing-rap" ||
    style === "mumble-rap" ||
    style === "soundcloud-rap" ||
    style === "autotuned-rap" ||
    style === "lyrical-rap" ||
    families.includes("rap") ||
    families.includes("drill");

  const matching = VOCAL_PAIRS.filter((p) => {
    let styleOk = false;
    if (isRap) {
      styleOk = p.styles.some(
        (s) =>
          s === style ||
          s === "rap" ||
          s === "talk-rap" ||
          s === "melodic-rap" ||
          s === "sung-rap" ||
          s === "mumble-rap" ||
          s === "soundcloud-rap" ||
          s === "autotuned-rap" ||
          s === "lyrical-rap"
      );
    } else {
      styleOk = !style || p.styles.includes(style);
    }
    const famOk = p.families.some((f) => families.includes(f) || f === "general");
    return styleOk && famOk;
  });

  const rapPairs = VOCAL_PAIRS.filter((p) => p.styles.some((s) => s !== "sung"));
  const pool = matching.length ? matching : isRap ? rapPairs : [...VOCAL_PAIRS];
  const pair = pool[Math.floor(rng() * pool.length) % pool.length];
  let phrase = gender === "male" ? pair.male : pair.female;

  if (rng() > 0.35) {
    const extras = gender === "male" ? VOCAL_MALE_ONLY : VOCAL_FEMALE_ONLY;
    const styleExtras = extras.filter((e) => {
      if (isRap) return /rap|mumble|autotuned|lyricist|talk-rap|drill|chopper|spoken|bars|phonk|mc/i.test(e);
      if (style === "sung") return !/rap|mumble|autotuned|drill|chopper|spoken|bars|phonk|mc/i.test(e);
      return true;
    });
    const src = styleExtras.length ? styleExtras : isRap ? rapPairs.map((p) => (gender === "male" ? p.male : p.female)) : extras;
    if (rng() > 0.45) phrase = src[Math.floor(rng() * src.length) % src.length];
  }

  // Only allow genre pairs to override if not conflicting with rap mode
  if (!isRap || families.includes("trap") || families.includes("drill") || families.includes("rap") || families.includes("phonk")) {
    const rapRecs = ["trap", "drill", "rap", "phonk"];
    const matchedFamily = families.find((f) => (isRap ? rapRecs.includes(f) : true) && VOCAL_GENRE_PAIRS[f]);
    if (matchedFamily && rng() > 0.7) {
      const rec = VOCAL_GENRE_PAIRS[matchedFamily];
      phrase = gender === "male" ? rec.male : rec.female;
    }
  }

  const modPool = isRap ? VOCAL_MODIFIERS_RAP : VOCAL_MODIFIERS;
  const mod = modPool[Math.floor(rng() * modPool.length) % modPool.length];
  if (rng() > 0.25) phrase = `${phrase} ${mod}`;
  return phrase;
}
