import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  bpmNotes,
  checkBlendBpm,
  conceptsOf,
  dedupeByConcept,
  dedupeSimilar,
  genreClause,
  isBroaderGenre,
  joinList,
  reconcileMoods,
  resolveGenreBlend,
  sentenceCase,
  stripTemplateBoilerplate,
  stripVocalLeadIn,
} from "../src/lib/suno/blend.ts";

describe("genre blend", () => {
  it("merges a broad genre into its own sub-genre", () => {
    assert.ok(isBroaderGenre("Trap", "Aggressive Trap"));
    assert.ok(!isBroaderGenre("Aggressive Trap", "Trap"));
    const blend = resolveGenreBlend(["Aggressive Trap", "Trap", "UKG Dubstep"]);
    assert.deepEqual(blend.genres, ["Aggressive Trap", "UKG Dubstep"]);
    assert.equal(blend.notes.length, 1);
  });

  it("drops repeats, keeps the first genre as primary and caps the blend at three", () => {
    const blend = resolveGenreBlend(["Trap", "Baile Funk", "trap", "Deep Dubstep", "Drill"]);
    assert.equal(blend.genres[0], "Trap");
    assert.equal(blend.genres.length, 3);
    assert.equal(new Set(blend.genres.map((g) => g.toLowerCase())).size, 3);
  });

  it("keeps UKG Dubstep as one genre with its own role", () => {
    assert.deepEqual(resolveGenreBlend(["UKG Dubstep"]).genres, ["UKG Dubstep"]);
    assert.equal(genreClause("Aggressive Trap", ["UKG Dubstep"]), "Aggressive Trap with UKG Dubstep hat skip and sub pressure");
  });

  it("gives every supporting genre a role instead of a list", () => {
    const clause = genreClause("Trap", ["Baile Funk", "Deep Dubstep"]);
    assert.match(clause, /^Trap with Baile Funk percussion, plus Deep Dubstep bass movement$/);
  });
});

describe("mood reconciliation", () => {
  it("turns contradictory moods into one phrase led by the first-named group", () => {
    assert.equal(reconcileMoods(["dark", "aggressive", "emotional"])?.phrase, "dark and aggressive with an emotional edge");
    assert.equal(reconcileMoods(["emotional", "dark"])?.phrase, "emotional with a dark edge");
  });

  it("keeps scale words as modifiers and returns nothing for no moods", () => {
    assert.equal(reconcileMoods(["cinematic", "dark"])?.phrase, "cinematic and dark");
    assert.equal(reconcileMoods([]), undefined);
  });
});

describe("concept dedupe", () => {
  it("treats 808 synonyms as one sound", () => {
    for (const p of ["sliding 808", "tuned 808 slides", "portamento bass slides", "saturated harmonic 808"]) {
      assert.ok(conceptsOf(p).has("808"), p);
    }
    assert.deepEqual(dedupeByConcept(["sliding 808", "deep mono sub", "tuned 808 slides", "mono sub weight"]), [
      "sliding 808",
      "deep mono sub",
    ]);
  });

  it("shares the seen set across sections so a later section does not repeat an earlier one", () => {
    const seen = new Set<string>();
    dedupeByConcept(["sliding 808"], seen);
    assert.deepEqual(dedupeByConcept(["warm atmospheric pads", "tuned 808 slides", "ceremonial bells"], seen), [
      "warm atmospheric pads",
      "ceremonial bells",
    ]);
  });

  it("drops a phrase that restates another in different words", () => {
    assert.deepEqual(dedupeSimilar(["wide harmonic field", "controlled saturation", "wide harmonic upper field"]), [
      "wide harmonic field",
      "controlled saturation",
    ]);
  });
});

describe("tempo check", () => {
  it("folds half and double time before judging a conflict", () => {
    assert.equal(checkBlendBpm(["Trap"], 70).conflicts.length, 0);
    assert.equal(checkBlendBpm(["Trap"], 140).conflicts.length, 0);
  });

  it("flags a genre far from the requested tempo and settles a tempo when none is given", () => {
    assert.ok(bpmNotes(["Aggressive Trap", "Deep House"], 145).length >= 1);
    const compromise = checkBlendBpm(["Trap", "House"], undefined).compromise;
    assert.ok(compromise >= 120 && compromise <= 150, String(compromise));
  });
});

describe("text cleanup", () => {
  it("strips the compiler's own filler from a re-ingested prompt", () => {
    const text = "Dark trap. The production keeps Melodic Future Bass, heavy and talk-rap front and center. Translation stays clear on every playback system. Sliding 808.";
    const out = stripTemplateBoilerplate(text);
    assert.doesNotMatch(out, /Melodic Future Bass|front and center|Translation stays/);
    assert.match(out, /Sliding 808/);
  });

  it("removes a vocal lead-in so it is never quoted inside another one", () => {
    assert.equal(stripVocalLeadIn("Topline features Vocals center on silky female rap flow"), "Vocals center on silky female rap flow");
    assert.equal(stripVocalLeadIn("Vocals center on silky female rap flow"), "silky female rap flow");
  });

  it("lowercases fragment capitals but keeps acronyms and genre names", () => {
    assert.equal(
      sentenceCase("Warm pads, Sliding 808, The UKG Dubstep hats; Wide mix", ["UKG Dubstep"]),
      "Warm pads, sliding 808, the UKG Dubstep hats; wide mix"
    );
  });

  it("joins lists with 'and', or 'plus' when an item already has an 'and'", () => {
    assert.equal(joinList(["a", "b", "c"]), "a, b and c");
    assert.equal(joinList(["a and b", "c"]), "a and b plus c");
  });
});
