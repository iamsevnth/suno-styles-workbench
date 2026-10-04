import { PROFILE } from "./profile.ts";

export const SURPRISE_BRIEF = "surprise me with variety from the full library";
export const SUGGESTION_MAX = 250;
export const SUGGESTION_COUNT = 6;

export const MOOD_HOOKS = [
  "dark, bass-forward",
  "cinematic, female vocal",
  "ceremonial, hypnotic",
  "kinetic, club-ready",
  "melancholic, intimate",
  "futuristic, mechanical",
  "soulful, late-night",
  "aggressive, half-time",
  "nocturnal, restrained",
  "emotional, wide chords",
];

function clip(s: string): string {
  const t = s.replace(/\s+/g, " ").trim();
  if (t.length <= SUGGESTION_MAX) return t;
  return t.slice(0, SUGGESTION_MAX).replace(/\s+\S*$/, "").trim();
}

function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 1831565813) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function suggestionPool(): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  const push = (raw: string) => {
    const s = clip(raw);
    if (!s || s.toLowerCase() === SURPRISE_BRIEF) return;
    const key = s.toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    out.push(s);
  };

  for (const f of PROFILE.hybridFormulas) {
    const bpm = PROFILE.preferredBpmCenters[f.primary] ?? 140;
    const trio = [f.primary, f.secondary, f.accent].filter(Boolean).join(" + ");
    push(`${trio}, ${f.mood}, ${f.atmosphere}, ${bpm} BPM`);
    push(`${f.primary} + ${f.secondary}, ${f.mood}, ${bpm} BPM`);
  }

  const t1 = PROFILE.tier1;
  const t2 = PROFILE.tier2;
  for (let i = 0; i < t1.length; i++) {
    const a = t1[i];
    const b = t2[i % t2.length];
    const mood = MOOD_HOOKS[i % MOOD_HOOKS.length];
    const bpm = PROFILE.preferredBpmCenters[a] ?? 140;
    push(`${a} + ${b}, ${mood}, ${bpm} BPM`);
  }

  return out;
}

export function pickSuggestions(seed: number, count: number = SUGGESTION_COUNT): string[] {
  const pool = suggestionPool();
  const rng = mulberry32(seed || 1);
  const shuffled = [...pool];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    const tmp = shuffled[i];
    shuffled[i] = shuffled[j];
    shuffled[j] = tmp;
  }
  return [SURPRISE_BRIEF, ...shuffled.slice(0, Math.max(1, count))];
}
