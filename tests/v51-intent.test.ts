import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  extractConstraintIntent, parseTempoIntent, parseKeyIntent, parseMeterIntent,
  parseArrangementCues, phraseExcluded,
} from "../src/lib/suno/intent.ts";
import { parseUserInput } from "../src/lib/suno/parse.ts";
import { generateStylesPrompts } from "../src/lib/suno/generate.ts";
import { MIN_CHARS, MAX_CHARS, HARD_MAX_CHARS } from "../src/lib/suno/limits.ts";

describe("v5.1 musical intent adapter", () => {
  it("parses flats, sharps and named modes without guessing an A minor tonic", () => {
    for (const [s, expected] of [
      ["F-sharp minor", "F# minor"], ["B-flat Dorian", "Bb dorian"],
      ["C# Phrygian", "C# phrygian"], ["G major", "G major"],
      ["E-flat mixolydian", "Eb mixolydian"],
    ]) assert.equal(parseKeyIntent(s), expected, s);
    assert.equal(parseKeyIntent("a minor key"), undefined);
    assert.equal(parseMeterIntent("140 BPM, 7/8, C# minor"), "7/8");
  });

  it("resolves ranges and ignores source and perceived tempo when choosing the output BPM", () => {
    const o = parseTempoIntent("Original loop at 100 BPM, new track at 145 BPM with half-time feel at 72 BPM.");
    assert.equal(o.bpm, 145);
    assert.ok(o.mentions.some(x => x.role === "source" && x.value === 100));
    assert.ok(o.mentions.some(x => x.role === "feel" && x.value === 72));
    assert.equal(parseTempoIntent("140–146 BPM").bpm, 143);
  });

  it("extracts full comma-separated excluded lists without seeding genre or instrument hints", () => {
    const raw = "142 BPM brostep, no cinematic, orchestral, strings, or trailer music; male tenor rapper, hard bass and dry drums.";
    const c = extractConstraintIntent(raw);
    assert.deepEqual(c.exclusions, ["cinematic", "orchestral", "strings", "trailer music"]);
    assert.doesNotMatch(c.positiveText, /\borchestral\b|\bstrings\b/);
    const parsed = parseUserInput(raw, { profileEnabled: false });
    assert.ok(parsed.genres.some(g => /brostep/i.test(g)));
    assert.equal(parsed.exclusions?.length, 4);
    assert.ok(!parsed.instrumentPhrases?.some(x => /\bstrings\b/i.test(x)));
  });

  it("recognizes instrumental sections as distinct from a singer in the same brief", () => {
    const vocal = parseUserInput("140 BPM brostep with male rapper, instrumental answers between sung bars");
    assert.equal(vocal.instrumental, false);
    assert.equal(vocal.vocals?.presentation, "male");
    const inst = parseUserInput("128 BPM bass house, strictly instrumental");
    assert.equal(inst.instrumental, true);
  });

  it("separates forbidden groove language from positive groove hints", () => {
    const p = parseUserInput("140 BPM bass house, exclude four-on-the-floor; use broken kick accents", { profileEnabled: false });
    assert.ok(!p.grooveHints.includes("four-on-the-floor"));
    assert.deepEqual(p.exclusions, ["four-on-the-floor"]);
    assert.equal(phraseExcluded("steady four-on-the-floor kicks", p.exclusions), true);
  });

  it("recognizes second-drop, bar and silence cues without inventing arrangement facts", () => {
    const a = parseArrangementCues("Drop 2 changes the FM motif after 8 bars. A full beat of silence follows.");
    assert.ok(a.some(x => x.kind === "drop2" && x.bars === 8));
    assert.ok(a.some(x => x.kind === "silence"));
  });

  it("preserves native routing, the separate Exclude field and hard length cap", () => {
    const result = generateStylesPrompts("142 BPM riddim, D-sharp minor, 4/4; exclude orchestral and acoustic guitar. Use clipped wobble stabs.", { count: 1, seed: 45, profileEnabled: false });
    assert.equal(result.parsed.key, "D# minor");
    assert.equal(result.parsed.meter, "4/4");
    assert.ok(result.parsed.native);
    const prompt = result.prompts[0];
    assert.match(prompt.exclude ?? "", /orchestral/);
    assert.ok(prompt.styles.length >= MIN_CHARS && prompt.styles.length <= HARD_MAX_CHARS);
    assert.ok(prompt.styles.length <= MAX_CHARS);
    assert.ok(prompt.hardGates.noExcludedConcepts !== false);
  });
});
