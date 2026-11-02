import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { generateLyrics } from "../src/lib/lyrics/generator.ts";
import { ARTIST_LEAK_RE, criticalGatesPass, findContradictions, NEGATIVE_RE, validatePrompt } from "../src/lib/suno/validate.ts";
import { generateStylesPrompts } from "../src/lib/suno/generate.ts";
import { MAX_CHARS, MIN_CHARS } from "../src/lib/suno/render.ts";
import { nonEdmBleed } from "../src/lib/suno/consistency.ts";
import { parseUserInput } from "../src/lib/suno/parse.ts";
import { PromptCandidate } from "../src/lib/suno/types.ts";

// Mateus's priority genres: bass music, club EDM and rap. They run on the native generator with dedicated
// phrase banks, and a hard gate keeps acoustic, band, orchestral and lo-fi wording out of them.

const SEEDS = [1, 7, 42, 99, 777];

function promptsFor(brief: string, seeds = SEEDS): PromptCandidate[] {
  return seeds.flatMap((seed) => generateStylesPrompts(brief, { count: 2, seed }).prompts);
}

interface Case {
  brief: string;
  /** The opening genre label the prompt should carry. */
  opens: RegExp;
  bpm: [number, number];
  /** Wording this genre must carry somewhere in its prompt (at least once across the seeds). */
  signature: RegExp;
}

const CASES: Case[] = [
  { brief: "bass EDM", opens: /^Bass EDM at/, bpm: [128, 150], signature: /half-time|sub|growl|drop/i },
  { brief: "bass house", opens: /^Bass house at/, bpm: [124, 132], signature: /four-on-the-floor|bass riff|mid-bass/i },
  { brief: "dubstep", opens: /^Dubstep at/, bpm: [138, 150], signature: /half-time|growl|mid-bass|snare/i },
  { brief: "wobble bass, wubs", opens: /^Wobble bass at/, bpm: [140, 150], signature: /wobble|LFO|wob/i },
  { brief: "UKG dubstep", opens: /^UKG Dubstep at 140 BPM/, bpm: [140, 140], signature: /skippy|syncopated/i },
  { brief: "EDM trap", opens: /^EDM trap at/, bpm: [138, 152], signature: /808/i },
  { brief: "future bass", opens: /^Future bass at/, bpm: [128, 160], signature: /supersaw|pluck|chord/i },
  { brief: "future house", opens: /^Future house at/, bpm: [124, 130], signature: /four-on-the-floor|offbeat|stab|bass/i },
  { brief: "future beats", opens: /^Future beats at/, bpm: [90, 140], signature: /swung|warped|pitch|off-grid|chop/i },
  { brief: "moombahton", opens: /^Moombahton at/, bpm: [100, 115], signature: /dembow|conga|timbales|airhorn|bouncing/i },
  { brief: "baile funk", opens: /^Baile funk at/, bpm: [125, 150], signature: /tamborz|808|chant|percussion/i },
  { brief: "afro tech house", opens: /^Afro tech house at/, bpm: [120, 126], signature: /percussion|conga|tribal|marimba|djembe/i },
  { brief: "glitch bass", opens: /^Glitch bass at/, bpm: [100, 150], signature: /glitch|stutter|FM|bit-crush/i },
  { brief: "brostep", opens: /^Brostep at/, bpm: [140, 152], signature: /growl|screech|fry|aggress/i },
  { brief: "drum & bass", opens: /^Drum & bass at/, bpm: [168, 178], signature: /break|reese|rolling|sub/i },
  { brief: "drumstep", opens: /^Drumstep at/, bpm: [168, 180], signature: /half-time|breakbeat|drop/i },
  { brief: "UK garage", opens: /^UK Garage at/, bpm: [128, 138], signature: /2-step|two-step|shuffle|swung/i },
  { brief: "deep dubstep", opens: /^Deep dubstep at/, bpm: [138, 142], signature: /dub|sparse|space|delay/i },
  { brief: "modern rap", opens: /^Modern rap at/, bpm: [80, 150], signature: /bars|flow|rap vocal|808/i },
  { brief: "trap rap", opens: /^Trap rap at/, bpm: [130, 160], signature: /hi-hat|808|rap vocal/i },
  { brief: "autotuned sung-rap", opens: /^Autotuned sung-rap at/, bpm: [120, 160], signature: /autotun|sung-rap|melodic/i },
];

describe("priority genres run on the native generator", () => {
  for (const c of CASES) {
    it(`"${c.brief}": own opening, in-range BPM, 750–900 characters, every gate green`, () => {
      const prompts = promptsFor(c.brief);
      assert.ok(prompts.length > 0);
      for (const p of prompts) {
        assert.ok(p.plan.native?.edm, `${c.brief} should be a native bass/rap plan: ${p.styles}`);
        assert.match(p.styles, c.opens, p.styles);
        assert.ok(p.bpm >= c.bpm[0] && p.bpm <= c.bpm[1], `${p.bpm} BPM outside ${c.bpm.join("-")}`);
        assert.equal((p.styles.match(/\b\d{2,3} BPM\b/g) ?? []).length, 1, p.styles);
        assert.ok(p.characters >= MIN_CHARS && p.characters <= MAX_CHARS, `${p.characters}`);
        assert.ok(p.characters <= 1000);
        assert.ok(criticalGatesPass(p.hardGates), JSON.stringify(p.hardGates));
        assert.equal(p.hardGates.noGenreBleed, true, p.styles);
        assert.doesNotMatch(p.styles, NEGATIVE_RE, p.styles);
        assert.doesNotMatch(p.styles, ARTIST_LEAK_RE, p.styles);
        // The brief names one genre, so the prompt names no other: no invented accent genres.
        assert.equal(p.plan.secondaryGenre, undefined, p.styles);
        assert.equal(p.plan.accentGenre, undefined, p.styles);
      }
      assert.ok(prompts.some((p) => c.signature.test(p.styles)), `${c.brief} lacks its signature wording`);
    });

    it(`"${c.brief}": no acoustic, band, orchestral or lo-fi wording`, () => {
      for (const p of promptsFor(c.brief)) assert.deepEqual(nonEdmBleed(p.styles, c.brief), [], p.styles);
    });

    it(`"${c.brief}": the same seed gives the same prompt`, () => {
      const a = generateStylesPrompts(c.brief, { count: 1, seed: 777 }).prompts[0].styles;
      const b = generateStylesPrompts(c.brief, { count: 1, seed: 777 }).prompts[0].styles;
      assert.equal(a, b);
    });
  }
});

describe("moods, vocals and tempo from the brief", () => {
  it("keeps a tempo the brief names", () => {
    for (const p of promptsFor("brostep, 150 BPM")) {
      assert.equal(p.bpm, 150);
      assert.match(p.styles, /\b150 BPM\b/);
    }
  });

  it("writes an instrumental without a vocal word", () => {
    for (const brief of ["instrumental dubstep", "instrumental future house", "instrumental drum and bass"]) {
      for (const p of promptsFor(brief)) {
        assert.doesNotMatch(p.styles, /\bvocal|\bsing|\brap\b|\bad-?lib|\bchops?\b|\bchant|\bshout/i, p.styles);
        assert.equal(p.hardGates.noContradictions, true, p.styles);
      }
    }
  });

  it("keeps the mood and the voice the brief names", () => {
    for (const p of promptsFor("future bass, euphoric, female vocals")) {
      assert.match(p.styles, /euphoric/i, p.styles);
      assert.match(p.styles, /female/i, p.styles);
    }
  });

  it("keeps instruments the brief names beside the genre's own leads", () => {
    for (const p of promptsFor("dubstep with strings and piano, dark")) {
      assert.match(p.styles, /strings/i, p.styles);
      assert.equal(p.hardGates.noGenreBleed, true, p.styles);
    }
  });
});

const dist = (genre: string) => {
  const text = promptsFor(genre).map((p) => p.styles);
  return text.join("\n");
};

describe("sibling genres stay genuinely distinct", () => {
  it("brostep, deep dubstep, UKG dubstep and wobble bass do not share signature wording", () => {
    const bro = dist("brostep");
    const deep = dist("deep dubstep");
    const ukg = dist("UKG dubstep");
    const wobble = dist("wobble bass");
    assert.match(bro, /screech|fry|growl|aggress/i);
    assert.match(deep, /sparse|space|dub chords?|delay/i);
    assert.match(ukg, /skippy|syncopated/i);
    assert.match(ukg, /shaker/i);
    assert.match(wobble, /wobble|LFO/i);
    assert.doesNotMatch(deep, /screech|fry bass|gang shout/i);
    assert.doesNotMatch(bro, /skippy|shaker shuffle|dub chord/i);
    assert.doesNotMatch(ukg, /screech|fry bass|wobble|LFO|\bwubs?\b|growl|dub chord/i);
    assert.doesNotMatch(wobble, /skippy|shaker shuffle/i);
    assert.doesNotMatch(wobble, /tamborz|dembow/i);
  });

  it("UKG dubstep is 140 BPM half-time trap drums, never UK garage", () => {
    for (const p of promptsFor("UKG dubstep")) {
      assert.equal(p.bpm, 140);
      assert.doesNotMatch(p.styles, /\bgarage\b|2-step|two-step|organ stab|diva/i, p.styles);
    }
    for (const p of promptsFor("UK garage")) assert.doesNotMatch(p.styles, /skippy|trap kick|\bUKG\b|dubstep/i, p.styles);
  });

  it("future bass, future house and future beats keep their own chords, grooves and tempos", () => {
    const bass = promptsFor("future bass");
    const house = promptsFor("future house");
    const beats = promptsFor("future beats");
    for (const p of bass) assert.ok(p.bpm >= 128 && p.bpm <= 160);
    for (const p of house) assert.ok(p.bpm >= 124 && p.bpm <= 130);
    for (const p of beats) assert.ok(p.bpm >= 90 && p.bpm <= 140);
    const t = (ps: PromptCandidate[]) => ps.map((p) => p.styles).join("\n");
    assert.match(t(bass), /supersaw|chord/i);
    assert.match(t(house), /four-on-the-floor|offbeat/i);
    assert.match(t(beats), /swung|warped|off-grid/i);
    assert.doesNotMatch(t(house), /half-time|supersaw chord stacks/i);
    assert.doesNotMatch(t(bass), /four-on-the-floor/i);
    assert.doesNotMatch(t(beats), /four-on-the-floor|supersaw/i);
  });

  it("trap EDM is a drop record and trap rap is a rap record", () => {
    for (const p of promptsFor("EDM trap")) {
      assert.match(p.styles, /drop/i, p.styles);
      assert.doesNotMatch(p.styles, /\brap\b|\bbars\b|\bflow\b|punchy ad-libs/i, p.styles);
    }
    for (const p of promptsFor("trap rap")) {
      assert.match(p.styles, /rap vocal|bars|flow/i, p.styles);
      assert.match(p.styles, /hi-hat|808/i, p.styles);
      assert.doesNotMatch(p.styles, /snare-roll build|heavy drop|second drop|supersaw/i, p.styles);
    }
  });

  it("a brief that says trap with male rap takes the rap banks", () => {
    assert.equal(parseUserInput("trap, male rap, dark").native?.primary, "trap-rap");
    assert.equal(parseUserInput("trap, female vocals, dark").native?.primary, "trap-edm");
    for (const p of promptsFor("trap, male rap, dark")) {
      assert.match(p.plan.primaryGenre, /^Trap/);
      assert.match(p.styles, /male rap/i, p.styles);
    }
  });

  it("drum & bass and drumstep differ: rolling breakbeats vs half-time drops", () => {
    const dnb = dist("drum and bass");
    const dstep = dist("drumstep");
    assert.match(dnb, /break|reese|rolling/i);
    assert.match(dstep, /half-time|double-time/i);
    for (const p of promptsFor("drum and bass")) assert.ok(p.bpm >= 168 && p.bpm <= 178);
    for (const p of promptsFor("drumstep")) assert.ok(p.bpm >= 168 && p.bpm <= 180);
    assert.doesNotMatch(dnb, /half-time drop/i);
  });
});

describe("rap wording", () => {
  it("modern rap carries rap flow, ad-libs and 808s", () => {
    const text = dist("modern rap");
    assert.match(text, /bars|flow/i);
    assert.match(text, /ad-lib/i);
    assert.match(text, /808/i);
  });

  it("trap rap carries hi-hat rolls and 808 slides", () => {
    const text = dist("trap rap");
    assert.match(text, /hi-hat roll|hat|triplet/i);
    assert.match(text, /808/i);
  });

  it("autotuned sung-rap carries autotune, melodic hooks and harmonies", () => {
    const text = dist("autotuned sung-rap");
    assert.match(text, /autotun/i);
    assert.match(text, /sung|melodic/i);
  });

  it("a brief that only describes a rap voice routes to a rap record", () => {
    for (const [brief, id] of [
      ["male rap vocals", "modern-rap"],
      ["autotuned rap", "sung-rap"],
    ] as const) {
      assert.equal(parseUserInput(brief).native?.primary, id, brief);
    }
  });

  it("a rap voice beside a bass genre stays a vocal, not a second genre", () => {
    const parsed = parseUserInput("UKG, male rap");
    assert.deepEqual(parsed.genres, ["UKG Dubstep"]);
    for (const p of promptsFor("UKG, male rap")) assert.match(p.styles, /male rap/i, p.styles);
  });
});

describe("genre bleed guard", () => {
  const sample = generateStylesPrompts("dubstep", { count: 1, seed: 777 }).prompts[0];
  const BLEED = [
    "acoustic guitar",
    "upright bass",
    "brushed snare",
    "vinyl crackle",
    "Rhodes",
    "live drum kit",
    "fingerstyle",
    "strings swell",
    "tape-stop",
    "string quartet",
    "banjo",
    "lo-fi",
  ];

  for (const word of BLEED) {
    it(`fails a bass-music prompt that says "${word}"`, () => {
      const text = `${sample.styles.replace(/\.$/, "")}, ${word}.`;
      assert.ok(findContradictions(text, sample.plan).includes("non_edm_bleed"), word);
      const v = validatePrompt(text, sample.plan);
      assert.equal(v.hardGates.noGenreBleed, false, word);
      assert.equal(criticalGatesPass(v.hardGates), false, word);
    });
  }

  it("lets a brief that asks for the wording keep it", () => {
    for (const word of ["acoustic guitar", "strings", "piano"]) {
      const brief = `dubstep with ${word}, dark`;
      for (const p of promptsFor(brief, [1, 7])) {
        assert.equal(p.hardGates.noGenreBleed, true, `${brief}: ${p.styles}`);
      }
    }
    assert.deepEqual(nonEdmBleed("a warm acoustic guitar", "future bass with acoustic guitar"), []);
    assert.deepEqual(nonEdmBleed("a warm acoustic guitar", "future bass"), ["acoustic", "guitar"]);
  });

  it("keeps the reverse guard: a lo-fi or folk prompt never gets bass-music wording", () => {
    for (const brief of ["lo-fi hip hop beats to study to", "folk ballad with acoustic guitar", "rock anthem"]) {
      for (const p of promptsFor(brief, [1, 7])) {
        assert.doesNotMatch(p.styles, /\bwubs?\b|\bgrowl bass|supersaw|snare-roll|heavy drop|bass drop/i, p.styles);
      }
    }
  });

  it("holds across the old path too: unclaimed bass and rap genres never pick up band wording", () => {
    for (const brief of ["phonk", "tearout dubstep", "UK drill", "deathstep", "riddim", "hybrid trap"]) {
      for (const p of promptsFor(brief, [1, 2, 3])) {
        assert.equal(p.hardGates.noGenreBleed, true, `${brief}: ${p.styles}`);
        assert.deepEqual(nonEdmBleed(p.styles, brief), [], p.styles);
      }
    }
  });

  it("library sweep: no bass, club or rap genre in the library produces bleed", () => {
    const bad: string[] = [];
    for (const brief of [...CASES.map((c) => c.brief), "Aggressive Trap", "Melodic Trap", "Dark Trap", "Hybrid Trap", "Cyber Trap", "Melodic Dubstep", "Riddim"]) {
      for (const p of promptsFor(brief, [3, 4])) if (p.hardGates.noGenreBleed === false) bad.push(brief);
    }
    assert.deepEqual(bad, []);
  });
});

describe("blends stay inside the bass and rap world", () => {
  const BLENDS: [string, RegExp, RegExp][] = [
    ["dubstep + baile funk", /^Dubstep with baile funk influences at/, /tambor|chant|percussion|808/i],
    ["trap + autotuned sung-rap", /^Trap with autotuned sung-rap influences at/, /sung-rap|autotun|melodic/i],
    ["future bass + UK garage", /^Future bass with UK Garage influences at/, /shuffle|swung|2-step/i],
    ["brostep + drum and bass", /^Brostep with drum and bass influences at/, /break|reese|rolling/i],
    ["moombahton + trap", /^Moombahton with trap influences at/, /808|trap|hi-hat/i],
  ];
  for (const [brief, opens, second] of BLENDS) {
    it(`"${brief}" names both genres, blends both banks and stays EDM`, () => {
      const prompts = promptsFor(brief);
      for (const p of prompts) {
        assert.match(p.styles, opens, p.styles);
        assert.ok(p.plan.native?.edm);
        assert.equal(p.hardGates.noGenreBleed, true, p.styles);
        assert.ok(criticalGatesPass(p.hardGates));
        assert.ok(p.characters >= MIN_CHARS && p.characters <= MAX_CHARS);
        assert.deepEqual(nonEdmBleed(p.styles, brief), [], p.styles);
      }
      assert.ok(prompts.every((p) => second.test(p.styles)), `${brief}: the second genre should be audible in every prompt`);
    });
  }

  it("a non-EDM genre in the blend never lends acoustic or lo-fi phrases to a bass record", () => {
    for (const p of promptsFor("dubstep + lo-fi jazz", [1, 7])) {
      assert.doesNotMatch(p.styles, /Rhodes|upright|brushed|vinyl|crackle/i, p.styles);
      assert.equal(p.hardGates.noGenreBleed, true, p.styles);
    }
  });

  it("three bass genres keep all three names", () => {
    for (const p of promptsFor("Trap + Baile Funk + Deep Dubstep, kinetic and dark, male rap, 140 BPM")) {
      assert.match(p.styles, /^Trap with baile funk and deep dubstep influences at 140 BPM/, p.styles);
      assert.equal(p.hardGates.noGenreBleed, true);
    }
  });
});

describe("rap lyrics", () => {
  const sung = generateLyrics({
    theme: "chasing the city lights after the breakup",
    genre: "Autotuned Sung-Rap",
    delivery: "Melodic Sing-Rap Topline (autotuned sheen)",
    seed: 777,
  });
  const trap = generateLyrics({ theme: "grinding for the crown", genre: "Trap Rap", delivery: "Hard Rap Flow", seed: 777 });

  it("tags sung-rap sections with the delivery", () => {
    assert.match(sung.fullText, /\[Verse 1 \| autotuned sung-rap, melodic\]/);
    assert.match(sung.fullText, /\[Hook \| (?:melodic )?chant\]/);
    assert.match(sung.fullText, /\[Pre-Hook \|/);
  });

  it("brackets the ad-libs and leaves out drop sections", () => {
    assert.match(sung.fullText, /\[ad-lib: [^\]]+\]/);
    assert.doesNotMatch(sung.fullText, /\[Drop/);
    assert.match(trap.fullText, /\[Verse 1 \|/);
    assert.match(trap.fullText, /\[ad-lib: [^\]]+\]/);
  });

  it("is driven by the theme and names no artist", () => {
    assert.match(sung.fullText, /city|lights|chasing|breakup/i);
    assert.match(trap.fullText, /grinding|crown/i);
    assert.doesNotMatch(sung.fullText + trap.fullText, ARTIST_LEAK_RE);
  });

  it("is deterministic for a seed", () => {
    const again = generateLyrics({ theme: "chasing the city lights after the breakup", genre: "Autotuned Sung-Rap", delivery: "Melodic Sing-Rap Topline (autotuned sheen)", seed: 777 });
    assert.equal(again.fullText, sung.fullText);
  });
});
