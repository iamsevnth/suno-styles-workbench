import { conceptsOf, dedupeByConcept, dedupeSimilar, genreClause, isCovered, joinList, reconcileMoods, sentenceCase } from "./blend.ts";
import { familyKeys, fitsFamilies, hasDrops } from "./families.ts";
import {
  FEELS,
  oneFamily,
  PRODUCTION,
  PRODUCTION_VERBS,
  VOCAL_ARC,
  VOCAL_STYLE,
} from "./lexicon.ts";
import { mulberry32 } from "./rng.ts";
import { applyTempoGenres, tempoStatedFor } from "./tempo-genre.ts";
import { allowedDeltas, withDropDelta } from "./wording.ts";
import { phraseExcluded } from "./intent.ts";
import { renderNative } from "./native/compose.ts";
import { lengthWindow, vocalBudget } from "./limits.ts";
export { MIN_CHARS, MAX_CHARS, HARD_MAX_CHARS } from "./limits.ts";
import { SonicPlan } from "./types.ts";

/**
 * The Styles target is 800–975 characters (Detailed, hard cap 1,000) or 600–850 (Tight).
 * Renderers expand with meaningful production detail; never pad with arbitrary text.
 */

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

function hasRapVocal(plan: SonicPlan): boolean {
  return plan.vocals.present === true && RAP_STYLES.has(plan.vocals.style ?? "");
}

/**
 * Characters the generated vocal sentence may use. The production carries a Styles prompt, so a
 * brief that only names the basics gets a short vocal line and the rest goes to the sonic plan.
 * Either way the vocal never takes more than its share of the prompt (25% Detailed, 15% Tight; see
 * limits.ts), so these are ceilings under that cap.
 */
export const VOCAL_BUDGET = { compact: 150, detailed: 300 } as const;

/** The vocal sentence's budget for a plan: its detail level, capped by the length's vocal share. */
export function vocalBudgetFor(v: SonicPlan["vocals"], length: SonicPlan["length"]): number {
  return Math.min(VOCAL_BUDGET[v.detail ?? "compact"], vocalBudget(length));
}

/**
 * The vocal sentence, built from the voice outward: who sings comes first, then the brief's own
 * processing, then planned details in order of usefulness, each only while it fits the budget.
 */
function vocalSentence(
  intro: string,
  identity: string,
  v: SonicPlan["vocals"],
  stylePhrase: string,
  arc: string,
  budget: number
): string {
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

const VOCAL_SENTENCE = /(?:^|(?<=[.!?]\s))(?:Vocal performance features|Lead vocals deliver|Vocals center on|Vocal delivery showcases|Topline features)[^.]*\./;

/**
 * Characters the vocal description takes in a prompt: the vocal sentence, or the native "with <vocal>"
 * clause. The Length setting caps this share (25% Detailed, 15% Tight).
 */
export function vocalPortion(styles: string, plan: SonicPlan): number {
  if (plan.vocals.present === false) return 0;
  const engine = plan.native
    ? (() => {
        const v = plan.native.sections.vocal?.[0];
        return v && styles.toLowerCase().includes(v.toLowerCase()) ? "with ".length + v.length : 0;
      })()
    : VOCAL_SENTENCE.exec(styles)?.[0].length ?? 0;
  // Wording the engine didn't write (an AI or assistant answer) is measured by the clauses about the voice.
  return engine || vocalClauses(styles);
}

const VOCAL_TERMS =
  /\b(?:vocal\w*|singers?|sung|sings?|singing|rap|rapp\w*|rapper|voices?|croon\w*|belt\w*|falsetto|melisma|ad-?libs?|whisper\w*|alto|soprano|tenor|baritone|choir)\b/i;

/**
 * Characters of the clauses (split at periods and semicolons) that talk about the voice. It works for any
 * wording, so it is how AI and assistant answers are held to the vocal share cap.
 */
export function vocalClauses(text: string): number {
  return text
    .split(/(?<=[.;])\s+/)
    .filter((clause) => VOCAL_TERMS.test(clause))
    .reduce((n, clause) => n + clause.length, 0);
}

/**
 * Renders a plan as Styles text. `wording` 0 is the prompt as generated; any other number re-renders the
 * same plan with different sentence frames, connectors and equivalent bank phrases (the Rephrase button).
 */
export function renderStyles(plan: SonicPlan, wording = 0): string {
  if (plan.native) return renderNative(plan, wording);
  let text = compose(plan, wording);
  const families = familyKeys([plan.primaryGenre, plan.secondaryGenre, plan.accentGenre]);
  if (!hasDrops(families)) text = sanitizeNonDropWording(text);
  return text;
}

/**
 * Final semantic guardrail for song/world/ambient families. Phrase banks already filter drop language,
 * but this protects against a future renderer or padding phrase reintroducing it. The replacements
 * preserve length, so the 800–975 character window remains unchanged.
 */
function sanitizeNonDropWording(text: string): string {
  return text
    .replace(/(?<!one-)\bdrops\b/gi, "peaks")
    .replace(/(?<!one-)\bdrop\b/gi, "peak");
}

/* -------------------------------------------------------------------------------------------- */
/* Composition                                                                                    */
/*                                                                                                */
/* A Styles prompt is a fixed sequence of sections, each one natural sentence, in the order of    */
/* the 2026-11-23 prompt-engineering research (docs/research): identity, groove, how the hook and  */
/* bass interact, texture, sections and what changes in the final drop, then two or three mix     */
/* priorities:                                                                                    */
/*   1 genre blend + tempo + mood   2 drums & groove   3 hook and bass (relational in bass music) */
/*   4 harmony / texture   5 instrumentation   6 vocals   7 arrangement + final-drop change   8 mix */
/* The plan decides WHAT is said; this file decides the order, the connective wording and how     */
/* much of each section fits the chosen length window.                                           */
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
  /** The final-drop change in bass music ("the final drop revoices the hook over displaced bass answers"). */
  delta: number;
  mix: number;
  master: number;
}

// Two or three mix priorities and no mastering buzzwords: the research finds a few consequential mix
// choices read better than a stack of them.
const FULL: Detail = { prod: 1, drums: 3, groove: 2, bass: 3, behavior: 2, harm: 2, mel: 1, sd: 2, inst: 8, arr: 3, delta: 1, mix: 3, master: 0 };

/**
 * Over the window: take detail away in order of least value, one step at a time. Decoration goes first
 * (production label, extra instruments, sound design, a third mix note); the groove, the hook and bass
 * relationship and the drop progression go last.
 */
const SHRINK_STEPS: [keyof Detail, number][] = [
  ["prod", 0], ["inst", 6], ["sd", 1], ["mix", 2], ["inst", 5], ["harm", 1], ["behavior", 1], ["inst", 4],
  ["sd", 0], ["groove", 1], ["inst", 3], ["drums", 2], ["bass", 2], ["arr", 2], ["inst", 2], ["harm", 0],
  ["groove", 0], ["behavior", 0], ["inst", 1], ["drums", 1], ["mix", 1], ["delta", 0], ["arr", 1], ["mel", 0],
  ["inst", 0],
];

/** Under the window: add detail in order of value before any generic sentence is used. */
const GROW_STEPS: [keyof Detail, number][] = [
  ["drums", 4], ["sd", 3], ["mel", 2], ["arr", 4], ["groove", 3], ["behavior", 3], ["inst", 9],
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
  hookForm: number;
  delta: string;
  vocal: string;
  moodPhrase: string;
  genreText: string;
  isBassMusic: boolean;
}

function compose(plan: SonicPlan, wording = 0): string {
  // Every musical choice comes from the plan's seed alone, so a Rephrase (wording > 0) keeps them all.
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
    hookForm: Math.floor(rng() * HOOK_BASS_FORMS.length),
    // Same single draw whatever is allowed, so excluding a word never shifts the other choices.
    delta: pick2(rng, allowedDeltas((d) => phraseExcluded(d, plan.exclusions))) ?? "",
    vocal: vocalSection(plan, rng, fits, Math.floor(rng() * 4)),
    moodPhrase: plan.moodPhrase ?? reconcileMoods([plan.moodPrimary, plan.moodSecondary ?? ""].filter(Boolean))?.phrase ?? plan.moodPrimary,
    genreText:
      genreClause(plan.primaryGenre, supporting) +
      (plan.unknownGenres?.length ? ` with ${plan.unknownGenres.join(" and ")} influences` : ""),
    isBassMusic: hasDrops(families),
  };

  const anchors = anchorsToCheck(plan);
  // Tempo-named genres are written by the tempo-genre rules on every build, so the length fitting below
  // measures the prompt exactly as it will read ("138 UKG Dubstep", no separate BPM).
  const build = (detail: Detail, extras: string[], look: Choices = choices) =>
    applyTempoGenres(assemble(plan, look, detail, extras, keepCaps), plan.bpm, !!plan.tempoGenre);
  // Anchors are compared without tempo numbers: "140 UKG" in the brief is honored by "138 UKG Dubstep".
  const neutral = (s: string) => applyTempoGenres(s, 0, false);
  const covers = (text: string, anchor: string) => {
    const t = neutral(text);
    const a = neutral(anchor);
    return hasAnchor(t, a) || (!VOCAL_ANCHOR.test(a) && !namesInstrument(a) && isCovered(t, a));
  };
  const missingIn = (text: string) => anchors.filter((a) => !/\bBPM\b/i.test(a) && !covers(text, a));

  // Brief elements the plan's sections never mention join the instrumentation list instead of a filler sentence.
  const detail: Detail = { ...FULL };
  const extras = missingIn(build(detail, []));
  let text = build(detail, extras);

  const { min: MIN_CHARS, max: MAX_CHARS } = lengthWindow(plan.length);

  // 1. Over the window: remove detail, never an anchor the brief asked for.
  for (const strict of [true, false]) {
    for (const [key, value] of SHRINK_STEPS) {
      if (text.length <= MAX_CHARS) break;
      if (detail[key] <= value) continue;
      const trial = { ...detail, [key]: value };
      const next = build(trial, extras);
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
      const next = build(trial, extras);
      if (next.length <= MAX_CHARS && next.length > text.length) {
        Object.assign(detail, trial);
        text = next;
      }
    }
  }
  if (text.length > MAX_CHARS) text = trimKeepingInstruments(text, MAX_CHARS);
  // Rephrase: the same detail and extras, so the same sounds; only sentence frames and the vocal opener change.
  // A rephrasing that lands outside the window is rejected by the checks, never trimmed into fewer facts.
  if (wording > 0) text = build(detail, extras, presentation(choices, plan, wording));

  text = sentenceCase(text, keepCaps);
  if (!tempoStatedFor(text, plan)) text = `${plan.bpm} BPM ${text}`;
  return text.replace(/\s+/g, " ").trim();
}

/** Openers for the vocal sentence; each takes the same noun phrase, so swapping one changes no fact. */
const VOCAL_HEADS = ["Vocal performance features", "Lead vocals deliver", "Vocals center on", "Vocal delivery showcases", "Topline features"];

/**
 * The presentation of a Rephrase: different sentence frames (each differs from the original's) and vocal
 * opener, with every musical choice (feel, phrases, final-drop change, vocal details) kept as it was.
 */
function presentation(c: Choices, plan: SonicPlan, wording: number): Choices {
  const rng = mulberry32((plan.seed ^ 0x51ed270b ^ Math.imul(wording, 0x9e3779b1)) >>> 0);
  const other = (current: number, size: number) => (size < 2 ? current : (current + 1 + Math.floor(rng() * (size - 1))) % size);
  const head = VOCAL_HEADS.find((h) => c.vocal.startsWith(h + " "));
  const vocal = head ? VOCAL_HEADS[other(VOCAL_HEADS.indexOf(head), VOCAL_HEADS.length)] + c.vocal.slice(head.length) : c.vocal;
  return {
    ...c,
    drumForm: other(c.drumForm % DRUM_FORMS.length, DRUM_FORMS.length),
    bassForm: other(c.bassForm % BASS_FORMS.length, BASS_FORMS.length),
    hookForm: other(c.hookForm % HOOK_BASS_FORMS.length, HOOK_BASS_FORMS.length),
    instIntro: other(c.instIntro % INSTRUMENT_INTROS.length, INSTRUMENT_INTROS.length),
    arrForm: other(c.arrForm % ARRANGEMENT_FORMS.length, ARRANGEMENT_FORMS.length),
    mixLead: other(c.mixLead % MIX_LEADS.length, MIX_LEADS.length),
    vocal,
  };
}

const DRUM_FORMS = [
  (feel: string, drums: string, groove: string, tail: string) =>
    `${cap(article(feel))} ${feel} carries ${drums}${groove ? `, with ${groove}` : ""}${tail}.`,
  (feel: string, drums: string, groove: string, tail: string) =>
    `Drums sit in ${article(feel)} ${feel}: ${drums}${groove ? `, plus ${groove}` : ""}${tail}.`,
  (feel: string, drums: string, groove: string, tail: string) =>
    `The rhythm settles into ${article(feel)} ${feel} built from ${drums}${groove ? `, with ${groove}` : ""}${tail}.`,
];

/**
 * Bass music: the hook and the bass in one relational sentence ("X carries the hook while the bass answers
 * in the gaps"), so the listener hears a call and response, not two unconnected tag lists. Agreement-free.
 */
const HOOK_BASS_FORMS = [
  (hook: string, bass: string, behavior: string) =>
    `The hook sits on ${hook}, with ${bass} answering in the gaps between kick accents${behavior ? `, moving through ${behavior}` : ""}.`,
  (hook: string, bass: string, behavior: string) =>
    `The hook rides on ${hook} while the low end answers with ${bass}${behavior ? `, moving through ${behavior}` : ""}.`,
  (hook: string, bass: string, behavior: string) =>
    `A hook on ${hook} leads, and the low end replies in the gaps with ${bass}${behavior ? `, articulated by ${behavior}` : ""}.`,
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

/**
 * The arc's first `count` stages, except that a drop stage outranks a middle stage: when the arc is cut,
 * the opening and the drop progression stay (research §3.1: the drop progression goes last).
 */
function takeArc(stages: string[], count: number): string[] {
  if (stages.length <= count) return stages.slice();
  if (count <= 0) return [];
  const ranked = stages.map((s, i) => ({ s, i, rank: i === 0 ? 0 : /\bdrop\b/i.test(s) ? 1 : 2 }));
  const kept = [...ranked].sort((a, b) => a.rank - b.rank || (a.rank === 1 ? b.i - a.i : a.i - b.i)).slice(0, count);
  return kept.sort((a, b) => a.i - b.i).map((k) => k.s);
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
  keepCaps: string[]
): string {
  const sentences: string[] = [];
  // Concepts already named by earlier sections: later sections never name the same sound again.
  const seen = new Set<string>();
  const claim = (items: string[]) => dedupeByConcept(items, seen);

  // 1. Primary genre, tempo and feel; the supporting genres carry explicit roles.
  const prod = d.prod > 0 ? `, delivered as ${c.prod}` : "";
  // A mood the genre name already says ("Dark Trap, dark") is not repeated.
  const genreWords = new Set(c.genreText.toLowerCase().match(/[a-z]+/g) ?? []);
  const moodWords = c.moodPhrase.toLowerCase().match(/[a-z]+/g) ?? [];
  const mood = moodWords.length && moodWords.every((w) => genreWords.has(w)) ? "" : `, ${c.moodPhrase}`;
  sentences.push(`${plan.bpm} BPM${plan.meter ? `, ${plan.meter},` : ""} ${c.genreText}${mood}${prod}.`);

  // 2. Drums and groove.
  const drums = claim(take(plan.drums, d.drums));
  const groove = claim(take(plan.groove, d.groove));
  const tail = c.isBassMusic && drums.length ? ", leaving space before each bass answer" : "";
  if (drums.length) sentences.push(DRUM_FORMS[c.drumForm % DRUM_FORMS.length](c.feel, joinList(drums), joinList(groove), tail));
  else sentences.push(`The rhythm settles into ${article(c.feel)} ${c.feel}${groove.length ? ` with ${joinList(groove)}` : ""}.`);

  // 3. Hook and bass. In bass music the two are one call-and-response sentence; elsewhere the bass has its own.
  const mel = claim(take(plan.melody, d.mel));
  const bass = claim(take(plan.bass, d.bass));
  // "808 glides into the downbeat" after "sliding 808" says the same thing twice, so movement is claimed too.
  const behavior = claim(take(plan.bassBehavior, d.behavior));
  // "No hook" in the brief: the call and response is written without the word, as the ordinary bass sentence.
  const relational = c.isBassMusic && mel.length > 0 && bass.length > 0 && !phraseExcluded("hook", plan.exclusions);
  if (relational) sentences.push(HOOK_BASS_FORMS[c.hookForm % HOOK_BASS_FORMS.length](joinList(mel), joinList(bass), joinList(behavior)));
  else if (bass.length) sentences.push(BASS_FORMS[c.bassForm % BASS_FORMS.length](joinList(bass), joinList(behavior)));
  else if (behavior.length) sentences.push(`The low end moves through ${joinList(behavior)}.`);

  // 4. Harmony, melody and texture.
  const harm = claim(dedupeSimilar(take(plan.harmony, d.harm)));
  const sd = claim(take(plan.soundDesign, d.sd));
  const musical: string[] = [];
  if (harm.length) musical.push(`The harmonic bed uses ${joinList(harm)} to ${c.harmVerb}.`);
  if (mel.length && !relational) musical.push(c.melTemplate.replace("{m}", joinList(mel)).replace(/^(\{m\}|.)/, (m) => m.toUpperCase()).replace(/([^.])$/, "$1."));
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
  const stages = takeArc(plan.arrangement, d.arr);
  const fresh = dedupeByConcept(stages, new Set(seen));
  const keep = new Set(fresh);
  for (const stage of stages) if (keep.size < Math.min(2, stages.length)) keep.add(stage);
  // The drop progression is never dropped for restating a sound (research §3.1: it goes last).
  if (c.isBassMusic) for (const stage of stages) if (/\bdrop\b/i.test(stage)) keep.add(stage);
  // Bass music says what the final drop changes, unless a stage already does ("harder second drop").
  const kept = stages.filter((stage) => keep.has(stage));
  const arr = c.isBassMusic && d.delta > 0 && c.delta ? withDropDelta(kept, c.delta) : kept;
  if (arr.length) sentences.push(`${ARRANGEMENT_FORMS[c.arrForm % ARRANGEMENT_FORMS.length]} ${arr.join(", then ")}.`);

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
    const heads = ["Vocal performance features", "Lead vocals deliver", "Vocal delivery showcases", "Topline features"];
    const head = heads[variant % heads.length];
    const budget = vocalBudgetFor(v, plan.length);
    const full = `${head} ${rawText}, ${joins[variant % joins.length]} ${room}.`;
    if (full.length <= budget) return full;
    // Over the vocal share: the engineered room goes first, then the brief's own clauses from the end.
    return fitClauses(head, rawText, budget);
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
  return vocalSentence(intro, identity, v, stylePhrase, arc, vocalBudgetFor(v, plan.length));
}

/** "<head> a, b, c." keeping as many of the brief's own clauses (from the start) as fit the budget. */
const VOCAL_EFFECT = /\b(?:auto-?tun\w*|pitch correction|delay|reverb|echo|slapback|distort\w*|vocoder|talkbox|formant|doubl\w*|chorus effect|saturat\w*|telephone|lo-?fi filter|throws?)\b/i;

function fitClauses(head: string, text: string, budget: number): string {
  const clauses = text.split(/,\s*/).filter(Boolean);
  // Clauses without an effect go first, from the end; the effects the brief asked for go last.
  const fits = () => `${head} ${clauses.join(", ")}.`.length <= budget;
  for (let i = clauses.length - 1; i > 0 && !fits(); i--) if (!VOCAL_EFFECT.test(clauses[i])) clauses.splice(i, 1);
  while (clauses.length > 1 && !fits()) clauses.pop();
  let out = `${head} ${clauses.join(", ")}.`;
  if (out.length > budget) {
    const words = clauses[0].split(/\s+/);
    while (words.length > 2 && `${head} ${words.join(" ")}.`.length > budget) words.pop();
    out = `${head} ${words.join(" ")}.`;
  }
  return out;
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
