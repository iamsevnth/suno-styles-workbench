import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { headlineCase } from "../src/lib/text/headline-case.ts";

describe("headline case for site headings", () => {
  const CASES: [string, string][] = [
    ["Write the brief. Get a Styles prompt Suno can follow.", "Write the Brief. Get a Styles Prompt Suno Can Follow."],
    ["Everything between the idea and the take", "Everything Between the Idea and the Take"],
    ["Three steps to a usable take", "Three Steps to a Usable Take"],
    ["Built to the rules Suno responds to", "Built to the Rules Suno Responds To"],
    ["One self-contained HTML file", "One Self-Contained HTML File"],
    ["Suno v6 settings", "Suno v6 Settings"],
    ["UKG is not UK garage", "UKG Is Not UK Garage"],
    ["FAQ", "FAQ"],
    ["the R&B and 140 BPM mix", "The R&B and 140 BPM Mix"],
    ["Sources: how this guide is checked", "Sources: How This Guide Is Checked"],
  ];
  for (const [input, expected] of CASES) {
    it(`"${input}"`, () => assert.equal(headlineCase(input), expected));
  }

  it("leaves words with capitals or digits exactly as written", () => {
    assert.equal(headlineCase("iPhone and v6 with DnB"), "iPhone and v6 With DnB");
  });
});
