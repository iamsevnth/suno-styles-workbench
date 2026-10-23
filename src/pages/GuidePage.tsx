import { Card, Code, ContentPage, Prose, Section } from "../components/content/Content.tsx";
import { MAX_CHARS, MIN_CHARS } from "../lib/suno/render.ts";
import { SKILLS } from "../lib/suno/skills/catalog.ts";
import { V6_MODELS, VARIETY_STOPS } from "../lib/suno/v6.ts";
import { hrefFor } from "../routes.ts";

const SOURCES_CHECKED = "10/23/2026";

const TOC = [
  ["quick-start", "Quick start"],
  ["briefs", "Writing a brief"],
  ["output", "Reading a prompt"],
  ["profile", "Hybrid Bass Profile"],
  ["suno-settings", "Suno v6 settings"],
  ["lyrics", "Lyrics Studio"],
  ["skills", "Skills Studio"],
  ["privacy", "Privacy and offline use"],
  ["faq", "FAQ"],
] as const;

const BRIEF_SIGNALS: [string, string, string][] = [
  ["Genres", "Any of 258 genre names or common short forms, combined with +, /, commas, “and” or “x”", "Trap + Baile Funk, dark r&b, dnb"],
  ["Tempo", "A whole number followed by BPM, kept between 60 and 200; if you give two, the last one wins", "140 BPM, 92bpm"],
  ["Vocals", "Gender, register, tone, delivery, effects, or a rap style; “instrumental” removes vocals", "female vocals, male tenor, melodic sung-rap, autotune gloss"],
  ["Instruments", "Named instruments stay in every variation; only their tone changes", "flute, Rhodes electric piano, strings, guitar"],
  ["Bass and drums", "Locks the bass family or adds drum details", "808, Reese, wobble, growl, skippy hats"],
  ["Groove", "Sets the metric feel", "half-time, 2-step, swung, four-on-the-floor"],
  ["Mood and setting", "Shapes harmony, textures and atmosphere", "dark, euphoric, cinematic, late-night, club"],
  ["Key", "Adds a tonal center", "F minor, A major"],
  ["Exploration", "Widens the genre search when you want surprises", "surprise me, explore, something new"],
];

const PROMPT_ORDER = [
  "Tempo, genres, mood and production style",
  "Metric feel, drum kit and groove",
  "Bass sounds and how they move",
  "Harmony, melodic hooks and texture",
  "The vocal: who sings, how, and how it is treated (or an instrumental note)",
  "Mix priorities and song form",
  "The instrument list, always last so it is never cut",
];

const SUNO_SOURCES = [
  { label: "Suno blog: Introducing v6 (09/09/2026)", href: "https://suno.com/blog/introducing-v6" },
  { label: "Suno Help Center: v6 FAQ", href: "https://help.suno.com/en/articles/13924481" },
];

function Table({ head, rows }: { head: string[]; rows: string[][] }) {
  return (
    <div className="overflow-x-auto rounded-[var(--r-xl)] border border-[var(--border)]">
      <table className="w-full text-sm text-left">
        <thead className="bg-[var(--bg-elevated)] text-[var(--fg)]">
          <tr>
            {head.map((h) => (
              <th key={h} scope="col" className="px-4 py-3 font-semibold whitespace-nowrap">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row[0]} className="border-t border-[var(--border)] align-top">
              {row.map((cell, i) => (
                <td key={i} className={`px-4 py-3 ${i === 0 ? "font-medium text-[var(--fg)] whitespace-nowrap" : "text-[var(--fg-muted)]"}`}>
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function GuidePage() {
  return (
    <ContentPage>
      <header className="flex flex-col gap-4">
        <p className="text-[11px] font-mono uppercase tracking-[0.18em] text-[var(--fg-subtle)]">Guide</p>
        <h1 className="text-4xl font-bold tracking-tight text-[var(--fg)]">How to get the most out of Suno Workbench</h1>
        <p className="text-base text-[var(--fg-muted)] max-w-2xl leading-relaxed">
          What the compiler reads in a brief, how each prompt is built, and the Suno settings that keep your Styles text
          intact.
        </p>
        <nav aria-label="On this page" className="flex flex-wrap gap-2 pt-1">
          {TOC.map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => document.getElementById(id)?.scrollIntoView({ behavior: "smooth" })}
              className="rounded-full border border-[var(--border)] bg-[var(--bg-elevated)] px-3 py-1 text-xs text-[var(--fg-muted)] hover:text-[var(--fg)] hover:border-[var(--border-strong)]"
            >
              {label}
            </button>
          ))}
        </nav>
      </header>

      <Section id="quick-start" title="Quick start">
        <Prose>
          <ol className="list-decimal pl-5 flex flex-col gap-2">
            <li>
              Open the <a className="underline underline-offset-2 text-[var(--fg)]" href={hrefFor("styles")}>Styles Compiler</a>, type a brief such as{" "}
              <Code>140 BPM trap future bass, female vocals, high energy</Code>, and press Generate Styles.
            </li>
            <li>Pick the variation that sounds closest to the record in your head and press Copy Style.</li>
            <li>
              In Suno, open Custom mode, paste into the Styles field, set Variety to Off, and generate. Add lyrics from Lyrics
              Studio if the song has vocals.
            </li>
          </ol>
        </Prose>
      </Section>

      <Section
        id="briefs"
        title="Writing a brief"
        intro="The compiler reads your brief for the signals below. Everything you name is kept; everything you leave out is planned for you."
      >
        <Table head={["Signal", "What it does", "Examples"]} rows={BRIEF_SIGNALS} />
        <Prose>
          <p>
            Short briefs work. <Code>dark r&amp;b, 90 bpm</Code> is enough. Longer briefs give you more control: a full vocal
            description such as <Code>smooth male vocal tone, laid back cadence, prominent autotune gloss</Code> is quoted in
            the prompt as written.
          </p>
          <p>
            You can also paste an existing Styles prompt as the brief. The compiler picks out its genres, tempo, vocals and
            instruments and builds new {MIN_CHARS}–{MAX_CHARS} character prompts around them.
          </p>
        </Prose>
      </Section>

      <Section id="output" title="Reading a prompt" intro="Every prompt is flowing prose in the same order, so you can compare variations at a glance.">
        <ol className="grid gap-2 sm:grid-cols-2 list-none p-0 m-0">
          {PROMPT_ORDER.map((item, i) => (
            <li key={item} className="flex gap-3 rounded-[var(--r-md)] border border-[var(--border)] bg-[var(--bg-elevated)] p-3 text-sm text-[var(--fg-muted)]">
              <span className="font-mono text-xs text-[var(--fg-subtle)] pt-0.5">{i + 1}</span>
              <span>{item}</span>
            </li>
          ))}
        </ol>
        <Prose>
          <p>
            Open Sonic Plan under a result to see the decisions behind it: tempo, mood, metric feel, the genres lending rhythm
            and bass, the bass stack, and the vocal. Download All Prompts saves the current set as a text file with an ID for
            each prompt.
          </p>
        </Prose>
      </Section>

      <Section id="profile" title="Hybrid Bass Profile">
        <Prose>
          <p>
            The profile is a built-in taste for hybrid bass music: 96 core library genres and 40 hybrid formulas such as Future
            Bass + UK Garage + Trap or Trap + Deep Dubstep + Baile Funk. It only fills gaps. Genres, BPM, moods and instruments you
            name always win.
          </p>
          <ul className="list-disc pl-5 flex flex-col gap-1.5">
            <li>No genre in the brief: it usually picks one of the hybrid formulas instead of a random library pairing.</li>
            <li>No mood: it leans dark, cinematic, emotional, nocturnal, aggressive or kinetic.</li>
            <li>No BPM and no genre home tempo: it starts at 140 BPM instead of 128.</li>
          </ul>
          <p>Turn it off for neutral picks from the full library, for example when you write pop, folk or worship briefs.</p>
        </Prose>
      </Section>

      <Section
        id="suno-settings"
        title="Suno v6 settings"
        intro={`Suno released v6, v6-wild and v6-mini on 09/09/2026 and retired every earlier model. Plan access, Variety, Max Mode and credit details come from Suno's blog and v6 FAQ, checked ${SOURCES_CHECKED}. Recommendations are labeled.`}
      >
        <div className="grid gap-4 md:grid-cols-3">
          {V6_MODELS.map((m) => (
            <Card key={m.id} title={m.label}>
              <p>{m.use}</p>
            </Card>
          ))}
        </div>
        <Table
          head={["Setting", "Use", "Why"]}
          rows={[
            ["Variety", "Off", "Suno: Variety “is designed to introduce variety in your outputs by adjusting and updating your style prompts.” Set it to Off to keep compiled Styles word for word."],
            ["Max Mode", "On for keepers", "Suno: Max Mode lets v6 “spend more on getting it right” and costs more credits. Suno suggests it for songs longer than two minutes."],
            ["Personalize", "Off (recommended)", "Keeps your Taste profile from steering the result away from the compiled Styles."],
            ["Weirdness", "20–30% (recommended)", "Low values keep the arrangement close to the prompt."],
            ["Style Influence", "75–85% (recommended)", "High values make the Styles text weigh more than Suno's defaults."],
          ]}
        />
        <Prose>
          <p>
            Variety has five stops: {VARIETY_STOPS.map((v) => v.label).join(", ")}. Each generation makes two songs for a total
            of 10 credits at standard settings, per Suno's v6 FAQ.
          </p>
          <p className="text-xs text-[var(--fg-subtle)]">
            Sources:{" "}
            {SUNO_SOURCES.map((s, i) => (
              <span key={s.href}>
                {i > 0 && " · "}
                <a className="underline underline-offset-2 hover:text-[var(--fg)]" href={s.href} target="_blank" rel="noopener noreferrer">
                  {s.label}
                </a>
              </span>
            ))}
          </p>
        </Prose>
      </Section>

      <Section id="lyrics" title="Lyrics Studio">
        <Prose>
          <p>
            Start with the structure: add, remove and reorder sections such as intro, verse, buildup, drop, chorus, breakdown,
            bridge and outro, and set how many lines each one gets. Then give it a theme, a genre and a delivery to generate a
            draft, or paste your own lyrics and let it finish them.
          </p>
          <p>
            The phonetics converter respells words the way American English speakers say them, for example{" "}
            <Code>probably</Code> → <Code>problee</Code> and <Code>tension</Code> → <Code>tenshun</Code>. Section tags like{" "}
            <Code>[Chorus]</Code> stay untouched, and the output never uses hyphens.
          </p>
        </Prose>
      </Section>

      <Section id="skills" title="Skills Studio" intro="Each playbook asks a few questions and returns a checklist you can copy.">
        <div className="grid gap-3 sm:grid-cols-2">
          {SKILLS.map((s) => (
            <Card key={s.id} title={s.title}>
              <p>{s.blurb}</p>
            </Card>
          ))}
        </div>
      </Section>

      <Section id="privacy" title="Privacy and offline use">
        <Prose>
          <p>
            Suno Workbench has no server, no account, no analytics and no API key. Your current brief and results are kept in
            this tab's session storage, and your Styles history is kept in this browser's local storage until you press Clear
            History. Export History is the only way to move it, and it saves a file to your own computer.
          </p>
          <p>
            The offline file is the same site in one HTML file. Open it from your desktop and every tool works with no internet
            connection.
          </p>
        </Prose>
      </Section>

      <Section id="faq" title="FAQ">
        <div className="grid gap-3 md:grid-cols-2">
          <Card title={`Why ${MIN_CHARS}–${MAX_CHARS} characters?`}>
            <p>
              Suno's Styles field holds 1,000 characters. The window leaves a margin under the limit while giving Suno enough
              detail about the drums, bass, vocal and mix to follow.
            </p>
          </Card>
          <Card title="Why are there no artist names?">
            <p>
              Naming an artist invites imitation and rights problems. The compiler describes the production you want instead,
              and the Rights and Safety playbook helps when a request names someone.
            </p>
          </Card>
          <Card title="Why did Suno change my style?">
            <p>Variety is probably above Off. At Normal or higher, Suno rewrites the Styles field before it generates.</p>
          </Card>
          <Card title="Can I get the same prompts again?">
            <p>
              Each run uses a new random seed, and the compiler avoids repeating recipes from your history for the same brief.
              Your history keeps every past result to copy again.
            </p>
          </Card>
        </div>
      </Section>
    </ContentPage>
  );
}
