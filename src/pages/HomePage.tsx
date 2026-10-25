import { ButtonLink, Card, ContentPage, IconTile, Section, TileColor } from "../components/content/Content.tsx";
import Icon from "../components/icons/Icon.tsx";
import type { IconName } from "../components/icons/icon-data.ts";
import OfflineDownloadLink from "../components/layout/OfflineDownloadLink.tsx";
import { LIBRARY_STATS } from "../lib/suno/families.ts";
import { MAX_CHARS, MIN_CHARS } from "../lib/suno/render.ts";
import { hrefFor } from "../routes.ts";
import { headlineCase } from "../lib/text/headline-case.ts";
import { LogoFull } from "../components/layout/Logo.tsx";

const SAMPLE_BRIEF = "melodic R&B with flute and Rhodes electric piano";

const TOOLS: {
  route: "styles" | "lyrics" | "skills";
  title: string;
  body: string;
  cta: string;
  icon: IconName;
  tile: TileColor;
  accent: "blue" | "violet" | "orange";
  link: string;
}[] = [
  {
    route: "styles",
    title: "Styles Compiler",
    body: `Turns a one-line brief into one to six production prompts for Suno's Styles field. Each one names the tempo, genres, groove, bass, harmony, vocals, mix and instruments in ${MIN_CHARS}–${MAX_CHARS} characters.`,
    cta: "Open the compiler",
    icon: "wand",
    tile: "magenta",
    accent: "violet",
    link: "text-[var(--link)]",
  },
  {
    route: "lyrics",
    title: "Lyrics Studio",
    body: "Lay out a song section by section with exact line counts, generate or finish lyrics, then convert them to American English phonetic spellings so Suno pronounces every word the way you mean it.",
    cta: "Open Lyrics Studio",
    icon: "music",
    tile: "blue",
    accent: "blue",
    link: "text-[var(--link)]",
  },
  {
    route: "skills",
    title: "Skills Studio",
    body: "Eight playbooks for the work around a prompt: diagnose one that missed, plan covers and mashups, rewrite lyrics, step through the Song Editor and Studio, and check rights before you publish.",
    cta: "Open Skills Studio",
    icon: "cap",
    tile: "orange",
    accent: "orange",
    link: "text-[var(--fg)] light:text-[var(--tile-orange-fg)]",
  },
];

const STEPS: { title: string; body: string; tile: TileColor }[] = [
  {
    title: "Write a brief",
    body: `Name what matters: genres, a BPM, the voice, a few instruments, the mood. One line is enough, and anything you leave out is filled from a ${LIBRARY_STATS.genres}-style library.`,
    tile: "blue",
  },
  {
    title: "Generate and compare",
    body: "Each variation is a different production plan built from the same brief: a new groove, bass stack and arrangement around the genres, instruments and vocal you asked for.",
    tile: "violet",
  },
  {
    title: "Paste into Suno",
    body: "Copy a result into the Styles field in Advanced mode. Set Variety to Off so Suno uses your Styles text word for word, and generate.",
    tile: "coral",
  },
];

const GUARANTEES: [string, string, IconName, TileColor][] = [
  [
    "Fits the field",
    `Every prompt is ${MIN_CHARS}–${MAX_CHARS} characters, inside Suno's 1,000-character Styles limit.`,
    "list",
    "green",
  ],
  [
    "Keeps your words",
    "The genres, BPM, instruments and vocal description in your brief carry into every variation.",
    "settings",
    "violet",
  ],
  [
    "One clear tempo",
    "A single whole-number BPM per prompt, taken from your brief or the genre's home tempo.",
    "target",
    "coral",
  ],
  [
    "Positive prompting",
    "Prompts describe what to play instead of listing what to leave out, which Suno can misread.",
    "star",
    "blue",
  ],
  [
    "No artist names",
    "No named artists or “in the style of” phrasing, so prompts stay original and safe to share.",
    "users",
    "amber",
  ],
  [
    "Nothing leaves your browser",
    "No account, no server and no API key. History stays on this device until you export or clear it.",
    "shield",
    "magenta",
  ],
];

const HERO_TITLE = headlineCase("Write the brief. Get a Styles prompt Suno can follow.");

/** The hero title with the brand word in the logo's gradient (light mode). */
function HeroTitle() {
  const [before, after] = HERO_TITLE.split(/\bSuno\b/);
  return (
    <>
      {before}
      <span className="brand-word">Suno</span>
      {after}
    </>
  );
}

export default function HomePage() {
  return (
    <ContentPage>
      <section aria-labelledby="hero-title" className="flex flex-col gap-8 pt-2">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] lg:items-center">
          <div className="flex flex-col items-start lg:items-center gap-3">
            <LogoFull width={340} className="sm:-ml-2 lg:ml-0" />
            <p className="label-caps">For Suno v6 · Free · Runs in your browser</p>
          </div>
          <div className="flex flex-col gap-5">
            <h1
              id="hero-title"
              className="text-4xl sm:text-5xl font-bold tracking-tight text-[var(--fg)] max-w-3xl leading-[1.08]"
            >
              <HeroTitle />
            </h1>
            <p className="text-base text-[var(--fg-muted)] max-w-2xl leading-relaxed">
              Suno Workbench compiles a short creative brief into detailed production prompts that fit the Styles field,
              then helps you finish the lyrics and the rest of the song.
            </p>
            <div className="flex flex-wrap gap-3">
              <ButtonLink href={hrefFor("styles")} primary>
                Open the Styles Compiler
              </ButtonLink>
              <ButtonLink href={hrefFor("guide")}>Read the guide</ButtonLink>
            </div>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-2 items-stretch">
          <div className="surface rounded-[var(--r-xl)] p-5 flex gap-4">
            <IconTile icon="pencil" color="blue" />
            <div className="flex-1 min-w-0">
              <p className="label-caps light:text-[var(--tile-blue-fg)] mb-2">You type</p>
              <p className="font-mono text-sm text-[var(--fg)] rounded-[var(--r-md)] border border-[var(--border)] bg-[var(--input-bg)] px-3 py-2.5 break-words">
                {SAMPLE_BRIEF}
              </p>
            </div>
          </div>
          <div className="surface rounded-[var(--r-xl)] p-5 flex gap-4">
            <IconTile icon="sparkles" color="violet" />
            <div className="flex-1 min-w-0">
              <p className="label-caps light:text-[var(--tile-magenta-fg)] mb-2">The compiler plans</p>
              <ul className="text-sm text-[var(--fg-muted)] leading-relaxed list-disc pl-5 marker:text-[var(--fg-subtle)] light:marker:text-[#eb039c]">
                <li>An R&amp;B tempo, groove and drum kit</li>
                <li>R&amp;B bass and harmony, with no dubstep wobble or growl bass</li>
                <li>A sung lead with its delivery, room and vocal effects described</li>
                <li>Rhodes and flute in every variation, with a different tone each time</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      <Section eyebrow="Three tools" title="Everything between the idea and the take">
        <div className="grid gap-4 md:grid-cols-3">
          {TOOLS.map((tool) => (
            <Card
              key={tool.route}
              title={tool.title}
              icon={tool.icon}
              tile={tool.tile}
              accent={tool.accent}
              footer={
                <a
                  href={hrefFor(tool.route)}
                  className={`inline-flex items-center gap-1.5 text-sm font-semibold underline underline-offset-4 hover:opacity-80 ${tool.link}`}
                >
                  {tool.cta}
                  <Icon name="arrowRight" size={15} />
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
            <li key={step.title} className="surface rounded-[var(--r-xl)] p-5 flex gap-4">
              <span
                className={`icon-tile tile-${step.tile} w-10 h-10 rounded-full text-lg font-bold`}
                aria-hidden="true"
              >
                {i + 1}
              </span>
              <div>
                <span className="sr-only">Step {i + 1}: </span>
                <h3 className="text-base font-semibold text-[var(--fg)]">{headlineCase(step.title)}</h3>
                <p className="text-sm text-[var(--fg-muted)] leading-relaxed mt-1.5">{step.body}</p>
              </div>
            </li>
          ))}
        </ol>
      </Section>

      <Section eyebrow="What every prompt includes" title="Built to the rules Suno responds to">
        <dl className="grid gap-x-8 gap-y-6 sm:grid-cols-2 lg:grid-cols-3">
          {GUARANTEES.map(([term, detail, icon, tile]) => (
            <div key={term} className="flex gap-3.5">
              <span className={`icon-tile tile-${tile} w-10 h-10 rounded-full`} aria-hidden="true">
                <Icon name={icon} size={18} />
              </span>
              <div>
                <dt className="text-sm font-semibold text-[var(--fg)]">{term}</dt>
                <dd className="text-sm text-[var(--fg-muted)] leading-relaxed mt-0.5">{detail}</dd>
              </div>
            </div>
          ))}
        </dl>
      </Section>

      <section aria-labelledby="offline-title" className="flex flex-col gap-4 lg:flex-row lg:items-center lg:gap-10">
        <div className="lg:w-64 shrink-0">
          <p className="label-caps eyebrow mb-2">Offline</p>
          <h2 id="offline-title" className="text-2xl sm:text-[1.75rem] font-bold tracking-tight text-[var(--fg)]">
            {headlineCase("Take it with you")}
          </h2>
        </div>
        <p className="text-sm text-[var(--fg-muted)] leading-relaxed flex-1 max-w-xl">
          The whole site, including all three tools, also comes as one HTML file. Save it, double-click it, and it runs
          with no internet connection and nothing to install.
        </p>
        <div className="flex flex-wrap gap-3">
          <OfflineDownloadLink primary className="inline-flex h-11 px-5 text-sm" label="Download the offline file" />
          <a
            href={hrefFor("guide")}
            className="surface inline-flex items-center gap-2 h-11 px-5 rounded-[var(--r-md)] text-sm font-semibold text-[var(--fg)] hover:bg-[var(--bg-subtle)]"
          >
            <Icon name="settings" size={16} />
            Suno settings to use
          </a>
        </div>
      </section>
    </ContentPage>
  );
}
