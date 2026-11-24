import { test } from "node:test";
import assert from "node:assert/strict";
import { parseUserInput } from "../src/lib/suno/parse.ts";
import { generateStylesPrompts } from "../src/lib/suno/generate.ts";
import { lintBrief, ownershipMap } from "../src/lib/suno/lint.ts";
import { changedMusicalAxes } from "../src/lib/suno/semantic.ts";

const ids = (brief: string) => lintBrief(parseUserInput(brief, { profileEnabled: true })).map((f) => f.id);

// Acceptance tests T09, T10, T11 and T14 from the prompt-engine research (11/23/2026).
test("T09: continuous 32nd hats in a deep, sparse 140 groove", () => {
  assert.ok(ids("deep 140 with continuous 32nd hats, sparse and dark").includes("CONSTANT_MAX_HAT_DENSITY"));
});

test("T10: the main groove is both 2-step and four-on-the-floor", () => {
  assert.ok(ids("uk garage 2-step with four on the floor kicks, dark").includes("TWO_PRIMARY_KICK_SYSTEMS"));
  // Giving each kick pattern its own section is fine.
  assert.ok(!ids("uk garage, 2-step verses and four on the floor drops").includes("TWO_PRIMARY_KICK_SYSTEMS"));
});

test("T11: no hook and a stack of competing basses", () => {
  const found = ids("dubstep with 808, sub bass, reese, wobble and growl bass, dark");
  assert.ok(found.includes("UNDEFINED_HOOK"));
  assert.ok(found.includes("MASSIVE_FULL_RANGE_BASS_STACK"));
});

test("T14: electronic hats requested while all hats are excluded", () => {
  assert.ok(ids("trap with 808 hats and rolling hi-hat rolls, exclude hi-hats").includes("ELECTRONIC_HATS_EXCLUDED"));
});

test("excluded words never trigger the positive checks", () => {
  const found = ids("melodic dubstep with a pluck hook, no 808, no reese, no wobble, no sub bass");
  assert.ok(!found.includes("MASSIVE_FULL_RANGE_BASS_STACK"));
});

test("three genres as equals get role advice naming the engine's choice", () => {
  const r = generateStylesPrompts("trap, baile funk and deep dubstep, kinetic, 140 BPM, female vocals", { count: 1, seed: 7 });
  const f = lintBrief(r.parsed, r.prompts[0].plan).find((x) => x.id === "TOO_MANY_EQUAL_GENRES");
  assert.ok(f, "finding present");
  assert.match(f!.message, /the engine chose groove: /);
});

test("tempo notes become one tempo finding", () => {
  const found = lintBrief(parseUserInput("ukg dubstep and future bass at 174 bpm with a vocal chop hook", { profileEnabled: true }));
  assert.equal(found.filter((f) => f.id === "TEMPO_CONVENTION_CONFLICT").length, 1);
});

test("a second drop described only as bigger gets a suggestion", () => {
  assert.ok(ids("riddim with a vocal chop hook, second drop bigger and heavier").includes("UNSPECIFIED_SECOND_DROP"));
  assert.ok(!ids("riddim with a vocal chop hook, second drop bigger with a half-time switch").includes("UNSPECIFIED_SECOND_DROP"));
});

test("a clear brief has no findings", () => {
  assert.deepEqual(ids("melodic dubstep, 150 BPM, female vocals, detuned pluck hook, emotional"), []);
  assert.deepEqual(ids("lofi jazz hop, rainy night"), [], "native genres bring their own lead");
  assert.deepEqual(ids(""), []);
});

test("every plan has exactly one groove owner and one low-end owner", () => {
  for (const brief of ["trap x deep dubstep, 140 BPM", "lofi jazz hop, rainy night", "ukg dubstep future bass wobble"]) {
    const r = generateStylesPrompts(brief, { count: 3, seed: 11 });
    for (const p of r.prompts) {
      const map = ownershipMap(p.plan);
      assert.equal(map.filter((x) => x.role === "Groove").length, 1, brief);
      assert.equal(map.filter((x) => x.role === "Low end").length, 1, brief);
      assert.ok(map.every((x) => x.owner), `${brief}: every role has an owner`);
    }
  }
});

test("variants differ from the first in at least two named musical axes", () => {
  const r = generateStylesPrompts("trap x deep dubstep, dark, 140 BPM, male rap", { count: 4, seed: 3, variationMode: "exploration" });
  for (const p of r.prompts.slice(1)) {
    const changed = changedMusicalAxes(r.prompts[0].plan, p.plan);
    assert.ok(changed.length >= 2, `changed: ${changed.join(",")}`);
  }
});

// Review follow-ups: following a finding's own advice clears it, and unrelated words don't hide it.
test("genres that already have roles are not flagged", () => {
  assert.ok(!ids("Trap groove, Deep Dubstep bass, Future Bass chords and hook, 140 BPM").includes("TOO_MANY_EQUAL_GENRES"));
});

test("an unrelated section word does not excuse two kick patterns", () => {
  assert.ok(ids("uk garage 2-step and four-on-the-floor kicks with a vocal chorus").includes("TWO_PRIMARY_KICK_SYSTEMS"));
});

test("a narrow cymbal exclusion is not a blanket hat exclusion", () => {
  assert.ok(!ids("trap with 808 hats and hi-hat rolls, no live cymbals").includes("ELECTRONIC_HATS_EXCLUDED"));
});

test("change words elsewhere do not excuse a second drop that is only bigger", () => {
  assert.ok(ids("riddim, syncopated rhythm with a vocal hook; second drop bigger").includes("UNSPECIFIED_SECOND_DROP"));
});

test("a tempo the brief reinterprets is not flagged", () => {
  const found = lintBrief(parseUserInput("ukg dubstep at 174 bpm with a half-time feel and a vocal chop hook", { profileEnabled: true }));
  assert.ok(!found.some((f) => f.id === "TEMPO_CONVENTION_CONFLICT"));
});

test("bass sources given their own sections are not a stack", () => {
  const brief = "dubstep with a vocal hook: 808 in the verse, reese in the first drop, wobble in the second drop, growl in the outro";
  assert.ok(!ids(brief).includes("MASSIVE_FULL_RANGE_BASS_STACK"));
});

test("short 32nd-note rolls in a sparse groove are fine", () => {
  assert.ok(!ids("deep sparse groove, 16th-note hats with short 32nd-note rolls at phrase ends, vocal hook").includes("CONSTANT_MAX_HAT_DENSITY"));
});

test("an instrument named only for harmony is not a hook", () => {
  assert.ok(ids("dubstep with piano chords and dark pads").includes("UNDEFINED_HOOK"));
  assert.ok(!ids("dubstep with a piano riff and dark pads").includes("UNDEFINED_HOOK"));
});

test("native plans include a harmony owner", () => {
  const r = generateStylesPrompts("lofi jazz hop, rainy night", { count: 1, seed: 5 });
  assert.ok(ownershipMap(r.prompts[0].plan).some((x) => x.role === "Harmony" && x.owner));
});
