import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { generateStylesPrompts } from "../src/lib/suno/generate.ts";
import { MAX_CHARS, MIN_CHARS } from "../src/lib/suno/render.ts";
import { runSkill } from "../src/lib/suno/skills/run.ts";
import { pickSuggestions, SURPRISE_BRIEF } from "../src/lib/suno/suggestions.ts";
import { historyFileStamp, toTitleCase } from "../src/lib/suno/title-case.ts";
import { formatAllPromptsTxt } from "../src/lib/suno/v6.ts";

function assertInWindow(characters: number) {
  assert.ok(
    characters >= MIN_CHARS && characters <= MAX_CHARS,
    `character count ${characters} is outside ${MIN_CHARS}-${MAX_CHARS}`
  );
}

describe("suggestions", () => {
  it("puts Surprise Me first and keeps every chip at 250 characters or fewer", () => {
    const chips = pickSuggestions(1);
    assert.equal(chips[0], SURPRISE_BRIEF);
    for (const chip of chips) assert.ok(chip.length <= 250, chip);
  });
});

describe("styles compiler", () => {
  it("compiles 140 BPM trap future bass with female vocals", () => {
    const { prompts } = generateStylesPrompts("140 BPM trap future bass, female vocals, high energy", {
      count: 6,
    });
    assert.equal(prompts.length, 6);
    for (const p of prompts) {
      assertInWindow(p.characters);
      assert.equal(p.characters, p.styles.length);
      assert.match(p.styles, /\b140 BPM\b/);
      assert.match(p.styles, /Trap/i);
      assert.match(p.styles, /Future Bass/i);
      assert.match(p.styles, /female/i);
      assert.doesNotMatch(p.styles, /Primary instrumentation:/i, "label headers were retired");
    }
  });

  it("keeps 92 BPM dark R&B with a male tenor in half-time", () => {
    const { prompts } = generateStylesPrompts("92bpm dark r&b, male tenor, intimate, half-time", { count: 3 });
    for (const p of prompts) {
      assertInWindow(p.characters);
      assert.match(p.styles, /\b92 BPM\b/);
      assert.match(p.styles, /Dark R&B/i);
      assert.match(p.styles, /\bmale\b/i);
      assert.match(p.styles, /tenor/i);
      assert.match(p.styles, /half-time/i);
      assert.doesNotMatch(p.styles, /140 UKG|Wubby 140/i);
    }
  });

  it("keeps instrumental briefs free of vocal presentation", () => {
    const { prompts } = generateStylesPrompts("experimental trap, 128 bpm, instrumental, cinematic risers", {
      count: 3,
    });
    for (const p of prompts) {
      assertInWindow(p.characters);
      assert.match(p.styles, /\b128 BPM\b/);
      assert.doesNotMatch(p.styles, /female vocals|male vocals/i);
      assert.match(p.styles, /instrumental/i);
    }
  });

  it("honors gospel dubstep at 150 BPM with Reese bass", () => {
    const { prompts } = generateStylesPrompts("gospel dubstep 150bpm reese bass", { count: 3 });
    for (const p of prompts) {
      assertInWindow(p.characters);
      assert.match(p.styles, /\b150 BPM\b/);
      assert.match(p.styles, /Gospel/i);
      assert.match(p.styles, /Dubstep/i);
      assert.match(p.styles, /Reese/i);
    }
  });

  it("never repeats a recipe that the caller asks it to avoid", () => {
    const first = generateStylesPrompts("140 BPM trap future bass", { count: 3 });
    const avoid = first.prompts.map((p) => p.plan.recipeId);
    const second = generateStylesPrompts("140 BPM trap future bass", { count: 3, avoidFingerprints: avoid });
    for (const p of second.prompts) assert.ok(!avoid.includes(p.plan.recipeId), p.plan.recipeId);
  });

  it("never leaks artist names, style-of phrasing, or lyric tags", () => {
    const briefs = [
      "140 BPM trap future bass, female vocals, high energy",
      "92bpm dark r&b, male tenor, intimate, half-time",
      "experimental trap, 128 bpm, instrumental, cinematic risers",
      "gospel dubstep 150bpm reese bass",
    ];
    for (const brief of briefs) {
      for (const p of generateStylesPrompts(brief, { count: 3 }).prompts) {
        assert.doesNotMatch(p.styles, /\b(taylor swift|drake|kanye|the weeknd|billie eilish)\b/i);
        assert.doesNotMatch(p.styles, /\bin the style of\b/i);
        assert.doesNotMatch(p.styles, /\[(verse|chorus|bridge)\]/i);
      }
    }
  });
});

describe("exports and formatting", () => {
  it("formats the all-prompts text export with IDs and delimiters", () => {
    const { prompts } = generateStylesPrompts("140 BPM trap future bass", { count: 2 });
    const txt = formatAllPromptsTxt(prompts);
    assert.ok(txt.includes("ID#"));
    assert.ok(txt.includes("===="));
  });

  it("stamps history files to the millisecond", () => {
    assert.equal(historyFileStamp(new Date(2026, 8, 28, 4, 15, 30, 42)), "20260928_041530_042");
  });

  it("title-cases prompt titles and keeps BPM uppercase", () => {
    const title = toTitleCase("swung emotional bass and trap | 140 bpm | 950 total characters");
    assert.ok(title.includes("Swung Emotional Bass and Trap"), title);
    assert.ok(title.includes("140 BPM"), title);
  });
});

describe("skills", () => {
  it("adds an exclusion section when a commercial artist is named", () => {
    const report = runSkill("rights", { request: "Make a song", named: "Drake", material: "named-style" });
    assert.ok(report.exclusion.includes("Drake"));
    assert.ok(report.exclusion.includes("Will not copy"));
  });
});
