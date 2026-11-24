import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { generateStylesPrompts } from "../src/lib/suno/generate.ts";
import { validatePrompt, criticalGatesPass, allHardGatesPass } from "../src/lib/suno/validate.ts";
import { checkAiRewrite, rewordInstruction } from "../src/lib/ai/check.ts";
import { analyzePromptFidelity } from "../src/lib/suno/fidelity.ts";
import { applyTempoGenres, briefTempoFromGenre, tempoGenreNumbers, tempoStated } from "../src/lib/suno/tempo-genre.ts";

const SEEDS = [1, 7, 42, 99];

/** Every 13x/14x number in the text: the rule is that a tempo is stated once. */
const tempoNumbers = (text: string) => (text.match(/\b1[34]\d\b/g) ?? []).length;

describe("tempo-named genres: the phrase", () => {
  it("writes any two of 140 / UKG / Dubstep as the full phrase, never split", () => {
    for (const [input, out] of [
      ["140 UKG", "140 UKG Dubstep"],
      ["UKG Dubstep", "140 UKG Dubstep"],
      ["ukg-dubstep", "140 UKG Dubstep"],
      ["140 dubstep", "140 UKG Dubstep"],
      ["140 UKG Dubstep", "140 UKG Dubstep"],
      ["140 uk garage", "140 UKG Dubstep"],
      ["Deep UKG-Dubstep", "Deep 140 UKG Dubstep"],
    ]) {
      assert.equal(applyTempoGenres(input, 140, true), out, input);
    }
  });

  it("puts the prompt's tempo in the name and drops the separate BPM", () => {
    assert.equal(applyTempoGenres("140 BPM 140 UKG with Future Bass low-end movement.", 137, true), "137 UKG Dubstep with Future Bass low-end movement.");
    assert.equal(applyTempoGenres("UKG Dubstep at 143 BPM with a dark mood.", 143, true), "143 UKG Dubstep with a dark mood.");
    assert.equal(applyTempoGenres("140 BPM 140 Bass with Baile Funk percussion.", 138, true), "138 Bass with Baile Funk percussion.");
    assert.equal(applyTempoGenres("Deep 140 at 141 BPM.", 141, true), "Deep 141.");
  });

  it("numbers only the first tempo-named genre, so the number never repeats a few words later", () => {
    const out = applyTempoGenres("140 BPM Deep 140 Bass with UKG Dubstep hat skip and Wubby 140 accents.", 141, true);
    assert.equal(out, "Deep 141 Bass with UKG hat skip and wubby bass accents.");
    assert.equal(tempoNumbers(out), 1);
  });

  it("outside 135–145 the name drops its number and the BPM stays", () => {
    assert.equal(applyTempoGenres("150 BPM UKG Dubstep with 140 Bass weight.", 150, true), "150 BPM UKG with UK bass weight.");
  });

  it("leaves other genres and single words alone", () => {
    for (const text of ["Wobble 140 dubstep pressure.", "garage dubstep swing.", "150 dubstep.", "UKG hats over a dubstep drop.", "140 BPM trap."]) {
      assert.equal(applyTempoGenres(text, 140, true), text);
    }
  });

  it("a brief's own number other than 140 sets the tempo; 140 is just the name", () => {
    assert.equal(briefTempoFromGenre("138 ukg dubstep, dark"), 138);
    assert.equal(briefTempoFromGenre("140 UKG, dark"), undefined);
    assert.equal(briefTempoFromGenre("150 dubstep"), undefined);
  });
});

describe("tempo-named genres: generated prompts", () => {
  it("the reported bug: no \"140 BPM 140 UKG\" or \"140 BPM 140 Bass\"", () => {
    for (const brief of [
      "140 UKG + Future Bass + Wobble Dubstep, emotional, nocturnal, 140 BPM",
      "140 Bass + Baile Funk, kinetic, 140 BPM",
    ]) {
      for (const seed of SEEDS) {
        for (const p of generateStylesPrompts(brief, { count: 3, seed }).prompts) {
          assert.equal(p.bpm, 140, p.styles);
          assert.doesNotMatch(p.styles, /\bBPM\b/, p.styles);
          assert.equal(tempoNumbers(p.styles), 1, p.styles);
          assert.match(p.styles, /^140 (?:UKG Dubstep|Bass) with /, p.styles);
          assert.ok(allHardGatesPass(p.hardGates), `${JSON.stringify(p.hardGates)} ${p.issues.join(";")}`);
        }
      }
    }
  });

  it("UKG dubstep with no tempo: the first prompt is 140, siblings vary inside 135–145", () => {
    const seen = new Set<number>();
    for (const seed of SEEDS) {
      const prompts = generateStylesPrompts("UKG dubstep, dark", { count: 3, seed }).prompts;
      assert.equal(prompts[0].bpm, 140);
      for (const p of prompts) {
        seen.add(p.bpm);
        assert.ok(p.bpm >= 135 && p.bpm <= 145, String(p.bpm));
        assert.match(p.styles, new RegExp(`^${p.bpm} UKG Dubstep\\b`), p.styles);
        assert.doesNotMatch(p.styles, /\bBPM\b/, p.styles);
        assert.equal(tempoNumbers(p.styles), 1, p.styles);
        assert.ok(criticalGatesPass(p.hardGates), JSON.stringify(p.hardGates));
      }
    }
    assert.ok(seen.size > 1, "siblings should vary the tempo");
  });

  it("a tempo the brief names always wins, inside or outside the window", () => {
    for (const p of generateStylesPrompts("138 ukg dubstep, female vocals", { count: 3, seed: 7 }).prompts) {
      assert.equal(p.bpm, 138);
      assert.match(p.styles, /^138 UKG Dubstep\b/, p.styles);
    }
    const r = generateStylesPrompts("UKG dubstep, 150 bpm", { count: 3, seed: 7 });
    assert.ok(r.parsed.genreNotes?.some((n) => /135–145/.test(n)), JSON.stringify(r.parsed.genreNotes));
    for (const p of r.prompts) {
      assert.equal(p.bpm, 150);
      assert.match(p.styles, /\b150 BPM\b/, p.styles);
      assert.doesNotMatch(p.styles, /UKG[ -]Dubstep|\b1[34]\d (?:UKG|Bass)\b/i, p.styles);
    }
  });

  it("a supporting tempo-named genre pulls the blend into the window and carries the tempo", () => {
    for (const seed of SEEDS) {
      for (const p of generateStylesPrompts("Aggressive Trap + UKG Dubstep, dark", { count: 2, seed }).prompts) {
        assert.ok(p.bpm >= 135 && p.bpm <= 145, String(p.bpm));
        assert.match(p.styles, new RegExp(`\\b${p.bpm} UKG Dubstep\\b`), p.styles);
        assert.doesNotMatch(p.styles, /\bBPM\b/, p.styles);
      }
    }
  });

  it("Fix mode applies the same rule to a pasted prompt", () => {
    const pasted = "140 BPM 140 UKG with Future Bass low-end movement, emotional and nocturnal. A deep half-time stomp carries skippy syncopated hi-hats and punchy trap kicks, leaving space before each bass answer. Low end centers on deep mono sub and filtered Reese swells. The harmonic bed uses lush detuned supersaw chords and eerie string loops to support the topline. Instrumentation is built around saturated 808 low end, crystalline synth bells and atmospheric pads. Lead vocals deliver airy female vocal floating over sub pressure. The arrangement moves through filtered intro, then full drop, then stripped break into a harder final drop. Balance the mix around centered mono low end and a wide harmonic upper field.";
    const r = generateStylesPrompts(pasted, { count: 1, seed: 7, mode: "rewrite" });
    const p = r.prompts[0];
    assert.equal(tempoNumbers(p.styles), 1, p.styles);
    assert.doesNotMatch(p.styles, /\bBPM\b/, p.styles);
  });
});

describe("tempo-named genres: checks", () => {
  const p = generateStylesPrompts("UKG dubstep, dark", { count: 1, seed: 7 }).prompts[0];

  it("the tempo counts as stated through the genre name", () => {
    assert.ok(tempoStated(p.styles, p.bpm));
    assert.deepEqual(tempoGenreNumbers(p.styles), [p.bpm]);
  });

  it("a separate BPM beside the numbered name is a contradiction", () => {
    const doubled = p.styles.replace(`${p.bpm} UKG Dubstep`, `${p.bpm} UKG Dubstep at ${p.bpm} BPM`);
    const v = validatePrompt(doubled, p.plan);
    assert.equal(v.hardGates.noContradictions, false);
    assert.ok(v.issues.includes("contradiction:tempo_named_twice"), v.issues.join(";"));
  });

  it("an AI rewrite that adds a BPM or changes the number is rejected", () => {
    const added = checkAiRewrite(p.styles.replace(`${p.bpm} UKG Dubstep`, `${p.bpm} BPM ${p.bpm} UKG Dubstep`), p);
    assert.equal(added.ok, false);
    const changed = checkAiRewrite(p.styles.replace(`${p.bpm} UKG Dubstep`, `${p.bpm === 140 ? 142 : 140} UKG Dubstep`), p);
    assert.equal(changed.ok, false);
  });

  it("the AI instruction asks for the genre name, not a BPM", () => {
    const text = rewordInstruction(p);
    assert.match(text, new RegExp(`"${p.bpm} UKG Dubstep"`));
    assert.match(text, /never add a separate BPM/);
  });

  it("the Fidelity Inspector reads the tempo from the genre name", () => {
    const brief = "140 UKG + Future Bass, emotional, 140 BPM";
    const out = generateStylesPrompts(brief, { count: 1, seed: 7 }).prompts[0];
    const report = analyzePromptFidelity(brief, out.styles);
    const tempo = report.findings.find((f) => f.id === "target-tempo");
    assert.equal(tempo?.status, "matched", JSON.stringify(tempo));
  });
});
