/**
 * Gate for on-device AI rewording. The AI only proposes new wording for a prompt the deterministic
 * engine already built; this check decides whether that wording may be shown. It never repairs
 * the text: anything that fails is discarded, with the reasons.
 */
import type { PromptCandidate } from "../suno/types.ts";
import { briefFaithfulness, criticalGatesPass, validatePrompt } from "../suno/validate.ts";
import { lengthWindow } from "../suno/limits.ts";
import { vocalClauses } from "../suno/render.ts";
import { tempoGenreNumbers } from "../suno/tempo-genre.ts";

export interface AiCheck {
  ok: boolean;
  /** The cleaned text (fences, quotes and labels removed). */
  text: string;
  /** Plain-language reasons the text was rejected; empty when ok. */
  problems: string[];
}

/** Removes the wrapping a chat model tends to add: code fences, quotes, "Styles:" labels. */
export function cleanAiText(raw: string): string {
  let t = raw.trim();
  t = t.replace(/^```[a-z]*\s*/i, "").replace(/\s*```$/, "");
  t = t.replace(/^(?:here(?:'s| is)[^:\n]*:|styles?(?: prompt)?:|rewritten(?: prompt)?:)\s*/i, "");
  t = t.replace(/^["“”']+|["“”']+$/g, "");
  return t.replace(/\s+/g, " ").trim();
}

const GATE_TEXT: Record<string, string> = {
  integerBpm: "the tempo (BPM) is missing or changed",
  protectedReferences: "it names an artist or says \"in the style of\"",
  positivePrompting: "it uses negative wording (no, avoid, without)",
  stylesOnly: "it contains lyrics or section tags",
  noContradictions: "it contradicts itself (tempo, vocals or mood)",
  noGenreBleed: "it adds wording from outside the genre",
  noExcludedConcepts: "it mentions something the brief excludes",
};

/**
 * Sentence-frame words the renderers use ("Instrumentation features", "The arrangement moves through"). A
 * rewording may change these freely; every other word carries a musical detail.
 */
const stem = (w: string) => (w.length > 4 && w.endsWith("s") && !w.endsWith("ss") ? w.slice(0, -1) : w);

const FRAME_WORDS = new Set(
  ("with into that then from over each every while through moves moving unfolds runs form record arrangement arranged " +
    "instrumentation built around palette sound balance finish finished features feature deliver delivers showcases " +
    "center centers centered uses sits rides leads replies answering answers answer gaps between settles carries " +
    "rhythm section production priorities front role goes design plus also they their this which where when " +
    "throughout mood delivered performance")
    .split(" ")
    .map(stem)
);

function detailWords(text: string): Set<string> {
  const words = text.toLowerCase().match(/[a-z0-9][a-z0-9'-]{3,}/g) ?? [];
  return new Set(words.map(stem).filter((w) => !FRAME_WORDS.has(w)));
}

/** Share of the original's musical detail words that a rewording kept, the share it must keep, and what it dropped. */
export const DETAIL_RETENTION = 0.8;
export function detailRetention(text: string, original: string): { share: number; missing: string[] } {
  const want = detailWords(original);
  if (!want.size) return { share: 1, missing: [] };
  const have = detailWords(text);
  const missing = [...want].filter((w) => !have.has(w));
  return { share: 1 - missing.length / want.size, missing };
}

/**
 * Words that name a sound, instrument or effect. A rewording may not bring in one the original never had
 * ("Phaser sweeps"): that changes the music, not the wording. Generic words (drums, percussion, bass, beat)
 * are not listed, so ordinary rewording passes.
 */
const SOUND_WORDS = new Set(
  ("synth synths pad pads piano keys rhodes wurlitzer organ guitar guitars strings violin cello viola harp flute " +
    "sax saxophone brass horn horns trumpet trombone choir bell bells pluck plucks marimba kalimba vibraphone " +
    "mallet mallets sitar tabla conga congas bongo bongos djembe cowbell timbale tambourine shaker shakers clap " +
    "claps snare snares kick kicks hat hats hi-hat cymbal cymbals tom toms rimshot rim rims 808 909 sub reese " +
    "wobble wub wubs growl growls supersaw supersaws arp arpeggio arpeggios sample samples chop chops riser risers " +
    "impact impacts sweep sweeps glitch stutter stutters gate gated tape vinyl crackle phaser flanger chorus vocoder " +
    "talkbox autotune auto-tune delay delays reverb distortion bitcrush bitcrushed sidechain saturation fuzz " +
    "harmonica banjo mandolin ukulele accordion bagpipes steel pedal-steel stab stabs drone drones " +
    "whistle whistles siren sirens airhorn air-horn gong timpani glockenspiel celesta clavinet theremin")
    .split(" ")
    .map(stem)
);

/** Sound, instrument and effect words the rewording has and the original doesn't. */
export function addedSounds(text: string, original: string): string[] {
  const words = (t: string) => new Set((t.toLowerCase().match(/[a-z0-9]+(?:-[a-z0-9]+)*/g) ?? [])
    .flatMap((w) => [w, ...w.split("-")]).map(stem));
  const before = words(original);
  return [...words(text)].filter((w) => SOUND_WORDS.has(w) && !before.has(w));
}

export function checkAiRewrite(raw: string, original: PromptCandidate): AiCheck {
  const text = cleanAiText(raw);
  const problems: string[] = [];
  if (!text) return { ok: false, text, problems: ["the model returned nothing"] };
  const result = validatePrompt(text, original.plan);
  if (!criticalGatesPass(result.hardGates)) {
    const window = lengthWindow(original.plan.length);
    for (const [gate, pass] of Object.entries(result.hardGates)) {
      if (pass !== false) continue;
      if (gate === "characterRange") problems.push(`length outside ${window.min}–${window.hardMax} characters`);
      else if (GATE_TEXT[gate]) problems.push(GATE_TEXT[gate]);
    }
  }
  // It must keep at least as many of the brief's own words (scenes, textures, instruments) as the original.
  if (briefFaithfulness(text, original.plan) < briefFaithfulness(original.styles, original.plan)) {
    problems.push("it dropped words from your brief that the original kept");
  }
  // A rewording keeps the result's own details too (drums, bass, vocals, arrangement, mix), not just the brief's.
  const kept = detailRetention(text, original.styles);
  if (kept.share < DETAIL_RETENTION) {
    problems.push(`it dropped details the original had (${kept.missing.slice(0, 6).join(", ")}${kept.missing.length > 6 ? ", …" : ""})`);
  }
  // A rewording changes words, not the music: no sound, instrument or effect the original didn't have.
  const added = addedSounds(text, original.styles);
  if (added.length) problems.push(`it added sounds the original didn't have (${added.slice(0, 6).join(", ")})`);
  // The vocal share cap (25% Detailed, 15% Tight) holds for AI wording too. Both texts are measured the same
  // way, so a faithful rewording of a prompt whose other clauses mention vocal chops is not penalized.
  if (original.plan.vocals?.present !== false) {
    const cap = lengthWindow(original.plan.length).vocalShare;
    const share = (t: string) => vocalClauses(t) / Math.max(1, t.length);
    if (share(text) > Math.max(cap, share(original.styles)) + 0.03) {
      problems.push(`its vocal description takes ${Math.round(share(text) * 100)}% of the characters (cap ${Math.round(cap * 100)}%)`);
    }
  }
  if (text.toLowerCase() === original.styles.toLowerCase()) problems.push("it is the same as the original");
  return { ok: problems.length === 0, text, problems };
}

/** How the prompt states its tempo: "140 BPM", or a genre name that carries it ("138 UKG Dubstep"). */
function tempoRule(original: PromptCandidate): string {
  const named = tempoGenreNumbers(original.styles).includes(original.bpm);
  if (!named) return `the tempo written exactly as "${original.bpm} BPM"`;
  const label = /\b(?:deep[ -])?1[34]\d(?: UKG Dubstep| Bass| Grime| Halftime)?\b|\b(?:deep|wubby|wobble)[ -]1[34]\d\b/i.exec(original.styles)?.[0] ?? String(original.bpm);
  return `the genre name "${label}" written exactly like that, which already states the tempo (never add a separate BPM)`;
}

/** The instruction given to an AI model, on this device or in the assistant the user pastes it into. */
export function rewordInstruction(original: PromptCandidate): string {
  const window = lengthWindow(original.plan.length);
  return [
    "You rewrite music-style prompts for Suno. Rewrite the prompt below with new wording and sentence order.",
    `Keep every musical fact: ${tempoRule(original)}, every genre name, instrument, vocal detail, mood and production detail.`,
    "Do not add new instruments, genres or effects.",
    `Write between ${window.min} and ${window.max} characters.`,
    "Describe only what to hear: never write no, avoid, without or don't.",
    "No artist names, no lyrics, no section tags in brackets.",
    "Return only the rewritten prompt, with no title, quotes or explanation.",
  ].join(" ");
}
