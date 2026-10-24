import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { familyKeys } from "../src/lib/suno/families.ts";
import { generateStylesPrompts } from "../src/lib/suno/generate.ts";
import { parseUserInput } from "../src/lib/suno/parse.ts";
import { PromptCandidate } from "../src/lib/suno/types.ts";
import { withoutGenreNames } from "./helpers.ts";

// UKG (UKG dubstep) and UK garage are different styles. UKG is 140 BPM trap drums under heavy,
// massive sub pressure with a skippy, syncopated hi-hat and shaker topline; UK garage is swung,
// 2-step and soulful. Neither may borrow the other's vocabulary.

const SEEDS = [1, 7, 42, 99, 500];
const UK_GARAGE_WORDS = /\bUK garage\b|\bgarage\b|2-step|two-step|house diva|organ stab|speed-garage/i;
const BASS_MUSIC_WORDS = /\bwubs?\b|wobble|growl|\bReese\b|\bneuro/i;
const UKG_WORDS = /\bUKG\b|dubstep|wobble|\bwubs?\b|growl|140 UK bass/i;

function promptsFor(brief: string): PromptCandidate[] {
  return SEEDS.flatMap((seed) => generateStylesPrompts(brief, { count: 3, seed }).prompts);
}

function planGenres(p: PromptCandidate): string[] {
  return [p.plan.primaryGenre, p.plan.secondaryGenre, p.plan.accentGenre].filter((g): g is string => Boolean(g));
}

describe("reading UKG and UK garage in a brief", () => {
  const CASES: [string, string[]][] = [
    ["UKG Dubstep", ["UKG Dubstep"]],
    ["UKG", ["UKG Dubstep"]],
    ["ukg dubstep, dark, 140 bpm", ["UKG Dubstep"]],
    ["ukg-dubstep, heavy", ["UKG Dubstep"]],
    ["UKG, male rap", ["UKG Dubstep"]],
    ["UKG Trap", ["UKG Trap"]],
    ["140 UKG", ["140 UKG"]],
    ["UK Garage", ["UK Garage"]],
    ["2-step garage, female vocals", ["UK Garage"]],
    ["UK Garage + UKG", ["UK Garage", "UKG Dubstep"]],
  ];
  for (const [brief, genres] of CASES) {
    it(`"${brief}" reads as ${genres.join(" + ")}`, () => {
      assert.deepEqual(parseUserInput(brief).genres, genres);
    });
  }

  it("files UKG genres under their own sound family, never UK garage or wobble bass music", () => {
    for (const name of ["UKG Dubstep", "140 UKG", "Deep UKG", "Half-Time UKG", "Deep UKG-Dubstep"]) {
      assert.deepEqual(familyKeys([name]), ["ukg"], name);
    }
    assert.deepEqual(familyKeys(["UKG Trap"]), ["trap", "ukg"]);
    assert.deepEqual(familyKeys(["UK Garage"]), ["garage"]);
  });
});

describe("UKG prompts", () => {
  for (const brief of ["UKG Dubstep", "UKG", "ukg dubstep, dark", "UKG, male rap", "UKG Dubstep, female vocals"]) {
    it(`"${brief}" is 140 BPM half-time trap drums with a skippy hat and shaker topline`, () => {
      for (const p of promptsFor(brief)) {
        assert.equal(p.plan.bpm, 140, p.styles);
        assert.match(p.styles, /\b140 BPM\b/, p.styles);
        assert.equal(p.plan.metricFeel, "half-time", p.styles);
        assert.match(p.styles, /\btrap\b/i, p.styles);
        assert.match(p.styles, /skipp|shuffl|syncopated/i, p.styles);
        assert.match(p.styles, /shaker/i, p.styles);
        assert.match(p.styles, /\b808|\bsub\b/i, p.styles);
        assert.doesNotMatch(p.styles, UK_GARAGE_WORDS, p.styles);
        assert.doesNotMatch(withoutGenreNames(p), BASS_MUSIC_WORDS, p.styles);
        assert.ok(!planGenres(p).some((g) => familyKeys([g]).includes("garage")), planGenres(p).join(" + "));
      }
    });
  }

  it("keeps a tempo the brief names", () => {
    for (const p of promptsFor("UKG dubstep, 150 bpm")) assert.equal(p.plan.bpm, 150);
  });

  it("keeps UKG-Swung Drill half-time, with the swing in the topline", () => {
    for (const p of promptsFor("UKG-Swung Drill")) {
      assert.equal(p.plan.metricFeel, "half-time", p.styles);
      assert.doesNotMatch(p.styles, UK_GARAGE_WORDS, p.styles);
    }
  });
});

describe("UK garage prompts", () => {
  for (const brief of ["UK Garage", "2-step garage, female vocals", "uk garage, 132 bpm"]) {
    it(`"${brief}" stays UK garage, with nothing from UKG or dubstep`, () => {
      for (const p of promptsFor(brief)) {
        assert.match(p.styles, /UK Garage/, p.styles);
        assert.doesNotMatch(p.styles, UKG_WORDS, p.styles);
        assert.ok(!planGenres(p).some((g) => familyKeys([g]).includes("ukg")), planGenres(p).join(" + "));
      }
    });
  }
});

describe("vocal description in one-line briefs", () => {
  it("quotes only the vocal part, not the genre list", () => {
    for (const brief of ["Melodic Trap, male rap", "UKG Trap, male rap"]) {
      const raw = parseUserInput(brief).vocals?.rawDescription ?? "";
      assert.doesNotMatch(raw, /trap/i, `${brief}: ${raw}`);
      for (const p of promptsFor(brief)) assert.doesNotMatch(p.styles, /features (Melodic|UKG) Trap/, p.styles);
    }
  });
});
