import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { generateStylesPrompts } from "../src/lib/suno/generate.ts";
import { parseUserInput } from "../src/lib/suno/parse.ts";
import { MAX_CHARS, MIN_CHARS } from "../src/lib/suno/render.ts";

const SEEDS = [1, 7, 42, 1337, 90210, 424242, 8675309, 2026];

function stylesFor(brief: string, count = 3): string[] {
  return SEEDS.flatMap((seed) => generateStylesPrompts(brief, { count, seed }).prompts.map((p) => p.styles));
}

describe("R&B briefs", () => {
  const brief = "melodic R&B with flute and Rhodes electric piano";

  it("parses R&B as a genre instead of splitting it on the ampersand", () => {
    const parsed = parseUserInput(brief);
    assert.ok(
      parsed.genres.some((g) => /R&B/.test(g)),
      `expected an R&B genre, got ${JSON.stringify(parsed.genres)}`
    );
  });

  it("does not count the Rhodes electric piano as a second, acoustic piano", () => {
    const parsed = parseUserInput(brief);
    assert.deepEqual(parsed.explicitInstruments, ["Rhodes electric piano", "flute"]);
  });

  it("keeps R&B, flute and Rhodes in every variation without trap or dubstep cues", () => {
    for (const styles of stylesFor(brief)) {
      assert.match(styles, /R&B/, styles);
      assert.match(styles, /flute/i, styles);
      assert.match(styles, /Rhodes/i, styles);
      // "growl" alone can be a vocal timbre ("smoky bluesy growl"); these are growl *bass* phrases.
      assert.doesNotMatch(styles, /dubstep|\bwubs?\b|wobble|neuro|growl stabs|growl bass|mid-bass growl|skrrt|SoundCloud/i, styles);
      assert.doesNotMatch(styles, /\bdrops?\b/i, styles);
      assert.ok(styles.length >= MIN_CHARS && styles.length <= MAX_CHARS, `${styles.length}`);
    }
  });
});

describe("melodic sung-rap briefs", () => {
  const brief =
    "Black Male vocal tone delivering melodic sung-rap phrases with smooth tone, laid back cadence, prominent autotune gloss";

  it("keeps dubstep bass vocabulary out of a trap-only plan", () => {
    for (const styles of stylesFor(brief)) {
      assert.doesNotMatch(styles, /\bwubs?\b|wobble|neuro|growl/i, styles);
    }
  });

  it("does not pad with SoundCloud ad-lib screams or contradict the sung-rap delivery", () => {
    for (const styles of stylesFor(brief)) {
      assert.doesNotMatch(styles, /skrrt|SoundCloud-style/i, styles);
      assert.doesNotMatch(styles, /rap pocket with unison doubles|lead stays in rap cadence|tight, chanted stack/i, styles);
    }
  });

  it("states the user's vocal description exactly once", () => {
    for (const styles of stylesFor(brief)) {
      const hits = styles.match(/melodic sung-rap phrases/gi) ?? [];
      assert.equal(hits.length, 1, styles);
    }
  });
});

describe("key parsing", () => {
  it("preserves flat-key spelling instead of turning Bb into BB", () => {
    assert.equal(parseUserInput("140 BPM, Bb minor, future bass").key, "Bb minor");
  });
});

describe("prompt prose", () => {
  const briefs = [
    "140 BPM trap future bass, female vocals, high energy",
    "Black Male vocal tone delivering melodic sung-rap phrases with smooth tone, laid back cadence, prominent autotune gloss",
    "92bpm dark r&b, male tenor, intimate, half-time",
    "gospel dubstep 150bpm reese bass",
  ];

  it("never uses meta-instructions like 'Keep X explicit in the arrangement'", () => {
    for (const brief of briefs) {
      for (const styles of stylesFor(brief, 2)) {
        assert.doesNotMatch(styles, /explicit in the arrangement/i, styles);
      }
    }
  });

  it("keeps mood words out of the vocal description", () => {
    for (const styles of stylesFor("140 BPM trap future bass, female vocals, high energy", 3)) {
      assert.doesNotMatch(styles, /vocals, high energy/i, styles);
    }
  });

  it("keeps the vocal sentence when three-genre briefs run long", () => {
    const vocalSentence = /Vocal performance features|Lead vocals deliver|Vocals center on|Vocal delivery showcases|Topline features/;
    for (const brief of [
      "Trap + Baile Funk + Deep Dubstep, kinetic, 140 BPM",
      "Future Bass + UK Garage + Trap, emotional, cinematic, 136 BPM",
    ]) {
      for (const seed of SEEDS) {
        for (const p of generateStylesPrompts(brief, { count: 3, seed }).prompts) {
          if (p.plan.vocals.present) assert.match(p.styles, vocalSentence, p.styles);
        }
      }
    }
  });

  it("keeps every prompt inside the character window across many seeds", () => {
    for (const brief of briefs) {
      for (const styles of stylesFor(brief, 3)) {
        assert.ok(styles.length >= MIN_CHARS && styles.length <= MAX_CHARS, `${styles.length}: ${styles}`);
      }
    }
  });
});
