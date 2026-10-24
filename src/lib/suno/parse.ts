import { inferBlendBand } from "./genre-atlas.ts";
import { genreNamesLongestFirst, matchGenre } from "./ontology.ts";
import { ParsedInput, VocalPreferences } from "./types.ts";

const COUNT_RE = /(?:generate|make|create|variants?|prompts?)\s*[:=]?\s*(\d{1,2})\b/i;
const N_FLAG_RE = /(?:^|\s)(?:-n|--count)\s*(\d{1,2})\b/i;

export const MOOD_WORDS = [
  "dark",
  "brooding",
  "menacing",
  "sinister",
  "ominous",
  "nocturnal",
  "shadowy",
  "gritty",
  "dystopian",
  "dangerous",
  "predatory",
  "aggressive",
  "apocalyptic",
  "emotional",
  "melancholic",
  "bittersweet",
  "vulnerable",
  "intimate",
  "yearning",
  "reflective",
  "soulful",
  "heartbroken",
  "nostalgic",
  "cathartic",
  "euphoric",
  "soaring",
  "uplifting",
  "triumphant",
  "anthemic",
  "explosive",
  "liberating",
  "cinematic",
  "epic",
  "monumental",
  "dramatic",
  "tense",
  "suspenseful",
  "immersive",
  "expansive",
  "atmospheric",
  "ritualistic",
  "ceremonial",
  "occult",
  "hypnotic",
  "ancient",
  "mystical",
  "tribal",
  "primal",
  "spiritual",
  "entrancing",
  "processional",
  "futuristic",
  "cybernetic",
  "mechanical",
  "digital",
  "neon",
  "synthetic",
  "kinetic",
  "energetic",
  "high energy",
  "high-energy",
  "hype",
  "heavy",
  "bouncy",
  "swaggering",
  "luxurious",
  "sleek",
  "seductive",
  "polished",
  "moody",
  "expensive",
  "controlled",
  "minimal",
  "raw",
  "organic",
  "warm",
  "cold",
  "restrained",
];

export const ATMOSPHERE_WORDS = [
  "ritual",
  "club",
  "festival",
  "late-night",
  "late night",
  "underground",
  "trailer",
  "horror",
  "cavernous",
  "neon",
  "industrial",
  "smoke",
  "haze",
  "occult",
  "ceremonial",
];

export const INSTRUMENT_PATTERNS: [RegExp, string][] = [
  [/\b(?:r&b|rnb|clean electric|melodic)?\s*guitars?\b/i, "clean electric guitar"],
  [/\b(?<!electric )piano\b/i, "sparse piano"],
  [/\brhodes\b/i, "Rhodes electric piano"],
  [/\bpads?\b/i, "atmospheric pads"],
  [/\bplucks?\b/i, "synth plucks"],
  [/\b808s?\b/i, "sliding 808"],
  [/\bsubs?\b/i, "deep mono sub"],
  [/\bwubs?\b|\bwobble\b|\bwubby\b/i, "rounded wobble bass"],
  [/\bgrowls?\b/i, "bass growls"],
  [/\breese\b/i, "Reese bass"],
  [/\bhand drums?\b|\bceremonial percussion\b|\bglobal percussion\b/i, "ceremonial hand percussion"],
  [/\bcowbell\b/i, "cowbell accents"],
  [/\bsynths?\b/i, "synths"],
  [/\bvocal chops?\b/i, "vocal chops"],
  [/\bsoul samples?\b|\bchopped soul\b/i, "warm chopped soul-inspired fragments"],
];

export function parseUserInput(
  raw: string,
  options?: {
    count?: number;
    profileEnabled?: boolean;
    mode?: "minimal" | "standard" | "advanced" | "reference" | "rewrite" | "variants";
  }
): ParsedInput {
  const text = raw.trim();
  const lower = text.toLowerCase();
  const looksLikeDraft =
    text.length > 400 ||
    /primary instrumentation:/i.test(text) ||
    (/bpm\b/i.test(text) &&
      /mix priorities|form uses|textures? use|low-end hierarchy|drive the low end/i.test(text));

  let count = options?.count ?? 3;
  const countMatch = text.match(COUNT_RE) || text.match(N_FLAG_RE);
  if (countMatch) count = Math.min(12, Math.max(1, parseInt(countMatch[1], 10)));

  let bpm: number | undefined;
  const bpmAll = [...text.matchAll(/\b(\d{2,3})\s*bpm\b/gi)];
  if (bpmAll.length) {
    bpm = clampBpm(parseInt(bpmAll[bpmAll.length - 1][1], 10));
  }

  const wantsVariety =
    /\b(variety|various|diverse|surprise|random|wild|explore|anything|something new|mix it up|different genres?|full library)\b/i.test(
      text
    );

  const genres = extractGenresInOrder(text);
  // "UKG" on its own means UKG dubstep, never UK garage.
  if (/\bukg\b/i.test(text) && !genres.some((g) => /\bukg\b/i.test(g))) {
    genres.push("UKG Dubstep");
  }
  if (/\britual\s+bass\b/i.test(text) && !genres.some((g) => /ritual/i.test(g))) {
    genres.push("Ritual Bass");
  }
  if (genres.includes("Deep Dubstep") && genres.includes("Dubstep")) {
    genres.splice(genres.indexOf("Dubstep"), 1);
  }

  const moods = MOOD_WORDS.filter((m) => includesPhrase(lower, m));
  const atmospheres = ATMOSPHERE_WORDS.filter((a) => lower.includes(a));

  const instruments: string[] = [];
  for (const [re, label] of INSTRUMENT_PATTERNS) {
    if (re.test(text) && !instruments.includes(label)) instruments.push(label);
  }
  const explicitInstruments = extractExplicitInstruments(text);

  const instrumental = /\binstrumental\b/i.test(text);
  const vocals: VocalPreferences = extractVocalDetails(text, lower, instrumental);

  // If a rap vocal style was detected but no genre was explicitly given, seed with authentic hip-hop/trap genres
  if (genres.length === 0 && vocals.style && vocals.style !== "sung" && vocals.style !== "chops") {
    if (vocals.style === "mumble-rap") {
      genres.push("SoundCloud Trap", "Minimal Dark Trap");
    } else if (vocals.style === "autotuned-rap") {
      genres.push("Melodic Trap", "Rage Trap");
    } else if (vocals.style === "melodic-rap") {
      genres.push("Melodic Trap", "Southern Trap");
    } else if (vocals.style === "lyrical-rap") {
      genres.push("Boom Bap", "Conscious Hip Hop");
    } else if (vocals.style === "talk-rap") {
      genres.push("West Coast Hip Hop", "Minimal Dark Trap");
    } else {
      genres.push("Southern Trap", "Aggressive Trap");
    }
  }

  const grooveHints: string[] = [];
  if (/\bswing|swung|shuffle\b/i.test(text)) grooveHints.push("swung");
  if (/\bhalf[- ]?time\b/i.test(text)) grooveHints.push("half-time");
  if (/\b2[- ]?step\b/i.test(text)) grooveHints.push("2-step");
  if (/\bsyncopat/i.test(text)) grooveHints.push("syncopated");
  if (/\bfour[- ]on[- ]the[- ]floor|4\/4 club\b/i.test(text)) grooveHints.push("four-on-the-floor");
  if (/\bhead-nod|head nod\b/i.test(text)) grooveHints.push("head-nod");
  if (/\bkinetic\b/i.test(text)) grooveHints.push("kinetic physical pocket");

  const bassHints: string[] = [];
  if (/\b808\b/i.test(text)) bassHints.push("sliding 808");
  if (/\bwub|wobble|wubby\b/i.test(text)) bassHints.push("rounded wobble bass");
  if (/\bgrowl\b/i.test(text)) bassHints.push("bass growls");
  if (/\breese\b/i.test(text)) bassHints.push("Reese bass");
  if (/\bneuro\b/i.test(text)) bassHints.push("modulated neuro mid-bass");
  if (/\bsub\b/i.test(text)) bassHints.push("deep mono sub");

  const drumHints: string[] = [];
  if (/\btrap hats?|hi[- ]?hats?\b/i.test(text)) drumHints.push("rapid trap hats");
  if (/\bskippy\b/i.test(text)) drumHints.push("skippy rims");
  if (/\bpunchy kicks?\b/i.test(text)) drumHints.push("punchy kicks");
  if (/\bspacious snare\b/i.test(text)) drumHints.push("spacious snare placement");
  if (/\bhard downbeat\b/i.test(text)) drumHints.push("hard downbeat kicks");

  const arrangementHints: string[] = [];
  if (/\bbuild\b/i.test(text)) arrangementHints.push("gradual build");
  if (/\bdrop\b/i.test(text)) arrangementHints.push("towering drop");
  if (/\bbreakdown\b/i.test(text)) arrangementHints.push("stripped breakdown");
  if (/\bcontrast\b/i.test(text)) arrangementHints.push("intimate-to-massive contrast");
  if (/\bkinetic\b/i.test(text)) arrangementHints.push("groove-forward momentum", "drop-focused payoff");

  const mixHints: string[] = [];
  if (/\bwide\b/i.test(text)) mixHints.push("wide harmonic field");
  if (/\bmono\b/i.test(text)) mixHints.push("centered mono low end");
  if (/\bcrisp\b/i.test(text)) mixHints.push("crisp drum transients");
  if (/\breverb\b/i.test(text)) mixHints.push("cinematic reverb tails");

  const soundDesignHints: string[] = [];
  if (/\bglitch\b/i.test(text)) soundDesignHints.push("digital glitches");
  if (/\bdrone\b/i.test(text)) soundDesignHints.push("deep drones");
  if (/\bgranular\b/i.test(text)) soundDesignHints.push("granular textures");
  if (/\bmetallic\b/i.test(text)) soundDesignHints.push("metallic modulation");
  if (/\briser|impacts?\b/i.test(text)) soundDesignHints.push("cinematic risers and impacts");

  const drafts: string[] = [];
  if (looksLikeDraft) drafts.push(text);
  const draftBlocks = text.match(/```[\s\S]*?```/g) || [];
  for (const b of draftBlocks) {
    drafts.push(b.replace(/```\w*\n?|\n?```/g, "").trim());
  }

  const references: string[] = [];
  const refMatches = text.matchAll(
    /(?:like|ref(?:erence)?s?|inspired by|in the style of)\s+([A-Z][\w\s.&'-]{1,40})/g
  );
  for (const m of refMatches) references.push(m[1].trim());

  const mandatory: string[] = [];
  const mandMatches = text.matchAll(/mandatory\s*[:=]\s*([^;\n]+)/gi);
  for (const m of mandMatches) mandatory.push(m[1].trim());
  if (wantsVariety) mandatory.push("__variety__");

  let mode = options?.mode ?? "minimal";
  if (looksLikeDraft || drafts.length) mode = "rewrite";
  else if (references.length) mode = "reference";
  else if (wantsVariety || (count > 1 && options?.mode !== "minimal")) {
    mode = options?.mode ?? "variants";
  } else if (genres.length || bpm || moods.length) {
    const detail =
      instruments.length + grooveHints.length + bassHints.length + (vocals.present ? 1 : 0);
    mode = detail >= 3 ? "advanced" : genres.length || bpm ? "standard" : "minimal";
  }

  let key: string | undefined;
  const keyMatch = text.match(/\b([A-G](?:#|b)?)\s*(minor|major|min|maj)\b/i);
  if (keyMatch) {
    const tonic = keyMatch[1].toUpperCase();
    const qual = keyMatch[2].toLowerCase();
    key = qual.startsWith("min") ? `${tonic} minor` : `${tonic} major`;
  }

  return {
    raw: text,
    count,
    genres: genres.slice(0, 4),
    bpm,
    key,
    moods,
    atmospheres,
    instruments,
    explicitInstruments: explicitInstruments.length ? explicitInstruments : undefined,
    vocals: Object.keys(vocals).length ? vocals : undefined,
    grooveHints,
    bassHints,
    drumHints,
    arrangementHints,
    mixHints,
    soundDesignHints,
    drafts,
    references,
    mandatory,
    instrumental,
    profileEnabled: options?.profileEnabled ?? true,
    blendBand: inferBlendBand(text, genres, wantsVariety, options?.profileEnabled ?? true),
    mode,
  };
}

function extractGenresInOrder(text: string): string[] {
  const lower = text.toLowerCase();
  const names = genreNamesLongestFirst();
  const hits: { name: string; index: number; len: number }[] = [];

  for (const name of names) {
    const needle = name.toLowerCase();
    let from = 0;
    while (from < lower.length) {
      const idx = lower.indexOf(needle, from);
      if (idx < 0) break;
      const before = idx === 0 || /[\s,+/|&(x×-]/.test(lower[idx - 1]);
      const after =
        idx + needle.length >= lower.length ||
        /[\s,+/|&).;x×-]/.test(lower[idx + needle.length]);
      if (before && after) {
        const covered = hits.some(
          (h) => idx >= h.index && idx + needle.length <= h.index + h.len && h.len > needle.length
        );
        if (!covered) {
          for (let i = hits.length - 1; i >= 0; i--) {
            const h = hits[i];
            if (h.index >= idx && h.index + h.len <= idx + needle.length && h.len < needle.length) {
              hits.splice(i, 1);
            }
          }
          if (!hits.some((h) => h.name === name)) {
            hits.push({ name, index: idx, len: needle.length });
          }
        }
        break;
      }
      from = idx + 1;
    }
  }

  // A bare "&" stays inside names such as "R&B" or "D&B"; only a spaced " & " separates genres.
  const chunks = text
    .split(/\s*(?:\+|\/|,|\s&\s| x | × |\band\b)\s*/i)
    .map((c) => c.trim())
    .filter(Boolean);
  for (const chunk of chunks) {
    const cleaned = chunk.replace(/\b\d{2,3}\s*bpm\b/gi, "").trim();
    const found = matchGenre(cleaned);
    if (found && !hits.some((h) => h.name === found.name)) {
      // Locate the longest spelling the brief used ("ukg-dubstep" for UKG Dubstep), and let it
      // replace shorter names found inside it ("dubstep"), as the name scan above does.
      const spelling = [found.name.toLowerCase(), ...found.aliases]
        .filter((s) => lower.includes(s))
        .sort((a, b) => b.length - a.length)[0];
      const idx = spelling ? lower.indexOf(spelling) : -1;
      const len = spelling ? spelling.length : found.name.length;
      if (idx >= 0) {
        for (let i = hits.length - 1; i >= 0; i--) {
          const h = hits[i];
          if (h.index >= idx && h.index + h.len <= idx + len && h.len < len) hits.splice(i, 1);
        }
      }
      hits.push({ name: found.name, index: idx >= 0 ? idx : lower.length, len });
    }
  }

  // A "UKG" not already inside a longer genre name ("UKG Trap", "140 UKG") is UKG dubstep.
  const ukg = lower.search(/\bukg\b/);
  if (ukg >= 0 && !hits.some((h) => /\bukg\b/i.test(h.name))) {
    hits.push({ name: "UKG Dubstep", index: ukg, len: 3 });
  }

  hits.sort((a, b) => a.index - b.index);
  return hits.map((h) => h.name);
}

/** Whole-word match that tolerates punctuation, so "uplifting," and "dark." both count. */
function includesPhrase(hay: string, needle: string): boolean {
  const escaped = needle.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`(^|[^a-z0-9])${escaped}($|[^a-z0-9])`, "i").test(hay);
}

function clampBpm(n: number): number {
  return Math.min(200, Math.max(60, n));
}

function extractExplicitInstruments(text: string): string[] {
  const explicit: string[] = [];
  const map: [RegExp, string][] = [
    [/\b(?:acoustic|electric|clean|nylon|12-string)?\s*guitars?\b/i, "guitar"],
    [/\brhodes(?:\s+piano|\s+electric piano)?\b/i, "Rhodes electric piano"],
    [/\b(?:acoustic|upright|grand|felt)?\s*(?<!electric )pianos?\b/i, "piano"],
    [/\b808s?\b/i, "808 bass"],
    [/\bsynths?\b|\bsynthesizers?\b/i, "synth"],
    [/\bpads?\b/i, "pads"],
    [/\bstrings?|violins?|cellos?\b/i, "strings"],
    [/\bbrass|horns?|trumpets?|trombones?\b/i, "brass"],
    [/\bflutes?\b/i, "flute"],
    [/\bsax(?:ophone)?s?\b/i, "saxophone"],
    [/\bbells?\b/i, "bells"],
    [/\bplucks?\b/i, "synth plucks"],
    [/\bkalimba|marimba|mallets?\b/i, "mallets"],
    [/\bharp\b/i, "harp"],
    [/\borgans?\b/i, "organ"],
    [/\bhand drums?|percussion|congas?|bongos?|djembe|cajon\b/i, "hand percussion"],
    [/\bvocal chops?\b/i, "vocal chops"],
  ];

  for (const [re, name] of map) {
    if (re.test(text) && !explicit.includes(name)) {
      explicit.push(name);
    }
  }
  return explicit;
}

const VOCAL_CLAUSE_RE =
  /vocal|voice|tone|cadence|flow|deliver|phras|rap|sung|sing|croon|falsetto|harmon|auto[- ]?tune|tuned|gloss|reverb|delay|double|ad-?lib|breath|rasp|smooth|airy|sultry|grit|silky|velvet|honey|soulful|tenor|baritone|soprano|alto|register|belt|whisper|chop/i;

/**
 * The vocal segment runs to the end of the sentence, so "female vocals, high energy"
 * would carry the mood into the vocal line. Keep the first clause and every later
 * comma clause that still describes the voice.
 */
function dropNonVocalClauses(segment: string): string {
  const [first, ...rest] = segment.split(/\s*,\s*/);
  return [first, ...rest.filter((clause) => VOCAL_CLAUSE_RE.test(clause))].join(", ");
}

function extractVocalDetails(text: string, lower: string, instrumental: boolean): VocalPreferences {
  const vocals: VocalPreferences = {};
  if (instrumental) {
    vocals.present = false;
    return vocals;
  }

  const hasVocalMention =
    /\b(vocal|vocals|voice|singing|singer|rapper|rapping|rap|bars|sung-rap|melodic-rap|sing-rap|talk-rap|mumble|cadence|croon|falsetto|soprano|mezzo|contralto|alto|tenor|baritone)\b/i.test(
      text
    );

  if (!hasVocalMention && !/\bfemale\b|\bmale\b/i.test(text)) {
    return vocals;
  }

  if (/\bfemale\b/i.test(text)) vocals.presentation = "female";
  if (/\bmale\b/i.test(text) && !/\bfemale\b/i.test(text)) vocals.presentation = "male";

  // Registers
  const regMatch = text.match(
    /\b(soprano|mezzo-soprano|mezzo|contralto|alto|tenor|baritone|bass-baritone|countertenor)\b/i
  );
  if (regMatch) vocals.register = regMatch[1].toLowerCase();

  // Timbres & Cultural Tone
  const descriptors: string[] = [];
  if (/\bblack male vocal tone\b/i.test(text)) {
    descriptors.push("Black male vocal tone");
    vocals.presentation = "male";
  } else if (/\bmale vocal tone\b/i.test(text)) {
    descriptors.push("male vocal tone");
  } else if (/\bfemale vocal tone\b/i.test(text)) {
    descriptors.push("female vocal tone");
  }

  const timbreMatches: [RegExp, string][] = [
    [/\bsmooth(?:\s+tone)?\b/i, "smooth tone"],
    [/\bsmoky\b/i, "smoky tone"],
    [/\bbreathy\b/i, "breathy"],
    [/\bairy\b/i, "airy"],
    [/\bsultry\b/i, "sultry"],
    [/\bgritty\b/i, "gritty"],
    [/\braspy\b/i, "raspy"],
    [/\bsilky\b/i, "silky"],
    [/\bwarm\b/i, "warm"],
    [/\bdeep\b/i, "deep resonant tone"],
    [/\bresonant\b/i, "resonant tone"],
    [/\bintimate\b/i, "intimate"],
    [/\braw\b/i, "raw"],
    [/\bcrisp\b/i, "crisp"],
    [/\bvelvety\b/i, "velvety"],
    [/\bhoneyed\b/i, "honeyed"],
    [/\bsoulful\b/i, "soulful"],
  ];

  for (const [re, label] of timbreMatches) {
    if (re.test(text) && !descriptors.includes(label)) {
      descriptors.push(label);
      if (!vocals.timbre && !label.includes("Black male")) vocals.timbre = label;
    }
  }

  // Delivery & Cadence
  const deliveryMatches: [RegExp, string][] = [
    [/\blaid[- ]?back cadence\b/i, "laid-back cadence"],
    [/\brelaxed cadence\b/i, "relaxed cadence"],
    [/\bmelodic sung[- ]?rap phrases\b/i, "melodic sung-rap phrases"],
    [/\bconversational cadence\b/i, "conversational cadence"],
    [/\brhythmic spoken[- ]?flow\b/i, "rhythmic spoken-flow"],
    [/\btriplet flow\b/i, "triplet flow"],
    [/\brapid cadence\b/i, "rapid cadence"],
    [/\bdouble[- ]?time\b/i, "double-time cadence"],
    [/\bpunchy delivery\b/i, "punchy delivery"],
    [/\beffortless pocket\b/i, "effortless pocket"],
    [/\bconfident swagger\b/i, "confident swagger"],
  ];

  for (const [re, label] of deliveryMatches) {
    if (re.test(text) && !descriptors.includes(label)) {
      descriptors.push(label);
      if (!vocals.delivery) vocals.delivery = label;
    }
  }

  // Effects & Processing
  const procList: string[] = [];
  if (/\bprominent auto[- ]?tune gloss\b/i.test(text)) {
    procList.push("prominent autotune gloss");
    descriptors.push("prominent autotune gloss");
  } else if (/\bauto[- ]?tune gloss\b/i.test(text)) {
    procList.push("autotune gloss");
    descriptors.push("autotune gloss");
  } else if (/\bhard auto[- ]?tune\b/i.test(text)) {
    procList.push("hard autotune");
    descriptors.push("hard autotune");
  } else if (/\bauto[- ]?tuned?\b/i.test(text)) {
    procList.push("autotuned pitch correction");
    descriptors.push("autotuned pitch correction");
  }

  if (/\bplate reverb\b/i.test(text)) procList.push("vintage plate reverb");
  if (/\bslapback(?: delay)?\b/i.test(text)) procList.push("slapback delay");
  if (/\btape saturation\b|\btape warmth\b/i.test(text)) procList.push("tape saturation");
  if (/\bstereo doubles\b|\bdoubled vocals\b/i.test(text)) procList.push("stereo doubles");
  if (/\bvocal chops?\b/i.test(text)) procList.push("vocal chops");

  // Style detection
  if (/\bmumble[- ]?(rap|flow|vocal|rapper)?\b|\bsoundcloud[- ]?(rap|rapper|trap)?\b|\bcloud[- ]?rap\b/i.test(text)) {
    vocals.style = "mumble-rap";
    procList.push("slurred mumble delivery", "heavy autotune saturation");
  } else if (/\bauto[- ]?tuned? rap\b|\bauto[- ]?tune rap\b|\bhard auto[- ]?tune\b|\brobotic rap\b|\brage[- ]?trap\b/i.test(text)) {
    vocals.style = "autotuned-rap";
    procList.push("hard auto-tune retune speed", "pitch-snapped precision");
  } else if (
    /\blyrical[- ]?(bars?|rap|flow)?\b|\b(complex|technical|dense) (bars?|rhymes?)\b|\bfast[- ]?(rap|flow)\b|\bchopper (rap|flow)\b|\bboom[- ]?bap (rap|flow|bars)\b|\bbars\b|\bmulti[- ]syllab/i.test(
      text
    )
  ) {
    vocals.style = "lyrical-rap";
    procList.push("crisp consonant articulation", "breath control");
  } else if (/\btalk[- ]?rap\b|\bspoken[- ]word\b|\btalk[- ]sing\b|\bconversational rap\b|\bspoken rap\b|\bdeadpan rap\b|\bdetroit (flow|rap)\b/i.test(text)) {
    vocals.style = "talk-rap";
    procList.push("dry conversational cadence", "rhythmic spoken-flow");
  } else if (/\bsung[- ]?rap\b|\bmelodic[- ]?rap\b|\bsing[- ]?rap\b|\brap & singer\b|\bsinger & rap\b/i.test(text)) {
    vocals.style = "melodic-rap";
    procList.push("melodic sung-rap cadence", "autotuned pitch correction");
  } else if (/\brapping\b|\brap\b|\brappers?\b|\bspitting bars\b|\bdrill\b/i.test(text)) {
    vocals.style = "rap";
  } else if (/\b(pure |traditional |clean pop )?singing\b|\bsinger(?! & rap)\b|\bsung(?!\s*[- ]?rap)\b|\benglish (singing|vocal)/i.test(text)) {
    vocals.style = "sung";
  } else if (/\bvocal chops?\b/i.test(text)) {
    vocals.style = "chops";
  }

  // Extract rawDescription segment
  const vocalSegmentRegex =
    /(?:(?:black\s+|white\s+|african\s+)?(?:male|female|lead)\s+vocal[^.!?\n;]*|(?:melodic\s+)?sung[- ]?rap[^.!?\n;]*|vocal[^.!?\n;]*|rap\s+vocal[^.!?\n;]*)/i;
  const match = text.match(vocalSegmentRegex);
  if (match && match[0].trim().length > 10) {
    vocals.rawDescription = dropNonVocalClauses(match[0].trim());
  } else if (hasVocalMention) {
    // Comma and "+" separate genres from the vocal in one-line briefs ("Melodic Trap, male rap"),
    // so only the part that names the vocal is quoted, never the genre list.
    const clauses = text.split(/(?<=[.!?;])\s+|\n+|\s*[,+]\s*/);
    const vc = clauses.find((c) =>
      /\b(vocal|vocals|voice|singer|singing|rapper|rap|sung-rap|melodic-rap)\b/i.test(c)
    );
    if (vc) vocals.rawDescription = vc.trim();
  }

  if (procList.length) {
    vocals.processing = [...new Set([...(vocals.processing ?? []), ...procList])];
  }
  if (descriptors.length) {
    vocals.descriptors = [...new Set(descriptors)];
  }

  if (/\benglish\b/i.test(text)) vocals.language = "English";
  if (/\bportuguese\b|\bbrazilian portuguese\b/i.test(text)) vocals.language = "Brazilian Portuguese";

  vocals.present = true;
  return vocals;
}
