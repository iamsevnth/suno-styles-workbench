import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { extractConstraintIntent, parseTempoIntent, parseKeyIntent, parseMeterIntent, splitPromptHeader, parseArrangementCues } from "../src/lib/suno/intent.ts";
import { parseUserInput } from "../src/lib/suno/parse.ts";
import { generateStylesPrompts } from "../src/lib/suno/generate.ts";
import { majorAxisDistance, isStructurallyUnique } from "../src/lib/suno/validate.ts";
import { SONIC_IDENTITIES } from "../src/lib/suno/sonic-identities.ts";

describe("VNext semantic intent regressions", () => {
  it("extracts excluded concepts before positive hint matching", () => {
    const c = extractConstraintIntent("142 BPM brostep, Exclude four-on-the-floor, male baritone rapper");
    assert.deepEqual(c.exclusions, ["four-on-the-floor"]);
    assert.doesNotMatch(c.positiveText, /four-on-the-floor/i);
    const parsed = parseUserInput("142 BPM brostep, Exclude four-on-the-floor, male baritone rapper");
    assert.ok(!parsed.grooveHints.includes("four-on-the-floor"));
    assert.deepEqual(parsed.exclusions, ["four-on-the-floor"]);
  });

  it("parses written and symbolic accidentals and musical modes", () => {
    for (const [source, key] of [
      ["F-sharp minor", "F# minor"], ["C-sharp Phrygian", "C# phrygian"],
      ["B-flat Dorian", "Bb dorian"], ["E minor", "E minor"], ["G major", "G major"],
    ]) assert.equal(parseKeyIntent(source), key, source);
    assert.equal(parseMeterIntent("145 BPM, 4/4, E minor"), "4/4");
  });

  it("distinguishes source, target and perceived tempos", () => {
    const t = parseTempoIntent("Remix the source loop at 100 BPM into a 145 BPM drumstep track with 72 BPM halftime feel");
    assert.equal(t.bpm, 145);
    assert.ok(t.mentions.some((m) => m.role === "feel" && m.value === 72));
    assert.equal(parseTempoIntent("140 to 146 BPM").bpm, 143);
  });

  it("reads metadata headers separately from the prompt body", () => {
    const h = splitPromptHeader("140 BPM | G Minor\nA half-time dubstep track...");
    assert.match(h.header, /140 BPM/);
    assert.equal(h.body, "A half-time dubstep track...");
  });

  it("captures Drop 2 and silence with arrangement details", () => {
    const c = parseArrangementCues("Drop 2 adds octave shifts and triplet fills. A full-beat silence precedes the final drop.");
    assert.ok(c.some((x) => x.kind === "drop2"));
    assert.ok(c.some((x) => x.kind === "silence"));
  });

  it("never accepts a title or recipe ID change as semantic diversity", () => {
    const plan = generateStylesPrompts("140 BPM trap future bass", { count: 1, seed: 99 }).prompts[0].plan;
    const copy = { ...plan, recipeId: plan.recipeId + "other", titlePhrase: plan.titlePhrase + " new" };
    assert.equal(majorAxisDistance(plan, copy), 0);
    assert.equal(isStructurallyUnique(copy, "new text", [plan], ["old text"]), false);
  });

  it("offers a large, nonduplicate sonic identity library", () => {
    assert.ok(SONIC_IDENTITIES.length >= 30);
    assert.equal(new Set(SONIC_IDENTITIES.map((x) => x.id)).size, SONIC_IDENTITIES.length);
  });

  it("A/B Lab changes only one high-level plan axis", () => {
    const p = generateStylesPrompts("140 BPM brostep, instrumental", { count: 2, seed: 123, variationMode: "ab" }).prompts;
    assert.equal(p.length, 2);
    assert.equal(majorAxisDistance(p[0].plan, p[1].plan), 1);
    assert.equal(p[0].plan.primaryGenre, p[1].plan.primaryGenre);
  });
});

describe("VNext archive-derived release guardrails", () => {
  it("keeps comma-separated forbidden concepts together in Exclude", () => {
    const c = extractConstraintIntent("142 BPM brostep; no cinematic, orchestral, strings, brass, choir, soundtrack, or trailer elements.");
    assert.deepEqual(c.exclusions, ["cinematic", "orchestral", "strings", "brass", "choir", "soundtrack", "trailer elements"]);
    assert.doesNotMatch(c.positiveText, /cinematic|orchestral|trailer/i);
  });

  it("preserves positive musical instructions after a negated colon", () => {
    const c = extractConstraintIntent("Keep the snare dry. Avoid random sound spam: every new texture should answer the main motif or mark a structural change.");
    assert.deepEqual(c.exclusions, ["random sound spam"]);
    assert.match(c.positiveText, /main motif/i);
  });

  it("distinguishes instrumental arrangements from instrumental pockets supporting a singer", () => {
    const singer = parseUserInput("108 BPM future bass, solo low male rapper, alternate vocal bars with instrumental answers", { mode: "rewrite" });
    const instrumental = parseUserInput("Original minimalist future-house instrumental at 124 BPM in F minor", { mode: "rewrite" });
    assert.equal(singer.instrumental, false);
    assert.equal(singer.vocals?.presentation, "male");
    assert.equal(instrumental.instrumental, true);
  });

  it("does not interpret wild as a genre-randomization instruction in Fix mode", () => {
    const p = parseUserInput("145 BPM brostep track with wild bass modulation and dry drum hits", { mode: "rewrite" });
    assert.ok(!p.mandatory.includes("__variety__"));
  });

  it("keeps brostep and riddim clear of unrequested cinematic language", () => {
    for (const genre of ["brostep", "riddim"]) {
      for (const lead of ["male tenor singing", "female alto singing", "strictly instrumental"]) {
        const { prompts } = generateStylesPrompts(`142 BPM ${genre}, punchy bass and precise groove, ${lead}`, {
          count: 3, seed: 42, profileEnabled: false, variationMode: "precision",
        });
        for (const prompt of prompts) {
          assert.doesNotMatch(prompt.styles, /\b(?:cinematic|orchestral|trailer|film score)\b/i, prompt.styles);
          assert.ok(Object.values(prompt.hardGates).every(Boolean), prompt.issues.join(", "));
        }
      }
    }
  });
});
