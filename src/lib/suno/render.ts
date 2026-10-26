import { familyKeys, fitsFamilies, hasDrops } from "./families.ts";
import {
  FAMILY_PADDING,
  FEELS,
  GENRE_GLUE,
  MICROS,
  oneFamily,
  PADDING,
  RAP_PADDING,
  PRODUCTION,
  PRODUCTION_VERBS,
  VOCAL_ARC,
  VOCAL_STYLE,
} from "./lexicon.ts";
import { mulberry32 } from "./rng.ts";
import { SonicPlan } from "./types.ts";

export const MIN_CHARS = 925;
export const MAX_CHARS = 975;

/** Last-resort pad, worded so it fits any genre. */
export const FINAL_PAD = "Translation stays clear on every playback system.";

const RAP_STYLES = new Set([
  "rap",
  "talk-rap",
  "melodic-rap",
  "sung-rap",
  "sing-rap",
  "mumble-rap",
  "soundcloud-rap",
  "autotuned-rap",
  "lyrical-rap",
]);

/** Lines in RAP_PADDING that only fit some rap styles; any other line fits every rap style. */
const RAP_PADDING_STYLES: [RegExp, string[]][] = [
  [/SoundCloud|skrrt/i, ["mumble-rap", "soundcloud-rap"]],
  [/talk-rap/i, ["talk-rap"]],
  [/Lyrical bars/i, ["lyrical-rap"]],
  [/Sung-rap melodic topline/i, ["melodic-rap", "sung-rap", "sing-rap"]],
  [/Autotuned pitch snaps|Fast retune auto-tune/i, ["autotuned-rap", "melodic-rap", "mumble-rap"]],
  [
    /rap pocket with unison doubles|lead stays in rap cadence|rather than vocal harmonizing|tight, chanted stack/i,
    ["rap", "lyrical-rap", "talk-rap", "autotuned-rap"],
  ],
];

/** Instrumentals skip sentences about singers; rap leads skip sentences about sung harmony. */
function suitsVocal(sentence: string, plan: SonicPlan): boolean {
  if (!plan.vocals.present) return !/vocal|singing|harmon|sung|choir|chant/i.test(sentence);
  if (hasRapVocal(plan)) return !/harmon|singing|choir|sung/i.test(sentence);
  return true;
}

function hasRapVocal(plan: SonicPlan): boolean {
  return plan.vocals.present === true && RAP_STYLES.has(plan.vocals.style ?? "");
}

function rapPaddingFor(style: string | undefined): string[] {
  return RAP_PADDING.filter((line) =>
    RAP_PADDING_STYLES.every(([pattern, styles]) => !pattern.test(line) || styles.includes(style ?? ""))
  );
}

/**
 * Characters the generated vocal sentence may use. The production carries a Styles prompt, so a
 * brief that only names the basics gets a short vocal line and the rest goes to the sonic plan.
 */
export const VOCAL_BUDGET = { compact: 150, detailed: 300 } as const;

/**
 * The vocal sentence, built from the voice outward: who sings comes first, then the brief's own
 * processing, then planned details in order of usefulness, each only while it fits the budget.
 */
function vocalSentence(
  intro: string,
  identity: string,
  v: SonicPlan["vocals"],
  stylePhrase: string,
  arc: string
): string {
  const budget = VOCAL_BUDGET[v.detail ?? "compact"];
  const procs = v.processing ?? [];
  const head = identity + (v.language ? ` in ${v.language}` : "");
  const parts: VocalParts = { head, procs: v.processingFromBrief ? procs.slice(0, 2) : [] };
  // Planned phrases may say "with" once in the whole sentence, a second "with ... with" reads as
  // a pile-up, and they never repeat a word the sentence already has. The brief's own words are
  // never held to either rule.
  const withLimit = Math.max(1, withCount(renderVocal(parts)));
  const consider = (candidate: VocalParts, addition: string) => {
    const before = renderVocal(parts);
    const after = renderVocal(candidate);
    if (`${intro} ${after}.`.length > budget) return;
    if (withCount(after) > withLimit || repeatsWord(before, addition)) return;
    Object.assign(parts, candidate);
  };
  // Who sings and the brief's effects are fixed; planned details join in order of usefulness.
  if (v.deliveryDetail) consider({ ...parts, detail: v.deliveryDetail }, v.deliveryDetail);
  consider({ ...parts, style: stylePhrase }, stylePhrase);
  consider({ ...parts, arc }, arc);
  if (!v.processingFromBrief) {
    const planned = procs.slice(0, v.detail === "detailed" ? 2 : 1);
    for (const proc of planned) consider({ ...parts, procs: [...parts.procs, proc] }, proc);
  }
  return `${intro} ${renderVocal(parts)}.`;
}

interface VocalParts {
  head: string;
  detail?: string;
  style?: string;
  arc?: string;
  procs: string[];
}

/** Writes the chosen parts in reading order: voice, trait, delivery, arc, then effects. */
function renderVocal(p: VocalParts): string {
  let out = p.head;
  // Most traits read as "with ..."; bare ones ("subtle melisma on emotional peaks") need a comma.
  if (p.detail) out += (/^with\s/.test(p.detail) ? " " : ", ") + p.detail;
  if (p.style) out += (withCount(out) === 0 && withCount(p.style) === 0 && !out.includes(",") ? " with " : ", ") + p.style;
  if (p.arc) out += `, ${p.arc}`;
  if (p.procs.length) out += (withCount(out) === 0 ? ", treated with " : ", processed through ") + p.procs.join(" and ");
  return out;
}

/** Words a vocal phrase may share with the rest of its sentence without reading as a repeat. */
const SHARED_WORDS = new Set(["vocal", "vocals", "with", "into", "that", "then", "from", "over", "each", "every"]);

/** True when a planned phrase repeats a word the sentence already has ("female belt, powerful belt"). */
function repeatsWord(body: string, addition: string): boolean {
  const words = (t: string) => (t.toLowerCase().match(/[a-z]{4,}/g) ?? []).filter((w) => !SHARED_WORDS.has(w));
  const seen = new Set(words(body));
  return words(addition).some((w) => seen.has(w));
}

function withCount(text: string): number {
  return (text.match(/\bwith\b/gi) ?? []).length;
}

/** A user's own vocal words are worth quoting once they say more than "female vocals". */
function hasRichVocalDescription(vocals: SonicPlan["vocals"]): boolean {
  const words = vocals.rawDescription?.trim().split(/\s+/).length ?? 0;
  return words >= 4;
}

export function renderStyles(plan: SonicPlan): string {
  let text = compose(plan);
  text = fitToWindow(text, plan);
  const families = familyKeys([plan.primaryGenre, plan.secondaryGenre, plan.accentGenre]);
  if (!hasDrops(families)) text = sanitizeNonDropWording(text);
  return text;
}

/**
 * Final semantic guardrail for song/world/ambient families. Phrase banks already filter drop language,
 * but this protects against a future renderer or padding phrase reintroducing it. The replacements
 * preserve length, so the 925–975 character window remains unchanged.
 */
function sanitizeNonDropWording(text: string): string {
  return text
    .replace(/(?<!one-)\bdrops\b/gi, "peaks")
    .replace(/(?<!one-)\bdrop\b/gi, "peak");
}

function compose(plan: SonicPlan): string {
  const rng = mulberry32((plan.seed ^ 2779096485) >>> 0);
  const template = Math.floor(rng() * 10);
  const families = familyKeys([plan.primaryGenre, plan.secondaryGenre, plan.accentGenre]);
  const genreStr = genreClause(plan, rng);

  const moodBits = [plan.moodPrimary, plan.moodSecondary, plan.atmosphere[0]]
    .filter((v): v is string => Boolean(v))
    .filter((v, i, a) => a.findIndex((x) => x.toLowerCase() === v.toLowerCase()) === i)
    .slice(0, 2);

  const fits = (phrase: string) => fitsFamilies(phrase, families);
  const isBassMusic = hasDrops(families);
  const feel = feelPhrase(plan.metricFeel, families, rng);
  const drums = plan.drums.slice(0, 3).join(", ");
  const groove = plan.groove.slice(0, 2).join(" and ");
  const bass = plan.bass.slice(0, 3).join(", ");
  const behavior = plan.bassBehavior.slice(0, 2).join(" and ");
  const harm = plan.harmony.slice(0, 2).join(" and ");
  const mel = plan.melody[0];
  const sd = plan.soundDesign.slice(0, 2).join(" and ");
  const arr = plan.arrangement.slice(0, 2).join(" and ");
  const mix = plan.mix.slice(0, 4).join(", ");
  const master = plan.master[0];
  const instruments = plan.instruments.slice(0, 8).join(", ");
  const prod = oneFamily(rng, PRODUCTION, families);

  const isRapStyle =
    plan.vocals.style === "rap" ||
    plan.vocals.style === "talk-rap" ||
    plan.vocals.style === "melodic-rap" ||
    plan.vocals.style === "sung-rap" ||
    plan.vocals.style === "sing-rap" ||
    plan.vocals.style === "mumble-rap" ||
    plan.vocals.style === "soundcloud-rap" ||
    plan.vocals.style === "autotuned-rap" ||
    plan.vocals.style === "lyrical-rap" ||
    families.includes("rap") ||
    families.includes("drill");

  let s1: string;
  let s2: string;
  let s3: string;

  if (template === 0) {
    s1 = `${plan.bpm} BPM ${genreStr} with ${moodBits.join(", ")} atmosphere and ${prod}.`;
    s2 = `A ${feel} uses ${drums}${
      groove ? ` to create ${groove}` : ""
    }${isBassMusic ? " before each major low-end response" : ""}.`;
    s3 = `${cap(
      bass
    )} form the low-end hierarchy, with ${behavior}, leaving space between phrases so silence shapes the groove.`;
  } else if (template === 1) {
    s1 = `${plan.bpm} BPM ${genreStr}. Mood stays ${moodBits.join(" and ")}, engineered for ${prod}.`;
    s2 = `Rhythm centers on a ${feel}: ${drums} outline ${
      groove || "the pocket"
    }${isBassMusic ? ", then yield for bass entries" : ""}.`;
    s3 = `Low-end focus is ${bass}, driven by ${behavior}${isBassMusic ? ", with mono sub authority under moving mid-bass" : ""}.`;
  } else if (template === 2) {
    s1 = `Write a ${plan.bpm} BPM ${genreStr} record — ${moodBits.join(", ")} tone, ${prod}.`;
    s2 = `Groove language is ${feel} with ${drums}; ${
      groove || "pocket and weight"
    } define the body motion.`;
    s3 = `Bass stack: ${bass}. Movement comes from ${behavior}, saving full-band intensity for the peaks.`;
  } else if (template === 3) {
    s1 = `${plan.bpm} BPM. ${cap(genreStr)} energy, ${moodBits.join("/")} atmosphere, ${prod}.`;
    s2 = `${cap(feel)} programming (${drums}) builds ${
      groove || "head-nod space"
    }${isBassMusic ? " ahead of each bass answer" : ""}.`;
    s3 = `${cap(bass)} carry the foundation via ${behavior}, keeping phrases punchy and intentional.`;
  } else if (template === 4) {
    s1 = `${plan.bpm} BPM ${genreStr} built for ${moodBits.join(" and ")} nights — ${prod}.`;
    s2 = `Drums lead with ${drums} inside a ${feel}, locking ${
      groove || "the pocket"
    } so each section has somewhere to land.`;
    s3 = `The bass conversation is ${bass}, moving through ${behavior}.`;
  } else if (template === 5) {
    s1 = `Design a ${plan.bpm} BPM ${genreStr} with ${moodBits.join(", ")} color and ${prod}.`;
    s2 = `${cap(drums)} sit in a ${feel}; groove identity is ${groove || "weight and space"}.`;
    s3 = `Low end is scored as ${bass}, articulated by ${behavior}.`;
  } else if (template === 6) {
    s1 = `${plan.bpm} BPM ${genreStr}. High-definition ${moodBits.join(" ")} energy, ${prod}.`;
    s2 = `The pocket is a ${feel} — ${drums} in front, ${
      groove || "space after the snare"
    } behind.`;
    s3 = `The low end pairs ${bass} with ${behavior}, and rests are treated as hits.`;
  } else if (template === 7) {
    s1 = `${cap(genreStr)} at ${plan.bpm} BPM, ${moodBits.join(" plus ")} atmosphere, ${prod}.`;
    s2 = `Metric feel: ${feel}. Kit language: ${drums}. Body feel: ${groove || "physical pocket"}.`;
    s3 = `Bass architecture (${bass}) speaks in ${behavior}.`;
  } else if (template === 8) {
    s1 = `${plan.bpm} BPM ${genreStr} — ${prod}, ${moodBits.join(" and ")} in feel.`;
    s2 = `${cap(feel)} frame, drums as ${drums}, groove as ${groove || "nod and gap"}.`;
    s3 = `${cap(bass)} take turns via ${behavior} rather than stacking into a wall.`;
  } else {
    s1 = `A ${plan.bpm} BPM ${genreStr} cut: ${moodBits.join(", ")} mood, ${prod}.`;
    s2 = `Program a ${feel} with ${drums} so ${groove || "the pocket"} stays readable.`;
    s3 = `Keep ${bass} musical: ${behavior}.`;
  }

  // Harmonic bed & Melodic motifs
  let s4 = "";
  if (harm) {
    const harmVerb = pick2(rng, PRODUCTION_VERBS.harm.filter(fits));
    s4 += `${cap(harm)} ${harmVerb}`;
    if (mel) {
      const melBit = pick2(rng, [...PRODUCTION_VERBS.mel]).replace("{m}", mel);
      s4 += melBit;
    }
    s4 += ".";
  }
  if (sd) {
    s4 += (s4 ? " " : "") + pick2(rng, [...PRODUCTION_VERBS.texture]).replace("{sd}", sd);
  }

  // Unified Vocal Section
  let sVocal = "";
  if (plan.vocals.present) {
    const v = plan.vocals;
    const who = v.presentation === "female" ? "female" : v.presentation === "male" ? "male" : "lead";

    if (hasRichVocalDescription(v)) {
      // Direct, authentic enhancement of user's exact vocal description into Suno audio terms
      const rawText = v.rawDescription!.replace(/\.$/, "");
      const texture = v.textureVariations?.[0] ?? "crisp close-mic presence and polished stereo imaging";
      // The brief's words may already say "with"; then the room is joined without another one.
      const room = withCount(rawText) > 0 ? texture.split(/\s+with\s+/)[0] : texture;
      const joins =
        withCount(rawText) > 0 || withCount(room) > 0
          ? ["engineered for", "captured in", "finished in", "set in"]
          : ["engineered with", "captured with", "finished with", "balanced with"];

      const intros = [
        `Vocal performance features ${rawText}, ${joins[0]} ${room}.`,
        `Lead vocals deliver ${rawText}, ${joins[1]} ${room}.`,
        `Vocal delivery showcases ${rawText}, ${joins[2]} ${room}.`,
        `Topline features ${rawText}, ${joins[3]} ${room}.`,
      ];
      sVocal = intros[template % intros.length];
    } else {
      const styleKey = v.style && VOCAL_STYLE[v.style] ? v.style : isRapStyle ? "rap" : "sung";
      const fitting = (bank: string[]) => (bank.filter(fits).length ? bank.filter(fits) : bank);
      const stylePhrase = pick2(rng, fitting(VOCAL_STYLE[styleKey] ?? VOCAL_STYLE.rap));
      const arcBank = VOCAL_ARC[styleKey] ?? (isRapStyle ? VOCAL_ARC.rap : VOCAL_ARC.sung);
      const arc = pick2(rng, fitting(arcBank ?? VOCAL_ARC.rap));
      // A tone or register the brief named ("breathy female alto") is the voice; otherwise the
      // planned phrase for the genre is.
      const identity = v.briefVoice
        ? `${v.briefVoice} ${
            /^(melodic-rap|sung-rap|sing-rap)$/.test(v.style ?? "")
              ? "melodic rap vocal"
              : hasRapVocal(plan)
                ? "rap flow"
                : "vocal"
          }`
        : v.delivery && v.delivery.length > 15
          ? v.delivery
          : `${who} ${v.timbre ?? (isRapStyle ? "confident" : "expressive")} ${v.register ?? "mid-register"} delivery`;
      const intro = [`Vocal performance features`, `Lead vocals deliver`, `Vocals center on`][template % 3];
      sVocal = vocalSentence(intro, identity, v, stylePhrase, arc);
    }
  } else {
    sVocal = pick2(rng, [
      "Arrangement stays strictly instrumental, letting bass motifs and atmospheric textures lead the melodic hook role.",
      "Composed as a pure instrumental cut, driven by bass movement and rhythmic space rather than a lead vocal.",
      "Instrumental arrangement where melodic motifs and percussion carry the primary topline focus.",
    ]);
  }

  const mixLead = pick2(rng, [...PRODUCTION_VERBS.mixLead]);
  let s5 = `${mixLead} ${mix}`;
  if (master) s5 += `, finished with ${master}`;
  s5 += `. ${pick2(rng, [...PRODUCTION_VERBS.form])} ${arr}.`;

  // Flowing instrumentation phrasing without rigid label headers
  const instIntros = [
    `The arrangement centers on ${instruments}.`,
    `Instrumentation features ${instruments}.`,
    `Arranged with ${instruments}.`,
    `Instrumentation is built around ${instruments}.`,
    `Acoustic palette includes ${instruments}.`,
  ];
  const s6 = instIntros[template % instIntros.length];

  return [s1, s2, s3, s4.trim(), sVocal.trim(), s5.trim(), s6.trim()]
    .filter(Boolean)
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
}

function feelPhrase(feel: string, families: string[], rng: () => number): string {
  const opts = (FEELS[feel] ?? FEELS["half-time"]).filter((x) => fitsFamilies(x, families));
  return opts.length ? opts[Math.floor(rng() * opts.length) % opts.length] : "steady rhythmic pocket";
}

function genreClause(plan: SonicPlan, rng: () => number): string {
  if (plan.secondaryGenre && plan.accentGenre) {
    const glue = pick2(rng, [...GENRE_GLUE]);
    return glue
      .replace("{p}", plan.primaryGenre)
      .replace("{s}", plan.secondaryGenre)
      .replace("{a}", plan.accentGenre);
  }
  if (plan.secondaryGenre) {
    return rng() > 0.5
      ? `${plan.primaryGenre} and ${plan.secondaryGenre} hybrid`
      : `${plan.primaryGenre} x ${plan.secondaryGenre} hybrid`;
  }
  if (plan.accentGenre) {
    return `${plan.primaryGenre} with ${plan.accentGenre} accents`;
  }
  return plan.primaryGenre;
}

function pick2<T>(rng: () => number, arr: T[]): T {
  return arr[Math.floor(rng() * arr.length) % arr.length];
}

function fitToWindow(text: string, plan: SonicPlan): string {
  let t = text.replace(/\s+/g, " ").trim();
  const rng = mulberry32((plan.seed ^ 1597463007) >>> 0);
  const families = familyKeys([plan.primaryGenre, plan.secondaryGenre, plan.accentGenre]);
  const fits = (phrase: string) => fitsFamilies(phrase, families);

  if (t.length > MAX_CHARS) {
    const compressions: [RegExp, string][] = [
      [/, leaving space between phrases so silence shapes the groove/g, ""],
      [/, finished with [^.]*/g, ""],
      [/ keep the emotional center clear/g, " anchor the harmony"],
      [/, while [^,]+ stay sparse and memorable/g, ""],
      [/; [^.]+\./g, "."],
      [/moving from intimate restraint to powerful layered peaks/g, "moving intimate-to-powerful"],
      [/shifting soft close-mic lines into stacked peaks/g, "moving intimate-to-powerful"],
      [/with layered harmonies and subtle delay throws/g, "with layered harmonies"],
      [/before each major low-end response/g, "before each bass response"],
      [/and modern bass production/g, "and bass-forward production"],
      [/and club-ready bass production/g, "and bass-forward production"],
      [/and weight-driven hybrid production/g, "and bass-forward production"],
      [/Arrangement moves through/g, "Form uses"],
      [/Structure rides/g, "Form uses"],
      [/Texture design uses/g, "Textures use"],
      [/FX bed includes/g, "Textures use"],
      [/Transitions lean on/g, "Textures use"],
      [/form the low-end hierarchy, with/g, "drive the low end via"],
      [/Low-end focus is/g, "Low end is"],
      [/Mix architecture prioritizes/g, "Mix favors"],
      [/\s+/g, " "],
    ];
    for (const [re, rep] of compressions) {
      if (t.length <= MAX_CHARS) break;
      t = t.replace(re, rep).replace(/\s+/g, " ").trim();
    }
  }

  if (t.length > MAX_CHARS) {
    t = shrinkToMax(t, plan);
  }

  if (t.length < MIN_CHARS) {
    const familyPadding = families
      .flatMap((f) => FAMILY_PADDING[f] ?? [])
      .filter((p) => suitsVocal(p, plan));
    const genericPadding = hasRapVocal(plan)
      ? [
          ...rapPaddingFor(plan.vocals.style),
          ...PADDING.filter(
            (p) =>
              !/harmonies|singing|belting|chorus belt|pads, harmonies|chord stacks bloom/i.test(
                p
              )
          ),
        ]
      : PADDING;

    const shuffled = (list: string[]) =>
      list
        .map((e, i) => ({ e, i: (rng() * 1000 + i) % list.length }))
        .sort((a, b) => a.i - b.i)
        .map((x) => x.e);
    const groovePadding = [
      `Groove emphasis stays on ${
        plan.groove[0] ?? "pocket and weight"
      } with disciplined spacing and punchy transient response.`,
      `Rhythmic pocket remains locked to ${
        plan.groove[0] ?? "the foundation"
      } with clean transient dynamics.`,
    ];
    // The genre's own descriptive sentences go first; generic ones only top up.
    const order = [
      ...shuffled(familyPadding),
      ...shuffled([...genericPadding.filter((p) => !/vocal|singing|harmonies|sung/i.test(p)), ...groovePadding]),
    ].filter(fits);
    for (const e of order) {
      if (t.length >= MIN_CHARS) break;
      if (t.length + 1 + e.length <= MAX_CHARS) {
        t = insertBeforeInstruments(t, e);
      }
    }
  }

  const micros = MICROS.filter(fits);
  for (const m of micros) {
    if (t.length >= MIN_CHARS) break;
    if (t.length + 1 + m.length <= MAX_CHARS) {
      t = insertBeforeInstruments(t, m);
    }
  }

  if (t.length > MAX_CHARS) t = shrinkToMax(t, plan);

  let guard = 0;
  while (t.length < MIN_CHARS && guard < 10) {
    guard++;
    if (t.length + 1 + FINAL_PAD.length <= MAX_CHARS) {
      t = insertBeforeInstruments(t, FINAL_PAD);
    } else break;
  }

  if (!new RegExp(`\\b${plan.bpm}\\s*BPM\\b`, "i").test(t)) {
    t = `${plan.bpm} BPM ${t}`.replace(/\s+/g, " ").trim();
    if (t.length > MAX_CHARS) t = shrinkToMax(t, plan);
  }

  t = ensureAnchors(t, plan);

  if (
    !/Mix priorities favor|Mix favors|Mix architecture prioritizes|The mix keeps|Balance leans on/i.test(
      t
    )
  ) {
    const mixClause = `Mix priorities favor ${plan.mix.slice(0, 3).join(", ")}.`;
    const candidate = insertBeforeInstruments(t, mixClause);
    if (candidate.length <= MAX_CHARS) t = candidate;
    else {
      t = t
        .replace(
          /Dynamic arc moves from restrained detail into explosive half-time weight, then returns to reflective space before a final expanded release\.\s*/i,
          ""
        )
        .replace(/\s+/g, " ")
        .trim();
      const c2 = insertBeforeInstruments(t, mixClause);
      if (c2.length <= MAX_CHARS) t = c2;
    }
  }

  if (hasRapVocal(plan)) {
    t = t
      .replace(/bright stacked female harmonies/gi, "bright female rap doubles")
      .replace(/stacked background harmonies on chorus lifts/gi, "stacked background hype shouts on hook drops")
      .replace(/stacked background harmonies/gi, "stacked background ad-lib doubles")
      .replace(/layered vocal harmonies on hook/gi, "layered ad-lib chants on hook")
      .replace(/layered harmonies/gi, "stereo doubles")
      .replace(/wide harmonic ad-libs/gi, "wide stereo ad-lib echoes")
      .replace(/melodic lift with a soaring top-line fragment/gi, "cold pluck hook motif")
      .replace(/pads, harmonies, and ambience/gi, "pads, ad-libs, and ambience")
      .replace(/a harmony, a wobble syllable/gi, "a vocal chop, an 808 slide");
  }

  return t.replace(/\s+/g, " ").trim();
}

/**
 * Over the limit, drop whole filler sentences first (dropFillerSentence protects the vocal
 * line, the BPM and the brief's anchors); cut mid-text only when nothing else can go.
 */
function shrinkToMax(text: string, plan: SonicPlan): string {
  const anchors = anchorsToCheck(plan);
  let t = text;
  for (let guard = 0; t.length > MAX_CHARS && guard < 8; guard++) {
    const next = dropFillerSentence(t, anchors);
    if (next === t) break;
    t = next;
  }
  // The protected sentences alone can still be too long (three-genre briefs): shorten them
  // before the last-resort cut, which would otherwise slice off the vocal sentence.
  for (const shorten of PROTECTED_SHORTENINGS) {
    if (t.length <= MAX_CHARS) break;
    t = shorten(t).replace(/\s+/g, " ").trim();
  }
  if (t.length <= MAX_CHARS) return t;
  // Last resort: cut the other sentences, never the vocal one.
  const vocal = t.match(VOCAL_SENTENCE)?.[0];
  if (!vocal) return trimKeepingInstruments(t, MAX_CHARS);
  const others = t.replace(vocal, " ").replace(/\s+/g, " ").trim();
  return insertBeforeInstruments(trimKeepingInstruments(others, MAX_CHARS - vocal.length - 1), vocal);
}

const VOCAL_SENTENCE =
  /(?:Vocal performance features|Lead vocals deliver|Vocals center on|Vocal delivery showcases|Topline features)[^.]*\./;

const PROTECTED_SHORTENINGS: ((text: string) => string)[] = [
  // Drop the vocal's effects clause ("..., treated with X and Y.").
  (t) => t.replace(VOCAL_SENTENCE, (sentence) => sentence.replace(/, (?:treated|engineered|captured|finished|balanced) with [^.]*\./, ".")),
  // Keep the first five instruments.
  (t) =>
    t.replace(new RegExp(`(${INSTRUMENT_HEADER_RE.source})([^.]*)\\.`, "i"), (_m, header: string, list: string) =>
      `${header}${list.split(",").slice(0, 5).join(",")}.`
    ),
  // Drop the vocal arc, keeping who sings and how.
  (t) => t.replace(VOCAL_SENTENCE, (sentence) => sentence.replace(/^([^,]*),[^.]*\./, "$1.")),
];

/** Anchors the plan writes for the vocal ("male rap flow", "female vocals"), not the brief's own words. */
const VOCAL_ANCHOR = /^(female|male|lead) (rap flow|vocals)$/i;

function hasAnchor(text: string, anchor: string): boolean {
  // "Houston chopped male rap cadence" already says "male rap flow"; a separate
  // "keeps male rap flow front and center" sentence would spend characters to repeat it.
  const vocal = anchor.match(VOCAL_ANCHOR);
  if (vocal) {
    // Any lead of that gender honors "female vocals", a rap flow included.
    const kind = /rap/i.test(vocal[2])
      ? "rap"
      : "vocal|voice|singer|sung|croon|belt|alto|soprano|tenor|baritone|rap|flow|mc|delivery";
    return new RegExp(`\\b${vocal[1]}\\b[^.]*\\b(${kind})`, "i").test(text);
  }
  const esc = anchor.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`\\b${esc}\\b`, "i").test(text);
}

/**
 * Vocal anchors are derived from the user's own vocal words, so when those words are
 * quoted in the vocal sentence the anchors are already honored.
 */
function anchorsToCheck(plan: SonicPlan): string[] {
  const all = (plan.anchors ?? []).filter((a) => a && a.trim().length > 1);
  if (!plan.vocals.present || !hasRichVocalDescription(plan.vocals)) return all;
  const vocalAnchors = new Set(
    [
      plan.vocals.presentation && `${plan.vocals.presentation} rap flow`,
      plan.vocals.presentation && `${plan.vocals.presentation} vocals`,
      plan.vocals.style,
    ].filter(Boolean)
  );
  return all.filter((a) => !vocalAnchors.has(a));
}

/** One natural sentence for every brief element the prose has not mentioned yet. */
function anchorSentence(missing: string[]): string {
  const list =
    missing.length === 1
      ? missing[0]
      : `${missing.slice(0, -1).join(", ")} and ${missing[missing.length - 1]}`;
  return `The production keeps ${list} front and center.`;
}

function ensureAnchors(text: string, plan: SonicPlan): string {
  const need = anchorsToCheck(plan);
  let t = text;

  const missing = need.filter((anchor) => !hasAnchor(t, anchor) && !/\bBPM\b/i.test(anchor));
  if (missing.length) {
    const clause = anchorSentence(missing);
    let guard = 0;
    while (t.length + 1 + clause.length > MAX_CHARS && guard < 6) {
      guard++;
      const next = dropFillerSentence(t, need);
      if (next === t) break;
      t = next;
    }
    t = insertBeforeInstruments(t, clause);
    if (t.length > MAX_CHARS) t = shrinkToMax(t, plan);
  }

  if (!new RegExp(`\\b${plan.bpm}\\s*BPM\\b`, "i").test(t)) {
    t = `${plan.bpm} BPM ${t}`.replace(/\s+/g, " ").trim();
    if (t.length > MAX_CHARS) t = shrinkToMax(t, plan);
  }
  if (t.length < MIN_CHARS && t.length + 1 + FINAL_PAD.length <= MAX_CHARS) {
    t = insertBeforeInstruments(t, FINAL_PAD);
  }
  return t.replace(/\s+/g, " ").trim();
}

const INSTRUMENT_HEADER_RE =
  /(?:The arrangement centers on|Instrumentation features|Arranged with|Instrumentation is built around|Acoustic palette includes)/i;

function findInstrumentationIndex(text: string): number {
  const m = text.match(INSTRUMENT_HEADER_RE);
  return m && m.index != null ? m.index : -1;
}

function dropFillerSentence(text: string, anchors: string[]): string {
  const instIdx = findInstrumentationIndex(text);
  const head = instIdx > 0 ? text.slice(0, instIdx).trim() : text;
  const tail = instIdx > 0 ? text.slice(instIdx) : "";
  const parts = head.split(/(?<=\.)\s+/).filter(Boolean);
  if (parts.length < 3) return text;
  let drop = -1;
  for (let i = parts.length - 1; i >= 1; i--) {
    // An anchor only protects the sentence holding its last remaining mention.
    const rest = [...parts.slice(0, i), ...parts.slice(i + 1), tail].join(" ");
    if (anchors.some((a) => hasAnchor(parts[i], a) && !hasAnchor(rest, a))) continue;
    if (/\bbpm\b/i.test(parts[i])) continue;
    if (/vocal performance|lead vocal|vocal delivery|topline features|vocals center|vocals:/i.test(parts[i])) continue; // Never drop vocal section!
    drop = i;
    break;
  }
  if (drop < 0) return text;
  parts.splice(drop, 1);
  return `${parts.join(" ")}${tail ? " " + tail : ""}`.replace(/\s+/g, " ").trim();
}

export function insertBeforeInstruments(text: string, clause: string): string {
  const c = clause.trim();
  if (!c) return text;
  const instIdx = findInstrumentationIndex(text);
  if (instIdx > 0) {
    return `${text.slice(0, instIdx)}${c} ${text.slice(instIdx)}`.replace(/\s+/g, " ").trim();
  }
  return `${text} ${c}`.replace(/\s+/g, " ").trim();
}

export function trimKeepingInstruments(text: string, max: number): string {
  if (text.length <= max) return text;
  const inst = text.match(
    new RegExp(`\\s+${INSTRUMENT_HEADER_RE.source}.*$`, "i")
  );
  if (!inst) {
    let body = text.slice(0, max);
    const lastStop = body.lastIndexOf(". ");
    if (lastStop > max * 0.55) body = body.slice(0, lastStop + 1);
    else body = body.replace(/\s+\S*$/, "") + ".";
    return body.replace(/\s+/g, " ").trim();
  }
  const bodyBudget = max - inst[0].length;
  let body = text.slice(0, text.length - inst[0].length);
  if (body.length > bodyBudget) {
    body = body.slice(0, bodyBudget);
    const lastStop = Math.max(body.lastIndexOf(". "), body.lastIndexOf("; "));
    if (lastStop > bodyBudget * 0.55) body = body.slice(0, lastStop + 1);
    else body = body.replace(/\s+\S*$/, "") + ".";
  }
  return `${body}${inst[0]}`.replace(/\s+/g, " ").trim();
}

function cap(s: string): string {
  if (!s) return s;
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function formatSeed(seed: number): string {
  return String(seed >>> 0).padStart(10, "0");
}

export function formatTitle(seed: number, bpm: number, key: string | undefined, characters: number): string {
  return `Seed #: ${formatSeed(seed)} | BPM: ${bpm} | Key: ${key ?? "--"} | Total Characters: ${characters}`;
}
