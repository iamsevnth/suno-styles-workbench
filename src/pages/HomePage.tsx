import { ButtonLink, Card, ContentPage, Section } from "../components/content/Content.tsx";
import OfflineDownloadLink from "../components/layout/OfflineDownloadLink.tsx";
import { LIBRARY_STATS } from "../lib/suno/families.ts";
import { MAX_CHARS, MIN_CHARS } from "../lib/suno/render.ts";
import { hrefFor } from "../routes.ts";
import { headlineCase } from "../lib/text/headline-case.ts";
import { LogoFull } from "../components/layout/Logo.tsx";

const SAMPLE_BRIEF = "melodic R&B with flute and Rhodes electric piano";

const TOOLS = [
  {
    route: "styles" as const,
    title: "Styles Compiler",
    body: `Turns a one-line brief into one to six production prompts for Suno's Styles field. Each one names the tempo, genres, groove, bass, harmony, vocals, mix and instruments in ${MIN_CHARS}–${MAX_CHARS} characters.`,
    cta: "Open the compiler",
  },
  {
    route: "lyrics" as const,
    title: "Lyrics Studio",
    body: "Lay out a song section by section with exact line counts, generate or finish lyrics, then convert them to American English phonetic spellings so Suno pronounces every word the way you mean it.",
    cta: "Open Lyrics Studio",
  },
  {
    route: "skills" as const,
    title: "Skills Studio",
    body: "Eight playbooks for the work around a prompt: diagnose one that missed, plan covers and mashups, rewrite lyrics, step through the Song Editor and Studio, and check rights before you publish.",
    cta: "Open Skills Studio",
  },
];

const STEPS = [
  {
    title: "Write a brief",
    body: `Name what matters: genres, a BPM, the voice, a few instruments, the mood. One line is enough, and anything you leave out is filled from a ${LIBRARY_STATS.genres}-style library.`,
  },
  {
    title: "Generate and compare",
    body: "Each variation is a different production plan built from the same brief: a new groove, bass stack and arrangement around the genres, instruments and vocal you asked for.",
  },
  {
    title: "Paste into Suno",
    body: "Copy a result into the Styles field in Advanced mode. Set Variety to Off so Suno uses your Styles text word for word, and generate.",
  },
];

const GUARANTEES = [
  ["Fits the field", `Every prompt is ${MIN_CHARS}–${MAX_CHARS} characters, inside Suno's 1,000-character Styles limit.`],
  ["Keeps your words", "The genres, BPM, instruments and vocal description in your brief carry into every variation."],
  ["One clear tempo", "A single whole-number BPM per prompt, taken from your brief or the genre's home tempo."],
  ["Positive prompting", "Prompts describe what to play instead of listing what to leave out, which Suno can misread."],
  ["No artist names", "No named artists or “in the style of” phrasing, so prompts stay original and safe to share."],
  ["Nothing leaves your browser", "No account, no server and no API key. History stays on this device until you export or clear it."],
];

export default function HomePage() {
  return (
    <ContentPage>
      <section aria-labelledby="hero-title" className="flex flex-col gap-6 pt-2">
        <LogoFull width={340} className="sm:-ml-2" />
        <p className="label-caps">
          For Suno v6 · Free · Runs in your browser
        </p>
        <h1 id="hero-title" className="text-4xl sm:text-5xl font-bold tracking-tight text-[var(--fg)] max-w-3xl leading-[1.08]">
          {headlineCase("Write the brief. Get a Styles prompt Suno can follow.")}
        </h1>
        <p className="text-base text-[var(--fg-muted)] max-w-2xl leading-relaxed">
          Suno Workbench compiles a short creative brief into detailed production prompts that fit the Styles field, then
          helps you finish the lyrics and the rest of the song.
        </p>
        <div className="flex flex-wrap gap-3">
          <ButtonLink href={hrefFor("styles")} primary>
            Open the Styles Compiler
          </ButtonLink>
          <ButtonLink href={hrefFor("guide")}>Read the guide</ButtonLink>
        </div>

        <div className="mt-2 grid gap-3 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] items-stretch">
          <div className="rounded-[var(--r-xl)] border border-[var(--border)] bg-[var(--bg-elevated)] p-4">
            <p className="label-caps mb-2">You type</p>
            <p className="font-mono text-sm text-[var(--fg)]">{SAMPLE_BRIEF}</p>
          </div>
          <div className="rounded-[var(--r-xl)] border border-[var(--border)] bg-[var(--bg-elevated)] p-4">
            <p className="label-caps mb-2">
              The compiler plans
            </p>
            <ul className="text-sm text-[var(--fg-muted)] leading-relaxed list-disc pl-5 marker:text-[var(--fg-subtle)]">
              <li>An R&amp;B tempo, groove and drum kit</li>
              <li>R&amp;B bass and harmony, with no dubstep wobble or growl bass</li>
              <li>A sung lead with its delivery, room and vocal effects described</li>
              <li>Rhodes and flute in every variation, with a different tone each time</li>
            </ul>
          </div>
        </div>
      </section>

      <Section eyebrow="Three tools" title="Everything between the idea and the take">
        <div className="grid gap-4 md:grid-cols-3">
          {TOOLS.map((tool) => (
            <Card
              key={tool.route}
              title={tool.title}
              footer={
                <a href={hrefFor(tool.route)} className="text-sm font-medium text-[var(--fg)] underline underline-offset-4 hover:opacity-80">
                  {tool.cta} →
                </a>
              }
            >
              <p>{tool.body}</p>
            </Card>
          ))}
        </div>
      </Section>

      <Section eyebrow="How it works" title="Three steps to a usable take">
        <ol className="grid gap-4 md:grid-cols-3 list-none p-0 m-0">
          {STEPS.map((step, i) => (
            <li key={step.title} className="bg-[var(--bg-elevated)] border border-[var(--border)] rounded-[var(--r-xl)] p-5">
              <span className="font-mono text-xs text-[var(--fg-subtle)]">Step {i + 1}</span>
              <h3 className="text-base font-semibold text-[var(--fg)] mt-1">{headlineCase(step.title)}</h3>
              <p className="text-sm text-[var(--fg-muted)] leading-relaxed mt-2">{step.body}</p>
            </li>
          ))}
        </ol>
      </Section>

      <Section eyebrow="What every prompt includes" title="Built to the rules Suno responds to">
        <dl className="grid gap-x-8 gap-y-5 sm:grid-cols-2 lg:grid-cols-3">
          {GUARANTEES.map(([term, detail]) => (
            <div key={term} className="border-l-2 border-[var(--border-strong)] pl-4">
              <dt className="text-sm font-semibold text-[var(--fg)]">{term}</dt>
              <dd className="text-sm text-[var(--fg-muted)] leading-relaxed mt-1">{detail}</dd>
            </div>
          ))}
        </dl>
      </Section>

      <Section
        eyebrow="Offline"
        title="Take it with you"
        intro="The whole site, including all three tools, also comes as one HTML file. Save it, double-click it, and it runs with no internet connection and nothing to install."
      >
        <div className="flex flex-wrap gap-3">
          <OfflineDownloadLink className="inline-flex h-11 px-5 text-sm" label="Download the offline file" />
          <ButtonLink href={hrefFor("guide")}>Suno settings to use</ButtonLink>
        </div>
      </Section>
    </ContentPage>
  );
}
