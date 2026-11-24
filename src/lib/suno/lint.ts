/**
 * Brief Check: deterministic checks on a creative brief before (and after) generation.
 *
 * The rule ids follow the prompt-engine research of 11/23/2026
 * (docs/research/prompt-engine-rules-2026-11-23.json). They are music-production heuristics, not
 * Suno rules: a finding never blocks generation, it explains what the brief leaves ambiguous and how
 * to say it more precisely. Rules about Suno's create screen (audio influence, voice ids, mashups,
 * reference counts) do not apply to text the Workbench writes and are not checked here.
 */
import type { ParsedInput, SonicPlan } from "./types.ts";
import { semanticAxes } from "./semantic.ts";
import { EDM_SUBS } from "./native/catalog-edm.ts";

const EDM_IDS = new Set(EDM_SUBS.map((x) => x.id));

export type LintSeverity = "warning" | "suggestion";

export interface LintFinding {
  id:
    | "TOO_MANY_EQUAL_GENRES"
    | "TEMPO_CONVENTION_CONFLICT"
    | "TWO_PRIMARY_KICK_SYSTEMS"
    | "MASSIVE_FULL_RANGE_BASS_STACK"
    | "CONSTANT_MAX_HAT_DENSITY"
    | "ELECTRONIC_HATS_EXCLUDED"
    | "UNDEFINED_HOOK"
    | "UNSPECIFIED_SECOND_DROP";
  severity: LintSeverity;
  title: string;
  /** What the brief says that is ambiguous or in tension. */
  message: string;
  /** How to rewrite the brief so the engine (and Suno) can follow it. */
  fix: string;
}

const TWO_STEP = /\b(?:2|two)[\s-]?step\b|\bukg\b|\buk garage\b|\bgarage shuffle\b/i;
const FOUR_FLOOR = /\bfour[\s-]on[\s-]the[\s-]floor\b|\b4[\s-]?on[\s-]?the[\s-]?floor\b|\b4\s?[x/]\s?4\b|\bfour[\s-]to[\s-]the[\s-]floor\b/i;
const SECTION_WORDS = /\b(?:intros?|verses?|choruses?|hook sections?|builds?|drops?(?:\s?(?:1|2|one|two))?|breakdowns?|bridges?|outros?|switch(?:es|ing)?|flip(?:s|ping)?|then|halfway|second half|section|transition|alternat\w*|trades?)\b/i;

/** Low-end sources a mix can only carry one or two of at once. */
const LOW_END_SOURCES: [string, RegExp][] = [
  ["808", /\b808s?\b(?!\s*(?:hats?|hi-?hats?|claps?|snares?|cowbell))/i],
  ["sub bass", /\bsub[\s-]?bass\b|\bmono sub\b|\bsine sub\b/i],
  ["Reese", /\breese\b/i],
  ["wobble", /\bwobbles?\b|\bwub\b/i],
  ["growl / FM bass", /\bgrowls?\b|\bfm bass\b/i],
  ["neuro bass", /\bneuro(?:funk)? bass\b/i],
  ["acid bass", /\bacid bass\b|\b303\b/i],
  ["donk / bassline", /\bdonk\b|\bspeed garage bassline\b|\borgan bass\b/i],
];

const HOOK_WORDS = /\b(?:hook|motif|riff|lead|melod\w*|topline|chops?|chant|whistle|arp\w*|pluck\w*|sample[ds]?|vocal\w*|sing\w*|rap\w*|flute|horn\w*|piano|guitar|sax\w*|bell\w*|chorus|refrain|theme)\b/i;
const SECOND_DROP = /\b(?:second|2nd|final|last|closing)\s+drop\b|\bdrop\s?(?:2|two)\b/i;
const BIGGER = /\b(?:bigger|heavier|harder|more intense|louder|massive|huger|crazier|more energy)\b/i;
const DROP_CHANGE = /\b(?:switch\w*|flip\w*|new|change\w*|different|half[\s-]?time|double[\s-]?time|call|answer\w*|variation|rhythm|motif|re-?voic\w*|key change|modulat\w*|bass (?:swap|change)|drums? (?:swap|change))\b/i;
const HATS_WANTED = /\b(?:808|trap|machine|electronic|drum[\s-]machine|rolling|ratchet\w*)\s+(?:hats|hi-?hats)\b|\b(?:hi-?)?hat rolls?\b|\bratchets?\b/i;
const HATS_EXCLUDED = /\b(?:all\s+)?(?:hats|hi-?hats|cymbals)\b/i;

/** Checks a brief. `plan` (the first generated variant) adds the role map to the genre advice. */
export function lintBrief(parsed: ParsedInput, plan?: SonicPlan): LintFinding[] {
  const text = parsed.raw ?? "";
  const findings: LintFinding[] = [];
  if (!text.trim()) return findings;
  const positive = stripExclusions(text);

  const genres = [...parsed.genres, ...(parsed.unknownGenres ?? [])];
  if (genres.length >= 3) {
    const roles = plan ? ownershipMap(plan).filter((r) => r.owner).map((r) => `${r.role.toLowerCase()}: ${r.owner}`) : [];
    findings.push({
      id: "TOO_MANY_EQUAL_GENRES",
      severity: "suggestion",
      title: `${genres.length} genres with no roles`,
      message:
        `The brief names ${genres.join(", ")} as equals. A blend works best when one genre owns the groove and the others take named roles` +
        (roles.length ? `; this time the engine chose ${roles.join(", ")}.` : "."),
      fix: `Say who does what, e.g. "${genres[0]} groove, ${genres[1]} bass, ${genres[2]} chords and hook".`,
    });
  }

  const tempoNotes = (parsed.genreNotes ?? []).filter((note) => /\bBPM\b/.test(note));
  if (tempoNotes.length) {
    findings.push({
      id: "TEMPO_CONVENTION_CONFLICT",
      severity: "warning",
      title: "Tempo outside the genre's usual range",
      message: tempoNotes.join(" "),
      fix: "Keep the tempo and say how the genre should feel at it (e.g. \"half-time feel\", \"double-time drums\"), or use the genre's usual tempo.",
    });
  }

  if (TWO_STEP.test(positive) && FOUR_FLOOR.test(positive) && !SECTION_WORDS.test(positive)) {
    findings.push({
      id: "TWO_PRIMARY_KICK_SYSTEMS",
      severity: "warning",
      title: "Two kick patterns at once",
      message: "The brief asks for a 2-step (skipping) kick and a four-on-the-floor kick without saying where each one plays.",
      fix: "Pick one main kick pattern, or give each its own section (\"2-step verses, four-on-the-floor drops\").",
    });
  }

  const lows = LOW_END_SOURCES.filter(([, re]) => re.test(positive)).map(([name]) => name);
  if (lows.length >= 4) {
    findings.push({
      id: "MASSIVE_FULL_RANGE_BASS_STACK",
      severity: "warning",
      title: `${lows.length} bass sources competing for the low end`,
      message: `${lows.join(", ")} all want the same frequencies; played together they mask each other and the drop turns to mud.`,
      fix: `Choose one sub owner (e.g. ${lows[0]}) and one mid-bass voice, then give the others call-and-answer or section roles ("${lows[2]} answers in the second drop").`,
    });
  }

  if (/\b32nd\b|\bthirty[\s-]second\b/i.test(positive) &&
    (/\b(?:constant|continuous|throughout|non[\s-]?stop|all the way|the whole (?:song|track))\b/i.test(positive) ||
      /\b(?:deep|sparse|minimal|spacious|halftime|half[\s-]time|deep 140)\b/i.test(positive))) {
    findings.push({
      id: "CONSTANT_MAX_HAT_DENSITY",
      severity: "warning",
      title: "Maximum hat density for the whole track",
      message: "Continuous 32nd-note hats fill every gap, which works against a sparse or deep groove.",
      fix: "Ask for 16th-note hats with short 32nd-note rolls at phrase ends.",
    });
  }

  const excluded = (parsed.exclusions ?? []).join(", ");
  if (excluded && HATS_EXCLUDED.test(excluded) && HATS_WANTED.test(positive)) {
    findings.push({
      id: "ELECTRONIC_HATS_EXCLUDED",
      severity: "warning",
      title: "Hats requested and excluded",
      message: `The brief asks for electronic hats but also excludes "${excluded}".`,
      fix: "Narrow the exclusion to what you don't want, e.g. \"acoustic drum kit, live cymbals\".",
    });
  }

  // The hook check is for electronic and bass music, where the research applies; native genres
  // (lo-fi, folk, jazz…) bring their own lead from the catalog.
  const bassWorld = plan
    ? !plan.native || plan.native.edm === true
    : !parsed.native || EDM_IDS.has(parsed.native.primary) || (!!parsed.native.secondary && EDM_IDS.has(parsed.native.secondary));
  if (!bassWorld || genres.length === 0) {
    // no hook check
  } else if (!parsed.instrumental && !HOOK_WORDS.test(positive)) {
    findings.push({
      id: "UNDEFINED_HOOK",
      severity: "suggestion",
      title: "No hook named",
      message: "Nothing in the brief says what the listener should remember: a lead, riff, chop or vocal line.",
      fix: "Name one recurring hook and what plays it (\"pitched vocal-chop hook\", \"detuned saw lead riff\").",
    });
  } else if (parsed.instrumental && !HOOK_WORDS.test(positive)) {
    findings.push({
      id: "UNDEFINED_HOOK",
      severity: "suggestion",
      title: "No hook named",
      message: "An instrumental needs a recurring musical idea in place of a vocal; the brief doesn't name one.",
      fix: "Name the instrument and figure that carries the hook (\"plucked arp motif\", \"whistle lead\").",
    });
  }

  if (SECOND_DROP.test(positive) && BIGGER.test(positive) && !DROP_CHANGE.test(positive)) {
    findings.push({
      id: "UNSPECIFIED_SECOND_DROP",
      severity: "suggestion",
      title: "Second drop is only \"bigger\"",
      message: "\"Bigger\" or \"heavier\" doesn't tell Suno what changes, so the second drop often repeats the first.",
      fix: "Name the change: a rhythm switch, a new bass call, the hook re-voiced, or a half-time flip.",
    });
  }

  return findings;
}

/** The brief without its "no …" / "exclude …" parts, so excluded words don't trigger positive checks. */
function stripExclusions(text: string): string {
  return text
    .replace(/\b(?:exclude|excluding|without|avoid|no)\b[^.;\n]*/gi, " ")
    .replace(/\s+/g, " ");
}

export interface RoleOwner {
  role: "Groove" | "Low end" | "Harmony" | "Hook" | "Color";
  /** The genre (or genres) the engine gave this role. */
  owner: string;
  /** The clause that carries it in the prompt, when there is one. */
  phrase?: string;
}

/**
 * Who owns what in a plan. Bass-music plans record a donor genre per role; native plans let the
 * primary sub-genre carry groove and low end and use the others for color.
 */
export function ownershipMap(plan: SonicPlan): RoleOwner[] {
  const axes = semanticAxes(plan);
  const d = plan.donors ?? {};
  if (plan.native) {
    const labels = plan.native.genreLabel;
    const color = [plan.secondaryGenre, plan.accentGenre].filter(Boolean).join(", ");
    const s = plan.native.sections;
    const lead = s.lead?.[0] ?? s.leads?.[0] ?? s.melody?.[0] ?? s.hook?.[0];
    return [
      { role: "Groove", owner: plan.primaryGenre || labels, phrase: axes.rhythm || undefined },
      { role: "Low end", owner: plan.primaryGenre || labels, phrase: axes.bass || undefined },
      { role: "Hook", owner: plan.primaryGenre || labels, phrase: lead },
      ...(color ? [{ role: "Color" as const, owner: color }] : []),
    ];
  }
  return [
    { role: "Groove", owner: d.rhythm ?? plan.primaryGenre, phrase: axes.rhythm || undefined },
    { role: "Low end", owner: d.bass ?? plan.primaryGenre, phrase: axes.bass || undefined },
    { role: "Harmony", owner: d.harmony ?? plan.secondaryGenre ?? plan.primaryGenre, phrase: plan.harmony[0] },
    { role: "Hook", owner: d.melody ?? plan.primaryGenre, phrase: plan.melody[0] },
    ...(plan.accentGenre ? [{ role: "Color" as const, owner: plan.accentGenre }] : []),
  ];
}
