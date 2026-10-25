/**
 * Title Case for the site's headings (AP style). Articles, coordinating conjunctions and
 * prepositions of three letters or fewer stay lowercase unless they open or close the heading or
 * follow a colon, period, question mark, exclamation point or dash. Words that already carry a
 * capital or a digit (UKG, FAQ, HTML, R&B, v6, 140) are left exactly as written, and each part of
 * a hyphenated word is capitalized (Self-Contained, Built-In).
 */
const MINOR_WORDS = new Set([
  "a",
  "an",
  "the",
  "and",
  "but",
  "or",
  "nor",
  "for",
  "so",
  "yet",
  "as",
  "at",
  "by",
  "in",
  "of",
  "on",
  "to",
  "up",
  "via",
  "vs",
  "per",
]);

export function headlineCase(text: string): string {
  const tokens = text.split(/(\s+)/);
  const wordIndexes = tokens.map((t, i) => (/\S/.test(t) ? i : -1)).filter((i) => i >= 0);
  const first = wordIndexes[0];
  const last = wordIndexes[wordIndexes.length - 1];
  let startsClause = true;
  return tokens
    .map((token, i) => {
      if (!/\S/.test(token)) return token;
      const forceCap = i === first || i === last || startsClause;
      startsClause = /[.:?!—–]$/.test(token) || token === "—" || token === "–" || token === "|";
      return headlineWord(token, forceCap);
    })
    .join("");
}

function headlineWord(token: string, forceCap: boolean): string {
  const match = token.match(/^([^A-Za-z0-9]*)(.*?)([^A-Za-z0-9]*)$/);
  if (!match || !match[2]) return token;
  const [, pre, core, post] = match;
  if (!forceCap && MINOR_WORDS.has(core.toLowerCase()) && core === core.toLowerCase()) return token;
  const capped = core
    .split("-")
    .map((part) => (/[A-Z0-9]/.test(part) ? part : part.charAt(0).toUpperCase() + part.slice(1)))
    .join("-");
  return `${pre}${capped}${post}`;
}
