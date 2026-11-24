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
