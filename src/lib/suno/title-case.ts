const SMALL = new Set([
  "a",
  "an",
  "the",
  "and",
  "but",
  "or",
  "nor",
  "for",
  "on",
  "at",
  "to",
  "from",
  "by",
  "of",
  "in",
  "with",
  "as",
  "vs",
]);

const KEEP_UPPER = new Set(["bpm", "ukg", "r&b", "edm", "qc", "id"]);

export function toTitleCase(input: string): string {
  const parts = input.split(/(\s+)/);
  const words = parts.filter((p) => !/^\s+$/.test(p));
  let wordIndex = 0;
  const last = words.length - 1;
  return parts
    .map((part) => {
      if (/^\s+$/.test(part) || part === "") return part;
      const i = wordIndex++;
      return titleWord(part, i === 0 || i === last);
    })
    .join("");
}

function titleWord(raw: string, forceCap: boolean): string {
  const match = raw.match(/^([^A-Za-z0-9]*)([A-Za-z0-9&'/+-]+)([^A-Za-z0-9]*)$/);
  if (!match) return raw;
  const [, pre, core, post] = match;
  const lower = core.toLowerCase();
  if (KEEP_UPPER.has(lower)) return `${pre}${core.toUpperCase()}${post}`;
  if (!forceCap && SMALL.has(lower)) return `${pre}${lower}${post}`;
  if (core.includes("-")) {
    return `${pre}${core
      .split("-")
      .map((w) => capToken(w))
      .join("-")}${post}`;
  }
  return `${pre}${capToken(core)}${post}`;
}

function capToken(w: string): string {
  if (!w) return w;
  const lower = w.toLowerCase();
  if (KEEP_UPPER.has(lower)) return w.toUpperCase();
  return lower.charAt(0).toUpperCase() + lower.slice(1);
}

export function historyFileStamp(d: Date = new Date()): string {
  const pad = (n: number, w: number = 2) => String(n).padStart(w, "0");
  return [
    d.getFullYear(),
    pad(d.getMonth() + 1),
    pad(d.getDate()),
    "_",
    pad(d.getHours()),
    pad(d.getMinutes()),
    pad(d.getSeconds()),
    "_",
    pad(d.getMilliseconds(), 3),
  ].join("");
}
