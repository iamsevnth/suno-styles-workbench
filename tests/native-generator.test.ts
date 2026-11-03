import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { bassMusicLeaks, hasConflictingBpm, moodClash, statedBpms, vocalInInstrumental } from "../src/lib/suno/consistency.ts";
import { generateStylesPrompts } from "../src/lib/suno/generate.ts";
import { HARD_MAX_CHARS, MAX_CHARS, MIN_CHARS } from "../src/lib/suno/render.ts";
import { NATIVE_MIN, NATIVE_MAX } from "../src/lib/suno/native/compose.ts";
import { ARTIST_LEAK_RE, findContradictions, validatePrompt } from "../src/lib/suno/validate.ts";
import { generateLyrics, themeKeywords } from "../src/lib/lyrics/generator.ts";
import { pickSuggestions } from "../src/lib/suno/suggestions.ts";
import { PromptCandidate } from "../src/lib/suno/types.ts";

const SEEDS = [1, 7, 42, 99, 500];

function promptsFor(brief: string, count = 3): PromptCandidate[] {
  return SEEDS.flatMap((seed) => generateStylesPrompts(brief, { count, seed }).prompts);
}

const BASS_MUSIC = /\b(808s?|wobble bass|wubs?|growls?|reese|neuro\w*|drops?|riddim|dubstep|tearout|trap hats?|sub[- ]?bass drops?)\b/i;
const FILLER = /Strong motif identity|Translation stays clear|genre-appropriate drum pattern/i;

interface FamilyBrief {
  brief: string;
  label: RegExp;
  bpm: number;
  /** Sounds that must appear because the genre family owns them (any one is enough). */
  sounds: RegExp;
  /** Wording that belongs to another family. */
  forbidden?: RegExp;
}

const FAMILIES: FamilyBrief[] = [
  { brief: "melodic techno, 126 BPM, hypnotic, rainy warehouse", label: /^Melodic techno at 126 BPM/, bpm: 126, sounds: /kick|hats|arpeggi|pluck/i },
  { brief: "minimal techno, 128 BPM, instrumental, dry", label: /^Minimal techno at 128 BPM/, bpm: 128, sounds: /kick|click|hats|percussion/i },
  { brief: "peak-time techno, 132 BPM, driving", label: /^Peak-time techno at 132 BPM/, bpm: 132, sounds: /kick|hats|stab|rumble/i },
  { brief: "deep house, 122 BPM, female vocals, warm, sunset rooftop", label: /^Deep house at 122 BPM/, bpm: 122, sounds: /house bass|hats|909|chord|pads/i },
  { brief: "tech house, 125 BPM, groovy", label: /^Tech house at 125 BPM/, bpm: 125, sounds: /kick|hats|percussion|bass/i },
  { brief: "lo-fi jazz hop, 82 BPM, rainy night study music, warm Rhodes, vinyl crackle", label: /^Lo-fi jazz hop at 82 BPM/, bpm: 82, sounds: /boom-bap|tape|crackle|Rhodes/i },
  { brief: "smooth jazz, 90 BPM, saxophone, mellow", label: /^Smooth jazz at 90 BPM/, bpm: 90, sounds: /brush|upright|piano|walking|ride/i },
  { brief: "indie folk, 96 BPM, male vocals, acoustic guitar, campfire, wistful", label: /^Indie folk at 96 BPM/, bpm: 96, sounds: /guitar|shaker|upright|banjo|harmonica/i },
  { brief: "alt rock, 128 BPM, male vocals, electric guitar riff, energetic, garage band", label: /^Alt rock at 128 BPM/, bpm: 128, sounds: /guitar|backbeat|drum kit|riff/i },
  { brief: "punk rock, 180 BPM, shouted male vocals", label: /^Punk rock at 180 BPM/, bpm: 180, sounds: /power chord|snare|guitar/i },
  { brief: "heavy metal, 150 BPM, male vocals, twin guitar harmonies", label: /^Heavy metal at 150 BPM/, bpm: 150, sounds: /double-kick|guitars|riff/i },
  { brief: "country ballad, 72 BPM, female vocals, pedal steel, front porch", label: /^Country ballad at 72 BPM/, bpm: 72, sounds: /pedal steel|fiddle|acoustic|boom-chick|banjo/i },
  { brief: "synthwave, 108 BPM, instrumental, neon night drive", label: /^Synthwave at 108 BPM/, bpm: 108, sounds: /arpeggio|analog|pads|gated|drum-machine/i },
  { brief: "dance pop, 118 BPM, female vocals, bright, summer road trip", label: /^Dance pop at 118 BPM/, bpm: 118, sounds: /hook|synth|chorus|pop/i },
  { brief: "cinematic ambient, 60 BPM, instrumental, soft piano, misty morning", label: /^Cinematic ambient at 60 BPM/, bpm: 60, sounds: /pad|reverb|drone|piano|texture/i, forbidden: /\bkick\b|\bsnare\b/i },
  { brief: "orchestral film score, 85 BPM, epic", label: /^Orchestral film score at 85 BPM/, bpm: 85, sounds: /strings|brass|timpani|orchestral/i },
];

describe("genre families", () => {
  for (const f of FAMILIES) {
    it(`"${f.brief}" opens with its own genre and tempo and stays in its family`, () => {
      for (const p of promptsFor(f.brief)) {
        assert.match(p.styles, f.label, p.styles);
        assert.match(p.styles, f.sounds, p.styles);
        assert.doesNotMatch(p.styles, BASS_MUSIC, p.styles);
        if (f.forbidden) assert.doesNotMatch(p.styles, f.forbidden, p.styles);
        assert.equal(p.plan.bpm, f.bpm);
        assert.equal(statedBpms(p.styles).join(), String(f.bpm), p.styles);
      }
    });
  }

  it("keeps every family prompt inside 800-975 characters and under the 1,000 cap", () => {
    for (const f of FAMILIES) {
      for (const p of promptsFor(f.brief)) {
        assert.ok(p.styles.length >= MIN_CHARS && p.styles.length <= MAX_CHARS, `${f.brief}: ${p.styles.length}`);
        assert.ok(p.styles.length <= HARD_MAX_CHARS);
      }
    }
  });

  it("never pads with generic filler sentences", () => {
    for (const f of FAMILIES) for (const p of promptsFor(f.brief)) assert.doesNotMatch(p.styles, FILLER, p.styles);
  });

  it("front-loads genre, BPM, mood, lead instrument and vocal in the first two sentences", () => {
    const [p] = promptsFor("deep house, 122 BPM, female vocals, warm, sunset rooftop", 1);
    const opening = p.styles.split(/(?<=\.)\s+/).slice(0, 2).join(" ");
    assert.match(opening, /Deep house/);
    assert.match(opening, /122 BPM/);
    assert.match(opening, /warm/);
    assert.match(opening, /Led by/);
    assert.match(opening, /female/);
  });

  it("gives variants different leads, vocal approaches or production eras inside the same genre", () => {
    const prompts = generateStylesPrompts("indie folk, 96 BPM, male vocals, campfire", { count: 4, seed: 7 }).prompts;
    assert.equal(new Set(prompts.map((p) => p.styles)).size, prompts.length);
    for (const p of prompts) {
      assert.equal(p.plan.primaryGenre, "Indie folk");
      assert.equal(p.plan.secondaryGenre, undefined);
      assert.equal(p.plan.accentGenre, undefined);
    }
  });
});

describe("brief words survive", () => {
  const BRIEF = "lo-fi jazz hop, rainy night study music, warm Rhodes, vinyl crackle, 82 BPM";
  it("carries scene, texture and instrument phrases verbatim", () => {
    for (const p of promptsFor(BRIEF)) {
      assert.match(p.styles, /rainy night/i, p.styles);
      assert.match(p.styles, /vinyl crackle/i, p.styles);
      assert.match(p.styles, /warm Rhodes/, p.styles);
      assert.match(p.styles, /Lo-fi jazz hop/, p.styles);
    }
  });

  it("carries a sunset rooftop into the prompt", () => {
    for (const p of promptsFor("deep house, 122 BPM, female vocals, warm, sunset rooftop")) {
      assert.match(p.styles, /sunset rooftop/i, p.styles);
    }
  });

  it("never swaps acoustic guitar for electric", () => {
    for (const brief of [
      "folk ballad, 84 BPM, female vocals, acoustic guitar, warm, campfire",
      "dark trap, rainy night, acoustic guitar, 140 BPM",
      "indie pop, acoustic guitar, bright",
    ]) {
      for (const p of promptsFor(brief)) {
        assert.match(p.styles, /acoustic guitar/i, p.styles);
        assert.doesNotMatch(p.styles, /electric guitar/i, p.styles);
      }
    }
  });

  it("keeps electric guitar when the brief asks for it", () => {
    for (const p of promptsFor("alt rock, 120 BPM, electric guitar riff, energetic")) {
      assert.match(p.styles, /electric guitar/i, p.styles);
    }
  });

  it("raises the score for prompts that keep the brief's words", () => {
    const [kept] = generateStylesPrompts(BRIEF, { count: 1, seed: 3 }).prompts;
    const stripped = kept.styles.replace(/rainy night/gi, "evening").replace(/vinyl crackle/gi, "texture");
    const worse = validatePrompt(stripped, kept.plan);
    assert.ok(kept.score > worse.score, `${kept.score} vs ${worse.score}`);
  });
});

describe("unknown genre words", () => {
  it("passes an unknown genre through verbatim in the opening clause and adds a visible note", () => {
    const { prompts, parsed } = generateStylesPrompts("vaporfunk, 100 BPM, dreamy, sunset rooftop", { count: 3, seed: 5 });
    assert.ok(parsed.genreNotes?.some((n) => /vaporfunk/.test(n) && /not in the genre library/.test(n)), String(parsed.genreNotes));
    for (const p of prompts) {
      assert.match(p.styles, /^Vaporfunk at 100 BPM/, p.styles);
      assert.doesNotMatch(p.styles, BASS_MUSIC, p.styles);
    }
  });

  it("never falls back to bass music for a brief with no recognised genre", () => {
    for (const p of promptsFor("something dreamy for a sunset rooftop, 100 BPM")) {
      assert.doesNotMatch(p.styles, BASS_MUSIC, p.styles);
      assert.match(p.styles, /\b100 BPM\b/);
    }
  });

  it("keeps an unknown word beside a known bass genre", () => {
    const { prompts } = generateStylesPrompts("trap + vaporfunk, 140 BPM", { count: 2, seed: 5 });
    for (const p of prompts) assert.match(p.styles, /vaporfunk/i, p.styles);
  });

  it("does not mistake sound words or negations for unknown genres", () => {
    for (const brief of ["140 BPM trap, no muddy bass, female rap, hard 808 bounce", "trap with UKG hat skip and sub pressure with bounce"]) {
      const { parsed } = generateStylesPrompts(brief, { count: 1, seed: 1 });
      assert.deepEqual(parsed.unknownGenres, [], brief);
    }
  });

  it("does not invent an accent genre for a single named genre", () => {
    for (const p of promptsFor("dark trap, 140 BPM")) {
      assert.equal(p.plan.secondaryGenre, undefined);
      assert.equal(p.plan.accentGenre, undefined);
    }
  });
});

describe("contradiction gate", () => {
  it("finds conflicting tempos", () => {
    assert.ok(hasConflictingBpm("120 BPM groove over a 90 BPM half-time stomp", 120));
    assert.ok(!hasConflictingBpm("120 BPM groove", 120));
  });

  it("finds vocal terms in an instrumental", () => {
    assert.ok(vocalInInstrumental("Fully instrumental, with lead vocals and stacked harmonies", true));
    assert.ok(!vocalInInstrumental("Fully instrumental, with airy vocal chops", true));
  });

  it("finds a calm mood beside a brutal one", () => {
    assert.ok(moodClash("a calm and brutal mood"));
    assert.ok(!moodClash("a calm mood with a brutal edge"));
  });

  it("finds bass-music phrasing that the brief did not ask for", () => {
    assert.deepEqual(bassMusicLeaks("warm folk with a wobble bass drop", "folk"), ["wobble bass", "drop"]);
    assert.deepEqual(bassMusicLeaks("deep dubstep drop", "dubstep drop"), []);
    assert.deepEqual(bassMusicLeaks("tape wobble on the keys", "lo-fi"), []);
  });

  it("fails validation when a plan's prompt contradicts itself", () => {
    const [p] = generateStylesPrompts("deep house, 122 BPM, female vocals", { count: 1, seed: 2 }).prompts;
    assert.deepEqual(findContradictions(p.styles, p.plan), []);
    assert.deepEqual(findContradictions(`${p.styles} Then 90 BPM half-time.`, p.plan), ["conflicting_bpm"]);
    assert.ok(findContradictions(`${p.styles} Heavy wobble bass drops.`, p.plan).includes("bass_music_phrasing"));
    const bad = validatePrompt(`${p.styles} Heavy wobble bass drops.`, p.plan);
    assert.equal(bad.hardGates.noContradictions, false);
  });

  it("produces no contradictions for any family brief or instrumental brief", () => {
    for (const f of FAMILIES) {
      for (const p of promptsFor(f.brief)) {
        assert.deepEqual(findContradictions(p.styles, p.plan), [], p.styles);
        assert.notEqual(p.hardGates.noContradictions, false, p.styles);
      }
    }
    for (const p of promptsFor("lofi hip hop study beats, 80 BPM, soft piano, instrumental, calm")) {
      assert.deepEqual(findContradictions(p.styles, p.plan), [], p.styles);
      assert.doesNotMatch(p.styles, /\b(?:lead vocals?|female vocals?|male vocals?|singer)\b/i, p.styles);
    }
  });

  it("never states two tempos", () => {
    for (const brief of ["dark trap, 140 BPM", "UKG dubstep and trap, male rap", "deep house, 122 BPM", "future bass, emotional"]) {
      for (const p of promptsFor(brief)) assert.equal(statedBpms(p.styles).length, 1, p.styles);
    }
  });
});

describe("lyrics", () => {
  const FOLK = { theme: "leaving the old farm town behind, Taylor Swift campfire", genre: "Indie Folk / Acoustic", delivery: "soft male vocal, intimate" };

  it("writes bracketed section directions", () => {
    const r = generateLyrics({ ...FOLK, seed: 5 });
    assert.match(r.fullText, /\[Verse 1 \| soft male vocal\]/);
    assert.match(r.fullText, /\[Chorus 1 \| full male vocal\]/);
    for (const s of r.sections) assert.match(s.tag, /^\[[^\]|]+ \| [^\]]+\]$/);
  });

  it("uses theme keywords and keeps artist names out of lyrics, tags and title", () => {
    assert.deepEqual(themeKeywords("Taylor Swift campfire songs"), ["campfire"]);
    for (const seed of [1, 2, 3, 4, 5]) {
      const r = generateLyrics({ ...FOLK, seed });
      assert.doesNotMatch(r.fullText, ARTIST_LEAK_RE);
      assert.doesNotMatch(r.title, ARTIST_LEAK_RE);
      assert.match(r.fullText, /farm|town|campfire|leaving/i);
    }
  });

  it("keeps artist names out of every performance note, for every delivery style", () => {
    const deliveries = ["Mumble SoundCloud Rapper", "Autotuned Trap Flow", "Sung-Rap / Melodic Trap Hybrid", "Lyrical Bars", "Talk-Rap", "Sung Melodic to High Belt"];
    for (const delivery of deliveries) {
      for (let seed = 1; seed <= 12; seed++) {
        const r = generateLyrics({ theme: "midnight drive", genre: "Trap / Street Drill", delivery, seed });
        assert.doesNotMatch(r.fullText, ARTIST_LEAK_RE, `${delivery}: ${r.fullText}`);
      }
    }
  });

  it("gives every chorus a shared hook and otherwise distinct lines, none copied from a verse", () => {
    for (const seed of [1, 2, 3]) {
      const r = generateLyrics({ ...FOLK, seed });
      const choruses = r.sections.filter((s) => s.type === "chorus");
      assert.ok(choruses.length >= 2);
      const hook = choruses[0].lines[0];
      for (const c of choruses) assert.equal(c.lines[0], hook);
      const seen = new Set<string>();
      for (const s of r.sections) {
        for (const line of s.lines) {
          if (line === hook) continue;
          if (s.type === "intro" || s.type === "outro" || s.type === "breakdown") continue;
          assert.ok(!seen.has(line), `repeated line: ${line}`);
          seen.add(line);
        }
      }
    }
  });

  it("gives a folk song no build-up or drop and no bass-music wording", () => {
    const r = generateLyrics({ ...FOLK, seed: 9 });
    assert.ok(!r.sections.some((s) => s.type === "drop" || s.type === "buildup"));
    assert.doesNotMatch(r.fullText, /\b(?:sub|808|bass|drop)\b/i);
  });
});

describe("suggestion chips", () => {
  it("contain no artist names and cover the new genre families", () => {
    const all = new Set<string>();
    for (let seed = 0; seed < 600; seed++) for (const chip of pickSuggestions(seed * 7919)) all.add(chip);
    for (const chip of all) assert.doesNotMatch(chip, ARTIST_LEAK_RE, chip);
    assert.ok([...all].some((c) => /Melodic techno/.test(c)));
    assert.ok([...all].some((c) => /Indie folk/.test(c)));
  });

  it("compile cleanly through the generator", () => {
    const all = new Set<string>();
    for (let seed = 0; seed < 100; seed++) for (const chip of pickSuggestions(seed * 31)) all.add(chip);
    for (const chip of all) {
      for (const p of generateStylesPrompts(chip, { count: 1, seed: 4 }).prompts) {
        assert.ok(p.styles.length <= HARD_MAX_CHARS, chip);
        assert.notEqual(p.hardGates.noContradictions, false, `${chip}: ${p.issues.join(",")}`);
      }
    }
  });
});


it("v5.1 shares the 800–975 target across native and legacy renderers", () => {
  assert.equal(MIN_CHARS, 800);
  assert.equal(MAX_CHARS, 975);
  assert.equal(HARD_MAX_CHARS, 1000);
  assert.equal(NATIVE_MIN, MIN_CHARS);
  assert.equal(NATIVE_MAX, MAX_CHARS);
});
