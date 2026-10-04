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
  [/\bpiano\b/i, "sparse piano"],
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
  if (/\bukg\b/i.test(text) && !genres.includes("UK Garage") && !genres.includes("140 UKG")) {
    genres.push("UK Garage");
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

  const vocals: VocalPreferences = {};
  const instrumental = /\binstrumental\b/i.test(text);
  if (/\bfemale\b/i.test(text)) vocals.presentation = "female";
  if (/\bmale\b/i.test(text) && !/\bfemale\b/i.test(text)) vocals.presentation = "male";
  if (/\bbreathy\b/i.test(text)) vocals.timbre = "breathy";
  if (/\bairy\b/i.test(text)) vocals.timbre = "airy";
  if (/\bsultry\b/i.test(text)) vocals.timbre = "sultry";
  if (/\bgritty\b/i.test(text)) vocals.timbre = "gritty";
  if (/\bsmoky\b/i.test(text)) vocals.timbre = "smoky";
  if (/\bsilky\b/i.test(text)) vocals.timbre = "silky";
  if (/\bwarm\b/i.test(text) && vocals.presentation === "male") vocals.timbre = "warm";
  if (/\bintimate\b/i.test(text)) vocals.delivery = "intimate";

  if (/\b(soprano|mezzo-soprano|mezzo|contralto|alto|tenor|baritone|bass-baritone|countertenor)\b/i.test(text)) {
    const m = text.match(
      /\b(soprano|mezzo-soprano|mezzo|contralto|alto|tenor|baritone|bass-baritone|countertenor)\b/i
    );
    if (m) vocals.register = m[1].toLowerCase();
  }

  if (/\btalk[- ]?rap\b|\bspoken[- ]word\b|\btalk[- ]sing\b|\bconversational rap\b/i.test(text)) {
    vocals.style = "talk-rap";
  } else if (/\bsung[- ]?rap\b|\bmelodic rap\b|\bsing-rap\b/i.test(text)) {
    vocals.style = "melodic-rap";
  } else if (/\brapping\b|\brap\b/i.test(text)) {
    vocals.style = "rap";
  } else if (/\bsung\b|\bsinging\b|\bsinger\b|\benglish (singing|vocal)/i.test(text)) {
    vocals.style = "sung";
  } else if (/\bvocal chops?\b/i.test(text)) {
    vocals.style = "chops";
  }

  if (/\benglish\b/i.test(text)) vocals.language = "English";
  if (/\bportuguese\b|\bbrazilian portuguese\b/i.test(text)) {
    vocals.language = "Brazilian Portuguese";
  }
  if (/\bvocal chops?\b/i.test(text)) {
    vocals.processing = [...(vocals.processing ?? []), "vocal chops"];
  }
  if (Object.keys(vocals).length > 0 || /\bvocal/i.test(text)) {
    vocals.present = !instrumental;
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

  const chunks = text
    .split(/\s*(?:\+|\/|,|&| x | × |\band\b)\s*/i)
    .map((c) => c.trim())
    .filter(Boolean);
  for (const chunk of chunks) {
    const cleaned = chunk.replace(/\b\d{2,3}\s*bpm\b/gi, "").trim();
    const found = matchGenre(cleaned);
    if (found && !hits.some((h) => h.name === found.name)) {
      const idx = lower.indexOf(found.name.toLowerCase());
      hits.push({
        name: found.name,
        index: idx >= 0 ? idx : lower.length,
        len: found.name.length,
      });
    }
  }

  const ukg = lower.search(/\bukg\b/);
  if (ukg >= 0 && !hits.some((h) => h.name === "UK Garage" || h.name === "140 UKG")) {
    hits.push({ name: "UK Garage", index: ukg, len: 3 });
  }

  hits.sort((a, b) => a.index - b.index);
  return hits.map((h) => h.name);
}

function includesPhrase(hay: string, needle: string): boolean {
  return ` ${hay} `.includes(` ${needle} `);
}

function clampBpm(n: number): number {
  return Math.min(200, Math.max(60, n));
}
