/**
 * Wording rules from docs/research/advanced-prompt-engineering-research-2026-11-23.md (§3, §3.1, §5, §11.4–11.5).
 */
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { generateStylesPrompts } from "../src/lib/suno/generate.ts";
import { arcHasDropChange, withDropDelta } from "../src/lib/suno/wording.ts";

const SEEDS = [1, 7, 42, 99];
const BASS_BRIEFS = [
  "Trap + UKG Dubstep, dark, female vocals",
  "140 UKG + Future Bass + Wobble Dubstep, emotional, nocturnal, 140 BPM",
  "Aggressive Trap + Riddim, menacing, male rap",
];
const NATIVE_BASS = ["UKG dubstep, dark", "riddim, aggressive", "melodic dubstep, emotional"];

function prompts(brief: string, length: "detailed" | "tight" = "detailed") {
  return SEEDS.flatMap((seed) => generateStylesPrompts(brief, { count: 3, seed, length }).prompts);
}

describe("research wording: hook and bass as call and response (§3 Part 3, §11.4)", () => {
  it("hybrid bass music ties the hook and the bass together in one sentence", () => {
    for (const brief of BASS_BRIEFS) {
      for (const p of prompts(brief)) {
        if (!p.plan.melody.length || p.plan.native) continue;
        assert.match(p.styles, /The hook (?:sits|rides) on|A hook on .+ leads/, p.styles);
        assert.match(p.styles, /answer|replies/i, p.styles);
      }
    }
  });

  it("native bass music has its first bass phrase answer the hook", () => {
    for (const brief of NATIVE_BASS) {
      for (const p of prompts(brief)) assert.match(p.styles, /answer|respon|repl|call/i, p.styles);
    }
  });
});

describe("research wording: say what the final drop changes (§3 Part 4)", () => {
  it("every bass-music arc with a drop says how a later drop differs", () => {
    for (const brief of [...BASS_BRIEFS, ...NATIVE_BASS]) {
      for (const p of prompts(brief)) {
        const arc = /(?:Arrangement:|arrangement moves through|record unfolds as|Form runs through)([^.]*)\./.exec(p.styles)?.[1];
        if (!arc || !/\bdrop\b/i.test(arc)) continue;
        const stages = arc.split(/,\s*(?:then\s+)?|\s+then\s+/);
        assert.ok(arcHasDropChange(stages) || /final drop that/.test(arc), p.styles);
      }
    }
  });

  it("adds the line once, replaces a bare later drop, goes before an outro, and leaves drop-less arcs alone", () => {
    const d = "a final drop that revoices the hook over displaced bass answers";
    assert.deepEqual(withDropDelta(["intro", "first drop"], d), ["intro", "first drop", d]);
    assert.deepEqual(withDropDelta(["intro", "drop", "final drop"], d), ["intro", "drop", d]);
    assert.deepEqual(withDropDelta(["intro", "harder second drop"], d), ["intro", "harder second drop"]);
    assert.deepEqual(withDropDelta(["intro", "verse", "hook", "outro"], d), ["intro", "verse", "hook", "outro"]);
    // Codex review: a bare "second drop" says nothing about what changes, and the line never follows an outro.
    assert.deepEqual(withDropDelta(["intro", "verse", "drop", "interlude", "second drop", "outro"], d), ["intro", "verse", "drop", "interlude", d, "outro"]);
    assert.deepEqual(withDropDelta(["build with pitch-rising synths", "hard drop", "half-bar switch-up", "outro"], d), ["build with pitch-rising synths", "hard drop", "half-bar switch-up", d, "outro"]);
  });

  it("never writes a word the brief excludes: \"no hook\" gets no hook wording (Codex review)", () => {
    for (const brief of ["riddim, no hook", "Trap + UKG Dubstep, dark, no hook", "UKG dubstep, dark, no hats"]) {
      for (const p of prompts(brief)) {
        assert.ok(p.hardGates.noExcludedConcepts, `${brief}: ${p.styles}`);
        if (/no hook/.test(brief)) assert.doesNotMatch(p.styles, /\bhook\b/i, p.styles);
      }
    }
  });

  it("song genres never get drop wording", () => {
    for (const brief of ["indie folk ballad, warm acoustic guitar", "neo soul, Rhodes, brushed drums", "UK drill, cold"]) {
      for (const p of prompts(brief)) assert.doesNotMatch(p.styles, /final drop/i, p.styles);
    }
  });
});

describe("research wording: two or three production priorities (§3 Part 5)", () => {
  it("hybrid prompts end on at most three mix priorities and no mastering buzzword", () => {
    for (const brief of BASS_BRIEFS) {
      for (const p of prompts(brief)) {
        if (p.plan.native) continue;
        const mix = /(?:Mix with|Mix for|Finish the mix with|Balance the mix around) ([^.]*)\.$/.exec(p.styles)?.[1];
        assert.ok(mix, p.styles);
        assert.ok(mix.split(/,\s*|\s+and\s+/).length <= 3 || mix.split(/,\s*/).length <= 3, mix);
        assert.doesNotMatch(p.styles, /finished for/i, p.styles);
      }
    }
  });

  it("native prompts carry no mastering phrase (Codex review)", () => {
    for (const brief of [...NATIVE_BASS, "future bass + pop", "house, uplifting, piano", "pop, bright, female vocals"]) {
      for (const p of prompts(brief)) {
        const prod = /Production: ([^.]*)\./.exec(p.styles)?.[1] ?? "";
        assert.doesNotMatch(prod, /\bmaster/i, `${brief}: ${prod}`);
      }
    }
  });

  it("native prompts list at most three production phrases", () => {
    for (const brief of NATIVE_BASS) {
      for (const p of prompts(brief)) {
        const prod = /Production: ([^.]*)\./.exec(p.styles)?.[1] ?? "";
        assert.ok(prod.split(/;\s*/).length <= 3, prod);
      }
    }
  });
});

describe("research wording: output order (§3.1)", () => {
  it("identity, then groove, then hook and bass, then sections, then mix", () => {
    for (const brief of BASS_BRIEFS) {
      for (const p of prompts(brief)) {
        if (p.plan.native) continue;
        // Each section is found after the one before it; the opening sentence is the identity.
        const opening = p.styles.indexOf(". ") + 2;
        let from = opening;
        for (const re of [/half-time|pocket|pulse|groove|stomp|frame/i, /The hook (?:sits|rides) on|A hook on|The low end|Bass is built|Low end centers/, /arrangement moves through|record unfolds as|Form runs through/, /Mix with|Mix for|Finish the mix|Balance the mix/]) {
          const hit = p.styles.slice(from).search(re);
          assert.ok(hit >= 0, `${re} missing or out of order in: ${p.styles}`);
          from += hit + 1;
        }
      }
    }
  });
});

describe("research wording: tight prompts keep the essentials (§3.1, §11.5)", () => {
  it("a Tight bass prompt still has the groove, the hook-bass relation and the drop progression", () => {
    for (const brief of BASS_BRIEFS) {
      for (const p of prompts(brief, "tight")) {
        if (p.plan.native) continue;
        assert.match(p.styles, /half-time|pocket|pulse|groove|stomp|frame/i, p.styles);
        assert.match(p.styles, /answer|replies/i, p.styles);
        assert.match(p.styles, /\bdrop\b/i, p.styles);
      }
    }
  });
});
