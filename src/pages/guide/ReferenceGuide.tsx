import { Card, Code, ExternalLink, Prose, Provenance, Section, Table } from "../../components/content/Content.tsx";
import { MAX_CHARS, MIN_CHARS } from "../../lib/suno/render.ts";
import { SKILLS } from "../../lib/suno/skills/catalog.ts";
import { SOURCES, SOURCES_CHECKED } from "./sources.ts";

const GLOSSARY: [string, string][] = [
  ["BPM", "Beats per minute: the tempo. The compiler always writes one whole number."],
  [
    "Half-time",
    "Drums that feel half as fast as the tempo, with the snare on beat three. Common in trap and dubstep at 140 BPM.",
  ],
  ["Four-on-the-floor", "A kick drum on every beat, the backbone of house and techno."],
  ["2-step", "UK garage's swung, skipping kick pattern that leaves out some downbeats."],
  ["Broken beat", "Syncopated drums that avoid a steady kick pattern, as in breakbeat and drum and bass."],
  ["808", "A tuned, sliding sub-bass drum sound from trap, drill and hip-hop."],
  ["Wub / wobble", "A bass whose tone is swept rhythmically by a filter, central to dubstep."],
  ["Reese", "A thick, detuned, slowly phasing bass used in drum and bass and UK bass."],
  ["Log drum", "Amapiano's pitched, percussive bass sound."],
  ["Dembow", "The kick-and-snare rhythm under reggaeton and dembow music."],
  ["One-drop", "A reggae and dancehall rhythm with the main accent on beat three."],
  ["Sidechain", "Ducking one sound (often bass or pads) each time the kick hits, which creates a pumping feel."],
  ["Topline", "The lead vocal melody and lyrics that sit on top of the track."],
];

const FAQ: [string, string][] = [
  [
    `Why ${MIN_CHARS}–${MAX_CHARS} characters?`,
    "Suno's Styles field holds 1,000 characters. The window leaves a margin under the limit while giving Suno enough detail about the drums, bass, vocal and mix to follow.",
  ],
  [
    "Does it use AI?",
    "No. The compiler is a set of rules and a phrase library of about 2,900 entries that runs in your browser. Nothing is sent to an AI service, so results are instant and work offline.",
  ],
  [
    "Why are there no artist names?",
    "Naming an artist invites imitation and rights problems, and Suno's moderation can refuse such prompts. The compiler describes the production instead, and the Rights and Safety playbook helps when a request names someone.",
  ],
  [
    "Can I get the same prompts again?",
    "Each run uses a new random seed, and the compiler avoids repeating recipes from your history for the same brief. Your history keeps every past result to copy again.",
  ],
  [
    "Which genres does it know?",
    "All 258 genres in the Genre coverage table above, grouped into 20 sound families. For a genre outside the library, name the closest library genre and describe what makes yours different: its instruments, groove and mood.",
  ],
  [
    "Does it work for other music generators?",
    "The prompts are plain descriptive prose, so they read sensibly anywhere. The character window and settings advice are tuned for Suno v6.",
  ],
];

export default function ReferenceGuide() {
  return (
    <>
      <Section id="lyrics" title="Lyrics Studio">
        <Prose>
          <p>
            Start with the structure: add, remove and reorder sections (intro, verse, buildup, drop, chorus, breakdown,
            bridge and outro) and set how many lines each one gets. Then give it a theme, a genre and a delivery to
            generate a draft, or paste your own lyrics and let it finish them. Section tags such as{" "}
            <Code>[Verse 1]</Code> and <Code>[Chorus]</Code> are written for Suno's Lyrics field, where they mark the
            song's sections.
          </p>
          <p>
            The phonetics converter respells words the way they are spoken in American English, with the reductions
            common in rap and Southern delivery: <Code>probably</Code> → <Code>problee</Code>, <Code>tension</Code> →{" "}
            <Code>tenshun</Code>, <Code>riding</Code> → <Code>rahdin</Code>. Section tags stay untouched and the output
            never uses hyphens. Use it when Suno mispronounces a word or sings it too formally.
          </p>
        </Prose>
      </Section>

      <Section
        id="skills"
        title="Skills Studio"
        intro="Each playbook asks a few questions and returns a checklist you can copy."
      >
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
            Suno Workbench has no server, no account, no analytics, no cookies and no API key. Your current brief and
            results are kept in this tab's session storage, and your Styles history in this browser's local storage
            until you press Clear History. Export History is the only way to move it, and it saves a file to your own
            computer.
          </p>
          <p>
            The offline file is the same site in one HTML file. Open it from your desktop and every tool works with no
            internet connection.
          </p>
        </Prose>
      </Section>

      <Section id="faq" title="FAQ">
        <div className="grid gap-3 md:grid-cols-2">
          {FAQ.map(([q, a]) => (
            <Card key={q} title={q}>
              <p>{a}</p>
            </Card>
          ))}
        </div>
      </Section>

      <Section id="glossary" title="Glossary">
        <Table head={["Term", "Meaning"]} rows={GLOSSARY} caption="Glossary of production terms" />
      </Section>

      <Section
        id="sources"
        title="Sources and how this guide is checked"
        intro={`Claims about Suno are checked against the sources below, last on ${SOURCES_CHECKED}. Suno changes its product often; if something here no longer matches, Suno's own pages win.`}
      >
        <ul className="flex flex-col gap-2 text-sm text-[var(--fg-muted)]">
          {Object.values(SOURCES).map((source) => (
            <li key={source.href} className="flex flex-wrap items-center gap-2">
              <Provenance kind={source.kind} />
              <ExternalLink href={source.href}>{source.label}</ExternalLink>
            </li>
          ))}
        </ul>
        <Prose>
          <p>
            Everything about how the compiler behaves is checked by its automated tests, and the genre coverage table
            and worked example on this page are generated from the engine itself, so they cannot fall out of date.
          </p>
        </Prose>
      </Section>
    </>
  );
}
