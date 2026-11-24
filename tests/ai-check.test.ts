import { test } from "node:test";
import assert from "node:assert/strict";
import { generateStylesPrompts } from "../src/lib/suno/generate.ts";
import { checkAiRewrite, cleanAiText, rewordInstruction } from "../src/lib/ai/check.ts";
import { aiAvailability } from "../src/lib/ai/on-device.ts";

const original = generateStylesPrompts("Dark melodic dubstep at 150 BPM, female lead vocal, cinematic strings, vinyl crackle", { count: 1, seed: 21 }).prompts[0];
const reorder = (t: string) => t.split(/(?<=\.)\s+/).reverse().join(" ");

test("reordered wording of the same prompt passes", () => {
  const r = checkAiRewrite(reorder(original.styles), original);
  assert.deepEqual(r.problems, []);
  assert.ok(r.ok);
});

test("model wrapping is removed before checking", () => {
  assert.equal(cleanAiText('```\nStyles: "a b c"\n```'), "a b c");
  assert.ok(checkAiRewrite("Here is the rewritten prompt:\n" + reorder(original.styles), original).ok);
});

test("negative wording, a missing tempo, short text and an unchanged copy are rejected", () => {
  assert.ok(checkAiRewrite(reorder(original.styles).replace(/\.$/, "") + ", avoid harsh cymbals.", original).problems.some((p) => /negative/.test(p)));
  assert.ok(checkAiRewrite(reorder(original.styles).replace(/\b150\s*BPM\b/gi, "a steady tempo"), original).problems.some((p) => /tempo/.test(p)));
  assert.ok(checkAiRewrite("Dark dubstep at 150 BPM.", original).problems.some((p) => /length/.test(p)));
  assert.ok(checkAiRewrite(original.styles, original).problems.some((p) => /same as the original/.test(p)));
  assert.ok(!checkAiRewrite("", original).ok);
});

test("dropping the brief's own words is rejected", () => {
  const dropped = reorder(original.styles).replace(/vinyl crackle/gi, "warm texture");
  if (dropped !== reorder(original.styles)) {
    assert.ok(checkAiRewrite(dropped, original).problems.some((p) => /dropped words/.test(p)));
  }
});

test("the instruction pins the tempo and the length", () => {
  const i = rewordInstruction(original);
  assert.match(i, new RegExp(`"${original.bpm} BPM"`));
  assert.match(i, /800 and 975 characters/);
});

test("no Prompt API means unavailable", async () => {
  assert.equal(await aiAvailability(), "unavailable");
});
