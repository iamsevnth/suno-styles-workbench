import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { Selector } from "../src/lib/suno/affinity.ts";
import { generateStylesPrompts } from "../src/lib/suno/generate.ts";
import { MAX_CHARS, MIN_CHARS } from "../src/lib/suno/render.ts";
import { GROOVE, HARMONY } from "../src/lib/suno/lexicon.ts";
import { PromptCandidate } from "../src/lib/suno/types.ts";
import { mulberry32 } from "../src/lib/suno/rng.ts";

const SEEDS = [1, 7, 42, 99, 500, 1234, 31337];

const TRAP_UKG = "145 BPM Aggressive Trap + UKG Dubstep, dark and aggressive, melodic emotional, silky female rap";
// The compiler's own earlier output pasted back in (Fix mode), instrumentation list included.
const TRAP_UKG_PASTED =
  "145 BPM Aggressive Trap with UKG Dubstep hat skip and sub pressure, cinematic, aggressive and dark with an emotional edge. " +
  "Drums sit in a head-nod half-time frame. Low end centers on sliding 808 and deep mono sub. " +
  "The harmonic bed uses luxury minor-key keys and warm G-funk synth chords to hold the tonal mood. " +
  "The sound palette centers on warm djembe and conga polyrhythms, trap drum kit, skippy hi-hat and shaker topline. " +
  "Lead vocals deliver silky female rap flow.";
const THREE_GENRE = "Trap + Baile Funk + Deep Dubstep, kinetic and dark, melodic emotional, male rap, 140 BPM";

/** Phrases native to other genres: hip-hop sample culture, world percussion, gospel, orchestral score, house, dembow. */
const OFF_FAMILY =
  /g-funk|boom[- ]bap|jazzy|soul[- ]sample|luxury minor|vinyl|dusty|ceremonial|djembe|woodblock|hand percussion|gospel|church|hammond|neo-soul|banjo|orchestral|dembow|four-on-the-floor|2-step/i;

/** Off-family for trap + Baile Funk + dubstep; Baile's own percussion (conga, tamborzão) is allowed in its role. */
const THREE_GENRE_OFF_FAMILY =
  /g-funk|boom[- ]bap|jazzy|soul[- ]sample|luxury minor|vinyl|ceremonial|gospel|church|hammond|neo-soul|orchestral|four-on-the-floor/i;

function run(brief: string, mode?: "rewrite"): PromptCandidate[] {
  return SEEDS.flatMap((seed) => generateStylesPrompts(brief, { count: 3, seed, mode }).prompts);
}

/** Every phrase the plan chose, across sections. */
function planPhrases(p: PromptCandidate): string[] {
  const { groove, drums, bass, bassBehavior, harmony, melody, instruments, soundDesign, arrangement, mix } = p.plan;
  return [...groove, ...drums, ...bass, ...bassBehavior, ...harmony, ...melody, ...instruments, ...soundDesign, ...arrangement, ...mix];
}

describe("genre-aware phrase selection: trap + UKG Dubstep", () => {
  for (const [label, brief, mode] of [
    ["plain brief", TRAP_UKG, undefined],
    ["pasted compiler output (Fix mode)", TRAP_UKG_PASTED, "rewrite"],
  ] as const) {
    it(`keeps off-family phrases out of the ${label}`, () => {
      for (const p of run(brief, mode)) {
        assert.equal(p.plan.primaryGenre, "Aggressive Trap");
        assert.equal(p.plan.secondaryGenre, "UKG Dubstep");
        assert.doesNotMatch(p.styles, OFF_FAMILY, p.styles);
        for (const phrase of planPhrases(p)) assert.doesNotMatch(phrase, OFF_FAMILY, phrase);
      }
    });

    it(`keeps the ${label} inside the character window`, () => {
      for (const p of run(brief, mode)) {
        assert.ok(p.styles.length >= MIN_CHARS && p.styles.length <= MAX_CHARS, `${p.styles.length}: ${p.styles}`);
      }
    });
  }

  it("still gives the supporting genre its role: UKG hat skip and sub pressure in drums, groove or bass", () => {
    for (const p of run(TRAP_UKG)) {
      assert.match(p.styles, /UKG Dubstep hat skip and sub pressure/, p.styles);
      assert.match(p.styles, /skipp|shuffl|syncopated/i, p.styles);
    }
  });

  it("keeps a G-funk phrase out of trap but lets a brief that names G-funk keep it", () => {
    const named = run("West Coast G-funk Hip-Hop with trap drums, warm G-funk synth chords, male rap, 95 BPM");
    assert.ok(
      named.some((p) => /g-funk/i.test(p.styles)),
      "a G-funk brief should still get G-funk wording"
    );
  });
});

describe("genre-aware phrase selection: three genres", () => {
  const prompts = run(THREE_GENRE);

  it("keeps the first-named genre primary and never uses off-family phrases", () => {
    for (const p of prompts) {
      assert.match(p.plan.primaryGenre, /Trap/);
      assert.doesNotMatch(p.styles, THREE_GENRE_OFF_FAMILY, p.styles);
      for (const phrase of planPhrases(p)) assert.doesNotMatch(phrase, THREE_GENRE_OFF_FAMILY, phrase);
    }
  });

  it("lets Baile Funk percussion appear only in the drum, groove and instrument roles", () => {
    const conga = /conga|djembe|woodblock|talking drum/i;
    for (const p of prompts) {
      const { harmony, melody, soundDesign, mix, bass, bassBehavior } = p.plan;
      for (const phrase of [...harmony, ...melody, ...soundDesign, ...mix, ...bass, ...bassBehavior]) {
        assert.doesNotMatch(phrase, conga, phrase);
      }
    }
  });

  it("stays inside the character window", () => {
    for (const p of prompts) assert.ok(p.styles.length >= MIN_CHARS && p.styles.length <= MAX_CHARS, p.styles);
  });
});

describe("genre-aware phrase selection: brief-named instruments stay protected", () => {
  it("keeps hand percussion when the brief asks for hand drums", () => {
    const prompts = run("145 BPM Aggressive Trap + UKG Dubstep, hand drums, dark and aggressive, male rap");
    for (const p of prompts) {
      assert.ok(p.plan.instruments.some((i) => /hand percussion|djembe|woodblock|conga|ceremonial/i.test(i)), p.plan.instruments.join(" | "));
    }
  });

  it("keeps a djembe named outside the compiled instrumentation list", () => {
    const prompts = run("145 BPM Aggressive Trap + UKG Dubstep with djembe, dark and aggressive, male rap");
    for (const p of prompts) {
      assert.ok(p.plan.instruments.some((i) => /hand percussion|djembe|woodblock|conga|ceremonial/i.test(i)), p.plan.instruments.join(" | "));
    }
  });
});

describe("Selector", () => {
  const trapUkg = new Selector(["Aggressive Trap", "UKG Dubstep"], "");

  it("excludes phrases native to genres outside the blend", () => {
    assert.equal(trapUkg.allows("warm G-funk synth chords", "harmony"), false);
    assert.equal(trapUkg.allows("ceremonial hand percussion", "instruments"), false);
    assert.equal(trapUkg.allows("mid-tempo boom-bap pocket with warm vinyl crackle", "groove"), false);
    assert.equal(trapUkg.allows("trap minor-key loops with hypnotic repetition", "harmony"), true);
  });

  it("allows them when the primary genre is native or the brief names them", () => {
    assert.equal(new Selector(["West Coast Hip Hop", "Aggressive Trap"], "").allows("warm G-funk synth chords", "harmony"), true);
    assert.equal(new Selector(["Aggressive Trap", "UKG Dubstep"], "add warm G-funk synth chords").allows("warm G-funk synth chords", "harmony"), true);
  });

  it("lets a supporting genre's phrases in only for its own role", () => {
    const baile = new Selector(["Aggressive Trap", "Baile Funk"], "");
    assert.equal(baile.allows("distorted conga hits", "drums"), true);
    assert.equal(baile.allows("distorted conga hits", "harmony"), false);
    const bank = { trap: ["trap bank phrase"], baile: ["baile bank phrase"] };
    assert.deepEqual(baile.pick(mulberry32(1), bank, ["trap", "baile"], 5, "harmony"), ["trap bank phrase"]);
    assert.deepEqual(new Set(baile.pick(mulberry32(1), bank, ["trap", "baile"], 5, "drums")), new Set(["trap bank phrase", "baile bank phrase"]));
  });

  it("draws primary-family phrases ahead of supporting ones", () => {
    const bank = { trap: ["t1", "t2", "t3"], ukg: ["u1", "u2", "u3"] };
    const sel = new Selector(["Aggressive Trap", "UKG Dubstep"], "");
    let primaryFirst = 0;
    for (let seed = 1; seed <= 200; seed++) {
      if (sel.pick(mulberry32(seed), bank, ["trap", "ukg"], 1, "drums")[0].startsWith("t")) primaryFirst++;
    }
    assert.ok(primaryFirst > 130, `primary drawn first ${primaryFirst}/200`);
  });

  it("never lets a mismatched phrase back in through the general fallback", () => {
    const bank = { trap: [], general: ["warm G-funk synth chords", "neutral dark bed"] };
    assert.deepEqual(trapUkg.pick(mulberry32(3), bank, ["trap"], 2, "harmony"), ["neutral dark bed"]);
  });

  it("keeps protected phrases when cleaning a list", () => {
    assert.deepEqual(
      trapUkg.clean(["ceremonial hand percussion", "trap drum kit"], "instruments", ["ceremonial hand percussion"]),
      ["ceremonial hand percussion", "trap drum kit"]
    );
    assert.deepEqual(trapUkg.clean(["ceremonial hand percussion", "trap drum kit"], "instruments"), ["trap drum kit"]);
  });

  it("uses real library banks without mixing styles", () => {
    const harmony = trapUkg.pick(mulberry32(5), HARMONY, ["rap", "trap"], 10, "harmony");
    assert.ok(harmony.length > 0);
    assert.ok(!harmony.some((h) => /g-funk|jazzy|soul-sample|luxury/i.test(h)), harmony.join(" | "));
    const groove = trapUkg.pick(mulberry32(5), GROOVE, ["trap", "rap", "ukg"], 12, "groove");
    assert.ok(!groove.some((g) => /boom-bap|vinyl/i.test(g)), groove.join(" | "));
  });
});
