import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { bassMusicLeaks } from "../src/lib/suno/consistency.ts";
import { generateStylesPrompts } from "../src/lib/suno/generate.ts";
import { fixSourceOmissions } from "../src/lib/suno/fix.ts";
import { findContradictions } from "../src/lib/suno/validate.ts";

describe("v5.1.1 Dancehall validation", () => {
  it("recognizes Dancehall riddim and reggae one-drop, but not EDM drop instructions", () => {
    const text = "Digital riddim and a one-drop drum groove";
    assert.deepEqual(bassMusicLeaks(text, "Dancehall", true), []);
    assert.deepEqual(bassMusicLeaks("one drop riddim", "Dancehall", true), []);
    assert.ok(bassMusicLeaks(text, "Dancehall").includes("riddim"));
    assert.ok(bassMusicLeaks("half-time stomp, wobble bass and a dubstep drop", "Dancehall", true).length >= 2);
  });

  it("keeps the genre-scoped exception out of unrelated genres", () => {
    const dancehall = generateStylesPrompts("dancehall, bouncy", { count: 1, seed: 31, profileEnabled: false }).prompts[0];
    const plan = dancehall.plan;
    assert.ok(!findContradictions(
      plan.bpm + " BPM dancehall with rolling riddim swing and one-drop percussion.",
      plan,
    ).includes("bass_music_phrasing"));
    assert.ok(findContradictions(
      plan.bpm + " BPM dancehall with a dubstep growl and a towering bass drop.",
      plan,
    ).includes("bass_music_phrasing"));
  });
});

describe("v5.1.1 source-preserving Fix fallback", () => {
  it("reports missing significant arrangement and vocal markers without inventing source claims", () => {
    const source = [
      "145 BPM, F# minor, 4/4 with a female alto lead and dry vocal autotune.",
      "The four-bar motif repeats before Drop 2, then a one-beat silence.",
      "The hook uses Rhodes and flute with acoustic guitar in the last refrain.",
    ].join(" ");
    const same = source + " Focused mix dynamics and precise transient control.";
    assert.deepEqual(fixSourceOmissions(source, same), []);
    const missing = fixSourceOmissions(source, "145 BPM, F# minor, 4/4. Strong rhythmic arrangement.");
    for (const marker of ["Drop 2", "silence/fakeout", "motif", "alto register", "autotune", "Rhodes", "flute", "acoustic guitar", "4-bar timing"]) {
      assert.ok(missing.some(x => x.includes(marker)), marker + ": " + missing.join("; "));
    }
    assert.ok(!fixSourceOmissions("145 BPM. Exclude flute, no acoustic guitar. Male vocals.", "145 BPM. Male vocals.").some(x => /flute|acoustic guitar/i.test(x)));
  });

  it("exposes omissions on fallback results instead of silently asserting fidelity", () => {
    const source = [
      "145 BPM, C# minor, 4/4. Brostep begins with a female alto singer and prominent autotune.",
      "The original four-bar motif returns during Drop 2 after a complete beat of silence.",
      "Rhodes and flute serve as a contrasting atmospheric counterphrase in the bridge.",
      "The drum sequence uses dry half-time kicks and metallic snares, with syncopated rhythms and controlled high end.",
      "The bass line alternates clipped FM gestures and sliding notes while the second drop changes register.",
      "A sparse opening introduces quiet harmonic material before heavier midrange textures expand across the stereo field.",
      "The lead's delivery remains intimate, closely miked, and restrained before widening into a tense final refrain.",
      "A deliberate transition moves from narrow mono bass to stereo textures while conserving dynamic range and avoiding fatigue.",
      "Percussive fills and precise stops separate sections rather than flattening the entire arrangement into a single level.",
    ].join(" ");
    assert.ok(source.length > 975, "fixture must force a fallback");
    const prompt = generateStylesPrompts(source, {
      mode: "rewrite", count: 1, seed: 8, profileEnabled: false,
    }).prompts[0];
    assert.equal(prompt.fixStrategy, "recompiled");
    const expected = fixSourceOmissions(source, prompt.styles);
    assert.deepEqual(prompt.issues.filter(x => x.startsWith("Check source retention:")), expected);
    assert.equal(prompt.characters, prompt.styles.length);
  });
});
