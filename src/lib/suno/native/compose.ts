import { conceptsOf, reconcileMoods } from "../blend.ts";
import { MIN_CHARS, MAX_CHARS } from "../limits.ts";
import { phraseExcluded } from "../intent.ts";
import { applyNativeIdentity } from "./identity.ts";
import { moodClash } from "../consistency.ts";
import { hashString, mulberry32 } from "../rng.ts";
import { NativeRoute, NativeParts, ParsedInput, SonicPlan, VocalPreferences } from "../types.ts";
import { GENERAL_SUB, NATIVE_SUBS } from "./catalog.ts";
import { NativeSub } from "./types.ts";

export const NATIVE_MIN = MIN_CHARS;
export const NATIVE_MAX = MAX_CHARS;
/** A production-detail target comfortably inside the 800–975-character window. */
const NATIVE_FILL = 875;

const subById = (id: string): NativeSub => NATIVE_SUBS.find((s) => s.id === id) ?? GENERAL_SUB;

export interface Hit {
  sub: NativeSub;
  index: number;
  len: number;
  text: string;
}

const NOUN_AFTER = /^\s+(?:percussion|guitars?|hats?|drums?|bass|vocals?|synths?|riffs?|pads?|samples?|kicks?|snares?|loops?|bells?|stabs?|hooks?|chords?|leads?|melod(?:y|ies)|vocal|keys|piano|strings?|chops?)\b/i;

/** Every native sub-genre the brief names, in the order it names them; a sub inside a longer match is dropped. */
export function nativeHits(text: string): Hit[] {
  const lower = text.toLowerCase();
  const hits: Hit[] = [];
  for (const sub of NATIVE_SUBS) {
    const re = new RegExp(sub.match.source, "g");
    if (sub.context && !sub.context(lower)) continue;
    for (const m of lower.matchAll(re)) {
      const index = m.index ?? 0;
      // "folk ballad", "indie anthem": the noun after a genre belongs to the genre.
      const tail = /^\s+(?:ballad|ballads|anthem|anthems|jam|groove|waltz|lullaby|hymn|banger|vibes?)\b/.exec(lower.slice(index + m[0].length));
      const full = tail ? m[0] + tail[0] : m[0];
      // "black metal", "country rock": a modifier right before a one-word genre belongs to it.
      const pre = /(?:black|death|power|nu|glam|speed|symphonic|melodic|math|dream|soft|southern|psychedelic|surf|christian|gothic|goth|chamber|cinematic|dark)\s+$/.exec(lower.slice(0, index));
      const head = pre && !/\s/.test(m[0].trim()) ? pre[0] : "";
      hits.push({ sub, index: index - head.length, len: full.length + head.length, text: head + full });
      break;
    }
  }
  const kept = hits.filter(
    (h) => !hits.some((o) => o !== h && o.len > h.len && h.index >= o.index && h.index + h.len <= o.index + o.len)
  );
  const spans = new Set<string>();
  const unique = kept.filter((h) => {
    const key = `${h.index}:${h.len}`;
    if (spans.has(key)) return false;
    spans.add(key);
    return true;
  });
  unique.sort((a, b) => a.index - b.index);
  return unique.filter((h, i) => i === 0 || !NOUN_AFTER.test(lower.slice(h.index + h.len)));
}

/** True when the ontology genre is one a matched native sub-genre takes over. */
export function nativeCovers(hits: Hit[], genre: { name: string; aliases?: string[] }): boolean {
  const name = genre.name.toLowerCase();
  const spelled = [name, ...(genre.aliases ?? [])];
  return hits.some(
    (h) => (h.sub.claims ?? []).includes(name) || spelled.some((s) => s.length > 2 && h.text.includes(s))
  );
}

const capFirst = (s: string) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);

/** Acronyms keep their capitals when the user's lower-cased words become a label ("ukg dubstep" is "UKG dubstep"). */
const ACRONYMS: [RegExp, string][] = [
  [/\bukg\b/g, "UKG"],
  [/\buk\b/g, "UK"],
  [/\bedm\b/g, "EDM"],
  [/\bnyc\b/g, "NYC"],
  [/\bny\b/g, "NY"],
  [/\bbr\b/g, "BR"],
  [/\bdnb\b/g, "DnB"],
  [/\bd&b\b/g, "D&B"],
  [/\br&b\b/g, "R&B"],
];
export function acronyms(words: string): string {
  return ACRONYMS.reduce((t, [re, to]) => t.replace(re, to), words);
}

/** The user's own genre words, capitalised only at the start so nothing is rewritten. */
export function verbatimLabel(words: string): string {
  return capFirst(acronyms(words.trim()));
}

/** A label in the middle of a sentence: the first letter drops to lower case unless the word is an acronym. */
export function midSentenceLabel(words: string): string {
  const w = acronyms(words.trim());
  return /^[A-Z]{2}/.test(w) ? w : w.charAt(0).toLowerCase() + w.slice(1);
}

/** The label to show for a hit when it differs from the catalog name; undefined when the name already says it. */
export function labelOf(hit: Hit): string | undefined {
  if (hit.sub.keepName) return undefined;
  const text = hit.text.replace(/\s+/g, " ").trim();
  if (text.split(" ").length > 1 || /-/.test(text)) return text.toLowerCase() === hit.sub.name.toLowerCase() ? undefined : text;
  return hit.sub.keepWords && text.toLowerCase() !== hit.sub.name.toLowerCase() ? text : undefined;
}

/* ------------------------------------------------------------------------------------------ */
/* Plan                                                                                        */
/* ------------------------------------------------------------------------------------------ */

const VOCAL_WORD = /\bvocal|\bsing\w*|\bchoir|\bvoice|\blyric|\brap(?:s|per|ping)?\b|\bad-?libs?\b|\bchants?\b|\bshouts?\b|\bchops?\b|\bhook phrase/i;

function shuffled<T>(rng: () => number, items: T[]): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

function uniq(items: string[]): string[] {
  const seen = new Set<string>();
  return items.filter((i) => {
    const k = i.toLowerCase();
    if (!i || seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}

/** A phrase the brief wrote must not carry a second tempo, or the prompt would contradict itself. */
const stripBpm = (s: string) => s.replace(/\b\d{2,3}\s*BPM\b/gi, "").replace(/\s{2,}/g, " ").trim();

function voiceOf(v: VocalPreferences | undefined): string {
  if (!v) return "";
  if (v.briefVoice) return v.briefVoice;
  return [v.timbre, v.presentation && v.presentation !== "lead" ? v.presentation : undefined, v.register]
    .filter(Boolean)
    .join(" ");
}

const isRapStyle = (v?: VocalPreferences) => !!v?.style && /rap/.test(v.style);

/** Mood words a brief uses that the shared mood list lacks; read straight from the brief's own text. */
const NATIVE_MOODS = [
  "calm", "mellow", "chill", "relaxed", "peaceful", "serene", "dreamy", "cozy", "wistful", "tender", "gentle", "playful", "bright",
  "happy", "joyful", "sad", "lonely", "romantic", "hopeful", "groovy", "funky", "sunny", "laid-back", "smooth", "hazy", "ethereal",
  "focused", "rebellious", "frantic", "powerful", "gloomy", "haunting", "sleepy", "breezy", "cheerful", "carefree",
];
const CALM_WORDS = new Set(["calm", "mellow", "chill", "relaxed", "peaceful", "serene", "gentle", "tender", "cozy", "sleepy", "breezy", "dreamy", "intimate", "restrained", "reflective", "warm"]);
const HARSH_WORDS = new Set(["aggressive", "dark", "menacing", "gritty", "heavy", "explosive", "frantic", "raw", "energetic", "hype", "powerful", "intense", "relentless", "brutal"]);

const article = (word: string) => (/^(?:[aio]|e(?!u)|u(?![snl]i|[ts]e|ni))/i.test(word) ? "an" : "a");

function moodsOf(parsed: ParsedInput, instrumentPhrases: string[], genreWords = ""): string[] {
  const text = parsed.raw.toLowerCase();
  const found = new Map<string, number>();
  for (const m of [...parsed.moods, ...NATIVE_MOODS]) {
    const at = text.search(new RegExp(`(?:^|[^a-z0-9-])${m.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?:$|[^a-z0-9-])`));
    if (at >= 0 || parsed.moods.includes(m)) found.set(m, at >= 0 ? at : 9999);
  }
  // "warm Rhodes" describes an instrument, not the record's mood.
  const own = (m: string) => instrumentPhrases.some((p) => new RegExp(`\\b${m}\\b`).test(p));
  // "heavy metal" and "dark ambient" already say it; the mood slot goes to a different word.
  const inGenre = (m: string) => new RegExp(`\\b${m}\\b`).test(genreWords.toLowerCase());
  return [...found.entries()].sort((x, y) => x[1] - y[1]).map(([m]) => m).filter((m) => !own(m) && !inGenre(m));
}

/** One readable mood phrase; a calm word beside a harsh one becomes "calm with an aggressive edge". */
function moodPhraseOf(moods: string[], fallback: string[]): { phrase: string; primary: string } {
  if (!moods.length) return { phrase: fallback.slice(0, 2).join(" and "), primary: fallback[0] };
  const calm = moods.filter((m) => CALM_WORDS.has(m));
  const harsh = moods.filter((m) => HARSH_WORDS.has(m));
  if (calm.length && harsh.length) {
    const calmFirst = moods.indexOf(calm[0]) <= moods.indexOf(harsh[0]);
    const [lead, edge] = calmFirst ? [calm[0], harsh[0]] : [harsh[0], calm[0]];
    const rest = moods.filter((m) => m !== lead && m !== edge && !CALM_WORDS.has(m) && !HARSH_WORDS.has(m)).slice(0, 1);
    return { phrase: `${[...rest, lead].join(" and ")} with ${article(edge)} ${edge} edge`, primary: lead };
  }
  const reconciled = reconcileMoods(moods.slice(0, 3));
  const lead = moods.slice(0, 3);
  const phrase = reconciled && !/ edge$/.test(reconciled.phrase) ? reconciled.phrase : lead.length > 1 ? `${lead.slice(0, -1).join(", ")} and ${lead[lead.length - 1]}` : lead[0];
  return { phrase, primary: reconciled?.primary ?? lead[0] };
}

const wordsOf = (s: string) => new Set(s.toLowerCase().match(/[a-z]+/g) ?? []);

const VOCAL_DELIVERY_RE = /\b(?:shouted|screamed|growled|raspy|husky|breathy|airy|smoky|whispered|belted|crooned|falsetto|gritty|raw|soulful|operatic|gravelly|twangy|sweet|silky|soft|hushed|powerful|nasal)\b/g;

const RAP_KIND: Record<string, string> = {
  rap: "rap vocal",
  "talk-rap": "talk-rap vocal",
  "melodic-rap": "sung-rap vocal",
  "sung-rap": "sung-rap vocal",
  "sing-rap": "sung-rap vocal",
  "autotuned-rap": "autotuned rap vocal",
  "mumble-rap": "mumble rap vocal",
  "soundcloud-rap": "mumble rap vocal",
  "lyrical-rap": "lyrical rap vocal",
};

/** The vocal style a brief gets: its own, "sung" when it names a voice but no style, else the genre's default. */
function styleOf(v: VocalPreferences | undefined, fallback: string | undefined): string | undefined {
  const asked = !!(v && (v.style || v.presentation || v.timbre || v.briefVoice || v.register));
  return v?.style ?? (asked ? "sung" : fallback);
}

function vocalLine(parsed: ParsedInput, approaches: string[], instrumental: boolean, fallbackStyle?: string): string {
  if (instrumental) return "";
  const v = parsed.vocals;
  const voice = voiceOf(v);
  const style = styleOf(v, fallbackStyle);
  const kind = style && RAP_KIND[style] ? RAP_KIND[style] : style === "chops" ? "vocal chops" : "lead vocal";
  const subject = voice ? `${voice} ${kind}` : kind;
  // Only descriptors the brief itself wrote; the parser also plans extras the user never asked for.
  const brief = parsed.raw.toLowerCase();
  // Vocal delivery words the brief wrote that the parser may not list as descriptors ("shouted", "raspy").
  const spoken = (brief.match(VOCAL_DELIVERY_RE) ?? []).filter((w) => !voice.toLowerCase().includes(w));
  const ownAll = [...(v?.descriptors ?? []), ...spoken].filter((d, i, all) => all.indexOf(d) === i).filter((d) => brief.includes(d.toLowerCase()) && !voice.toLowerCase().includes(d.toLowerCase()));
  // Effects the brief wrote ("slapback delay", "light autotune") stay in the vocal line, in the brief's order.
  const processingAll = (v?.processing ?? []).filter((x) => brief.includes(x.toLowerCase().split(/[\s-]+/)[0].slice(0, 6)));
  // A brief that describes the voice at length gets a longer vocal line; otherwise one short clause.
  const detailed = new Set([v?.register, v?.timbre, v?.delivery, ...ownAll, ...processingAll].filter(Boolean)).size >= 4 || (v?.rawDescription?.trim().split(/\s+/).length ?? 0) >= 10;
  const own = ownAll.slice(0, detailed ? 3 : 2);
  const processing = processingAll.filter((x) => !own.some((o) => o.toLowerCase().includes(x.toLowerCase().split(/[\s-]+/)[0].slice(0, 6)))).slice(0, detailed ? 3 : v?.processingFromBrief ? 1 : processingAll.length ? 1 : 0);
  const taken = wordsOf([subject, ...own, ...processing].join(" "));
  const approach = approaches.find((a) => ![...wordsOf(a)].some((w) => w.length > 3 && taken.has(w))) ?? approaches[0];
  return [subject, ...own, ...processing, own.length || processing.length ? "" : approach].filter(Boolean).join(", ");
}

const PROPER: [RegExp, string][] = [[/\brhodes\b/gi, "Rhodes"], [/\bwurlitzer\b/gi, "Wurlitzer"], [/\bhammond\b/gi, "Hammond"], [/\bfender\b/gi, "Fender"]];
const proper = (s: string) => PROPER.reduce((t, [re, to]) => t.replace(re, to), s);

/** Drops phrases that name a sound already named earlier ("Rhodes" lead then "Rhodes electric piano" extra). */
/** Only one mix phrase may talk about the master: "loud limited master; loud glossy master" says the same thing twice. */
function oneMaster(list: string[]): string[] {
  let seen = false;
  return list.filter((x) => {
    if (!/\bmaster(?:ing)?\b/i.test(x)) return true;
    if (seen) return false;
    seen = true;
    return true;
  });
}

/** Drops a phrase whose words are all inside an earlier phrase ("pitched vocal ad-libs" then "pitched vocal ad-lib layers"). */
function nearDistinct(items: string[]): string[] {
  const FILLER = new Set(["layer", "hit", "fx", "effect", "and", "with", "the", "of"]);
  const stems = (x: string) => new Set(x.toLowerCase().split(/[^a-z0-9]+/).map((w) => w.replace(/s$/, "")).filter((w) => w.length > 1 && !FILLER.has(w)));
  const kept: { text: string; words: Set<string> }[] = [];
  for (const item of items) {
    const words = stems(item);
    const dup = kept.some((k) => [...words].every((w) => k.words.has(w)) || [...k.words].every((w) => words.has(w)));
    if (!dup) kept.push({ text: item, words });
  }
  return kept.map((k) => k.text);
}

function distinct(lists: string[][]): string[][] {
  const seen = new Set<string>();
  return lists.map((list) => {
    const out: string[] = [];
    list.forEach((phrase, i) => {
      const concepts = conceptsOf(phrase);
      const lower = phrase.toLowerCase();
      const dupText = out.some((o) => o.toLowerCase().includes(lower) || lower.includes(o.toLowerCase()));
      const redundant = concepts.size > 0 && [...concepts].every((c) => seen.has(c));
      if (dupText || (redundant && i > 0)) return;
      out.push(phrase);
      concepts.forEach((c) => seen.add(c));
    });
    return out;
  });
}

function nativeDetail(v: ParsedInput["vocals"]): "compact" | "detailed" {
  if (!v) return "compact";
  const traits = new Set([v.register, v.timbre, v.delivery, v.language, ...(v.descriptors ?? []), ...(v.processing ?? [])].filter(Boolean));
  return traits.size >= 4 || (v.rawDescription?.trim().split(/\s+/).length ?? 0) >= 10 ? "detailed" : "compact";
}

export function buildNativePlan(
  parsed: ParsedInput,
  seed: number,
  opts: { variantIndex?: number; diversityRank?: number; attempt?: number } = {}
): SonicPlan {
  const route = parsed.native as NativeRoute;
  const primary = subById(route.primary);
  const secondary = route.secondary ? subById(route.secondary) : undefined;
  const tertiary = route.tertiary ? subById(route.tertiary) : undefined;
  const rng = mulberry32(seed ^ hashString(`${route.primary}|${route.secondary ?? ""}|${route.tertiary ?? ""}|${opts.variantIndex ?? 0}`));
  const rankOffset = (opts.diversityRank ?? 0) + (opts.attempt ?? 0);

  const instrumental =
    parsed.instrumental ||
    parsed.vocals?.present === false ||
    (!parsed.vocals?.present && !parsed.vocals?.presentation && !parsed.vocals?.style && primary.vocal === "none");

  const bpm = Math.round(
    parsed.bpm ?? (() => {
      const [lo, hi, mid] = primary.bpm;
      const jitter = (rng() - 0.5) * 0.4 * (hi - lo);
      // Ballads, lullabies and waltzes sit at the slow end of the genre's range.
      const slow = /\b(?:ballad|lullaby|waltz)\b/i.test(parsed.raw) ? lo + (mid - lo) * 0.4 : mid;
      return Math.min(hi, Math.max(lo, slow + jitter * (slow === mid ? 1 : 0.5)));
    })()
  );

  const bank = (key: keyof NativeSub): string[] => {
    const p = (primary[key] as string[] | undefined) ?? [];
    // A non-EDM secondary (pop, folk) never lends phrases to a bass or rap record.
    const lends = secondary && (!primary.edm || secondary.edm);
    const s = lends ? ((secondary[key] as string[] | undefined) ?? []) : [];
    // Secondary genre flavors the pool but the primary's phrases come first.
    const sp = shuffled(rng, p);
    const ss = shuffled(rng, s).slice(0, 2);
    const t = tertiary && primary.edm && tertiary.edm ? ((tertiary[key] as string[] | undefined) ?? []) : [];
    const tt = shuffled(rng, t).slice(0, 1);
    // A bass or rap blend weaves the second genre in from the second phrase on, so both worlds are audible.
    const woven = primary.edm && ss.length ? [sp[0], ss[0], tt[0], sp[1], ss[1], ...sp.slice(2)].filter((x): x is string => !!x) : [...sp, ...ss];
    const pool = uniq(woven);
    const withoutExclusions = pool.filter((x) => !phraseExcluded(x, parsed.exclusions));
    const allowed = instrumental ? withoutExclusions.filter((x) => !VOCAL_WORD.test(x)) : withoutExclusions;
    // Rotate so sibling variants lead with different phrases even when the shuffles collide.
    const rot = allowed.length ? rankOffset % Math.min(allowed.length, p.length || allowed.length) : 0;
    return [...allowed.slice(rot), ...allowed.slice(0, rot)];
  };

  const briefTextures = (parsed.textures ?? []).map(stripBpm);
  const scenes = (parsed.scenes ?? []).filter((s) => !briefTextures.some((t) => t.includes(s)));
  const instrumentPhrases = (parsed.instrumentPhrases ?? []).map(stripBpm);

  const leadBank = bank("leads");
  // A bass or rap record keeps the instruments the brief names (hand percussion, strings, piano) beside its own leads.
  const NAMED_KEEP = /^(?:guitar|strings|piano|Rhodes electric piano|brass|flute|saxophone|harp|organ|hand percussion|chopped sample|mallets|bells)$/;
  const namedInstruments = primary.edm ? (parsed.explicitInstruments ?? []).filter((i) => NAMED_KEEP.test(i)).map((i) => (i === "chopped sample" ? "chopped sample hits" : i)) : [];
  const leads = instrumentPhrases.length
    ? instrumentPhrases.slice(0, 3)
    : uniq([...namedInstruments.slice(0, 2), ...leadBank]).slice(0, 3);

  const genreWords = [route.labels?.primary, route.labels?.secondary, primary.name, route.verbatim].filter(Boolean).join(" ");
  const moodList = moodsOf(parsed, instrumentPhrases, genreWords);
  const mood = moodPhraseOf(moodList, primary.moods.filter((m) => !new RegExp(`\\b${m}\\b`, "i").test(genreWords)));
  const moodPhrase = mood.phrase;
  const moodPrimary = mood.primary;

  const userDrums = [...parsed.drumHints, ...parsed.grooveHints.map((g) => `${g} groove`)].map(stripBpm);
  const userBass = parsed.bassHints.map(stripBpm);
  const userHarmony = parsed.harmonyHints.map(stripBpm);
  const userMix = parsed.mixHints.map(stripBpm);
  const userArr = parsed.arrangementHints.map(stripBpm);
  const userDesign = parsed.soundDesignHints.map(stripBpm);

  const primaryName = route.labels?.primary ? verbatimLabel(route.labels.primary) : primary.name;
  const secondaryName = route.labels?.secondary ? midSentenceLabel(route.labels.secondary) : secondary ? midSentenceLabel(secondary.name) : undefined;
  const tertiaryName = route.labels?.tertiary ? midSentenceLabel(route.labels.tertiary) : tertiary ? midSentenceLabel(tertiary.name) : undefined;
  const genreLabel = route.verbatim
    ? secondary
      ? `${verbatimLabel(route.verbatim)} meets ${midSentenceLabel(primaryName)}`
      : verbatimLabel(route.verbatim)
    : primary.id === "general"
      ? ""
      : secondary
        ? `${primaryName} with ${secondaryName}${tertiaryName ? ` and ${tertiaryName}` : ""} influences`
        : primaryName;

  const vocalStyle = styleOf(parsed.vocals, primary.vocalStyle);
  const approaches = vocalStyle && RAP_KIND[vocalStyle] && (primary.rapVocals?.length || secondary?.rapVocals?.length) ? bank("rapVocals") : bank("vocals");
  const vocalSentence = proper(vocalLine(parsed, approaches, instrumental, primary.vocalStyle));
  // A bass-music brief that already has "vocal chops" in its vocal line does not get them again as sound design.
  const noRepeatChops = (list: string[]) => (primary.edm && /\bchop/i.test(vocalSentence) ? list.filter((x) => !/\bchop/i.test(x)) : list);
  const [dLeads, dDrums, dBass, dHarmony, dTextures, dExtras] = distinct([
    leads,
    uniq([...userDrums, ...bank("drums")]),
    uniq([...userBass, ...bank("bass")]),
    uniq([...userHarmony, ...bank("harmony")]),
    uniq([...briefTextures, ...userDesign, ...noRepeatChops(bank("textures"))]),
    uniq(noRepeatChops(bank("extras"))),
  ]);
  // A supporting bass or rap genre's signature rhythm joins the primary's first drum phrase, so the blend is audible
  // even when the drum line only has room for one phrase.
  const signatures = [secondary, tertiary].filter((x): x is NativeSub => !!x && !!x.edm && !!primary.edm && !!x.signature).map((x) => x.signature as string);
  const withSignatures = (drums: string[]) => {
    if (!signatures.length || !drums.length) return drums;
    const [first, ...rest] = drums;
    return uniq([`${first} plus ${signatures[0]}`, ...signatures.slice(1), ...rest]);
  };
  const sections: Record<string, string[]> = {
    leads: dLeads.map(proper),
    vocal: [vocalSentence].filter(Boolean),
    drums: withSignatures(dDrums),
    bass: dBass,
    harmony: dHarmony,
    textures: dTextures,
    extras: dExtras,
    era: bank("eras"),
    arrangement: uniq([...userArr, ...bank("arrangement")]),
    mix: oneMaster(uniq([...userMix, ...noRepeatChops(bank("mix"))])),
    ending: noRepeatChops(bank("endings")),
  };

  const identity = applyNativeIdentity(primary, sections, parsed, opts.diversityRank ?? opts.variantIndex ?? 0, parsed.variationMode ?? "precision");
  Object.assign(sections, identity.sections);

  const parts: NativeParts = {
    genreLabel,
    sections,
    scenes,
    textures: briefTextures,
    edm: !!primary.edm,
    allow: [primary.allow, secondary?.allow, tertiary?.allow].filter(Boolean).join(" ") || undefined,
    headings: primary.headings ?? (primary.edm ? { bass: "Bass design and chords", textures: "Sound design" } : undefined),
  };
  const key = parsed.key;

  const anchors = uniq([
    `${bpm} BPM`,
    genreLabel,
    ...(route.verbatim ? [route.verbatim] : []),
    ...scenes,
    ...briefTextures,
    ...instrumentPhrases,
    ...moodList.filter((m) => moodPhrase.includes(m)),
    ...(key ? [key] : []),
    ...(instrumental ? ["instrumental"] : []),
  ]);

  const vocals: VocalPreferences = { ...(parsed.vocals ?? {}) };
  if (instrumental) vocals.present = false;
  else {
    if (vocals.present === undefined) vocals.present = true;
    vocals.style ??= (styleOf(parsed.vocals, primary.vocalStyle) as VocalPreferences["style"]) ?? "sung";
    vocals.detail ??= nativeDetail(parsed.vocals);
  }

  const recipeId = hashString(
    [route.primary, route.secondary, leads[0], sections.vocal[0], sections.drums[0], sections.era[0], sections.arrangement[0], sections.mix[0], sections.textures[0]].join("|")
  ).toString(36);

  return {
    bpm,
    key,
    meter: parsed.meter,
    exclusions: parsed.exclusions,
    arrangementCues: parsed.arrangementCues,
    variationMode: parsed.variationMode,
    sonicIdentity: identity.identity.label,
    primaryGenre: genreLabel || "Original",
    secondaryGenre: secondary?.name,
    accentGenre: tertiary?.name,
    donors: {},
    moodPrimary,
    moodPhrase,
    bpmNotes: parsed.genreNotes?.filter((n) => /BPM/.test(n)),
    atmosphere: scenes,
    metricFeel: primary.feel,
    groove: parsed.grooveHints,
    drums: sections.drums,
    bass: sections.bass,
    bassBehavior: [],
    harmony: sections.harmony,
    melody: leads,
    instruments: uniq([...instrumentPhrases, ...leads]),
    vocals,
    arrangement: sections.arrangement,
    soundDesign: sections.textures,
    mix: sections.mix,
    master: [],
    titlePhrase: [primary.name, moodPrimary, scenes[0] ?? leads[0]].filter(Boolean).join(" "),
    anchors,
    recipeId,
    briefText: parsed.raw,
    native: parts,
    scenes,
    textures: briefTextures,
    variantAxes: ["lead", "vocal approach", "production era"],
    seed,
  };
}

/* ------------------------------------------------------------------------------------------ */
/* Render                                                                                      */
/* ------------------------------------------------------------------------------------------ */

const take = (list: string[] | undefined, n: number): string[] => (list ?? []).slice(0, Math.max(0, n));
const lowerFirst = (s: string) => (/^[A-Z][a-z]/.test(s) ? s.charAt(0).toLowerCase() + s.slice(1) : s);
const sentence = (s: string) => `${s.replace(/[.;,\s]+$/g, "")}.`;

/** "a, b and c" for short phrases; semicolons when a phrase already carries "and" or a comma. */
function listOf(items: string[]): string {
  const list = uniq(items);
  if (list.length <= 1) return list[0] ?? "";
  if (list.some((i) => /\band\b|,/.test(i))) return list.join("; ");
  return `${list.slice(0, -1).join(", ")} and ${list[list.length - 1]}`;
}

/** How many phrases of each section the prompt carries; the renderer grows these one step at a time. */
interface Detail {
  leads: number;
  drums: number;
  bass: number;
  harmony: number;
  textures: number;
  extras: number;
  era: number;
  mix: number;
  arrangement: number;
  ending: number;
}

/** Order in which detail is added until the prompt reaches the window; most useful first. */
const GROW: (keyof Detail)[] = [
  "arrangement", "era", "textures", "mix", "extras", "ending", "harmony", "leads", "textures", "extras", "mix", "leads", "textures",
];

function compose(plan: SonicPlan, d: Detail): string {
  const n = plan.native as NativeParts;
  const s = n.sections;
  const out: string[] = [];

  const mood = plan.moodPhrase ? ` with ${article(plan.moodPhrase)} ${plan.moodPhrase} mood` : "";
  const scene = n.scenes.length ? `, evoking ${article(n.scenes[0])} ${listOf(n.scenes)} atmosphere` : "";
  const key = plan.key ? ` in ${plan.key}` : "";
  const meter = plan.meter ? `, ${plan.meter}` : "";
  const head = n.genreLabel ? `${n.genreLabel} at ${plan.bpm} BPM${meter}${key}` : `${plan.bpm} BPM${meter}${key}`;
  out.push(sentence(`${head}${mood}${scene}`));

  const leads = listOf(take(s.leads, d.leads));
  const vocal = s.vocal[0];
  out.push(sentence(vocal ? `Led by ${leads}, with ${lowerFirst(vocal)}` : `Fully instrumental, led by ${leads}`));

  if (d.drums && s.drums.length) out.push(sentence(`Drums: ${listOf(take(s.drums, d.drums))}`));
  const low = [...take(s.bass, d.bass), ...take(s.harmony, d.harmony)];
  if (low.length) out.push(sentence(`${n.headings?.bass ?? "Bass and harmony"}: ${listOf(low)}`));

  const tex = nearDistinct([...take(s.textures, d.textures), ...take(s.extras, d.extras)]);
  if (tex.length) out.push(sentence(`${n.headings?.textures ?? "Textures"}: ${listOf(tex)}`));

  const prod = [...take(s.era, d.era), ...take(s.mix, d.mix)];
  if (prod.length) out.push(sentence(`Production: ${listOf(prod)}`));

  if (d.arrangement && s.arrangement.length) out.push(sentence(`Arrangement: ${listOf(take(s.arrangement, 1))}`));
  if (d.ending && s.ending.length) out.push(take(s.ending, 1)[0]);

  return out.join(" ").replace(/\s{2,}/g, " ").replace(/\s+([,.])/g, "$1").trim();
}

export function renderNative(plan: SonicPlan): string {
  const n = plan.native as NativeParts;
  const d: Detail = {
    leads: 1,
    drums: 1,
    bass: 1,
    harmony: 1,
    // The brief's own textures always stay.
    textures: Math.max(1, n.textures.length),
    extras: 0,
    era: 0,
    mix: 1,
    arrangement: 0,
    ending: 0,
  };
  let text = compose(plan, d);
  // Sparse banks (jazz) need more than one pass; later passes also deepen drums and bass.
  for (const key of [...GROW, ...GROW, "drums", "bass", "drums", "bass", "harmony", "leads"] as (keyof Detail)[]) {
    if (text.length >= NATIVE_FILL) break;
    const trial = { ...d, [key]: Math.min(d[key] + 1, key === "arrangement" || key === "ending" || key === "era" ? 1 : 4) };
    if (trial[key] === d[key]) continue;
    const next = compose(plan, trial);
    if (next.length <= NATIVE_MAX) {
      Object.assign(d, trial);
      text = next;
    }
  }
  return text;
}
