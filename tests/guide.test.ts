import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { readFileSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { GUIDE_ANCHOR_REDIRECTS, GUIDE_CHAPTERS, GUIDE_GROUPS } from "../src/lib/guide/manifest.ts";
import { parseGuideBlocks } from "../src/lib/guide/blocks.ts";
import { searchGuide } from "../src/lib/guide/search.ts";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
function sourcePath(id: string, status: string) {
  return path.join(root, "src", "content", "guide", status === "manuscript" ? "manuscript" : "verified", id + ".md");
}

describe("complete Guide manuscript", () => {
  it("lists unique, grouped chapters with existing nonempty source files", () => {
    const ids = GUIDE_CHAPTERS.map((chapter) => chapter.id);
    assert.equal(new Set(ids).size, ids.length);
    assert.ok(ids.length >= 30);
    for (const chapter of GUIDE_CHAPTERS) {
      assert.ok(GUIDE_GROUPS.includes(chapter.group), chapter.group);
      const file = sourcePath(chapter.id, chapter.status);
      assert.ok(existsSync(file), file);
      const text = readFileSync(file, "utf8");
      assert.ok(text.length >= 150, file);
      assert.ok(text.startsWith("# "), file);
      assert.doesNotMatch(text, /<PARSED TEXT FOR PAGE:/);
    }
  });

  it("preserves the lengthy source manuscript without resurrecting the retired standalone chapter", () => {
    const sources = GUIDE_CHAPTERS.filter(x => x.status === "manuscript");
    const total = sources.reduce((sum, x) => sum + readFileSync(sourcePath(x.id, x.status), "utf8").length, 0);
    assert.ok(total > 300_000, "expected the complete long-form source reference, not an abbreviated overview");
    assert.ok(!GUIDE_CHAPTERS.some(x => x.id === "ch12"), "retired Skills Studio must not return as an active chapter");
    assert.ok(GUIDE_CHAPTERS.some(x => x.id === "app-d"));
    assert.ok(GUIDE_CHAPTERS.some(x => x.id === "app-e-06"));
  });

  it("splits the sonic encyclopedia at numbered section headings without cutting words", () => {
    const parts = GUIDE_CHAPTERS.filter(x => x.id.startsWith("app-e-"));
    assert.equal(parts.length, 6);
    const text = parts.map(x => readFileSync(sourcePath(x.id, x.status), "utf8"));
    for (const part of text.slice(1)) assert.match(part, /^# Sonic Identity Encyclopedia — Part \d+\n\nMaster Library §\d+\./);
    const sectionNumbers = text.join("\\n").match(/Master Library §\d+\./g) ?? [];
    assert.ok(sectionNumbers.length >= 59, `Expected all 59 numbered sonic-identity sections, found ${sectionNumbers.length}`);
  });

  it("keeps the current v4 and official Suno reference separate from the historical source", () => {
    const current = GUIDE_CHAPTERS.find(x => x.id === "current-workbench");
    const official = GUIDE_CHAPTERS.find(x => x.id === "create-mode");
    const reconciliation = GUIDE_CHAPTERS.find(x => x.id === "reconciliation");
    assert.equal(current?.status, "current");
    assert.equal(official?.status, "official");
    assert.equal(reconciliation?.status, "current");
    assert.match(readFileSync(sourcePath("reconciliation","current"), "utf8"), /ten-digit|10-digit/i);
    assert.match(readFileSync(sourcePath("create-mode","official"), "utf8"), /v6-mini/);
  });

  it("retains links for old Guide quicklinks through chapter redirects", () => {
    for (const name of ["quick-start","briefs","vocals","coverage","quality","create-mode","rights"]) {
      assert.ok(GUIDE_CHAPTERS.some(x => x.id === GUIDE_ANCHOR_REDIRECTS[name]), name);
    }
  });

  it("searches every chapter and appendix offline with ranked readable excerpts", () => {
    const docs = GUIDE_CHAPTERS.map((chapter) => ({
      ...chapter, body: readFileSync(sourcePath(chapter.id, chapter.status), "utf8"),
    }));
    const result = searchGuide(docs, "Phrygian");
    assert.ok(result.length >= 1);
    assert.ok(result.every(hit => hit.excerpt.length > 0));
    assert.ok(searchGuide(docs, "v6-mini").some(hit => hit.chapter.id === "create-mode"));
    assert.deepEqual(searchGuide(docs, "  "), []);
  });

  it("renders headings, lists and paragraphs without needing HTML parsing", () => {
    const blocks = parseGuideBlocks("# Guide\n\n## Parsing\n\nA **strong** prompt describes musical roles.\n\n- First input\n- Second input");
    assert.deepEqual(blocks.map(x => x.type), ["heading","heading","paragraph","list"]);
    assert.deepEqual(blocks[3], {type:"list",items:["First input","Second input"]});
  });
});
