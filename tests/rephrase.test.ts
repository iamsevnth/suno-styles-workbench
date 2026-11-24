import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { generateStylesPrompts } from "../src/lib/suno/generate.ts";
import { canRephrase, rephrase } from "../src/lib/suno/rephrase.ts";
import { renderStyles } from "../src/lib/suno/render.ts";
import { briefFaithfulness, criticalGatesPass, validatePrompt } from "../src/lib/suno/validate.ts";
import { assistantRequest, checkAssistantAnswer } from "../src/lib/ai/handoff.ts";

const BRIEFS = [
  "Trap + UKG Dubstep, dark, female vocals",
  "140 UKG + Future Bass + Wobble Dubstep, emotional, nocturnal, 140 BPM",
  "indie folk ballad, warm acoustic guitar, breathy female alto vocals",
  "UKG dubstep, dark",
  "house, uplifting, piano",
  "Aggressive Trap, male rap, dark",
];

describe("Rephrase (no AI)", () => {
  it("wording 0 is the prompt exactly as generated", () => {
    for (const brief of BRIEFS) {
      for (const p of generateStylesPrompts(brief, { count: 2, seed: 7 }).prompts) {
        if (p.fixStrategy) continue;
        assert.equal(renderStyles(p.plan, 0), renderStyles(p.plan));
      }
    }
  });

  it("gives new wording that passes the checks and keeps the brief's words, three times in a row", () => {
    for (const brief of BRIEFS) {
      for (const length of ["detailed", "tight"] as const) {
        const p = generateStylesPrompts(brief, { count: 1, seed: 7, length }).prompts[0];
        const seen: string[] = [];
        let after = 0;
        for (let i = 0; i < 3; i++) {
          const r = rephrase(p, after, seen);
          assert.ok(r, `${brief} (${length}): no rephrasing ${i + 1}`);
          assert.notEqual(r.text, p.styles);
          assert.ok(!seen.includes(r.text), "repeats an earlier rephrasing");
          assert.ok(criticalGatesPass(validatePrompt(r.text, p.plan).hardGates), r.text);
          assert.ok(briefFaithfulness(r.text, p.plan) >= briefFaithfulness(p.styles, p.plan), r.text);
          seen.push(r.text);
          after = r.wording;
        }
      }
    }
  });

  it("keeps the tempo-named genre rule", () => {
    const p = generateStylesPrompts("UKG dubstep, dark", { count: 1, seed: 7 }).prompts[0];
    const r = rephrase(p);
    assert.ok(r);
    assert.match(r.text, new RegExp(`^${p.bpm} UKG Dubstep\\b`));
    assert.doesNotMatch(r.text, /\bBPM\b/);
  });

  it("is off for a pasted prompt that Fix mode kept", () => {
    const pasted = generateStylesPrompts("house, uplifting, piano", { count: 1, seed: 7 }).prompts[0].styles;
    const kept = generateStylesPrompts(pasted, { count: 1, seed: 7, mode: "rewrite" }).prompts[0];
    if (kept.fixStrategy && kept.fixStrategy !== "recompiled") {
      assert.equal(canRephrase(kept), false);
      assert.equal(rephrase(kept), null);
    }
  });
});

describe("Reword with your own assistant", () => {
  const p = generateStylesPrompts("Dark melodic dubstep at 150 BPM, female lead vocal, cinematic strings", { count: 1, seed: 7 }).prompts[0];

  it("the request carries the rules and the prompt", () => {
    const req = assistantRequest(p);
    assert.match(req, /"150 BPM"/);
    assert.match(req, /Write between 800 and 975 characters/);
    assert.ok(req.endsWith(p.styles));
  });

  it("a tight prompt asks for the tight window", () => {
    const t = generateStylesPrompts("Dark melodic dubstep at 150 BPM, female lead vocal", { count: 1, seed: 7, length: "tight" }).prompts[0];
    assert.match(assistantRequest(t), /Write between 600 and 850 characters/);
  });

  it("accepts a reworded answer (even with chat wrapping) and rejects one that breaks the rules", () => {
    const reordered = p.styles.split(/(?<=\.)\s+/).reverse().join(" ");
    const ok = checkAssistantAnswer(`Here is the rewritten prompt:\n"${reordered}"`, p);
    assert.equal(ok.ok, true, ok.problems.join("; "));
    assert.equal(ok.text, reordered);
    const bad = checkAssistantAnswer("No drums, avoid bass, in the style of Skrillex.", p);
    assert.equal(bad.ok, false);
    assert.ok(bad.problems.length >= 2, bad.problems.join("; "));
  });
});
