import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { analyzePromptFidelity, SUNO_FIELD_SOURCES, type FidelityReport } from "../src/lib/suno/fidelity.ts";

function fact(report: FidelityReport, id: string) {
  const found = report.findings.find(f => f.id === id);
  assert.ok(found, "Expected source fact: " + id);
  return found;
}

describe("v5.3 fidelity: explicit source facts", () => {
  const source = [
    "145 BPM, F# minor, 4/4, deep dubstep, acoustic guitar, female alto vocals with autotune.",
    "A 8-bar motif begins before Drop 2 and a brief silence.",
    "No choir.",
  ].join(" ");
  const aligned = [
    "145 BPM, F# minor, 4/4 deep dubstep with acoustic guitar and female alto vocals,",
    "autotune. An 8-bar motif is followed by Drop 2 and a silence.",
  ].join(" ");

  it("matches supported facts without claiming any audio quality", () => {
    const report = analyzePromptFidelity(source, aligned, "choir");
    for (const id of ["target-tempo", "key", "meter", "acoustic-guitar", "female",
      "alto", "autotune", "second-drop", "silence", "motif", "bars:8", "exclude:choir"]) {
      assert.equal(fact(report, id).status, "matched", id);
    }
    assert.equal(report.scope, "textual-source-fidelity");
    assert.equal(Object.hasOwn(report, "qualityScore"), false);
    assert.ok(report.caveats.some(x => x.includes("No listening")));
    assert.equal(report.counts.matched + report.counts.different + report.counts["not-found"] + report.counts.review,
      report.findings.length);
  });

  it("identifies explicit BPM, key and meter differences", () => {
    const report = analyzePromptFidelity("145 BPM, C# minor, 4/4, electric guitar.",
      "160 BPM, D minor, 3/4, acoustic guitar.");
    for (const id of ["target-tempo", "key", "meter", "electric-guitar"]) {
      assert.equal(fact(report, id).status, "different", id);
    }
  });
  it("accepts 140–150 BPM target when destination is 145 BPM", () => {
    const result = analyzePromptFidelity("140-150 BPM and female vocals", "145 BPM and female vocals");
    assert.equal(fact(result, "target-tempo").status, "matched");
  });
  it("does not conflate a sample/source tempo with requested target BPM", () => {
    const result = analyzePromptFidelity("Reference loop at 90 BPM, final work should feel tense", "140 BPM tense drums.");
    assert.equal(fact(result, "context-tempo").status, "review");
    assert.ok(!result.findings.some(f => f.id === "target-tempo"));
  });
  it("does not quietly accept two incompatible destination BPM values", () => {
    const result = analyzePromptFidelity("145 BPM, dark techno", "145 BPM but transitions into 175 BPM dark techno");
    assert.equal(fact(result, "target-tempo").status, "review");
  });
  it("does not assume a single target when source itself conflicts", () => {
    const result = analyzePromptFidelity("145 BPM and 160 BPM final tempo", "145 BPM");
    assert.equal(fact(result, "target-tempo").status, "review");
  });
  it("normalizes enharmonic accidental spelling when recognized by parser", () => {
    const result = analyzePromptFidelity("C-sharp minor, 140 BPM", "140 BPM in C# minor");
    assert.equal(fact(result, "key").status, "matched");
  });
  it("flags source details omitted by a Fix fallback", () => {
    const result = analyzePromptFidelity(
      "150 BPM. Female alto with autotune; Rhodes flute melody; second drop follows 16 bars and a fakeout motif.",
      "150 BPM. Female singer on layered synths and a heavy final drop.");
    for (const id of ["alto", "autotune", "rhodes", "flute", "second-drop", "fakeout", "motif", "bars:16"]) {
      assert.equal(fact(result, id).status, "not-found", id);
    }
  });
  it("shows source Exclude requirement as unresolved if it remains a negation in Styles", () => {
    const source = "145 BPM, no choir. Heavy dubstep.";
    const report = analyzePromptFidelity(source, source);
    assert.equal(fact(report, "exclude:choir").status, "not-found");
    assert.equal(fact(analyzePromptFidelity(source, "145 BPM heavy dubstep with choir.", ""), "exclude:choir").status, "different");
    assert.equal(fact(analyzePromptFidelity(source, "145 BPM heavy dubstep.", "choir"), "exclude:choir").status, "matched");
  });
  it("recognizes exclusion terms without treating exclusion as a positive instrument request", () => {
    const result = analyzePromptFidelity("140 BPM, no flute; acoustic guitar stays", "140 BPM acoustic guitar", "flute");
    assert.equal(fact(result, "exclude:flute").status, "matched");
    assert.ok(!result.findings.some(x => x.id === "flute"));
  });
  it("can audit both an externally supplied pre-Fix prompt and a fixed prompt against the same original brief", () => {
    const brief = "150 BPM, female vocals, acoustic guitar, no choir.";
    const preFix = "150 BPM male vocals, electric guitar, with choir.";
    const fixed = "150 BPM female vocals, acoustic guitar.";
    const before = analyzePromptFidelity(brief, preFix, "");
    const after = analyzePromptFidelity(brief, fixed, "choir");
    for (const id of ["female", "acoustic-guitar", "exclude:choir"]) {
      assert.equal(fact(before, id).status, "different", "pre-Fix " + id);
      assert.equal(fact(after, id).status, "matched", "fixed " + id);
    }
    assert.equal(fact(before, "target-tempo").status, "matched");
    assert.equal(fact(after, "target-tempo").status, "matched");
  });
  it("does not interpret alto saxophone as vocal range", () => {
    const result = analyzePromptFidelity("150 BPM, alto saxophone solo.", "150 BPM saxophone solo");
    assert.ok(!result.findings.some(x => x.id === "alto"));
    assert.equal(fact(result, "saxophone").status, "matched");
  });
  it("reports no detected facts rather than claiming perfect preservation", () => {
    const result = analyzePromptFidelity("Please invent an interesting feeling.", "Lush and atmospheric.");
    assert.equal(result.counts.matched, 0);
    assert.equal(result.scope, "textual-source-fidelity");
    assert.ok(result.findings.length >= 0);
  });
  it("rejects oversized source text before expensive scanning", () => {
    assert.throws(() => analyzePromptFidelity("x".repeat(50001), "abc"), /50,000/);
  });
  it("keeps authoritative Suno field sources separate from validation methodology", () => {
    assert.ok(SUNO_FIELD_SOURCES.some(x => /3161921/.test(x.url)));
    assert.ok(SUNO_FIELD_SOURCES.every(x => x.url.startsWith("https://help.suno.com/")));
    assert.ok(SUNO_FIELD_SOURCES.every(x => x.claim.length > 15));
  });
});
