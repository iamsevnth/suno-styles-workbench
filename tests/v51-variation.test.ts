import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { generateStylesPrompts } from "../src/lib/suno/generate.ts";
import { repairExistingPrompt } from "../src/lib/suno/fix.ts";
import { changedMusicalAxes, semanticDistance, semanticFingerprint } from "../src/lib/suno/semantic.ts";
import { MIN_CHARS, MAX_CHARS } from "../src/lib/suno/limits.ts";
import { EDM_SUBS } from "../src/lib/suno/native/catalog-edm.ts";

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
    const writtenAccidental = source.replace("145 BPM C# minor", "145 BPM C-sharp minor");
    const spelled = repairExistingPrompt(writtenAccidental, base);
    assert.ok(spelled, "equivalent key spelling should not require recompilation");
    assert.match(spelled.text, /C-sharp minor/i);
    assert.doesNotMatch(spelled.text, /C# minor/i, "do not insert a redundant canonical key");
  });
});

describe("v5.1 complete native-bank A/B contract", () => {
  it("retains all 29 existing native bass, club and rap banks", () => {
    assert.equal(EDM_SUBS.length, 29);
  });

  for (const [index, sub] of EDM_SUBS.entries()) {
    it(`${sub.id}: two valid variants differ only in bass articulation`, () => {
      const input = `${sub.name}, ${sub.bpm[2]} BPM, instrumental`;
      const generated = generateStylesPrompts(input, {
        count: 2,
        seed: 400 + index,
        variationMode: "ab",
        profileEnabled: false,
      });
      assert.equal(generated.parsed.native?.primary, sub.id);
      assert.equal(generated.prompts.length, 2);
      const [a, b] = generated.prompts;
      assert.deepEqual(changedMusicalAxes(a.plan, b.plan), ["bass"]);
      assert.equal(a.plan.primaryGenre, b.plan.primaryGenre);
      assert.equal(a.plan.bpm, b.plan.bpm);
      const bassBefore = a.plan.native?.sections.bass[0];
      const bassAfter = b.plan.native?.sections.bass[0];
      assert.ok(bassBefore && bassAfter && bassBefore !== bassAfter);
      assert.ok(a.styles.includes(bassBefore), "original bass phrase should occur in Styles");
      assert.equal(b.styles, a.styles.replace(bassBefore, bassAfter),
        "A/B must change exactly one rendered musical phrase");
      for (const prompt of generated.prompts) {
        assert.ok(prompt.characters >= MIN_CHARS && prompt.characters <= MAX_CHARS,
          `${sub.id}: ${prompt.characters} characters`);
        assert.ok(Object.values(prompt.hardGates).every(Boolean),
          `${sub.id}: ${prompt.issues.join(", ")}`);
      }
    });
  }
});

describe("v5.1 conservative short-source Fix expansion", () => {
  it("preserves the original musical structure instead of recompiling a coherent 757-character source", () => {
    const source = [
      "140 BPM, E minor, 4/4. An instrumental future bass composition builds from a carefully shaped four-note bell motif over a steady sub pulse.",
      "The first section uses filtered pads, sparse syncopated kick and snare, and quiet reverse-pickup transitions that leave melodic space.",
      "The build gradually widens suspended chords and gathers snare momentum before a deliberate full-beat silence.",
      "Drop 1 uses bright stacked chords and a controlled low-end counterphrase, with the four-note motif echoed by a tuned bass lead.",
      "Drop 2 rearranges the motif an octave higher, adds triplet drum fills, and gives the bass an answering phrase rather than repeating the first drop.",
      "The final breakdown returns to dry bell notes and centered mono sub before a focused final lift.",
    ].join(" ");
    const base = generateStylesPrompts(
      "140 BPM E minor instrumental future bass, 4/4, deep 808 and bright bell motif",
      { count: 1, seed: 168, profileEnabled: false },
    ).prompts[0].plan;
    const fixed = repairExistingPrompt(source, base);
    assert.ok(fixed, "a coherent short source must remain eligible for conservative expansion");
    assert.equal(fixed.strategy, "expanded");
    assert.ok(fixed.text.length >= MIN_CHARS && fixed.text.length <= MAX_CHARS);
    for (const phrase of ["four-note motif", "full-beat silence", "Drop 2", "E minor", "filtered pads"]) {
      assert.ok(fixed.text.includes(phrase), phrase);
    }
  });
});
