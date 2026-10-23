import {
  familyKeys,
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
import { toTitleCase } from "./title-case.ts";
import { SonicPlan } from "./types.ts";

export const MIN_CHARS = 925;
export const MAX_CHARS = 975;

export function renderStyles(plan: SonicPlan): string {
  let text = compose(plan);
  text = fitToWindow(text, plan);
  return text;
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

  const feel = feelPhrase(plan.metricFeel, rng);
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
    } before each major low-end response.`;
    s3 = `${cap(
      bass
    )} form the low-end hierarchy, with ${behavior}, leaving space between phrases so silence shapes the drop.`;
  } else if (template === 1) {
    s1 = `${plan.bpm} BPM ${genreStr}. Mood stays ${moodBits.join(" and ")}, engineered for ${prod}.`;
    s2 = `Rhythm centers on a ${feel}: ${drums} outline ${
      groove || "the pocket"
    }, then yield for bass entries.`;
    s3 = `Low-end focus is ${bass}, driven by ${behavior}, with mono sub authority under moving mid-bass.`;
  } else if (template === 2) {
    s1 = `Write a ${plan.bpm} BPM ${genreStr} record — ${moodBits.join(", ")} tone, ${prod}.`;
    s2 = `Groove language is ${feel} with ${drums}; ${
      groove || "pocket and weight"
    } define the body motion.`;
    s3 = `Bass stack: ${bass}. Movement comes from ${behavior}, never constant full-band intensity.`;
  } else if (template === 3) {
    s1 = `${plan.bpm} BPM. ${cap(genreStr)} hybrid energy, ${moodBits.join("/")} atmosphere, ${prod}.`;
    s2 = `${cap(feel)} programming (${drums}) builds ${
      groove || "head-nod space"
    } ahead of each bass answer.`;
    s3 = `${cap(bass)} carry the foundation via ${behavior}, keeping phrases punchy and intentional.`;
  } else if (template === 4) {
    s1 = `${plan.bpm} BPM ${genreStr} built for ${moodBits.join(" and ")} nights — ${prod}.`;
    s2 = `Drums lead with ${drums} inside a ${feel}, locking ${
      groove || "the pocket"
    } so the drop has somewhere to land.`;
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
    s3 = `${cap(behavior)} drives ${bass}, with rests treated as hits.`;
  } else if (template === 7) {
    s1 = `${cap(genreStr)} at ${plan.bpm} BPM, ${moodBits.join(" plus ")} atmosphere, ${prod}.`;
    s2 = `Metric feel: ${feel}. Kit language: ${drums}. Body feel: ${groove || "physical pocket"}.`;
    s3 = `Bass architecture (${bass}) speaks in ${behavior}.`;
  } else if (template === 8) {
    s1 = `${plan.bpm} BPM ${genreStr} — ${prod} aimed at ${moodBits.join(" and ")} translation.`;
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
    const harmVerb = pick2(rng, [...PRODUCTION_VERBS.harm]);
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

    if (v.rawDescription || (v.descriptors && v.descriptors.length > 0)) {
      // Direct, authentic enhancement of user's exact vocal description into Suno audio terms
      const rawText = v.rawDescription ? v.rawDescription.replace(/\.$/, "") : v.descriptors!.join(", ");
      const texture = v.textureVariations?.[0] ?? "crisp close-mic presence and polished stereo imaging";

      const intros = [
        `Vocal performance features ${rawText}, engineered with ${texture}.`,
        `Lead vocals deliver ${rawText}, captured with ${texture}.`,
        `Vocal delivery showcases ${rawText}, finished with ${texture}.`,
        `Topline features ${rawText}, balanced with ${texture}.`,
      ];
      sVocal = intros[template % intros.length];
    } else {
      const styleKey = v.style && VOCAL_STYLE[v.style] ? v.style : isRapStyle ? "rap" : "sung";
      const stylePhrase = pick2(rng, [...(VOCAL_STYLE[styleKey] ?? VOCAL_STYLE.rap)]);
      const proc = (v.processing ?? []).slice(0, 2).join(" and ");
      const arcBank = VOCAL_ARC[styleKey] ?? (isRapStyle ? VOCAL_ARC.rap : VOCAL_ARC.sung);
      const arc = pick2(rng, [...(arcBank ?? VOCAL_ARC.rap)]);
      const identity =
        v.delivery && v.delivery.length > 15
          ? v.delivery
          : `${who} ${v.timbre ?? (isRapStyle ? "confident" : "expressive")} ${v.register ?? "mid-register"} delivery`;

      let vBody = `${identity} with ${stylePhrase}`;
      if (v.language) vBody += ` in ${v.language}`;
      vBody += `, ${arc}`;
      if (proc) vBody += `, treated with ${proc}`;

      const intros = [
        `Vocal performance features ${vBody}.`,
        `Lead vocals deliver ${vBody}.`,
        `Vocals center on ${vBody}.`,
      ];
      sVocal = intros[template % intros.length];
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

function feelPhrase(feel: string, rng: () => number): string {
  const opts = FEELS[feel] ?? FEELS["half-time"] ?? ["rhythmic pocket"];
  return opts[Math.floor(rng() * opts.length) % opts.length];
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

  if (t.length > MAX_CHARS) {
    const compressions: [RegExp, string][] = [
      [/, leaving space between phrases so silence shapes the drop/g, ""],
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
    t = trimKeepingInstruments(t, MAX_CHARS);
  }

  if (t.length < MIN_CHARS) {
    const isRap =
      plan.vocals.style === "rap" ||
      plan.vocals.style === "talk-rap" ||
      plan.vocals.style === "melodic-rap" ||
      plan.vocals.style === "sung-rap" ||
      plan.vocals.style === "sing-rap" ||
      plan.vocals.style === "mumble-rap" ||
      plan.vocals.style === "soundcloud-rap" ||
      plan.vocals.style === "autotuned-rap" ||
      plan.vocals.style === "lyrical-rap" ||
      (plan.primaryGenre && /rap|drill|trap|hip hop/i.test(plan.primaryGenre));

    const paddingPool = isRap
      ? [
          ...RAP_PADDING,
          ...PADDING.filter(
            (p) =>
              !/harmonies|singing|belting|chorus belt|pads, harmonies|chord stacks bloom/i.test(
                p
              )
          ),
        ]
      : PADDING;

    const extras = [
      ...paddingPool.filter((p) => !/vocal|singing|harmonies|sung/i.test(p)),
      `Groove emphasis stays on ${
        plan.groove[0] ?? "pocket and weight"
      } with disciplined spacing and punchy transient response.`,
      `Low-end identity prioritizes ${
        plan.bass[0] ?? "mono sub"
      } under expressive mid-bass motion and clean mono compatibility.`,
      `Rhythmic pocket remains locked to ${
        plan.groove[0] ?? "the foundation"
      } with clean transient dynamics.`,
    ];
    const order = extras
      .map((e, i) => ({ e, i: (rng() * 1000 + i) % extras.length }))
      .sort((a, b) => a.i - b.i)
      .map((x) => x.e);
    for (const e of order) {
      if (t.length >= MIN_CHARS) break;
      if (t.length + 1 + e.length <= MAX_CHARS) {
        t = insertBeforeInstruments(t, e);
      }
    }
  }

  const micros = [...MICROS];
  for (const m of micros) {
    if (t.length >= MIN_CHARS) break;
    if (t.length + 1 + m.length <= MAX_CHARS) {
      t = insertBeforeInstruments(t, m);
    }
  }

  if (t.length > MAX_CHARS) t = trimKeepingInstruments(t, MAX_CHARS);

  let guard = 0;
  while (t.length < MIN_CHARS && guard < 10) {
    guard++;
    const m = "Clear club translation remains essential.";
    if (t.length + 1 + m.length <= MAX_CHARS) {
      t = insertBeforeInstruments(t, m);
    } else break;
  }

  if (!new RegExp(`\\b${plan.bpm}\\s*BPM\\b`, "i").test(t)) {
    t = `${plan.bpm} BPM ${t}`.replace(/\s+/g, " ").trim();
    if (t.length > MAX_CHARS) t = trimKeepingInstruments(t, MAX_CHARS);
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

  const isRapTrack =
    plan.vocals.style === "rap" ||
    plan.vocals.style === "talk-rap" ||
    plan.vocals.style === "melodic-rap" ||
    plan.vocals.style === "sung-rap" ||
    plan.vocals.style === "sing-rap" ||
    plan.vocals.style === "mumble-rap" ||
    plan.vocals.style === "soundcloud-rap" ||
    plan.vocals.style === "autotuned-rap" ||
    plan.vocals.style === "lyrical-rap" ||
    (plan.primaryGenre && /rap|drill|trap|hip hop/i.test(plan.primaryGenre));

  if (isRapTrack) {
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

function hasAnchor(text: string, anchor: string): boolean {
  const esc = anchor.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`\\b${esc}\\b`, "i").test(text);
}

function ensureAnchors(text: string, plan: SonicPlan): string {
  const need = (plan.anchors ?? []).filter((a) => a && a.trim().length > 1);
  let t = text;

  for (const anchor of need) {
    if (hasAnchor(t, anchor)) continue;
    const clause = `Keep ${anchor} explicit in the arrangement.`;
    let guard = 0;
    while (t.length + 1 + clause.length > MAX_CHARS && guard < 6) {
      guard++;
      const next = dropFillerSentence(t, need);
      if (next === t) break;
      t = next;
    }
    if (t.length + 1 + clause.length <= MAX_CHARS) {
      t = insertBeforeInstruments(t, clause);
    } else {
      t = insertBeforeInstruments(t, anchor.endsWith(".") ? anchor : `${anchor}.`);
      if (t.length > MAX_CHARS) t = trimKeepingInstruments(t, MAX_CHARS);
    }
  }

  if (!new RegExp(`\\b${plan.bpm}\\s*BPM\\b`, "i").test(t)) {
    t = `${plan.bpm} BPM ${t}`.replace(/\s+/g, " ").trim();
    if (t.length > MAX_CHARS) t = trimKeepingInstruments(t, MAX_CHARS);
  }
  if (t.length < MIN_CHARS) {
    const pad = "Clear club translation remains essential.";
    if (t.length + 1 + pad.length <= MAX_CHARS) t = insertBeforeInstruments(t, pad);
  }
  return t.replace(/\s+/g, " ").trim();
}

const INSTRUMENT_HEADER_RE =
  /(?:The arrangement centers on|Instrumentation features|Arranged with|Instrumentation is built around|Acoustic palette includes|Primary instrumentation:)/i;

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
    if (anchors.some((a) => hasAnchor(parts[i], a))) continue;
    if (/\bbpm\b/i.test(parts[i])) continue;
    if (/vocal performance|lead vocal|vocal delivery|topline features|vocals center|vocals:/i.test(parts[i])) continue; // Never drop vocal section!
    drop = i;
    break;
  }
  if (drop < 0) return text;
  parts.splice(drop, 1);
  return `${parts.join(" ")}${tail ? " " + tail : ""}`.replace(/\s+/g, " ").trim();
}

function insertBeforeInstruments(text: string, clause: string): string {
  const c = clause.trim();
  if (!c) return text;
  const instIdx = findInstrumentationIndex(text);
  if (instIdx > 0) {
    return `${text.slice(0, instIdx)}${c} ${text.slice(instIdx)}`.replace(/\s+/g, " ").trim();
  }
  return `${text} ${c}`.replace(/\s+/g, " ").trim();
}

function trimKeepingInstruments(text: string, max: number): string {
  if (text.length <= max) return text;
  const inst = text.match(
    /\s+(?:The arrangement centers on|Instrumentation features|Arranged with|Instrumentation is built around|Acoustic palette includes|Primary instrumentation:).*$/i
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

export function formatTitle(phrase: string, bpm: number, characters: number): string {
  const words = phrase.trim().split(/\s+/).slice(0, 6);
  const titled = toTitleCase(words.join(" "));
  return `${titled} | ${bpm} BPM | ${characters} total characters`;
}
