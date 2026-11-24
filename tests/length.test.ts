import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { generateStylesPrompts } from "../src/lib/suno/generate.ts";
import { vocalPortion } from "../src/lib/suno/render.ts";
import { LENGTH_WINDOWS, vocalBudget } from "../src/lib/suno/limits.ts";
import { allHardGatesPass, validatePrompt } from "../src/lib/suno/validate.ts";
import type { PromptLength } from "../src/lib/suno/types.ts";

const BRIEFS = [
  "Trap + UKG Dubstep, dark, female vocals",
  "140 UKG + Future Bass + Wobble Dubstep, emotional, nocturnal, 140 BPM",
  "indie folk ballad, warm acoustic guitar, breathy female alto vocals with gentle vibrato and soft harmonies",
  "melodic dubstep, emotional, male vocals with raspy powerful belts, heavy autotune and stacked harmonies on the chorus, doubled ad-libs in the drop",
  "Aggressive Trap, gritty male rap with fast triplet flow, ad-libs and heavy autotune on the hook",
  "drum and bass, liquid, female vocals",
  "lofi hip hop, rainy night",
  "house, uplifting, piano",
  "riddim, instrumental",
  "neo soul, smoky female vocals, Rhodes, brushed drums",
];
const SEEDS = [1, 7, 42];

function each(length: PromptLength, fn: (p: ReturnType<typeof generateStylesPrompts>["prompts"][number], brief: string) => void) {
  for (const brief of BRIEFS) for (const seed of SEEDS) for (const p of generateStylesPrompts(brief, { count: 3, seed, length }).prompts) fn(p, brief);
}

describe("Prompt Length", () => {
  it("windows: Detailed 800–975 (hard 1,000), Tight 600–850; vocal caps 25% and 15%", () => {
    assert.deepEqual(LENGTH_WINDOWS.detailed, { min: 800, max: 975, hardMax: 1000, vocalShare: 0.25 });
    assert.deepEqual(LENGTH_WINDOWS.tight, { min: 600, max: 850, hardMax: 850, vocalShare: 0.15 });
    assert.equal(vocalBudget("detailed"), 200);
    assert.equal(vocalBudget("tight"), 90);
  });

  for (const length of ["detailed", "tight"] as const) {
    const w = LENGTH_WINDOWS[length];
    it(`${length}: every prompt sits in ${w.min}–${w.max} and passes every gate`, () => {
      each(length, (p, brief) => {
        assert.equal(p.plan.length ?? "detailed", length);
        assert.ok(p.characters >= w.min && p.characters <= w.max, `${brief}: ${p.characters}\n${p.styles}`);
        assert.ok(allHardGatesPass(p.hardGates), `${brief}: ${JSON.stringify(p.hardGates)} ${p.issues.join(";")}`);
      });
    });

    it(`${length}: the vocal description takes at most ${w.vocalShare * 100}% of the characters`, () => {
      each(length, (p, brief) => {
        if (p.plan.vocals.present === false) return;
        const share = vocalPortion(p.styles, p.plan) / p.characters;
        assert.ok(vocalPortion(p.styles, p.plan) > 0, `${brief}: vocal not found\n${p.styles}`);
        assert.ok(share <= w.vocalShare, `${brief}: vocals ${(share * 100).toFixed(1)}%\n${p.styles}`);
      });
    });
  }

  it("fitting the vocal cap keeps the effects the brief asked for (Codex review)", () => {
    for (const brief of ["melodic dubstep, breathy female alto vocals with light autotune and slapback delay, emotional", "indie folk ballad, raspy male vocals, whispered verses, light autotune and slapback delay"]) {
      for (const p of generateStylesPrompts(brief, { count: 3, seed: 7, length: "tight" }).prompts) {
        assert.match(p.styles, /autotun/i, p.styles);
        assert.match(p.styles, /slapback/i, p.styles);
      }
    }
  });

  it("Tight prompts are shorter than Detailed ones for the same brief and seed", () => {
    for (const brief of BRIEFS) {
      const d = generateStylesPrompts(brief, { count: 1, seed: 7 }).prompts[0];
      const t = generateStylesPrompts(brief, { count: 1, seed: 7, length: "tight" }).prompts[0];
      assert.ok(t.characters < d.characters, `${brief}: ${t.characters} vs ${d.characters}`);
    }
  });

  it("the Instrumental toggle works the same at either length", () => {
    for (const length of ["detailed", "tight"] as const) {
      for (const p of generateStylesPrompts("Trap + UKG Dubstep, dark", { count: 3, seed: 7, length, instrumentalDefault: true }).prompts) {
        assert.equal(p.plan.vocals.present, false, p.styles);
        assert.equal(vocalPortion(p.styles, p.plan), 0);
      }
      for (const p of generateStylesPrompts("Trap + UKG Dubstep, dark, female vocals", { count: 3, seed: 7, length, instrumentalDefault: true }).prompts) {
        assert.notEqual(p.plan.vocals.present, false, p.styles);
      }
    }
  });

  it("the length gate follows the plan: a Detailed prompt fails the Tight window", () => {
    const d = generateStylesPrompts("Trap + UKG Dubstep, dark", { count: 1, seed: 7 }).prompts[0];
    assert.ok(d.characters > 850, String(d.characters));
    assert.equal(validatePrompt(d.styles, { ...d.plan, length: "tight" }).hardGates.characterRange, false);
  });

  it("Fix mode keeps the Detailed window", () => {
    const pasted = generateStylesPrompts("house, uplifting, piano", { count: 1, seed: 7 }).prompts[0].styles;
    const p = generateStylesPrompts(pasted, { count: 1, seed: 7, mode: "rewrite", length: "tight" }).prompts[0];
    assert.equal(p.plan.length, undefined);
    assert.ok(p.characters >= 800, String(p.characters));
  });
});
