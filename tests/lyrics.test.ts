import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { generateLyrics } from "../src/lib/lyrics/generator.ts";
import { convertToPhonetics, wordToAmericanPhonetic } from "../src/lib/lyrics/phonetics.ts";
import { DEFAULT_STRUCTURE } from "../src/lib/lyrics/types.ts";

describe("lyrics generator", () => {
  it("builds every default section with tags", () => {
    const result = generateLyrics({
      theme: "Midnight sub bass ritual in neo-tokyo",
      genre: "Trapstep / Hybrid Bass",
      mood: "Dark & Menacing",
      delivery: "Intimate to Aggressive Chant",
      structure: DEFAULT_STRUCTURE,
    });
    assert.ok(result.sections.length > 5);
    assert.ok(result.fullText.includes("[Verse 1]"));
    assert.ok(result.fullText.includes("[Chorus"));
    assert.ok(result.fullText.includes("[Drop"));
    assert.ok(result.totalLines > 10);
  });
});

describe("American English phonetics", () => {
  const sample = `[Chorus]
In the red line glow where the streetlights freeze
Hold the frequency until the glass begins to crack
Baile funk in the favela rhythm
I probably feel the sub bass tension dropping tonight`;
  const result = convertToPhonetics(sample);

  it("leaves section tags untouched", () => {
    assert.equal(result.lines[0].isTag, true);
    assert.equal(result.lines[0].phonetic, "[Chorus]");
  });

  it("preserves words with an existing ay spelling", () => {
    assert.equal(convertToPhonetics("day").fullPhonetic, "day");
  });

  it("respells loanwords and casual speech", () => {
    assert.match(result.lines[3].phonetic, /bylee/i);
    assert.ok(result.lines[3].phonetic.includes("fahvelah"));
    for (const word of ["problee", "tha", "bays", "tenshun", "droppin"]) {
      assert.ok(result.lines[4].phonetic.includes(word), `${word} missing from ${result.lines[4].phonetic}`);
    }
  });

  it("never emits hyphens", () => {
    assert.ok(!result.lines[4].phonetic.includes("-"));
  });

  it("preserves the aw vowel spelling", () => {
    assert.equal(convertToPhonetics("saw").lines[0].phonetic, "saw");
  });
});
