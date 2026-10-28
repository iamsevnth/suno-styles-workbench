import { conceptsOf, dedupeByConcept, dedupeSimilar, genreClause, isCovered, joinList, reconcileMoods, sentenceCase } from "./blend.ts";
import { familyKeys, fitsFamilies, hasDrops } from "./families.ts";
import {
  FAMILY_PADDING,
  FEELS,
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

/* -------------------------------------------------------------------------------------------- */
/* Composition                                                                                    */
/*                                                                                                */
/* A Styles prompt is a fixed sequence of sections, each one natural sentence:                    */
/*   1 genre blend + BPM + mood   2 drums & groove   3 bass   4 harmony / melody / texture         */
/*   5 instrumentation   6 vocals   7 arrangement   8 mix                                         */
/* The plan decides WHAT is said; this file decides the order, the connective wording and how     */
/* much of each section fits in the 925–975 character window.                                    */
/* -------------------------------------------------------------------------------------------- */

/** How many items each section may list. The renderer starts at FULL and shrinks or grows from there. */
interface Detail {
  prod: number;
  drums: number;
  groove: number;
  bass: number;
  behavior: number;
  harm: number;
  mel: number;
  sd: number;
  inst: number;
  arr: number;
  mix: number;
  master: number;
}

const FULL: Detail = { prod: 1, drums: 3, groove: 2, bass: 3, behavior: 2, harm: 2, mel: 1, sd: 2, inst: 8, arr: 3, mix: 4, master: 1 };

/** Over the window: take detail away in order of least value, one step at a time. */
const SHRINK_STEPS: [keyof Detail, number][] = [
  ["master", 0], ["prod", 0], ["mel", 0], ["inst", 6], ["mix", 3], ["sd", 1], ["behavior", 1], ["groove", 1],
  ["harm", 1], ["inst", 5], ["arr", 2], ["mix", 2], ["drums", 2], ["inst", 4], ["sd", 0], ["bass", 2],
  ["inst", 3], ["arr", 1], ["groove", 0], ["harm", 0], ["mix", 1], ["inst", 2], ["behavior", 0], ["drums", 1],
  ["inst", 1], ["inst", 0],
];

/** Under the window: add detail in order of value before any generic sentence is used. */
const GROW_STEPS: [keyof Detail, number][] = [
  ["drums", 4], ["sd", 3], ["mel", 2], ["mix", 5], ["arr", 4], ["groove", 3], ["behavior", 3], ["inst", 9],
];

/** Everything about a plan that is chosen once, so shrinking and growing never reroll the wording. */
interface Choices {
  feel: string;
  prod: string;
  harmVerb: string;
  melTemplate: string;
  textureTemplate: string;
  drumForm: number;
  bassForm: number;
  instIntro: number;
  arrForm: number;
  mixLead: number;
  vocal: string;
  moodPhrase: string;
  genreText: string;
  isBassMusic: boolean;
}

function compose(plan: SonicPlan): string {
  const rng = mulberry32((plan.seed ^ 2779096485) >>> 0);
  const families = familyKeys([plan.primaryGenre, plan.secondaryGenre, plan.accentGenre]);
  const fits = (phrase: string) => fitsFamilies(phrase, families);
  const keepCaps = [plan.primaryGenre, plan.secondaryGenre, plan.accentGenre].filter((g): g is string => Boolean(g));
  const supporting = [plan.secondaryGenre, plan.accentGenre].filter((g): g is string => Boolean(g));

  const choices: Choices = {
    feel: feelPhrase(plan.metricFeel, families, rng),
    prod: oneFamily(rng, PRODUCTION, families),
    harmVerb: pick2(rng, PRODUCTION_VERBS.harm.filter(fits)),
    melTemplate: pick2(rng, MELODY_TEMPLATES),
    textureTemplate: pick2(rng, [...PRODUCTION_VERBS.texture]).trim(),
    drumForm: Math.floor(rng() * DRUM_FORMS.length),
    bassForm: Math.floor(rng() * BASS_FORMS.length),
    instIntro: Math.floor(rng() * INSTRUMENT_INTROS.length),
    arrForm: Math.floor(rng() * ARRANGEMENT_FORMS.length),
    mixLead: Math.floor(rng() * MIX_LEADS.length),
    vocal: vocalSection(plan, rng, fits, Math.floor(rng() * 4)),
    moodPhrase: plan.moodPhrase ?? reconcileMoods([plan.moodPrimary, plan.moodSecondary ?? ""].filter(Boolean))?.phrase ?? plan.moodPrimary,
    genreText: genreClause(plan.primaryGenre, supporting),
    isBassMusic: hasDrops(families),
  };

  const anchors = anchorsToCheck(plan);
  const build = (detail: Detail, extras: string[], pads: string[]) => assemble(plan, choices, detail, extras, pads, keepCaps);
  const covers = (text: string, anchor: string) =>
    hasAnchor(text, anchor) || (!VOCAL_ANCHOR.test(anchor) && !namesInstrument(anchor) && isCovered(text, anchor));
  const missingIn = (text: string) => anchors.filter((a) => !/\bBPM\b/i.test(a) && !covers(text, a));

  // Brief elements the plan's sections never mention join the instrumentation list instead of a filler sentence.
  const detail: Detail = { ...FULL };
  const extras = missingIn(build(detail, [], []));
  let text = build(detail, extras, []);

  // 1. Over the window: remove detail, never an anchor the brief asked for.
  for (const strict of [true, false]) {
    for (const [key, value] of SHRINK_STEPS) {
      if (text.length <= MAX_CHARS) break;
      if (detail[key] <= value) continue;
      const trial = { ...detail, [key]: value };
      const next = build(trial, extras, []);
      if (strict && anchors.some((a) => covers(text, a) && !covers(next, a))) continue;
      Object.assign(detail, trial);
      text = next;
    }
  }

  // 2. Under the window: add more of what the plan already chose, then genre sentences, then neutral ones.
  if (text.length < MIN_CHARS) {
    for (const [key, value] of GROW_STEPS) {
      if (text.length >= MIN_CHARS) break;
      if (detail[key] >= value) continue;
      const trial = { ...detail, [key]: value };
      const next = build(trial, extras, []);
      if (next.length <= MAX_CHARS && next.length > text.length) {
        Object.assign(detail, trial);
        text = next;
      }
    }
  }
  const pads: string[] = [];
  if (text.length < MIN_CHARS) {
    for (const pad of padCandidates(plan, families, text, rng)) {
      if (text.length >= MIN_CHARS) break;
      const next = build(detail, extras, [...pads, pad]);
      if (next.length <= MAX_CHARS) {
        pads.push(pad);
        text = next;
      }
    }
  }
  if (text.length > MAX_CHARS) text = trimKeepingInstruments(text, MAX_CHARS);

  text = sentenceCase(text, keepCaps);
  if (!new RegExp(`\\b${plan.bpm}\\s*BPM\\b`, "i").test(text)) text = `${plan.bpm} BPM ${text}`;
  return text.replace(/\s+/g, " ").trim();
}

const DRUM_FORMS = [
  (feel: string, drums: string, groove: string, tail: string) =>
    `${cap(article(feel))} ${feel} carries ${drums}${groove ? `, with ${groove}` : ""}${tail}.`,
  (feel: string, drums: string, groove: string, tail: string) =>
    `Drums sit in ${article(feel)} ${feel}: ${drums}${groove ? `, plus ${groove}` : ""}${tail}.`,
  (feel: string, drums: string, groove: string, tail: string) =>
    `The rhythm settles into ${article(feel)} ${feel} built from ${drums}${groove ? `, with ${groove}` : ""}${tail}.`,
];

const BASS_FORMS = [
  (bass: string, behavior: string) => `The low end pairs ${bass}${behavior ? ` with ${behavior}` : ""}.`,
  (bass: string, behavior: string) => `Bass is built on ${bass}${behavior ? `, moving through ${behavior}` : ""}.`,
  (bass: string, behavior: string) => `Low end centers on ${bass}${behavior ? `, articulated by ${behavior}` : ""}.`,
];

/** Agreement-free: every template works for one melodic item or several. */
const MELODY_TEMPLATES = [
  "Melodic hooks lean on {m}, kept short and memorable.",
  "Hooks are built from {m}, repeating like a chant.",
  "The lead role goes to {m}, surfacing at section peaks.",
  "{m} answer the bass sparingly",
];

const INSTRUMENT_INTROS = [
  "The sound palette centers on",
  "Instrumentation features",
  "Arranged with",
  "Instrumentation is built around",
  "Acoustic palette includes",
];

const ARRANGEMENT_FORMS = ["The arrangement moves through", "The record unfolds as", "Form runs through"];
const MIX_LEADS = ["Mix with", "Mix for", "Finish the mix with", "Balance the mix around"];

/** Sounds the brief can name outright; they need their own word in the prompt, not just a related one. */
const NAMED_INSTRUMENT_CONCEPTS = new Set(["keys", "guitar", "strings", "bells", "plucks", "drones", "percussion"]);

function namesInstrument(anchor: string): boolean {
  return [...conceptsOf(anchor)].some((c) => NAMED_INSTRUMENT_CONCEPTS.has(c)) ||
    /\b(flute|sax|saxophone|trumpet|harp|organ|synth|choir|violin|cello|marimba|vibraphone|rhodes|wurlitzer)\b/i.test(anchor);
}

function article(phrase: string): string {
  return /^[aeiou]/i.test(phrase) ? "an" : "a";
}

/** Join the first `count` items; an empty list stays empty so the section can drop out. */
function take(items: string[], count: number): string[] {
  return items.slice(0, Math.max(0, count));
}

function assemble(
  plan: SonicPlan,
  c: Choices,
  d: Detail,
  extras: string[],
  pads: string[],
  keepCaps: string[]
): string {
  const sentences: string[] = [];
  // Concepts already named by earlier sections: later sections never name the same sound again.
  const seen = new Set<string>();
  const claim = (items: string[]) => dedupeByConcept(items, seen);

  // 1. Primary genre, tempo and feel; the supporting genres carry explicit roles.
  const prod = d.prod > 0 ? `, delivered as ${c.prod}` : "";
  sentences.push(`${plan.bpm} BPM ${c.genreText}, ${c.moodPhrase}${prod}.`);

  // 2. Drums and groove.
  const drums = claim(take(plan.drums, d.drums));
  const groove = claim(take(plan.groove, d.groove));
  const tail = c.isBassMusic && drums.length ? ", leaving space before each bass answer" : "";
  if (drums.length) sentences.push(DRUM_FORMS[c.drumForm % DRUM_FORMS.length](c.feel, joinList(drums), joinList(groove), tail));
  else sentences.push(`The rhythm settles into ${article(c.feel)} ${c.feel}${groove.length ? ` with ${joinList(groove)}` : ""}.`);

  // 3. Bass.
  const bass = claim(take(plan.bass, d.bass));
  // "808 glides into the downbeat" after "sliding 808" says the same thing twice, so movement is claimed too.
  const behavior = claim(take(plan.bassBehavior, d.behavior));
  if (bass.length) sentences.push(BASS_FORMS[c.bassForm % BASS_FORMS.length](joinList(bass), joinList(behavior)));
  else if (behavior.length) sentences.push(`The low end moves through ${joinList(behavior)}.`);

  // 4. Harmony, melody and texture.
  const harm = claim(dedupeSimilar(take(plan.harmony, d.harm)));
  const mel = claim(take(plan.melody, d.mel));
  const sd = claim(take(plan.soundDesign, d.sd));
  const musical: string[] = [];
  if (harm.length) musical.push(`The harmonic bed uses ${joinList(harm)} to ${c.harmVerb}.`);
  if (mel.length) musical.push(c.melTemplate.replace("{m}", joinList(mel)).replace(/^(\{m\}|.)/, (m) => m.toUpperCase()).replace(/([^.])$/, "$1."));
  if (sd.length) musical.push(c.textureTemplate.replace("{sd}", joinList(sd)));
  sentences.push(...musical);

  // 5. Instrumentation: only sounds the sections above have not already named, plus brief elements nothing else carried.
  // An instrument the brief named ("Rhodes") stays even when a texture line already mentioned keys.
  const named = (plan.anchors ?? []).filter(namesInstrument);
  const claimedInst = claim(take(plan.instruments, d.inst).filter((i) => !named.some((a) => hasAnchor(i, a))));
  const keptInst = take(plan.instruments, d.inst).filter((i) => named.some((a) => hasAnchor(i, a)));
  const instruments = [...keptInst, ...claimedInst, ...extras].filter((v, i, all) => all.indexOf(v) === i);
  if (instruments.length) sentences.push(`${INSTRUMENT_INTROS[c.instIntro % INSTRUMENT_INTROS.length]} ${joinList(instruments)}.`);

  // 6. Vocals.
  sentences.push(c.vocal);

  // 7. Arrangement arc.
  // A stage that only restates a sound already described ("heavier 808") adds nothing to the arc; the arc keeps two stages at least.
  const stages = take(plan.arrangement, d.arr);
  const fresh = dedupeByConcept(stages, new Set(seen));
  const keep = new Set(fresh);
  for (const stage of stages) if (keep.size < Math.min(2, stages.length)) keep.add(stage);
  const arr = stages.filter((stage) => keep.has(stage));
  if (arr.length) sentences.push(`${ARRANGEMENT_FORMS[c.arrForm % ARRANGEMENT_FORMS.length]} ${arr.join(", then ")}.`);

  // Genre sentences that top up the length sit just before the mix so the mix stays last.
  sentences.push(...pads);

  // 8. Mix and finish.
  // A mix note that re-names a sound the sections above already described ("kick and 808 carved apart"
  // after "sliding 808") is skipped even when it also names something new: each sound is stated once.
  const restated = (phrase: string) => [...conceptsOf(phrase)].some((c) => seen.has(c));
  const mix = claim(dedupeSimilar(plan.mix).filter((m) => !restated(m))).slice(0, d.mix);
  const master = take(plan.master, d.master);
  if (mix.length) {
    sentences.push(`${MIX_LEADS[c.mixLead % MIX_LEADS.length]} ${joinList(mix)}${master.length ? `, finished for ${joinList(master)}` : ""}.`);
  }

  return sentences.join(" ").replace(/\s+/g, " ").trim();
}

/** The vocal sentence is built once; it keeps its own character budget (VOCAL_BUDGET). */
function vocalSection(plan: SonicPlan, rng: () => number, fits: (p: string) => boolean, variant: number): string {
  const families = familyKeys([plan.primaryGenre, plan.secondaryGenre, plan.accentGenre]);
  const isRapStyle =
    RAP_STYLES.has(plan.vocals.style ?? "") || families.includes("rap") || families.includes("drill");
  if (!plan.vocals.present) {
    return pick2(rng, [
      "Arrangement stays strictly instrumental, letting bass motifs and atmospheric textures lead the melodic hook role.",
      "Composed as a pure instrumental cut, driven by bass movement and rhythmic space rather than a lead vocal.",
      "Instrumental arrangement where melodic motifs and percussion carry the primary topline focus.",
    ]);
  }
  const v = plan.vocals;
  const who = v.presentation === "female" ? "female" : v.presentation === "male" ? "male" : "lead";

  if (hasRichVocalDescription(v)) {
    // The brief's own vocal words, translated into one engineered-room clause.
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
    return intros[variant % intros.length];
  }

  const styleKey = v.style && VOCAL_STYLE[v.style] ? v.style : isRapStyle ? "rap" : "sung";
  const fitting = (bank: string[]) => (bank.filter(fits).length ? bank.filter(fits) : bank);
  const stylePhrase = pick2(rng, fitting(VOCAL_STYLE[styleKey] ?? VOCAL_STYLE.rap));
  const arcBank = VOCAL_ARC[styleKey] ?? (isRapStyle ? VOCAL_ARC.rap : VOCAL_ARC.sung);
  const arc = pick2(rng, fitting(arcBank ?? VOCAL_ARC.rap));
  // A tone or register the brief named ("breathy female alto") is the voice; otherwise the planned phrase is.
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
  const intro = [`Vocal performance features`, `Lead vocals deliver`, `Vocals center on`][variant % 3];
  return vocalSentence(intro, identity, v, stylePhrase, arc);
}

/**
 * Sentences that top a short prompt up to the window, best first: the genre's own, then neutral ones.
 * A sentence is skipped when the sounds it names are already in the text, so padding never repeats a section.
 */
function padCandidates(plan: SonicPlan, families: string[], text: string, rng: () => number): string[] {
  const fits = (phrase: string) => fitsFamilies(phrase, families);
  const present = conceptsOf(text);
  const fresh = (sentence: string) => {
    const concepts = [...conceptsOf(sentence)];
    return concepts.length === 0 || concepts.some((k) => !present.has(k));
  };
  const familyPadding = families.flatMap((f) => FAMILY_PADDING[f] ?? []).filter((p) => suitsVocal(p, plan));
  const genericPadding = hasRapVocal(plan)
    ? [
        ...rapPaddingFor(plan.vocals.style),
        ...PADDING.filter((p) => !/harmonies|singing|belting|chorus belt|pads, harmonies|chord stacks bloom/i.test(p)),
      ]
    : PADDING;
  const shuffled = (list: string[]) =>
    list
      .map((e, i) => ({ e, i: (rng() * 1000 + i) % list.length }))
      .sort((a, b) => a.i - b.i)
      .map((x) => x.e);
  const ordered = [
    ...shuffled(familyPadding),
    ...shuffled(genericPadding.filter((p) => !/vocal|singing|harmonies|sung/i.test(p))),
    ...MICROS,
  ].filter(fits);
  const out: string[] = [];
  for (const sentence of ordered) {
    if (!fresh(sentence) || out.includes(sentence)) continue;
    out.push(sentence);
  }
  // Last resorts, used only when everything above has been tried.
  return [...out, FINAL_PAD];
}

function feelPhrase(feel: string, families: string[], rng: () => number): string {
  const opts = (FEELS[feel] ?? FEELS["half-time"]).filter((x) => fitsFamilies(x, families));
  return opts.length ? opts[Math.floor(rng() * opts.length) % opts.length] : "steady rhythmic pocket";
}

function pick2<T>(rng: () => number, arr: T[]): T {
  return arr[Math.floor(rng() * arr.length) % arr.length];
}

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

const INSTRUMENT_HEADER_RE =
  /(?:The sound palette centers on|Instrumentation features|Arranged with|Instrumentation is built around|Acoustic palette includes)/i;

function findInstrumentationIndex(text: string): number {
  const m = text.match(INSTRUMENT_HEADER_RE);
  return m && m.index != null ? m.index : -1;
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
