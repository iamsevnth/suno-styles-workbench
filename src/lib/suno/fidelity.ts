import { extractConstraintIntent, parseKeyIntent, parseMeterIntent, parseTempoIntent, phraseExcluded } from "./intent.ts";
import { parseUserInput } from "./parse.ts";

export type FidelityStatus = "matched" | "different" | "not-found" | "review";
export type EvidenceMethod = "literal" | "normalized" | "heuristic";

export interface FidelityFinding {
  id: string;
  category: string;
  requested: string;
  status: FidelityStatus;
  sourceEvidence: string;
  outputEvidence?: string;
  method: EvidenceMethod;
  explanation: string;
}
export interface FidelityReport {
  schemaVersion: 1;
  scope: "textual-source-fidelity";
  sourceCharacters: number;
  outputCharacters: number;
  excludedCharacters: number;
  findings: FidelityFinding[];
  counts: Record<FidelityStatus, number>;
  caveats: string[];
}
export interface FidelitySource {
  id: string;
  label: string;
  url: string;
  claim: string;
}

/**
 * Source citations establish Suno field/control behavior. They do NOT validate
 * Workbench's lexical detector, inferred musical intent, or sound quality.
 */
export const SUNO_FIELD_SOURCES: FidelitySource[] = [
  {
    id: "suno-exclude",
    label: "Suno Help — Exclude",
    url: "https://help.suno.com/en/articles/3161921",
    claim: "Suno provides a separate Exclude control for unwanted musical elements.",
  },
  {
    id: "suno-custom",
    label: "Suno Help — Custom Mode",
    url: "https://help.suno.com/en/articles/2415873",
    claim: "Custom Mode supports providing original lyrics and additional creation context.",
  },
  {
    id: "suno-sliders",
    label: "Suno Help — Creative Sliders",
    url: "https://help.suno.com/en/articles/6141377",
    claim: "Style Influence controls closeness to the style input; slider settings affect outcomes independently of text.",
  },
  {
    id: "suno-variety",
    label: "Suno Help — v6 FAQ",
    url: "https://help.suno.com/en/articles/13924481",
    claim: "Suno documents that v6 Variety adjusts style prompts and recommends setting Variety to zero for full style-tag control.",
  },
];

function normalized(text: string): string {
  return text.normalize("NFKC").toLowerCase()
    .replace(/[–—]/g, "-").replace(/&/g, "and")
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/\s+/g, " ").trim();
}
function literalMatch(text: string, phrase: string): string | undefined {
  const source = normalized(text).replace(/[.,;:()[\]{}]/g, " ");
  const target = normalized(phrase).replace(/[.,;:()[\]{}]/g, " ");
  if (!target.trim()) return undefined;
  const haystack = " " + source.replace(/\s+/g, " ").trim() + " ";
  return haystack.includes(" " + target.replace(/\s+/g, " ").trim() + " ") ? phrase : undefined;
}
function witnessed(text: string, expression: RegExp): string | undefined {
  return text.match(expression)?.[0];
}
function countItems(items: FidelityFinding[]): Record<FidelityStatus, number> {
  return {
    matched: items.filter(x => x.status === "matched").length,
    different: items.filter(x => x.status === "different").length,
    "not-found": items.filter(x => x.status === "not-found").length,
    review: items.filter(x => x.status === "review").length,
  };
}

interface Marker {
  id: string;
  category: string;
  label: string;
  source: RegExp;
  output: RegExp;
  opposite?: RegExp;
  note?: string;
}
const MARKERS: Marker[] = [
  { id: "acoustic-guitar", category: "Instrument", label: "Acoustic guitar",
    source: /\b(?:acoustic|nylon[- ]string|steel[- ]string)\s+guitars?\b/i,
    output: /\b(?:acoustic|nylon[- ]string|steel[- ]string)\s+guitars?\b/i,
    opposite: /\belectric\s+guitars?\b/i },
  { id: "electric-guitar", category: "Instrument", label: "Electric guitar",
    source: /\belectric\s+guitars?\b/i,
    output: /\belectric\s+guitars?\b/i,
    opposite: /\bacoustic\s+guitars?\b/i },
  { id: "flute", category: "Instrument", label: "Flute",
    source: /\bflutes?\b/i, output: /\bflutes?\b/i },
  { id: "rhodes", category: "Instrument", label: "Rhodes",
    source: /\brhodes\b/i, output: /\brhodes\b/i },
  { id: "piano", category: "Instrument", label: "Piano",
    source: /\bpianos?\b/i, output: /\bpianos?\b/i },
  { id: "saxophone", category: "Instrument", label: "Saxophone",
    source: /\b(?:saxophone|sax)\b/i, output: /\b(?:saxophone|sax)\b/i },
  { id: "violin", category: "Instrument", label: "Violin",
    source: /\bviolins?\b/i, output: /\bviolins?\b/i },
  { id: "cello", category: "Instrument", label: "Cello",
    source: /\bcellos?\b/i, output: /\bcellos?\b/i },
  { id: "trumpet", category: "Instrument", label: "Trumpet",
    source: /\btrumpets?\b/i, output: /\btrumpets?\b/i },
  { id: "supersaw", category: "Instrument", label: "Supersaw",
    source: /\bsuper[- ]?saws?\b/i, output: /\bsuper[- ]?saws?\b/i },
  { id: "808", category: "Instrument", label: "808",
    source: /\b808s?\b/i, output: /\b808s?\b/i },
  { id: "female", category: "Voice", label: "Female voice",
    source: /\bfemale\b(?=[^.;\n]{0,45}\b(?:vocal|voice|singer|lead|rapper|alto|soprano)\b)/i,
    output: /\bfemale\b/i, opposite: /\bmale\b/i },
  { id: "male", category: "Voice", label: "Male voice",
    source: /\bmale\b(?=[^.;\n]{0,45}\b(?:vocal|voice|singer|lead|rapper|tenor|baritone)\b)/i,
    output: /\bmale\b/i, opposite: /\bfemale\b/i },
  { id: "alto", category: "Voice", label: "Alto register",
    source: /\balto\b(?!\s+sax)/i, output: /\balto\b/i },
  { id: "soprano", category: "Voice", label: "Soprano register",
    source: /\bsoprano\b(?!\s+sax)/i, output: /\bsoprano\b/i },
  { id: "tenor", category: "Voice", label: "Tenor register",
    source: /\btenor\b(?!\s+sax)/i, output: /\btenor\b/i },
  { id: "baritone", category: "Voice", label: "Baritone register",
    source: /\bbaritone\b(?!\s+sax)/i, output: /\bbaritone\b/i },
  { id: "autotune", category: "Voice processing", label: "Autotune",
    source: /\bauto[- ]?tun(?:e|ed|ing)\b/i,
    output: /\bauto[- ]?tun(?:e|ed|ing)\b/i },
  { id: "whisper", category: "Vocal delivery", label: "Whisper",
    source: /\bwhisper(?:s|ed|ing|y)?\b/i,
    output: /\bwhisper(?:s|ed|ing|y)?\b/i },
  { id: "falsetto", category: "Vocal delivery", label: "Falsetto",
    source: /\bfalsetto\b/i, output: /\bfalsetto\b/i },
  { id: "half-time", category: "Groove", label: "Half-time",
    source: /\bhalf[- ]time\b/i, output: /\bhalf[- ]time\b/i },
  { id: "2-step", category: "Groove", label: "2-step",
    source: /\b2[- ]step\b/i, output: /\b2[- ]step\b/i },
  { id: "swing", category: "Groove", label: "Swing",
    source: /\b(?:swing|swung)\b/i, output: /\b(?:swing|swung)\b/i },
  { id: "second-drop", category: "Arrangement", label: "Second drop",
    source: /\b(?:drop\s*2|second[- ]drop)\b/i,
    output: /\b(?:drop\s*2|second[- ]drop)\b/i },
  { id: "motif", category: "Arrangement", label: "Motif",
    source: /\bmotifs?\b/i, output: /\bmotifs?\b/i },
  { id: "silence", category: "Arrangement", label: "Silence",
    source: /\b(?:silenc\w*|silent)\b/i,
    output: /\b(?:silenc\w*|silent)\b/i },
  { id: "fakeout", category: "Arrangement", label: "Fakeout / reload",
    source: /\b(?:fake[- ]?out|reload|blackout)\b/i,
    output: /\b(?:fake[- ]?out|reload|blackout)\b/i },
  { id: "sidechain", category: "Mix", label: "Sidechain",
    source: /\bside[- ]chain(?:ed|ing)?\b/i,
    output: /\bside[- ]chain(?:ed|ing)?\b/i },
  { id: "mono", category: "Mix", label: "Mono",
    source: /\bmono\b/i, output: /\bmono\b/i },
];

/**
 * This is a lexical fact-extraction tool, not a calibrated semantic validator.
 * 'matched' means matching text was observed; not-found is NOT proof that a
 * musical idea or sound disappeared from generated audio.
 */
export function analyzePromptFidelity(sourceText: string, styleText: string, excludeText = ""): FidelityReport {
  if (sourceText.length > 50000 || styleText.length > 50000 || excludeText.length > 10000) {
    throw new Error("Fidelity Inspector supports up to 50,000 source/style characters and 10,000 Exclude characters.");
  }
  const source = extractConstraintIntent(sourceText);
  const outputPositive = extractConstraintIntent(styleText).positiveText;
  const findings: FidelityFinding[] = [];
  const keys = new Set<string>();

  const add = (item: FidelityFinding) => {
    if (keys.has(item.id)) return;
    keys.add(item.id);
    findings.push(item);
  };
  const makeItem = (id: string, category: string, requested: string, sourceEvidence: string,
    status: FidelityStatus, method: EvidenceMethod, outputEvidence?: string, explanation?: string) => {
    add({
      id, category, requested, sourceEvidence, status, method, outputEvidence,
      explanation: explanation ?? (status === "matched"
        ? "Matching wording is present in the destination text."
        : status === "different" ? "A different explicit value or a direct conflict is present."
        : "Matching wording was not detected; paraphrases or musical equivalence need human review."),
    });
  };

  const tempo = parseTempoIntent(source.positiveText);
  const targetTempos = tempo.mentions.filter(x => x.role === "target" || x.role === "range");
  if (targetTempos.length) {
    const first = targetTempos[0];
    const from = first.value;
    const to = first.upper ?? first.value;
    const conflicts = targetTempos.some(x => x.value !== from || (x.upper ?? x.value) !== to);
    const generatedTargets = parseTempoIntent(outputPositive).mentions
      .filter(x => x.role === "target" || x.role === "range");
    const acceptable = generatedTargets.some(x => x.value >= Math.min(from, to) &&
      x.value <= Math.max(from, to) && (x.upper == null || (x.upper >= Math.min(from, to) && x.upper <= Math.max(from, to))));
    const differing = generatedTargets.find(x => x.value < Math.min(from, to) ||
      x.value > Math.max(from, to));
    const observed = generatedTargets.map(x => x.raw).join(", ") || undefined;
    const distinctOutputs = new Set(generatedTargets.map(x => String(x.value) + "-" + String(x.upper ?? x.value)));
    const state: FidelityStatus = conflicts || distinctOutputs.size > 1 ? "review" : acceptable ? "matched" : differing ? "different" : "not-found";
    makeItem("target-tempo", "Tempo", "Target " + first.raw, first.raw,
      state, "normalized", observed,
      conflicts ? "Multiple incompatible target BPM instructions appear in the source; no single target is assumed."
        : state === "matched" ? "An explicit destination tempo falls within the stated source target/range."
          : state === "different" ? "The destination explicitly names a tempo outside the source target/range."
            : "No matching target tempo was detected. This does not measure actual generated audio BPM.");
  } else if (tempo.mentions.length) {
    const context = tempo.mentions.map(x => x.raw).join(", ");
    makeItem("context-tempo", "Tempo", "Context-only tempo", context, "review", "heuristic", undefined,
      "The source mentions a reference, perceived or source tempo, but not an unambiguous destination BPM.");
  }

  const sourceKey = parseKeyIntent(source.positiveText);
  if (sourceKey) {
    const resultKey = parseKeyIntent(outputPositive);
    makeItem("key", "Key", sourceKey, sourceKey,
      !resultKey ? "not-found" : normalized(resultKey) === normalized(sourceKey) ? "matched" : "different",
      "normalized", resultKey, "Text-only key comparison; Suno's actual harmonic key is not measured.");
  }
  const sourceMeter = parseMeterIntent(source.positiveText);
  if (sourceMeter) {
    const resultMeter = parseMeterIntent(outputPositive);
    makeItem("meter", "Meter", sourceMeter, sourceMeter,
      !resultMeter ? "not-found" : sourceMeter === resultMeter ? "matched" : "different",
      "normalized", resultMeter, "Text-only time-signature comparison, not a beat-transcription test.");
  }

  const parsed = parseUserInput(source.positiveText, { count: 1, profileEnabled: false, mode: "rewrite" });
  for (const genre of [...new Set(parsed.genres ?? [])]) {
    const sourceMatch = literalMatch(source.positiveText, genre);
    if (!sourceMatch) continue; // Do not audit genres the parser inferred or injected.
    const found = literalMatch(outputPositive, genre);
    makeItem("genre:" + normalized(genre), "Genre", genre, sourceMatch,
      found ? "matched" : "not-found", "literal", found,
      found ? "The named genre is present in the destination text."
        : "Exact genre wording was not detected; synonyms and related subgenres may need human review.");
  }

  for (const marker of MARKERS) {
    const sourceMatch = witnessed(source.positiveText, marker.source);
    if (!sourceMatch) continue;
    const found = witnessed(outputPositive, marker.output);
    const conflict = marker.opposite ? witnessed(outputPositive, marker.opposite) : undefined;
    const status: FidelityStatus = found ? "matched" : conflict ? "different" : "not-found";
    makeItem(marker.id, marker.category, marker.label, sourceMatch, status, "normalized",
      found ?? conflict, found
        ? "The named feature has a matching lexical marker in Styles."
        : conflict ? "A potentially incompatible explicit replacement appears. Inspect the full source and output."
          : "The named feature was not found lexically; related wording may still express the intent.");
  }

  const instrumental = witnessed(source.positiveText,
    /\b(?:strictly|purely|fully|entirely)\s+instrumental\b|\binstrumental[- ]only\b|\ban?\s+instrumental\s+(?:song|track|piece|cut)\b/i);
  if (instrumental) {
    const found = witnessed(outputPositive, /\binstrumental\b|\bwithout\s+vocals?\b/i);
    const opposing = witnessed(outputPositive, /\b(?:male|female)\s+(?:lead\s+)?vocals?\b|\blead\s+sing(?:er|ing)\b/i);
    makeItem("instrumental", "Voice", "Instrumental only", instrumental,
      found ? "matched" : opposing ? "different" : "not-found", "normalized", found ?? opposing,
      "Lexical vocal-mode check. Whether audio actually has vocals cannot be verified here.");
  }

  // The source instructions may name the exact duration of a structural passage.
  const numbers: Record<string, number> = { one: 1, two: 2, four: 4, eight: 8, sixteen: 16 };
  for (const match of source.positiveText.matchAll(/\b(\d{1,2}|one|two|four|eight|sixteen)[- ]bars?\b/gi)) {
    const amount = Number(match[1]) || numbers[match[1].toLowerCase()];
    if (!amount) continue;
    const alternatives = [String(amount), ...Object.keys(numbers).filter(x => numbers[x] === amount)];
    const found = alternatives.map(x => witnessed(outputPositive,
      new RegExp("\\b" + x + "[- ]bars?\\b", "i"))).find(Boolean);
    makeItem("bars:" + amount, "Arrangement", amount + "-bar instruction", match[0],
      found ? "matched" : "not-found", "normalized", found,
      found ? "A matching bar-count instruction is present in the destination text."
        : "The source bar count was not found; this may affect phrasing, but audio structure was not tested.");
  }

  const requestedExclusions = [...new Set(source.exclusions.map(x => x.trim()).filter(Boolean))];
  for (const item of requestedExclusions) {
    const matchedExclude = phraseExcluded(excludeText, [item]);
    const forbiddenPositive = phraseExcluded(outputPositive, [item]);
    const status: FidelityStatus = forbiddenPositive ? "different" : matchedExclude ? "matched" : "not-found";
    makeItem("exclude:" + normalized(item), "Exclude field", item, item, status, "normalized",
      forbiddenPositive ? item + " detected in Styles text" : matchedExclude ? item + " in Exclude field" : undefined,
      forbiddenPositive ? "A forbidden term appears in positive Styles text. Check whether it is actually being requested."
        : matchedExclude ? "The exclusion is represented in the separate Exclude field documented by Suno."
          : "This prohibition was not detected in the separate Exclude field. It may remain prose in the source.");
  }

  const supporting: Array<[string, string]> = [
    ...(parsed.scenes ?? []).map(x => ["Scene", x] as [string, string]),
    ...(parsed.textures ?? []).map(x => ["Texture", x] as [string, string]),
    ...(parsed.unknownGenres ?? []).map(x => ["Unrecognized genre", x] as [string, string]),
  ];
  for (const [category, phrase] of supporting) {
    if (phrase.length < 3 || !literalMatch(source.positiveText, phrase)) continue;
    const found = literalMatch(outputPositive, phrase);
    makeItem("phrase:" + category + ":" + normalized(phrase), category, phrase, phrase,
      found ? "matched" : "not-found", "literal", found,
      found ? "An exact source phrase survives in the output." :
        "The exact phrase was not detected; rewritten equivalents are not automatically verified.");
  }

  const counts = countItems(findings);
  return {
    schemaVersion: 1,
    scope: "textual-source-fidelity",
    sourceCharacters: sourceText.length,
    outputCharacters: styleText.length,
    excludedCharacters: excludeText.length,
    findings,
    counts,
    caveats: [
      "No listening or Suno-generation test was performed. Text matching cannot predict musical or audio quality.",
      "Not-found means literal or normalized wording was absent, not that an equivalent musical idea is absent.",
      "The denominator includes only facts recognized by the limited extractor. Unrecognized creative requirements are not silently counted as retained.",
      "Suno Help sources document field or slider behavior; they do not validate Workbench's detectors or establish character-count quality targets.",
      "For v6, Variety and other creative settings can alter how Styles text is used. This inspector cannot observe a user's Suno settings.",
    ],
  };
}
