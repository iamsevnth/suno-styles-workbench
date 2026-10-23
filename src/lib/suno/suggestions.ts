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

  // Rapper style presets (mumble soundcloud, autotuned, lyrical bars, talk-rap, sung-rap)
  push("140 BPM Trap, mumble soundcloud rapper flow, distorted 808, slurred cadence");
  push("130 BPM UK Drill, cold talk-rap delivery, sliding 808, zero singing");
  push("88 BPM Boom Bap, lyrical bars, complex rhyme schemes, sharp punchlines");
  push("136 BPM Melodic Trap, autotuned rap, emotional sung-rap hook, ambient keys");
  push("144 BPM Atlanta Trap, rapid staccato rap flow, rapid hi-hats, heavy sub");
  push("96 BPM West Coast Hip Hop, deadpan talk-rap cadence, laid-back G-funk bass");
  push("142 BPM Rage Trap, hard autotuned rap flow, distorted synths, hyper-energy ad-libs");
  push("132 BPM Cloud Rap, hypnotic SoundCloud mumble rapper, spaced-out pads, lo-fi 808");
  push("92 BPM Underground Hip Hop, dense lyrical bars, boom bap drums, razor-sharp internal rhymes");
  push("138 BPM Melodic Trap, Tory Lanez style sung-rap topline, autotuned hooks, zero pop singing");
  push("100 BPM Detroit Hip Hop, offbeat talk-rap cadence, punchline pauses, clean sub-bass");
  push("140 BPM NY Drill, menacing female drill rap flow, sliding 808s, triplet bursts");
  push("146 BPM Southern Trap, rapid chopper rap cadence, triplet hats, heavy brass stabs");
  push("134 BPM Emo Trap, Juice WRLD inspired autotuned sung-rap, acoustic guitar loop, sliding sub");
  push("140 BPM Memphis Phonk, gritty distorted rap delivery, phonk cowbells, sub-bass bounce");

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
