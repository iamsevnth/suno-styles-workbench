export interface VocalPair {
  archetype: string;
  male: string;
  female: string;
  styles: string[];
  families: string[];
}

export const VOCAL_PAIRS: VocalPair[] = [
  // POWER / BOLD
  { archetype: "power", male: "bold male baritone", female: "sultry female alto", styles: ["sung"], families: ["general", "soul", "trap"] },
  { archetype: "power", male: "powerful male tenor with rasp", female: "soaring female soprano with breathy edge", styles: ["sung"], families: ["future", "soul", "general"] },
  { archetype: "power", male: "gritty masculine delivery", female: "velvety feminine delivery", styles: ["sung", "rap"], families: ["trap", "bass", "general"] },
  { archetype: "power", male: "commanding male baritone", female: "empowering female belt", styles: ["sung"], families: ["future", "soul", "general"] },
  { archetype: "power", male: "aggressive male rock shout", female: "fierce female rock belt", styles: ["sung"], families: ["general"] },
  { archetype: "power", male: "hyper-aggressive male trap delivery", female: "fierce pop diva female lead", styles: ["rap", "sung"], families: ["trap", "future"] },
  // SMOOTH / SOULFUL
  { archetype: "smooth", male: "warm male crooner", female: "intimate female crooner", styles: ["sung"], families: ["soul", "future", "general"] },
  { archetype: "smooth", male: "smooth male R&B lead", female: "silky smooth female R&B lead", styles: ["sung"], families: ["soul", "trap"] },
  { archetype: "smooth", male: "soulful male ad-libs", female: "soulful female ad-libs", styles: ["sung", "melodic-rap"], families: ["soul", "trap", "future"] },
  { archetype: "smooth", male: "tender acoustic male folk voice", female: "intimate lo-fi female whisper", styles: ["sung"], families: ["soul", "general"] },
  { archetype: "smooth", male: "warm vintage male croon", female: "rich resonant female contralto", styles: ["sung"], families: ["soul", "cinematic"] },
  // EMOTIONAL / RAW
  { archetype: "raw", male: "raw emotional male vocals", female: "passionate emotional female vocals", styles: ["sung", "melodic-rap"], families: ["soul", "future", "cinematic"] },
  { archetype: "raw", male: "breathy intimate male whisper", female: "ethereal female whisper", styles: ["sung", "talk-rap"], families: ["soul", "cinematic", "future"] },
  { archetype: "raw", male: "dark brooding male baritone", female: "dark brooding female alto", styles: ["sung", "talk-rap"], families: ["cinematic", "ritual", "drill", "trap"] },
  { archetype: "raw", male: "raspy masculine edge", female: "husky feminine edge", styles: ["sung", "rap"], families: ["trap", "phonk", "bass"] },
  { archetype: "raw", male: "gruff bluesy male growl", female: "smoky bluesy female growl", styles: ["sung"], families: ["soul", "phonk"] },
  // MODERN / CLEAN
  { archetype: "modern", male: "modern clean male pop vocal", female: "modern clean female pop vocal", styles: ["sung"], families: ["future", "house", "general"] },
  { archetype: "modern", male: "confident male rap flow", female: "silky female rap flow", styles: ["rap", "talk-rap"], families: ["trap", "drill", "rap", "phonk"] },
  { archetype: "modern", male: "bright youthful male tenor", female: "bright youthful female soprano", styles: ["sung"], families: ["future", "house"] },
  { archetype: "modern", male: "playful male falsetto", female: "playful female soprano", styles: ["sung"], families: ["future", "soul"] },
  // ANTHEMIC / CHORUS
  { archetype: "anthemic", male: "anthemic male chorus lead", female: "anthemic female chorus lead", styles: ["sung"], families: ["future", "house", "general"] },
  { archetype: "anthemic", male: "stacked male harmonies", female: "stacked female harmonies", styles: ["sung"], families: ["future", "soul"] },
  { archetype: "anthemic", male: "cinematic dramatic male narration", female: "haunting atmospheric female vocal", styles: ["talk-rap", "sung"], families: ["cinematic", "ritual"] },
];

export const VOCAL_MALE_ONLY = [
  "commanding urban male rap",
  "laid-back male reggae vocal",
  "gritty urban male delivery",
  "soaring operatic male tenor",
  "deep resonant male bass",
  "hyper-confident male trap flow",
  "tender heartfelt male ballad voice",
  "raw unprocessed male indie vocal",
  "cinematic brooding male spoken-word",
  "powerful gospel-tinged male lead",
];

export const VOCAL_FEMALE_ONLY = [
  "empowering female diva belt",
  "dreamy ethereal female soprano",
  "sultry jazz female alto",
  "fierce contemporary female rap",
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

export const VOCAL_GENRE_PAIRS: Record<string, { male: string; female: string }> = {
  trap: { male: "confident male rap flow", female: "silky female rap flow" },
  drill: { male: "confident male rap flow", female: "silky female rap flow" },
  rap: { male: "confident male rap flow", female: "silky female rap flow" },
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
  const matching = VOCAL_PAIRS.filter((p) => {
    const styleOk = !style || p.styles.includes(style);
    const famOk = p.families.some((f) => families.includes(f) || f === "general");
    return styleOk && famOk;
  });
  const pool = matching.length ? matching : [...VOCAL_PAIRS];
  const pair = pool[Math.floor(rng() * pool.length) % pool.length];
  let phrase = gender === "male" ? pair.male : pair.female;

  if (rng() > 0.45) {
    const extras = gender === "male" ? VOCAL_MALE_ONLY : VOCAL_FEMALE_ONLY;
    const styleExtras = extras.filter((e) => {
      if (style === "rap" || style === "talk-rap") return /rap|spoken|urban|trap flow/i.test(e);
      if (style === "sung") return !/rap|spoken/i.test(e);
      return true;
    });
    const src = styleExtras.length ? styleExtras : extras;
    if (rng() > 0.65) phrase = src[Math.floor(rng() * src.length) % src.length];
  }

  const rec = families.map((f) => VOCAL_GENRE_PAIRS[f]).find(Boolean);
  if (rec && rng() > 0.7) phrase = gender === "male" ? rec.male : rec.female;

  const mod = VOCAL_MODIFIERS[Math.floor(rng() * VOCAL_MODIFIERS.length) % VOCAL_MODIFIERS.length];
  if (rng() > 0.35) phrase = `${phrase} ${mod}`;
  return phrase;
}
