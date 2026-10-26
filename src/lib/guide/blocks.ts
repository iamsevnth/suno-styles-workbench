export type GuideBlock =
  | { type: "heading"; level: 1 | 2 | 3; text: string }
  | { type: "paragraph"; text: string }
  | { type: "list"; items: string[] }
  | { type: "pre"; text: string };

function isBullet(line: string): boolean {
  return /^\s*(?:[•*-]\s+|\d+\.\s+)/.test(line);
}

function removeBullet(line: string): string {
  return line.trim().replace(/^(?:[•*-]\s+|\d+\.\s+)/, "").trim();
}

function isTableLike(lines: string[]): boolean {
  // Fixed-column manuscript tables remain readable as scrollable reference blocks.
  return lines.length > 1 && lines.filter((line) => /\S {3,}\S/.test(line)).length >= 2;
}

function wrapText(lines: string[]): string {
  let result = "";
  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) continue;
    if (!result) { result = line; continue; }
    if (/[-‐]\s*$/.test(result) && /^[a-z]/.test(line)) result = result.replace(/[-‐]\s*$/, "") + line;
    else result += " " + line;
  }
  return result;
}

/** Readable, safe structured text from the historical DOCX and the edited Markdown pages. */
export function parseGuideBlocks(source: string): GuideBlock[] {
  const output: GuideBlock[] = [];
  const lines = source.replace(/\r/g, "").split("\n");
  let pending: string[] = [];
  let bulletItems: string[] = [];

  const flushParagraph = () => {
    if (!pending.length) return;
    if (isTableLike(pending)) output.push({ type: "pre", text: pending.join("\n") });
    else {
      const text = wrapText(pending);
      if (text) output.push({ type: "paragraph", text });
    }
    pending = [];
  };
  const flushBullets = () => {
    if (bulletItems.length) output.push({ type: "list", items: bulletItems });
    bulletItems = [];
  };

  for (const line of lines) {
    const heading = line.match(/^\s*(#{1,3})\s+(.+)$/);
    if (heading) {
      flushParagraph(); flushBullets();
      output.push({ type: "heading", level: heading[1].length as 1 | 2 | 3, text: heading[2].trim() });
    } else if (!line.trim()) {
      flushParagraph(); flushBullets();
    } else if (isBullet(line)) {
      flushParagraph();
      bulletItems.push(removeBullet(line));
    } else {
      flushBullets();
      pending.push(line);
    }
  }
  flushParagraph(); flushBullets();
  return output;
}
