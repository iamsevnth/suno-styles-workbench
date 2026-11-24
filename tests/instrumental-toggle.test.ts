import { test } from "node:test";
import assert from "node:assert/strict";
import { mentionsVocals, parseUserInput } from "../src/lib/suno/parse.ts";
import { generateStylesPrompts } from "../src/lib/suno/generate.ts";
import { vocalInInstrumental } from "../src/lib/suno/consistency.ts";
import { checkAiRewrite } from "../src/lib/ai/check.ts";

const ON = { instrumentalDefault: true };

test("mentionsVocals finds singers, rap, voices, chops and male/female leads, not exclusions", () => {
  for (const b of ["female lead", "male rap verses", "vocal chops", "a choir", "with a singer", "spoken word intro", "ad-libs"]) assert.ok(mentionsVocals(`dubstep, ${b}`), b);
  for (const b of ["trap with 808s", "deep dubstep, dark, 140 BPM", "dubstep, no vocals", "lofi, without singing"]) assert.ok(!mentionsVocals(b), b);
});

test("toggle on: a brief that never mentions vocals stays instrumental", () => {
  for (const brief of ["deep dubstep, dark, 140 BPM", "lofi jazz hop, rainy night", "melodic techno, hypnotic, 124 BPM"]) {
    const parsed = parseUserInput(brief, ON);
    assert.equal(parsed.instrumental, true, brief);
    assert.equal(parsed.instrumentalByToggle, true, brief);
    const r = generateStylesPrompts(brief, { count: 3, seed: 9, ...ON });
    assert.equal(r.prompts.length, 3, brief);
    for (const p of r.prompts) {
      assert.equal(p.plan.vocals.present, false, brief);
      assert.ok(!vocalInInstrumental(p.styles, true), `${brief}: ${p.styles}`);
    }
  }
});

test("toggle on: any vocal mention in the brief wins", () => {
  for (const brief of ["deep dubstep with female vocals", "drill, male rap", "future bass with vocal chops", "house with a gospel choir"]) {
    const parsed = parseUserInput(brief, ON);
    assert.equal(parsed.instrumental, false, brief);
    assert.equal(parsed.instrumentalByToggle, false, brief);
  }
});

test("toggle off: generation is unchanged", () => {
  const brief = "deep dubstep, dark, 140 BPM";
  const a = generateStylesPrompts(brief, { count: 3, seed: 4 }).prompts.map((p) => p.styles);
  const b = generateStylesPrompts(brief, { count: 3, seed: 4, instrumentalDefault: false }).prompts.map((p) => p.styles);
  assert.deepEqual(a, b);
});

test("toggle on: an explicitly instrumental brief is instrumental by its own words", () => {
  const parsed = parseUserInput("instrumental dubstep, dark", ON);
  assert.equal(parsed.instrumental, true);
  assert.equal(parsed.instrumentalByToggle, false);
});

test("AI wording that adds vocals to a toggle-instrumental prompt is discarded", () => {
  const p = generateStylesPrompts("deep dubstep, dark, 140 BPM", { count: 1, seed: 9, ...ON }).prompts[0];
  const withVocal = p.styles.replace(/\.\s*$/, "") + ", with a soaring female lead vocal.";
  const r = checkAiRewrite(withVocal, p);
  assert.ok(!r.ok);
  assert.ok(r.problems.some((x) => /contradicts/.test(x)), r.problems.join("; "));
});
