/**
 * Contradiction checks shared by the renderers and the validator. A prompt that asks for two things that
 * cannot both be true (two tempos, a vocal on an instrumental, a calm and a brutal mood, drop language
 * on a folk record) is worse than a plain prompt, so these are hard gates.
 */

const BPM_RE = /\b(\d{2,3})\s*BPM\b/gi;

/** Every distinct tempo the text states. */
export function statedBpms(text: string): number[] {
  return [...new Set([...text.matchAll(BPM_RE)].map((m) => parseInt(m[1], 10)))];
}

export function hasConflictingBpm(text: string, bpm: number): boolean {
  return statedBpms(text).some((n) => n !== bpm);
}

/** Vocal wording that cannot sit in an instrumental; "vocal chops" and wordless textures are fine. */
const VOCAL_TERM_RE =
  /\b(?:lead vocals?|backing vocals?|vocalists?|singers?|sung|singing|lyrics?|rapp(?:ed|ing)|rap (?:flow|vocals?|verses?)|female vocals?|male vocals?|vocal harmon(?:y|ies)|harmon(?:y|ies) vocals?|stacked harmonies|gang vocals?|ad-libs?|doubled vocals?|vocal hook|belted|whispered vocals?)\b/i;

export function vocalTermsIn(text: string): string[] {
  const hits: string[] = [];
  for (const m of text.matchAll(new RegExp(VOCAL_TERM_RE.source, "gi"))) hits.push(m[0].toLowerCase());
  return hits;
}

export function vocalInInstrumental(text: string, instrumental: boolean): boolean {
  if (instrumental) return VOCAL_TERM_RE.test(text);
  return /\b(?:fully|purely|entirely) instrumental\b/i.test(text) && VOCAL_TERM_RE.test(text);
}

const CALM = new Set([
  "calm", "mellow", "relaxed", "peaceful", "serene", "tranquil", "gentle", "tender", "chilled", "sleepy", "soothing", "dreamy",
]);
const HARSH = new Set([
  "aggressive", "brutal", "relentless", "furious", "violent", "frantic", "ferocious", "savage", "raging", "crushing", "menacing",
  "hostile",
]);

/** True when one sentence asks for a calm and a brutal mood with no "edge" to reconcile them. */
export function moodClash(sentence: string): boolean {
  if (/\bedge\b/i.test(sentence)) return false;
  const words = sentence.toLowerCase().match(/[a-z]+/g) ?? [];
  return words.some((w) => CALM.has(w)) && words.some((w) => HARSH.has(w));
}

/** Phrases that belong to bass music and sound wrong on any other genre. */
export const BASS_MUSIC_RE =
  /\b(?:808s?|wobble bass|bass wobbles?|wobbling (?:bass|sub)|wubs?|wubby|growls?|reese|neuro\w*|drops?|half-time stomp|riddim|dubstep|sub[- ]?bass drops?|bass (?:slides?|glides?)|portamento|tearout|trap hats?|hi-hat rolls?)\b/gi;

/** Bass-music phrases in the text that the brief did not ask for. */
export function bassMusicLeaks(text: string, briefWords: string, dancehall = false): string[] {
  const brief = briefWords.toLowerCase();
  const leaks: string[] = [];
  for (const m of text.matchAll(BASS_MUSIC_RE)) {
    const word = m[0].toLowerCase();
    // In Dancehall and reggae, "riddim" is the backing groove and "one-drop"
    // is a reggae drum pattern. Keep unrelated EDM drops and bass sounds gated.
    if (dancehall && word === "riddim") continue;
    if (dancehall && word === "drop" && /\bone[- ]$/i.test(text.slice(0, m.index ?? 0))) continue;
    const stem = word.replace(/s$/, "");
    if (!brief.includes(stem)) leaks.push(word);
  }
  return [...new Set(leaks)];
}

/**
 * Acoustic, band, orchestral and lo-fi wording that never belongs in a bass-music, club or rap prompt.
 * Matched text is allowed only when the brief itself used the word.
 */
export const NON_EDM_RE =
  /\b(?:acoustic|guitars?|fingerstyle|fingerpick\w*|strumm\w*|nylon|banjo|fiddle|mandolin|pedal steel|harmonica|ukulele|violins?|cellos?|violas?|harps?|oboe|clarinet|accordion|upright (?:bass|piano)|double bass|walking bass|brush(?:ed|es)(?: snare| drums?| kit)?|vinyl(?: crackle| hiss| noise)?|crackle|tape[- ]stop|tape[- ]saturat\w*|cassette|lo-?fi|dusty|rhodes|wurlitzer|live[- ](?:drums?|drum kit|band|room|kit|take)|drum kit|felt piano|grand piano|piano trio|saxophones?|trumpets?|trombones?|flugelhorn|brass section|horn section|string (?:section|quartet|ensemble)|strings? swell\w*|orchestral|orchestra|symphon\w*|film score|campfire|front porch|twang\w*|bluegrass|honky|folk|country|jazz\w*|blast beats?|double[- ]kick|power chords?|palm[- ]muted|shoegaze|grunge)\b/gi;

/** Non-EDM phrases in the text that the brief did not ask for (the brief's own words are always allowed). */
export function nonEdmBleed(text: string, briefWords: string): string[] {
  const brief = briefWords.toLowerCase();
  const found: string[] = [];
  for (const m of text.matchAll(NON_EDM_RE)) {
    const word = m[0].toLowerCase();
    const first = word.split(/\s+/)[0];
    const stem = word.replace(/s$/, "");
    const asked = brief.includes(stem) || (first.length >= 5 && brief.includes(first.replace(/s$/, "")));
    if (!asked) found.push(word);
  }
  return [...new Set(found)];
}

/** Families that make bass music, club records or rap: the genres that must never read like a band or a score. */
const BASS_WORLD_FAMILIES = new Set(["bass", "riddim", "future", "trap", "garage", "house", "phonk", "drill", "baile", "ritual", "ukg", "rap"]);
/** A genre from one of these families in the same plan makes live or acoustic wording legitimate. */
const BAND_FAMILIES = new Set(["folk", "gospel", "live", "cinematic", "ambient", "drone", "soul"]);

/** True when a plan's genres are bass music, club or rap, so the genre-bleed gate applies. */
export function isBassWorld(families: string[], nativeEdm: boolean | undefined, native: boolean): boolean {
  if (native) return !!nativeEdm;
  return families.some((f) => BASS_WORLD_FAMILIES.has(f)) && !families.some((f) => BAND_FAMILIES.has(f));
}
