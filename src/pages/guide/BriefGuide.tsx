import { Card, Code, Prose, Section, Table } from "../../components/content/Content.tsx";
import { LIBRARY_STATS } from "../../lib/suno/families.ts";
import { generateStylesPrompts } from "../../lib/suno/generate.ts";
import { MAX_CHARS, MIN_CHARS } from "../../lib/suno/render.ts";
import { hrefFor } from "../../routes.ts";

const BRIEF_SIGNALS: [string, string, string][] = [
  [
    "Genres",
    `Any of ${LIBRARY_STATS.genres} genre names or their short forms (r&b, dnb, edm). Join several with +, /, commas, “and” or “x”. The first one leads. “UKG” means UKG dubstep; write “UK garage” or “2-step” for UK garage.`,
    "Trap + Baile Funk, dark r&b, Drum and Bass",
  ],
  [
    "Tempo",
    "A whole number followed by BPM, kept between 60 and 200. If you give two, the last one wins. Leave it out and the genre's home tempo is used.",
    "140 BPM, 92bpm",
  ],
  [
    "Vocals",
    "Gender, register, tone, delivery, effects or a rap style. A full description is quoted as written. “instrumental” removes the vocal entirely.",
    "female vocals, male tenor, melodic sung-rap, autotune gloss",
  ],
  [
    "Instruments",
    "Named instruments appear in every variation; only their tone and treatment change.",
    "flute, Rhodes electric piano, strings, guitar",
  ],
  [
    "Bass and drums",
    "Locks the bass sound or adds drum details on top of the genre's own.",
    "808, Reese, wobble, growl, skippy hats",
  ],
  ["Groove", "Overrides the genre's home feel.", "half-time, 2-step, swung, four-on-the-floor"],
  [
    "Mood and setting",
    "Shapes harmony, textures and atmosphere. Punctuation after a mood word is fine.",
    "dark, euphoric, uplifting, cinematic, late-night",
  ],
  ["Key", "Adds a tonal center to the harmony.", "F minor, A major"],
  ["Exploration", "Widens the genre search when you want surprises.", "surprise me, explore, something new"],
];

const BEFORE_AFTER: [string, string, string][] = [
  ["Name the genre first", "a chill song for late at night", "Bedroom R&B, intimate, 88 BPM"],
  [
    "Say what you want, not what you don't",
    "trap but no autotune and no 808 slides",
    "trap, dry natural vocal, punchy short 808 hits",
  ],
  ["Describe the voice", "female vocals", "breathy female alto, close-mic, light autotune gloss"],
  ["Pick two genres, not five", "trap dubstep house afrobeats pop", "Afrobeats + Pop, sunny, 108 BPM"],
  [
    "Describe the sound instead of an artist",
    "sounds like a famous rapper",
    "dark melodic trap, hazy autotuned vocal, sparse 808s",
  ],
];

const EXAMPLE_BRIEF = "melodic R&B with flute and Rhodes electric piano";
const EXAMPLE_SEED = 42;

function WorkedExample() {
  const { prompts, parsed } = generateStylesPrompts(EXAMPLE_BRIEF, { count: 1, seed: EXAMPLE_SEED });
  const prompt = prompts[0];
  const plan = prompt.plan;
  const rows: [string, string][] = [
    ["Genres", [plan.primaryGenre, plan.secondaryGenre, plan.accentGenre].filter(Boolean).join(" + ")],
    ["Tempo", `${plan.bpm} BPM (${parsed.bpm == null ? "the genre's home tempo" : "from your brief"})`],
    ["Feel", plan.metricFeel],
    ["Bass", plan.bass.join(", ")],
    [
      "Vocal",
      plan.vocals.present ? `${plan.vocals.presentation ?? "lead"}, ${plan.vocals.style ?? "sung"}` : "instrumental",
    ],
    ["Instruments", plan.instruments.join(", ")],
  ];
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <div className="rounded-[var(--r-xl)] border border-[var(--border)] bg-[var(--bg-elevated)] p-5 flex flex-col gap-3">
        <p className="text-[10px] font-mono uppercase tracking-wider text-[var(--fg-subtle)]">Brief</p>
        <p className="font-mono text-sm text-[var(--fg)]">{EXAMPLE_BRIEF}</p>
        <p className="text-[10px] font-mono uppercase tracking-wider text-[var(--fg-subtle)] pt-2">
          Compiled Styles prompt · {prompt.characters} characters
        </p>
        <p className="text-sm text-[var(--fg-muted)] leading-relaxed">{prompt.styles}</p>
      </div>
      <div className="flex flex-col gap-3">
        <Table
          head={["Decision", "What the compiler chose"]}
          rows={rows}
          caption="Sonic plan behind the example prompt"
        />
        <p className="text-xs text-[var(--fg-subtle)] leading-relaxed">
          This example is compiled live by the page you are reading, with a fixed seed, so it always matches the current
          engine. The brief names no sub-genre, tempo, bass or drum kit; the compiler chose them from the R&B family's
          vocabulary and kept the flute and Rhodes in the instrument list.
        </p>
      </div>
    </div>
  );
}

export default function BriefGuide() {
  return (
    <>
      <Section id="quick-start" title="Quick start">
        <Prose>
          <ol className="list-decimal pl-5 flex flex-col gap-2">
            <li>
              Open the{" "}
              <a className="underline underline-offset-2 text-[var(--fg)]" href={hrefFor("styles")}>
                Styles Compiler
              </a>
              , type a brief such as <Code>140 BPM trap future bass, female vocals, high energy</Code>, and press
              Generate Styles.
            </li>
            <li>Pick the variation closest to the record in your head and press Copy Style.</li>
            <li>
              In Suno, open Advanced mode (the full-control screen with separate Lyrics and Styles fields), paste into
              Styles, set Variety to Off, and generate. Add lyrics from Lyrics Studio if the song has vocals.
            </li>
            <li>
              Generate a few takes. If one is close, keep the prompt and change one thing at a time: the brief, a
              slider, or the lyrics.
            </li>
          </ol>
        </Prose>
      </Section>

      <Section
        id="briefs"
        title="Writing a brief"
        intro="The compiler reads your brief for the signals below. Everything you name is kept; everything you leave out is planned from the genre."
      >
        <Table head={["Signal", "What it does", "Examples"]} rows={BRIEF_SIGNALS} caption="Brief signals" />
        <Prose>
          <p>
            Short briefs work: <Code>dark r&amp;b, 90 bpm</Code> is enough. Longer briefs give you more control. A full
            vocal description such as <Code>smooth male vocal tone, laid back cadence, prominent autotune gloss</Code>{" "}
            is quoted in the prompt word for word, and mood words that trail it (“high energy”) are kept out of the
            vocal line.
          </p>
          <p>
            You can also paste an existing Styles prompt as the brief. The compiler picks out its genres, tempo, vocals
            and instruments and builds new {MIN_CHARS}–{MAX_CHARS} character prompts around them.
          </p>
        </Prose>
      </Section>

      <Section
        id="better-briefs"
        title="Five habits of strong briefs"
        intro="Each row shows a weak brief and a stronger one for the same idea."
      >
        <Table head={["Habit", "Weak brief", "Stronger brief"]} rows={BEFORE_AFTER} caption="Brief habits" />
        <div className="grid gap-3 md:grid-cols-2">
          <Card title="Why positive wording matters">
            <p>
              Style models respond to the words that are present. “No 808 slides” still puts “808 slides” in front of
              the model. Describe the sound you want in Styles, and use Suno's separate Exclude field for anything you
              want kept out.
            </p>
          </Card>
          <Card title="UKG is not UK garage">
            <p>
              <Code>UKG</Code> and <Code>UKG dubstep</Code> compile as UKG dubstep: 140 BPM half-time trap drums under
              heavy sub and 808 pressure, with a skippy, syncopated hi-hat and shaker layer on top.{" "}
              <Code>UK garage</Code>, <Code>garage</Code> and <Code>2-step</Code> compile as UK garage: swung 2-step
              drums, warm chords and soulful vocals around 134 BPM. Neither borrows the other's vocabulary.
            </p>
          </Card>
          <Card title="Why fewer genres work better">
            <p>
              Every genre you add competes for the same {MAX_CHARS} characters. Two genres leave room for drums, bass,
              vocal and mix detail; five leave room for little more than the genre list.
            </p>
          </Card>
        </div>
      </Section>

      <Section id="example" title="Worked example" intro="One brief, one compiled prompt, and the decisions behind it.">
        <WorkedExample />
      </Section>
    </>
  );
}
