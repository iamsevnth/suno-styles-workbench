import { Card, Code, Prose, Section, Table } from "../../components/content/Content.tsx";
import { LIBRARY_STATS } from "../../lib/suno/families.ts";
import { MAX_CHARS, MIN_CHARS, VOCAL_BUDGET } from "../../lib/suno/render.ts";
import { hrefFor } from "../../routes.ts";

const BRIEF_SIGNALS: [string, string, string][] = [
  [
    "Genres",
    `Sets the musical vocabulary the compiler is allowed to draw from. The first recognized genre leads the plan; later genres act as secondary or accent influences. The compiler maps each genre into sound families so its groove, drums, bass, harmony, texture and form stay stylistically coherent instead of borrowing random production language. Any of ${LIBRARY_STATS.genres} recognized styles can be named directly or through common short forms.`,
    "Trap + Baile Funk, dark R&B, Drum and Bass",
  ],
  [
    "Tempo",
    "Locks the plan to one whole-number BPM between 60 and 200. If a prompt contains more than one BPM, the last recognized value wins so the final Styles text never carries conflicting tempo instructions. If you omit tempo, the compiler uses the lead genre's home tempo or another genre-aware fallback.",
    "140 BPM, 92 bpm",
  ],
  [
    "Vocals",
    `Controls whether a singer or rapper is planned and how much of the Styles budget is reserved for the voice. Gender, register, timbre, delivery, rap/sung style and processing cues can all be recognized. A short request stays compact; a detailed voice description can use up to ${VOCAL_BUDGET.detailed} characters so the production still has room to be described.`,
    "female alto, melodic rap, close-mic",
  ],
  [
    "Instruments",
    "Turns named instruments into protected anchors. Those instruments must survive every variation even when their tone, articulation or processing changes. This is the best way to keep a signature sound—Rhodes, flute, strings, guitar, pads or a particular bass voice—present across multiple generated Styles prompts.",
    "flute, Rhodes, strings, guitar",
  ],
  [
    "Bass and Drums",
    "Adds explicit low-end or drum behavior on top of the genre's normal toolkit. Bass-music families can use wobble, growl, Reese, neuro and sub language; trap, drill and phonk stay centered on 808 behavior. Song, world, cinematic and other non-drop families are prevented from inheriting dubstep-style drop vocabulary simply because the phrase library contains it.",
    "808, Reese, wobble, skippy hats",
  ],
  [
    "Groove",
    "Overrides or sharpens the genre's default metric feel. Use this when the pocket matters as much as the genre: half-time changes perceived weight, 2-step changes kick placement, swing changes subdivision feel and four-on-the-floor establishes a steady club pulse.",
    "half-time, 2-step, swung, four-on-the-floor",
  ],
  [
    "Mood and Setting",
    "Steers harmony, texture, density, space and arrangement without replacing the core genre. Mood works best as a production modifier—dark, intimate, euphoric, cinematic, nocturnal—rather than as a substitute for genre, tempo or groove.",
    "dark, euphoric, cinematic, late-night",
  ],
  [
    "Key",
    "Adds a tonal center that the harmonic plan can honor. Key information is useful when the prompt must coordinate with existing vocals, samples or instruments, although Suno may still interpret harmonic detail creatively.",
    "F minor, A major",
  ],
  [
    "Exploration",
    "Signals that the compiler may widen its genre choices when the brief leaves the core style open. This is different from Suno's Variety control: exploration changes the Workbench plan before you paste it into Suno; Variety can change Suno's interpretation of the Styles prompt at generation time.",
    "surprise me, explore, something new",
  ],
];

const HABITS: [string, string, string, string][] = [
  [
    "Lead With the Musical Identity",
    "Put the main genre, tempo or groove near the front so the hierarchy is obvious. Decorative mood words should support those anchors, not replace them.",
    "a chill song for late at night",
    "Bedroom R&B, intimate, 88 BPM",
  ],
  [
    "Write Positive Targets",
    "Describe the sound you want instead of naming the sound you do not want. Negative phrases still put the unwanted concept into the Styles text. Use Suno's Exclude Styles field for exclusions and keep Workbench input focused on the desired production.",
    "trap but no autotune and no 808 slides",
    "trap, dry natural vocal, punchy short 808 hits",
  ],
  [
    "Describe the Voice",
    "A generic word such as vocals leaves register, tone and delivery open. Add the traits that actually matter: singer/rapper role, range, timbre, cadence and processing. The compiler then protects that information inside one controlled vocal sentence.",
    "female vocals",
    "breathy female alto, close-mic, light autotune gloss",
  ],
  [
    "Use Fewer, Stronger Genres",
    `Every genre competes for the same ${MAX_CHARS}-character budget. One or two strong genres leave space for drums, bass, harmony, instruments, vocal behavior and mix. Five loosely related genres often force the plan to spend its budget reconciling identities instead of describing a clear record.`,
    "trap dubstep house afrobeats pop",
    "Afrobeats + Pop, sunny, 108 BPM",
  ],
  [
    "Translate References Into Production Language",
    "Instead of asking for a named artist, describe the high-level attributes you actually need: era, groove, vocal weight, instrumentation, arrangement, texture and mix. This produces a more reusable prompt and avoids making imitation the organizing principle.",
    "sounds like a famous rapper",
    "dark melodic trap, hazy autotuned vocal, sparse 808s",
  ],
];

const VOCAL_RULES: [string, string, string][] = [
  [
    "No Vocal Detail",
    `The compiler chooses a voice that fits the genre and keeps it within the compact ${VOCAL_BUDGET.compact}-character budget.`,
    "dark trap",
  ],
  [
    "Basic Voice",
    `Gender plus sung/rap identity is preserved, while optional delivery and effect details are added only if they fit inside the compact ${VOCAL_BUDGET.compact}-character budget.`,
    "male rap, female vocals",
  ],
  [
    "Detailed Voice",
    `Four or more vocal traits unlock the detailed budget of up to ${VOCAL_BUDGET.detailed} characters so register, timbre, delivery and processing can stay together instead of being truncated.`,
    "breathy female alto, close-mic, slapback",
  ],
  [
    "Full Description",
    "When the brief already contains a natural voice description, that wording is treated as an anchor rather than replaced by generic vocal planning. The compiler then adds only the minimum extra mix context that fits.",
    "smooth male vocal, laid-back cadence, autotune gloss",
  ],
  [
    "Instrumental",
    "No singer is planned and the vocal sentence is removed. The recovered character budget is spent on production, arrangement, texture and mix instead.",
    "instrumental",
  ],
];

export default function BriefGuide() {
  return (
    <>
      <Section id="quick-start" title="Quick Start">
        <Prose>
          <ol className="list-decimal pl-5 flex flex-col gap-3">
            <li>
              Open the <a className="underline underline-offset-2 text-[var(--fg)]" href={hrefFor("styles")}>Styles Compiler</a>.
              Use <strong>Create From Brief</strong> for a new idea, or <strong>Fix Existing Prompt</strong> when you
              already have a Suno Styles prompt that is vague, contradictory or difficult to control.
            </li>
            <li>
              In Create mode, type a compact brief such as <Code>140 BPM trap + future bass, female vocal, high energy</Code>.
              <strong> Example Briefs</strong> are ready-made inputs you can click to learn the syntax. Refresh changes
              the set. The first card, <strong>Always Available</strong>, is the persistent exploration brief that asks
              the compiler to range across the full library.
            </li>
            <li>
              Set <strong>Variations</strong> from 1 to 6. Each variation keeps your anchors but builds a different sonic
              plan and wording recipe. More variations are useful when the musical identity is settled but you want
              alternate grooves, bass choices, textures or arrangements.
            </li>
            <li>
              Leave <strong>Hybrid Bass Profile</strong> on when you want the compiler's built-in hybrid-bass taste to
              fill gaps in an open brief. Turn it off for neutral library choices or when you want the named genre to
              dominate without profile-driven bass hybrids.
            </li>
            <li>
              In <strong>Fix Existing Prompt</strong>, paste the Styles prompt that already ran. Workbench reparses the
              musical intent and rebuilds it with a clearer hierarchy, positive wording, genre-aware vocabulary and one
              consistent tempo while preserving detected genres, BPM, instruments and vocal traits.
            </li>
            <li>
              Copy the best result into Suno's Styles field in Songs → Advanced. If you need the Styles tags preserved
              as written, set Suno's Variety control to 0 / Off before generating.
            </li>
          </ol>
        </Prose>
      </Section>

      <Section
        id="briefs"
        title="Writing a Brief"
        intro="A strong brief names the few musical facts that must survive, then lets the compiler fill the production gaps from the right genre family."
      >
        <Table head={["Signal", "What It Does", "Examples"]} rows={BRIEF_SIGNALS} caption="Brief signals" />
        <Prose>
          <p>
            Short input is valid. <Code>dark R&amp;B, 90 BPM</Code> gives the engine enough information to select an
            R&amp;B-appropriate groove, bass, harmony and vocal plan. Add details only when they matter to the identity
            of the record.
          </p>
          <p>
            The genre-family guardrails are deliberate. R&amp;B, gospel, pop, hip-hop, Afro, Latin, dancehall, ambient
            and cinematic plans do not suddenly inherit EDM drop language. Bass-music families keep their full low-end
            vocabulary, while trap/drill/phonk remain 808-centered. The goal is not to make every genre use the same
            dramatic structure; it is to make each family sound like itself.
          </p>
        </Prose>
      </Section>

      <Section
        id="vocals"
        title="Vocal Logic"
        intro="The vocal is one controlled part of the Styles prompt, not the whole prompt. Workbench budgets the vocal sentence according to how much vocal information you actually supply."
      >
        <Table head={["Input Level", "What the Compiler Does", "Example"]} rows={VOCAL_RULES} caption="Vocal logic" />
        <Prose>
          <p>
            Voice identity is assembled from the outside in: presentation first, then register/timbre, delivery, style
            and processing. User-provided traits outrank planned traits. The renderer avoids repeating the same vocal
            descriptor in multiple clauses and limits connective wording so the sentence stays readable instead of
            becoming a stack of instructions.
          </p>
          <p>
            If the brief contains a detailed natural-language voice description, Workbench protects that description
            rather than translating it into a different persona. If the brief says <Code>instrumental</Code>, the voice
            is removed entirely rather than described as “no vocals,” keeping the Styles text positively framed.
          </p>
        </Prose>
      </Section>

      <Section id="better-briefs" title="Five Habits of Strong Briefs">
        <Table head={["Habit", "Why It Matters", "Weak Brief", "Stronger Brief"]} rows={HABITS} caption="Five habits of strong briefs" />
        <div className="grid gap-3 lg:grid-cols-2">
          <Card title="Positive Wording Is a Routing Tool">
            <p>
              Positive wording does more than sound cleaner. It gives the planner a target it can map into a sound
              family. “Dry natural vocal” maps to a production choice; “no autotune” leaves the unwanted concept inside
              the instruction. Put exclusions in Suno's Exclude Styles control.
            </p>
          </Card>
          <Card title="Genre Count Controls Detail Density">
            <p>
              Each added genre consumes planning and rendering space. If three or more genres are essential, order them
              by importance and make the role of each one clear—lead genre, rhythmic donor, texture accent—rather than
              expecting all of them to carry equal weight.
            </p>
          </Card>
        </div>
      </Section>
    </>
  );
}
