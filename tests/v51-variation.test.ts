import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { generateStylesPrompts } from "../src/lib/suno/generate.ts";
import { repairExistingPrompt } from "../src/lib/suno/fix.ts";
import { changedMusicalAxes, semanticDistance, semanticFingerprint } from "../src/lib/suno/semantic.ts";
import { MIN_CHARS, MAX_CHARS } from "../src/lib/suno/limits.ts";

describe("v5.1 musical diversity and Fix fidelity", () => {
  it("ignores changes in the seed, recipe ID and title when computing semantic distance", () => {
    const result = generateStylesPrompts("142 BPM brostep, instrumental, clipped FM bass", { count: 1, seed: 991, profileEnabled: false });
    const source = result.prompts[0].plan;
    const fake = { ...source, seed: source.seed + 5, recipeId: source.recipeId + "new", titlePhrase: "Totally new title" };
    assert.equal(semanticDistance(source, fake), 0);
    assert.equal(semanticFingerprint(source), semanticFingerprint(fake));
  });

  it("A/B changes only the bass production axis and preserves all other sonic decisions", () => {
    const result = generateStylesPrompts("140 BPM brostep, instrumental, dark bass and half-time drums", {
      count: 6, seed: 151, variationMode: "ab", profileEnabled: false,
    });
    assert.equal(result.prompts.length, 2);
    const [a, b] = result.prompts;
    assert.equal(a.plan.native?.edm, true);
    assert.deepEqual(changedMusicalAxes(a.plan, b.plan), ["bass"]);
    assert.equal(b.plan.abAxis, "bass");
    assert.equal(a.plan.primaryGenre, b.plan.primaryGenre);
    assert.equal(a.plan.bpm, b.plan.bpm);
    assert.notEqual(a.styles, b.styles);
    for (const p of result.prompts) {
      assert.ok(p.characters >= MIN_CHARS && p.characters <= MAX_CHARS, p.characters + " characters");
      assert.ok(Object.values(p.hardGates).every(Boolean), p.issues.join(", "));
    }
  });

  it("native identity labels originate within the selected native bank, not another genre", () => {
    const result = generateStylesPrompts("142 BPM riddim, instrumental with short squared bass pulses", {
      seed: 55, count: 3, variationMode: "exploration", profileEnabled: false,
    });
    assert.ok(result.parsed.native);
    assert.equal(result.prompts.length, 3);
    assert.ok(result.prompts.every(p => Boolean(p.plan.sonicIdentity?.includes("focus"))));
    assert.ok(result.prompts.every(p => p.plan.native?.edm));
    assert.ok(result.prompts.every(p => p.hardGates.noGenreBleed !== false));
  });

  it("preserves source-written Drop 2, silence, motif, bars, vocal register and instrumentation", () => {
    const base = generateStylesPrompts("145 BPM C# minor brostep, female alto vocals, talking FM bass and hard half-time snare", {
      count: 1, seed: 17, profileEnabled: false,
    }).prompts[0].plan;
    const phrases = [
      "145 BPM C# minor brostep opens with clipped FM talking bass and a precisely placed half-time snare.",
      "Female alto lead sings in a dry intimate register with restrained autotune, short room reflections and sharp consonants.",
      "The central motif repeats through a four-bar call-and-response between bass gestures and high synth stabs.",
      "Drums retain a deep kick and a weighty snare while small ghost notes create restless syncopation.",
      "Drop 2 shifts the talking bass an octave upward and replies with fast triplet edits instead of replaying Drop 1.",
      "A full-beat silence separates the two drops, followed by a reverse pickup and tighter rhythmic articulation.",
      "The sub stays centered and steady while upper harmonics unfold across a controlled stereo field.",
      "Keep the transitions musically purposeful, the arrangement tense, and the bass movements distinctly voiced.",
    ];
    let source = phrases.join(" ");
    while (source.length < MIN_CHARS) source += " Maintain a focused low end and articulate transition detail.";
    assert.ok(source.length <= MAX_CHARS, source.length + " characters");
    const fixed = repairExistingPrompt(source, base);
    assert.ok(fixed, "conservative Fix must preserve a valid source");
    assert.equal(fixed.strategy, "preserved");
    for (const marker of ["Drop 2", "full-beat silence", "four-bar", "female alto", "central motif"]) {
      assert.ok(fixed.text.toLowerCase().includes(marker.toLowerCase()), marker);
    }
  });
});
