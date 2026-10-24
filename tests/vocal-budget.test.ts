import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { generateStylesPrompts } from "../src/lib/suno/generate.ts";
import { MAX_CHARS, MIN_CHARS, VOCAL_BUDGET } from "../src/lib/suno/render.ts";
import { PromptCandidate } from "../src/lib/suno/types.ts";

// The production carries a Styles prompt. Unless the brief describes the voice at length, the
// vocal gets one short sentence and the rest of the 925–975 characters goes to the sonic plan.

const SEEDS = [1, 7, 42, 99, 500];
const VOCAL_SENTENCE =
  /(?:Vocal performance features|Lead vocals deliver|Vocals center on|Vocal delivery showcases|Topline features)[^.]*\./;

function promptsFor(brief: string): PromptCandidate[] {
  return SEEDS.flatMap((seed) => generateStylesPrompts(brief, { count: 3, seed }).prompts);
}

const vocalOf = (p: PromptCandidate) => p.styles.match(VOCAL_SENTENCE)?.[0] ?? "";

describe("vocal share of the Styles prompt", () => {
  const BASIC_BRIEFS = [
    "UKG Dubstep and Trap, male rap, explosive, hypnotic",
    "140 BPM trap future bass, female vocals, high energy",
    "dark trap",
    "afrobeats, male vocals",
    "deep house, female vocals",
    "melodic R&B with flute and Rhodes electric piano",
  ];
  for (const brief of BASIC_BRIEFS) {
    it(`"${brief}" keeps the vocal to one short sentence`, () => {
      for (const p of promptsFor(brief)) {
        const vocal = vocalOf(p);
        assert.ok(vocal, p.styles);
        assert.equal(p.plan.vocals.detail, "compact");
        assert.ok(vocal.length <= VOCAL_BUDGET.compact, `${vocal.length}: ${vocal}`);
        assert.ok(p.characters >= MIN_CHARS && p.characters <= MAX_CHARS, `${p.characters}`);
      }
    });
  }

  it("does not repeat the vocal in a separate front-and-center sentence", () => {
    for (const brief of ["UKG, male rap", "afrobeats, male vocals", "deep house, female vocals"]) {
      for (const p of promptsFor(brief)) {
        assert.doesNotMatch(p.styles, /keeps[^.]*(rap flow|vocals)[^.]*front and center/, p.styles);
      }
    }
  });

  it("gives a brief that describes the voice at length a longer vocal line in its own words", () => {
    const brief =
      "trap, breathy female alto vocal, close-mic, light autotune gloss, slapback delay, doubled vocals, tape saturation";
    for (const p of promptsFor(brief)) {
      assert.equal(p.plan.vocals.detail, "detailed");
      assert.match(vocalOf(p), /breathy female alto/i, p.styles);
      assert.ok(vocalOf(p).length <= VOCAL_BUDGET.detailed + 120, vocalOf(p));
    }
  });
});
