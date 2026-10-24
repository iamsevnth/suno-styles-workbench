import { Card, Prose, Section, Table } from "../../components/content/Content.tsx";
import { familyKeys } from "../../lib/suno/families.ts";
import { allStyles, GENRES } from "../../lib/suno/ontology.ts";
import { PROFILE } from "../../lib/suno/profile.ts";
import { MAX_CHARS, MIN_CHARS } from "../../lib/suno/render.ts";

const PIPELINE: [string, string][] = [
  [
    "1. Parse",
    "Reads the brief for genres, tempo, key, moods, vocals, instruments, groove, bass and drum hints. Named instruments and the vocal description are marked as anchors that every variation must keep.",
  ],
  [
    "2. Plan",
    "Maps each genre to its sound families, then builds a sonic plan per variation: the genre's home feel, a bass sound from the families' own basses, drums, harmony, melody, textures, a song form, mix and mastering, and the vocal. Each variation uses a different seed and preset, and its recipe is fingerprinted so variations and later runs of the same brief do not repeat.",
  ],
  [
    "3. Render",
    `Writes the plan as flowing prose in a fixed sentence order and fits it to ${MIN_CHARS}–${MAX_CHARS} characters. When it runs long, filler sentences go first and the vocal sentence, the tempo and the last mention of each anchor are kept. When it runs short, it adds the genre's own descriptive sentences.`,
  ],
  [
    "4. Validate",
    "Checks every prompt against the quality gates below and repairs or recompiles it, up to 14 attempts per variation, until it passes.",
  ],
];

const GATES: [string, string][] = [
  ["Character range", `${MIN_CHARS}–${MAX_CHARS} characters, inside the 1,000-character Styles field.`],
  ["One whole-number BPM", "Exactly the tempo from your brief, or the genre's home tempo."],
  ["No artist names", "No named artists and no “in the style of” phrasing."],
  ["Positive prompting", "No “avoid”, “don't” or “no vocals”-style negatives in the Styles text."],
  ["Styles only", "No lyric lines or section tags such as [Verse], which belong in the Lyrics field."],
  [
    "Distinct variations",
    "Preferred rather than required: the compiler keeps trying for a variation whose plan and wording differ from the others.",
  ],
];

const FAMILY_LABELS: Record<string, string> = {
  afro: "Afro (Afrobeats, amapiano, gqom)",
  ambient: "Ambient and downtempo",
  baile: "Brazilian funk",
  bass: "Bass music and dubstep",
  breaks: "Breaks, jungle and drum and bass",
  cinematic: "Cinematic, orchestral and trailer",
  dancehall: "Dancehall",
  drill: "Drill",
  future: "Future bass",
  garage: "UK garage",
  gospel: "Gospel and worship",
  house: "House, techno and EDM",
  latin: "Latin (reggaeton, dembow, moombahton)",
  phonk: "Phonk",
  pop: "Pop",
  rap: "Hip-hop and rap",
  riddim: "Riddim",
  ritual: "Ritual bass",
  soul: "R&B and soul",
  trap: "Trap",
};

function familyCoverage(): [string, string, string][] {
  const byFamily = new Map<string, string[]>();
  for (const genre of allStyles()) {
    for (const family of familyKeys([genre.name])) {
      byFamily.set(family, [...(byFamily.get(family) ?? []), genre.name]);
    }
  }
  return [...byFamily.entries()]
    .sort((a, b) => b[1].length - a[1].length)
    .map(([family, names]) => [
      FAMILY_LABELS[family] ?? family,
      String(names.length),
      names.slice(0, 8).join(", ") + (names.length > 8 ? ", …" : ""),
    ]);
}

export default function EngineGuide() {
  const coverage = familyCoverage();
  return (
    <>
      <Section
        id="how-it-works"
        title="How the compiler works"
        intro="Every prompt is compiled by rules and phrase libraries that run in your browser. No AI service is called."
      >
        <Table head={["Stage", "What happens"]} rows={PIPELINE} caption="Compiler pipeline" />
        <Prose>
          <p>
            Each prompt follows the same sentence order: tempo, genres, mood and production style; feel, drums and
            groove; bass and how it moves; harmony, hooks and textures; the vocal; mix and form; and last, the
            instrument list, which is never cut. Open Sonic Plan under any result to see the decisions behind it.
          </p>
        </Prose>
      </Section>

      <Section
        id="coverage"
        title="Genre coverage"
        intro={`${allStyles().length} genres, each mapped to one or more sound families with their own groove, drums, bass, harmony, melody, textures, song forms, mix and mastering vocabulary. Hybrids belong to several families: Cinematic Trap draws on both trap and cinematic.`}
      >
        <Table head={["Sound family", "Genres", "Includes"]} rows={coverage} caption="Genres by sound family" />
        <div className="grid gap-3 md:grid-cols-2">
          <Card title="Songs, scores and world grooves have no drops">
            <p>
              R&amp;B, gospel, pop, hip-hop, Afro, Latin, dancehall, ambient and cinematic prompts never mention drops.
              Each gets its own feel (four-on-the-floor for house, a free-floating pulse for ambient), its own bass
              (upright, log drum, dembow, drones) and its own drum kit.
            </p>
          </Card>
          <Card title="Bass music keeps its full toolkit">
            <p>
              Dubstep, riddim, UK garage, drum and bass and future bass draw on wub, growl, Reese, neuro and rolling
              basses. Trap, drill and phonk stay on 808s.
            </p>
          </Card>
        </div>
      </Section>

      <Section
        id="quality"
        title="Quality gates"
        intro="The compiler retries each variation until it passes the first five gates. A prompt that still misses one shows the issue in red on its card."
      >
        <Table head={["Gate", "Rule"]} rows={GATES} caption="Quality gates" />
        <Prose>
          <p>
            An automated test suite compiles every genre in the library across several seeds and checks that each prompt
            stays in the character window, uses positive wording, keeps drop language out of genres without drops, and
            keeps bass-music sounds out of genres that do not use them. It also checks that every phrase in the library
            is free of artist names and negative wording.
          </p>
        </Prose>
      </Section>

      <Section id="profile" title="Hybrid Bass Profile">
        <Prose>
          <p>
            The profile is a built-in taste for hybrid bass music: {GENRES.length} core library genres and{" "}
            {PROFILE.hybridFormulas.length} hybrid formulas such as Future Bass + UK Garage + Trap or Trap + Deep
            Dubstep + Baile Funk. It only fills gaps. Genres, BPM, moods and instruments you name always win.
          </p>
          <ul className="list-disc pl-5 flex flex-col gap-1.5">
            <li>
              No genre in the brief: it usually picks one of the hybrid formulas instead of a random library pairing.
            </li>
            <li>
              No mood, and a bass-music plan: it leans dark, cinematic, emotional, nocturnal, aggressive or kinetic.
              Other genres use their own default moods (uplifting for gospel, intimate for R&amp;B, euphoric for house).
            </li>
            <li>No BPM and no genre home tempo: it starts at 140 BPM instead of 128.</li>
          </ul>
          <p>Turn it off for neutral picks from the full library, for example for pop, folk or worship briefs.</p>
        </Prose>
      </Section>
    </>
  );
}
