import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { familyKeys } from "../src/lib/suno/families.ts";
import { generateStylesPrompts } from "../src/lib/suno/generate.ts";
import * as dna from "../src/lib/suno/lexicon-dna.ts";
import * as vocals from "../src/lib/suno/lexicon-vocals.ts";
import * as lexicon from "../src/lib/suno/lexicon.ts";
import { allStyles } from "../src/lib/suno/ontology.ts";
import { ARTIST_LEAK_RE } from "../src/lib/suno/validate.ts";
import { parseUserInput } from "../src/lib/suno/parse.ts";
import { MAX_CHARS, MIN_CHARS } from "../src/lib/suno/render.ts";
import { PromptCandidate } from "../src/lib/suno/types.ts";

const SEEDS = [3, 11, 42, 777, 2026, 90210];
// "Riddim" is ordinary dancehall vocabulary, so it is not on this list.
const BASS_MUSIC_WORDS = /\bwubs?\b|wobble|growl stabs|growl bass|mid-bass growl|neuro|\bReese\b|dubstep/i;
// "One-drop" is a reggae rhythm, not an EDM drop.
const DROP_WORDS = /(?<!one-)\bdrops?\b|\bdrop-|(?<!one)-drop\b/i;
// An "808 cowbell" is a drum-machine sound; these are 808 bass phrases.
const BASS_808 = /808 (sub|bass|slides?|glides?|low end|tails?|punch)|sliding 808|tuned 808|\b808s\b/i;

function promptsFor(brief: string): PromptCandidate[] {
  return SEEDS.flatMap((seed) => generateStylesPrompts(brief, { count: 3, seed }).prompts);
}

describe("genre families", () => {
  it("gives every one of the library's genres a specific sound family", () => {
    const unmapped = allStyles()
      .map((g) => g.name)
      .filter((name) => familyKeys([name]).includes("general"));
    assert.deepEqual(unmapped, []);
  });

  it("reads moods followed by punctuation", () => {
    assert.ok(parseUserInput("gospel choir, uplifting, 90 bpm").moods.includes("uplifting"));
    assert.ok(parseUserInput("deep house. euphoric!").moods.includes("euphoric"));
  });
});

const SONG_AND_WORLD_BRIEFS: [string, RegExp][] = [
  ["gospel choir, uplifting, 90 bpm", /Gospel/],
  ["deep soulful neo-soul, intimate", /Soul/i],
  ["afrobeats, sunny, male vocals", /Afrobeats/],
  ["amapiano with log drum and piano", /Amapiano/],
  ["reggaeton, 95 bpm, female vocals", /Reggaeton/],
  ["dancehall, bouncy", /Dancehall/],
  ["electropop, bright, female vocals", /Electropop|Pop/],
  ["ambient, slow, cinematic piano", /Ambient/],
  ["orchestral film score, epic", /Orchestral|Film Score/],
];

describe("song, world and ambient genres", () => {
  for (const [brief, genre] of SONG_AND_WORLD_BRIEFS) {
    it(`"${brief}" stays in its genre with no drops or bass-music sounds`, () => {
      for (const p of promptsFor(brief)) {
        assert.match(p.styles, genre, p.styles);
        assert.doesNotMatch(p.styles, DROP_WORDS, p.styles);
        assert.doesNotMatch(p.styles, BASS_MUSIC_WORDS, p.styles);
        assert.ok(p.characters >= MIN_CHARS && p.characters <= MAX_CHARS, `${p.characters}`);
      }
    });
  }

  it("keeps a sung lead when a non-rap genre asks for vocals", () => {
    for (const brief of [
      "gospel choir, uplifting",
      "deep house, female vocals",
      "afrobeats, male vocals",
      "electropop, female vocals",
    ]) {
      for (const p of promptsFor(brief)) {
        assert.equal(p.plan.vocals.style, "sung", `${brief}: ${p.plan.vocals.style}`);
      }
    }
  });

  it("gives ambient music a free-floating pulse and no trap drums", () => {
    for (const p of promptsFor("ambient, slow, cinematic piano")) {
      assert.equal(p.plan.metricFeel, "free");
      assert.doesNotMatch(p.styles, BASS_808, p.styles);
      assert.doesNotMatch(p.styles, /trap hi-hats|trap drum/i, p.styles);
    }
  });
});

describe("club genres", () => {
  it("keeps house on a four-on-the-floor kick with house bass", () => {
    for (const p of promptsFor("deep house, 122 bpm, female vocals")) {
      assert.equal(p.plan.metricFeel, "four-on-the-floor");
      assert.doesNotMatch(p.styles, BASS_MUSIC_WORDS, p.styles);
      assert.doesNotMatch(p.styles, BASS_808, p.styles);
    }
  });

  it("gives drum and bass breakbeats and a broken feel", () => {
    for (const p of promptsFor("drum and bass, liquid, female vocals")) {
      assert.match(p.styles, /break/i, p.styles);
      assert.doesNotMatch(p.styles, BASS_808, p.styles);
      assert.doesNotMatch(p.styles, /trap hi-hats/i, p.styles);
    }
  });
});

describe("phrase library", () => {
  // Every string in lexicon, lexicon-dna and lexicon-vocals before genre vocabulary was added (main @ 6ea3337).
  const BASELINE = 1428;

  function countStrings(value: unknown): number {
    if (typeof value === "string") return 1;
    if (Array.isArray(value)) return value.reduce((n: number, x) => n + countStrings(x), 0);
    if (value && typeof value === "object")
      return Object.values(value).reduce((n: number, x) => n + countStrings(x), 0);
    return 0;
  }

  it("holds at least twice the original vocabulary", () => {
    let total = 0;
    for (const [name, value] of Object.entries({ ...lexicon, ...dna, ...vocals })) {
      if (typeof value === "function" || name === "FAMILY_MOODS") continue;
      if (name === "VOCAL_PAIRS") total += vocals.VOCAL_PAIRS.length * 2;
      else total += countStrings(value);
    }
    assert.ok(total >= BASELINE * 2, `only ${total} phrases`);
  });

  it("writes every phrase positively, with no artist names", () => {
    // "zero" only as a negation ("zero singing"), so a title like "Zero-Gravity" passes.
    const negative = /\bzero\s|\b(no|not|without|avoid|don't|do not|never|neither)\b/i;
    const offenders: string[] = [];
    const visit = (value: unknown) => {
      if (typeof value === "string") {
        if (negative.test(value) || ARTIST_LEAK_RE.test(value) || /\bin the style of\b/i.test(value))
          offenders.push(value);
      } else if (Array.isArray(value)) value.forEach(visit);
      else if (value && typeof value === "object") Object.values(value).forEach(visit);
    };
    for (const value of Object.values({ ...lexicon, ...dna, ...vocals })) {
      if (typeof value !== "function") visit(value);
    }
    assert.deepEqual(offenders, []);
  });
});
