/**
 * Genres whose name carries the tempo: "140 UKG Dubstep", "140 Bass", "Deep 140", "Wubby 140".
 *
 * The number in these names is the tempo, so a prompt never states it twice ("140 BPM 140 UKG").
 * Rules (set by the project owner):
 *  - Any two of "140", "UKG" and "Dubstep" written together are one phrase, always written in full as
 *    "<tempo> UKG Dubstep" and never split.
 *  - The number follows the prompt's tempo inside 135–145 BPM ("137 UKG Dubstep"), and the prompt
 *    then names no separate BPM.
 *  - "140 Bass", "Deep 140" and "Wubby 140" follow the same rule.
 *  - Outside 135–145 (a brief that asks for 150 BPM, say) the name drops its number ("UKG", "UK bass")
 *    and the tempo is written as "150 BPM" as usual. Any one of the three words on its own is fine.
 *  - Only the first tempo-named genre in a prompt carries the number; later ones are written without it,
 *    so the same number never appears twice a few words apart.
 */

export const TEMPO_WINDOW = { min: 135, max: 145, home: 140 } as const;

/** Variation steps for sibling prompts when the brief names no tempo: 140 first, then ±2..5. */
const VARIANT_STEPS = [0, -2, 2, 3, -3, 1, -1, 4, -4, 5, -5];

export function inTempoWindow(bpm: number | undefined): boolean {
  return bpm != null && bpm >= TEMPO_WINDOW.min && bpm <= TEMPO_WINDOW.max;
}

/** A tempo inside the window for the nth sibling prompt; the first prompt is always 140. */
export function windowTempo(rank: number, rng: () => number): number {
  if (rank <= 0) return TEMPO_WINDOW.home;
  const step = VARIANT_STEPS[(rank + Math.floor(rng() * 4)) % VARIANT_STEPS.length] || 2;
  return TEMPO_WINDOW.home + step;
}

/** Tempo numbers that count as the "140" term: 135–145 only, so "150 dubstep" is never rewritten. */
const N = "(13[5-9]|14[0-5])";
const UKG = "(?:ukg|uk garage)";
const DUB = "dub[\\s-]?step";

/** Every order of the three terms first, then every pair, so the longest spelling is always consumed. */
const TERM_ORDERS = (() => {
  const terms = { n: N, u: UKG, d: DUB };
  const sep = "[\\s-]*";
  const orders = ["nud", "ndu", "und", "udn", "dnu", "dun", "nu", "un", "ud", "du", "nd", "dn"];
  // A number or "dubstep" right after wobble/wubby/garage belongs to that other genre.
  const guard = "(?<!(?:wobble|wubby|wubz|garage)[\\s-]+)";
  return orders
    .map((o) => {
      const body = [...o].map((k) => terms[k as keyof typeof terms]).join(sep);
      return o === "nd" || o === "dn" || o.startsWith("d") ? guard + body : body;
    })
    .join("|");
})();

interface Kind {
  id: "ukg" | "bass" | "deep" | "wubby";
  re: RegExp;
  numbered: (bpm: number, m: RegExpExecArray) => string;
  plain: (m: RegExpExecArray) => string;
}

const deepOf = (m: RegExpExecArray) => (m.groups?.deep ? `${m.groups.deep.trim().replace(/-$/, "")} ` : "");

const KINDS: Kind[] = [
  {
    id: "ukg",
    // Any two or all three of number / UKG / dubstep written together, in any order ("140 UKG", "UKG Dubstep",
    // "Dubstep UKG", "138 dubstep UKG"). "Wobble 140 dubstep" and "garage dubstep" are other genres.
    re: new RegExp(`(?<![a-z0-9-])(?<deep>deep[\\s-]+)?(?:${TERM_ORDERS})(?![a-z0-9])`, "gi"),
    numbered: (bpm, m) => `${deepOf(m)}${bpm} UKG Dubstep`,
    plain: (m) => `${deepOf(m)}UKG`,
  },
  {
    id: "bass",
    re: new RegExp(`(?<![a-z0-9-])(?<deep>deep[\\s-]+)?${N}[\\s-]+bass(?![a-z0-9])(?![\\s-]+(?:line|lines|drum|drums|guitar|player)\\b)`, "gi"),
    numbered: (bpm, m) => `${deepOf(m)}${bpm} Bass`,
    plain: (m) => `${deepOf(m).toLowerCase()}UK bass`,
  },
  {
    id: "deep",
    re: new RegExp(`(?<![a-z0-9-])deep[\\s-]+${N}(?![a-z0-9])(?![\\s-]*(?:bpm|bass|ukg|uk garage|dub))`, "gi"),
    numbered: (bpm) => `Deep ${bpm}`,
    plain: () => "deep UK bass",
  },
  {
    id: "wubby",
    re: new RegExp(`(?<![a-z0-9-])(?<w>wubby|wobble|deep-wobble)[\\s-]+${N}(?![a-z0-9])(?![\\s-]*(?:bpm|dub))`, "gi"),
    numbered: (bpm, m) => `${cap(m.groups?.w ?? "wubby")} ${bpm}`,
    plain: (m) => `${(m.groups?.w ?? "wubby").toLowerCase()} bass`,
  },
];

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();

interface Found {
  kind: Kind;
  index: number;
  length: number;
  match: RegExpExecArray;
}

function findAll(text: string): Found[] {
  const found: Found[] = [];
  for (const kind of KINDS) {
    const re = new RegExp(kind.re.source, kind.re.flags);
    let m: RegExpExecArray | null;
    while ((m = re.exec(text))) {
      found.push({ kind, index: m.index, length: m[0].length, match: m });
      if (m[0].length === 0) re.lastIndex++;
    }
  }
  // Longest match wins where two kinds overlap ("deep 140 bass" is one bass name, not "Deep 140" + "bass").
  found.sort((a, b) => a.index - b.index || b.length - a.length);
  const kept: Found[] = [];
  for (const f of found) {
    const last = kept[kept.length - 1];
    if (last && f.index < last.index + last.length) continue;
    kept.push(f);
  }
  return kept;
}

/** True when the text names a tempo-named genre in any spelling ("UKG dubstep", "140 UKG", "Deep 140"). */
export function namesTempoGenre(text: string): boolean {
  return findAll(text).length > 0;
}

/** Genre names on a plan that carry the tempo when the tempo sits inside 135–145. */
export function hasTempoGenre(names: (string | undefined)[]): boolean {
  return names.some((n) => !!n && namesTempoGenre(n));
}

/** The tempo a numbered tempo-genre states ("138 UKG Dubstep" → 138), as written in a prompt. */
export function tempoGenreNumbers(text: string): number[] {
  return findAll(text)
    .map((f) => Number(/(1[34]\d)/.exec(f.match[0])?.[1]))
    .filter((n) => Number.isFinite(n) && n > 0);
}

/**
 * A tempo the brief sets through a genre name, when the brief names no BPM: "138 UKG dubstep" asks for 138.
 * "140" is the genre's own name, so it sets nothing and sibling prompts may still vary inside 135–145.
 */
export function briefTempoFromGenre(brief: string): number | undefined {
  const n = tempoGenreNumbers(brief).find((x) => x !== TEMPO_WINDOW.home);
  return inTempoWindow(n) ? n : undefined;
}

const BPM_ANY = /\b\d{2,3}\s*BPM\b/i;

/**
 * Rewrites every tempo-named genre in a prompt by the rules above. With `carry` (a tempo-named genre on
 * the plan and a tempo inside 135–145), the first one carries the tempo and every "NNN BPM" is removed;
 * otherwise each is written without its number and the BPM stays.
 */
export function applyTempoGenres(text: string, bpm: number, carry: boolean): string {
  const found = findAll(text);
  if (!found.length) return text;
  const numbered = carry && inTempoWindow(bpm);
  let out = "";
  let cursor = 0;
  found.forEach((f, i) => {
    out += text.slice(cursor, f.index);
    out += numbered && i === 0 ? f.kind.numbered(bpm, f.match) : f.kind.plain(f.match);
    cursor = f.index + f.length;
  });
  out += text.slice(cursor);
  return numbered ? removeBpm(out) : out;
}

/** Drops every "NNN BPM" and tidies the wording around where it stood. */
export function removeBpm(text: string): string {
  if (!BPM_ANY.test(text)) return text;
  return text
    .replace(/\s+(?:at|around|near)\s+\d{2,3}\s*BPM\b/gi, "")
    .replace(/(^|[.!?]\s+)\d{2,3}\s*BPM\s*[,:;]?\s*/gi, "$1")
    .replace(/,\s*\d{2,3}\s*BPM\b/gi, "")
    .replace(/\b\d{2,3}\s*BPM\s*,?\s*/gi, "")
    .replace(/(^|[.!?]\s+)([a-z])/g, (_, lead: string, ch: string) => lead + ch.toUpperCase())
    .replace(/\s+([,.;])/g, "$1")
    .replace(/,\s*,/g, ",")
    .replace(/\s{2,}/g, " ")
    .trim();
}

/** True when the prompt states the tempo, as "NNN BPM" or through a numbered tempo-named genre. */
export function tempoStated(text: string, bpm: number): boolean {
  return new RegExp(`\\b${bpm}\\s*BPM\\b`, "i").test(text) || tempoGenreNumbers(text).includes(bpm);
}

/**
 * The tempo check for a plan: a genre name may carry the tempo only on a plan that has a tempo-named genre
 * inside 135–145 (plan.tempoGenre). Any other plan must write "NNN BPM", so "140 Bass" can't stand in for the
 * tempo of a house or folk prompt.
 */
export function tempoStatedFor(text: string, plan: { bpm: number; tempoGenre?: boolean }): boolean {
  return plan.tempoGenre ? tempoStated(text, plan.bpm) : new RegExp(`\\b${plan.bpm}\\s*BPM\\b`, "i").test(text);
}

/** Where the tempo is written: "NNN BPM", or the numbered genre name that carries it. */
export function tempoAnchor(plan: { bpm: number; tempoGenre?: boolean }): RegExp {
  const bpm = `${plan.bpm}\\s*BPM\\b`;
  if (!plan.tempoGenre) return new RegExp(`\\b${bpm}`, "i");
  return new RegExp(`\\b(?:${bpm}|(?:deep[ -])?${plan.bpm} (?:UKG Dubstep|Bass)\\b|(?:Deep|Wubby|Wobble|Deep-wobble) ${plan.bpm}\\b)`, "i");
}

/**
 * The tempo stated twice: a numbered tempo-named genre beside a separate BPM, or two numbered tempo-named
 * genres ("140 UKG Dubstep ... 140 Bass"), even when the numbers agree. Only the first one carries the number.
 */
export function tempoGenreWithBpm(text: string): boolean {
  const numbered = tempoGenreNumbers(text).length;
  return numbered > 1 || (numbered > 0 && BPM_ANY.test(text));
}
