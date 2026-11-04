import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  arrangeLyrics,
  approximateRhymeKey,
  estimatedSyllables,
  parseWholeSong,
  parseProjectJSON,
  renderArrangement,
  sourceLines,
  suggestTargets,
  verifyArrangement,
  type ArrangementOptions,
  type SourceSection,
  type TargetSection,
} from "../src/lib/lyrics/arranger.ts";

const chorus = {
  id: "chorus",
  type: "chorus" as const,
  text: Array.from({ length: 16 }, (_, n) => "Original line " + (n + 1) + " shines tonight").join("\n"),
};
const options: ArrangementOptions = { seed: 51, preserveRhyme: true, targetBpm: 140, sourceBpm: 100 };
const destination: TargetSection[] = [
  { id: "build", type: "buildup", bars: 8, sourceId: chorus.id, mode: "chop" },
  { id: "drop", type: "drop", bars: 16, sourceId: chorus.id, mode: "whole" },
];

describe("v5.2 source-only lyric arrangement", () => {
  it("parses whole-song section tags and leaves unknown labels as source text", () => {
    const parsed = parseWholeSong("[Chorus]\nFirst line\nSecond line\n\n[Build Up]\nThird line\n\n[Custom Tag]\nOwn words");
    assert.deepEqual(parsed.map(x => x.type), ["chorus", "buildup", "buildup"]);
    assert.deepEqual(sourceLines(parsed).map(x => x.text),
      ["First line", "Second line", "Third line", "[Custom Tag]", "Own words"]);
  });
  it("proposes an 8-bar buildup and 16-bar drop using the original chorus", () => {
    const proposed = suggestTargets([chorus]);
    assert.deepEqual(proposed.map(t => [t.type, t.bars]), [["buildup", 8], ["drop", 16]]);
    assert.ok(proposed.every(t => t.sourceId === chorus.id));
  });
  it("rearranges 16 original chorus lines into 24 slots without adding lyric text", () => {
    const result = arrangeLyrics([chorus], destination, options);
    assert.equal(result.sections.length, 2);
    assert.deepEqual(result.sections.map(s => s.lines.length), [8, 16]);
    assert.equal(result.sourceLineCount, 16);
    assert.equal(result.verified, true);
    assert.equal(verifyArrangement([chorus], result), true);
    assert.equal(result.fullText, renderArrangement(result.sections));
    assert.ok(result.repeatedSlots >= 8);
    assert.ok(result.warnings.some(w => w.includes("20% faster")));
    for (const section of result.sections) {
      for (const span of section.lines) {
        const original = sourceLines([chorus]).find(l => l.id === span.lineId);
        assert.ok(original);
        assert.equal(original!.text.slice(span.start, span.end), span.text);
      }
    }
  });
  it("reproduces a seeded result and permits changed ordering", () => {
    const base = arrangeLyrics([chorus], destination, options);
    assert.deepEqual(arrangeLyrics([chorus], destination, options), base);
    const changed = arrangeLyrics([chorus], destination, { ...options, seed: 99 });
    assert.notEqual(changed.fullText, base.fullText);
  });
  it("chops long lines only at existing source word boundaries", () => {
    const material: SourceSection[] = [{
      id: "a", type: "verse",
      text: "One two three four five six seven eight nine ten eleven twelve thirteen fourteen",
    }];
    const chopped = arrangeLyrics(material, [{
      id: "new", type: "drop", bars: 3, sourceId: "a", mode: "chop",
    }], { seed: 4, preserveRhyme: false, targetBpm: 150 });
    const fragments = chopped.sections[0].lines;
    assert.equal(fragments.length, 3);
    assert.ok(fragments.some(line => line.text.split(" ").length <= 6));
    assert.ok(chopped.warnings.some(w => w.includes("reuses 0")) === false);
    assert.ok(verifyArrangement(material, chopped));
  });
  it("honors source-section locking for ordered phrase selection", () => {
    const locked: SourceSection[] = [{ id: "l", type: "verse", locked: true, text: "Alpha\nBeta\nGamma" }];
    const targets: TargetSection[] = [{ id: "t", type: "verse", bars: 3, sourceId: "l", mode: "whole" }];
    const a = arrangeLyrics(locked, targets, { seed: 3, preserveRhyme: false, targetBpm: 120 });
    const b = arrangeLyrics(locked, targets, { seed: 73, preserveRhyme: false, targetBpm: 120 });
    assert.equal(a.fullText, "[Verse]\nAlpha\nBeta\nGamma");
    assert.equal(a.fullText, b.fullText);
  });
  it("rejects altered outputs, invalid offsets, and source changes", () => {
    const result = arrangeLyrics([chorus], destination, options);
    assert.equal(verifyArrangement([chorus], { ...result, fullText: result.fullText + " invented" }), false);
    const altered = structuredClone(result);
    altered.sections[0].lines[0].text = "UNAUTHORIZED NEW WORD";
    assert.equal(verifyArrangement([chorus], altered), false);
    const moved = structuredClone(result);
    moved.sections[0].lines[0].start = -1;
    assert.equal(verifyArrangement([chorus], moved), false);
    assert.equal(verifyArrangement([{ ...chorus, text: "Changed source" }], result), false);
  });
  it("rejects invalid bar counts, broken source references, and empty input", () => {
    assert.throws(() => arrangeLyrics([chorus], [{ ...destination[0], bars: 0 }], options));
    assert.throws(() => arrangeLyrics([chorus], [{ ...destination[0], bars: 65 }], options));
    assert.throws(() => arrangeLyrics([chorus], [{ ...destination[0], sourceId: "missing" }], options));
    assert.throws(() => arrangeLyrics([], destination, options));
    assert.throws(() => arrangeLyrics([chorus], destination, { ...options, targetBpm: 0 }));
    assert.throws(() => arrangeLyrics([chorus], destination, { ...options, seed: 0.5 }));
  });
  it("round-trips only validated project data", () => {
    const project = {
      version: 1, mode: "sections", wholeText: "", sections: [chorus], targets: destination, options,
    };
    assert.deepEqual(parseProjectJSON(JSON.stringify(project)), project);
    assert.throws(() => parseProjectJSON("{}"));
    assert.throws(() => parseProjectJSON(JSON.stringify({ ...project, targets: [{ ...destination[0], bars: 0 }] })));
    assert.throws(() => parseProjectJSON(JSON.stringify({ ...project, options: { ...options, targetBpm: "fast" } })));
    assert.throws(() => parseProjectJSON(JSON.stringify({ ...project, sections: [{ ...chorus, text: 7 }] })));
  });
  it("keeps estimators explicitly approximate", () => {
    assert.ok(estimatedSyllables("Moving through the midnight") > 0);
    assert.equal(approximateRhymeKey("Let it glow"), approximateRhymeKey("We grow"));
    assert.equal(approximateRhymeKey(""), "");
  });
});
