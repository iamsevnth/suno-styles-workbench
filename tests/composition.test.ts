import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { generateStylesPrompts } from "../src/lib/suno/generate.ts";
import { MAX_CHARS, MIN_CHARS } from "../src/lib/suno/render.ts";
import { allStyles } from "../src/lib/suno/ontology.ts";
import { PromptCandidate } from "../src/lib/suno/types.ts";

const SEEDS = [1, 7, 42, 99, 500];

// The brief that exposed the defects: a trap genre named beside its own sub-genre, a UKG Dubstep
// colour, contradictory moods, and the compiler's own earlier output pasted back in (Fix mode).
const TRAP_UKG_BRIEF =
  "145 BPM Aggressive Trap hybridized with Trap, colored by UKG Dubstep — melodic emotional trap production, dark and aggressive in feel, " +
  "Wide-snare half-time pocket frame, drums as accelerating snare rolls, syncopated closed-hat skips, sharp snares, groove as swung and trap-weight half-time, " +
  "Sliding 808, deep mono sub, portamento bass slides take turns via disciplined mono sub with tight attack and clean decay and trap 808 glide and bounce " +
  "with precise pitch automation rather than stacking into a wall, Textures use cinematic risers and impacts and white-noise lifts, " +
  "Vocals center on silky female rap flow, The production keeps Melodic Future Bass, heavy and talk-rap front and center, " +
  "Translation stays clear on every playback system, Instrumentation is built around saturated harmonic 808, warm filtered analog pads, " +
  "warm djembe and conga polyrhythms, trap drum kit, skippy hi-hat and shaker topline, cinematic impacts, atmospheric pads, sliding 808";

const THREE_GENRE_BRIEF = "Trap + Baile Funk + Deep Dubstep, kinetic and dark, melodic emotional, male rap, 140 BPM";

function run(brief: string, mode?: "rewrite"): PromptCandidate[] {
  return SEEDS.flatMap((seed) => generateStylesPrompts(brief, { count: 2, seed, mode }).prompts);
}

const count = (text: string, re: RegExp) => (text.match(re) ?? []).length;

describe("trap + trap + UKG Dubstep brief", () => {
  const prompts = run(TRAP_UKG_BRIEF, "rewrite");

  it("resolves the genres to one primary and one supporting genre", () => {
    const parsed = generateStylesPrompts(TRAP_UKG_BRIEF, { count: 1, seed: 1, mode: "rewrite" }).parsed;
    assert.deepEqual(parsed.genres, ["Aggressive Trap", "UKG Dubstep"]);
    for (const p of prompts) {
      assert.equal(p.plan.primaryGenre, "Aggressive Trap");
      assert.equal(p.plan.secondaryGenre, "UKG Dubstep");
      assert.equal(p.plan.accentGenre, undefined);
    }
  });

  it("opens with BPM, the primary genre and the supporting genre's role", () => {
    for (const p of prompts) {
      assert.match(p.styles, /^145 BPM Aggressive Trap with UKG Dubstep hat skip and sub pressure, /, p.styles);
    }
  });

  it("never names a genre twice or invents one from the pasted-in boilerplate", () => {
    for (const p of prompts) {
      assert.doesNotMatch(p.styles, /Trap (?:and|x|hybrid|hybridized)[^.]*\bTrap\b/, p.styles);
      assert.equal(count(p.styles, /\bUKG\b/g), 1, p.styles);
      assert.doesNotMatch(p.styles, /Future Bass/i, p.styles);
    }
  });

  it("reconciles the moods into one phrase", () => {
    for (const p of prompts) {
      assert.match(p.styles, /aggressive and dark with an emotional edge/i, p.styles);
    }
  });

  it("states each sound once", () => {
    for (const p of prompts) {
      // The arrangement arc may still say "pad intro" or "808 drop"; every other section names a sound once.
      const body = p.styles.replace(/(?:arrangement moves through|record unfolds as|Form runs through)[^.]*\./, "");
      assert.ok(count(body, /\b808\b/g) <= 1, `808 repeated: ${p.styles}`);
      assert.ok(count(body, /\bmono sub\b/gi) <= 1, `mono sub repeated: ${p.styles}`);
      assert.ok(count(body, /\bpads?\b/gi) <= 1, `pads repeated: ${p.styles}`);
    }
  });

  it("carries no template fragments or repeated filler", () => {
    for (const p of prompts) {
      assert.doesNotMatch(p.styles, /take turns via|front and center|rather than stacking/i, p.styles);
      assert.ok(count(p.styles, /Translation stays clear/g) <= 1, p.styles);
      assert.doesNotMatch(p.styles, /(?:features|deliver|showcases|on)\s+(?:Vocals center on|Topline features|Lead vocals deliver)/i, p.styles);
      assert.equal(count(p.styles, /Vocals center on|Lead vocals deliver|Vocal performance features|Vocal delivery showcases|Topline features/g), 1, p.styles);
    }
  });

  it("does not capitalize mid-sentence fragments", () => {
    for (const p of prompts) {
      const stray = p.styles.match(/[,;:]\s+[A-Z][a-z]+/g) ?? [];
      assert.deepEqual(stray, [], p.styles);
    }
  });

  it("keeps the 925–975 character window", () => {
    for (const p of prompts) assert.ok(p.styles.length >= MIN_CHARS && p.styles.length <= MAX_CHARS, `${p.styles.length}`);
  });

  it("writes the sections in a fixed order", () => {
    const order = [/^145 BPM/, /half-time/, /\b(?:low end|bass)\b/i, /harmonic bed|Transitions|Ear-candy|FX bed|Texture design|Scene changes/, /Vocals center on|Lead vocals deliver|Vocal performance features|Vocal delivery showcases|Topline features/, /arrangement moves through|record unfolds as|Form runs through/, /\bMix\b|mix with|mix for|mix around|Balance the mix/i];
    for (const p of prompts) {
      let at = -1;
      for (const section of order) {
        const hit = p.styles.search(section);
        assert.ok(hit > at, `${section} out of order in: ${p.styles}`);
        at = hit;
      }
    }
  });
});

describe("three-genre brief", () => {
  const prompts = run(THREE_GENRE_BRIEF);

  it("keeps the first-named genre as the primary in every variation", () => {
    for (const p of prompts) {
      assert.equal(p.plan.primaryGenre, "Trap");
      const supporting = [p.plan.secondaryGenre, p.plan.accentGenre].filter(Boolean).sort();
      assert.deepEqual(supporting, ["Baile Funk", "Deep Dubstep"]);
    }
  });

  it("gives each supporting genre an explicit role in the opening sentence", () => {
    for (const p of prompts) {
      const opening = p.styles.split(". ")[0];
      assert.match(opening, /^140 BPM Trap with (?:Baile Funk percussion, plus Deep Dubstep bass movement|Deep Dubstep bass movement, plus Baile Funk percussion), kinetic and dark with an emotional edge$/, opening);
    }
  });

  it("stays inside the window with no stray capitals", () => {
    for (const p of prompts) {
      assert.ok(p.styles.length >= MIN_CHARS && p.styles.length <= MAX_CHARS);
      assert.deepEqual(p.styles.match(/[,;:]\s+[A-Z][a-z]+/g) ?? [], [], p.styles);
    }
  });
});

describe("tempo across a blend", () => {
  it("chooses one tempo near the primary when the brief names none", () => {
    for (const seed of SEEDS) {
      const p = generateStylesPrompts("Trap + UKG Dubstep, dark", { count: 1, seed }).prompts[0];
      assert.match(p.styles, new RegExp(`\\b${p.bpm} BPM\\b`));
      assert.ok(p.bpm >= 130 && p.bpm <= 150, String(p.bpm));
    }
  });

  it("notes a tempo that fights one of the blended genres", () => {
    const p = generateStylesPrompts("90 BPM Aggressive Trap + Deep House, dark", { count: 1, seed: 1 }).prompts[0];
    assert.ok((p.plan.bpmNotes ?? []).some((n) => /Deep House/.test(n)), String(p.plan.bpmNotes));
  });
});

describe("no gunshot wording", () => {
  it("never writes 'gunshot' for any genre in the ontology", () => {
    for (const { name: genre } of allStyles()) {
      for (const seed of [1, 2, 3]) {
        const brief = `${genre}, kinetic, 140 BPM`;
        for (const p of generateStylesPrompts(brief, { count: 2, seed }).prompts) {
          assert.doesNotMatch(p.styles, /gunshot|gun-shot|gun shot/i, `${genre}: ${p.styles}`);
        }
      }
    }
  });
});
