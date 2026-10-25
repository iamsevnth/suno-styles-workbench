import { Section } from "../../components/content/Content.tsx";
import { LIBRARY_STATS } from "../../lib/suno/families.ts";
import { MAX_CHARS, MIN_CHARS } from "../../lib/suno/render.ts";

const FAQ: [string, string][] = [
  [
    `Why ${MIN_CHARS}–${MAX_CHARS} characters?`,
    "Suno's Styles field supports up to 1,000 characters. Workbench keeps a safety margin while still reserving enough space for tempo, groove, drums, bass, harmony, vocals, instruments and mix detail.",
  ],
  [
    "Does Suno Workbench use AI?",
    "No. The compiler is a deterministic rules engine and phrase library that runs in your browser. No prompt is sent to an AI service, and the downloadable offline file runs without internet access.",
  ],
  [
    "What does Fix Existing Prompt actually preserve?",
    "It reparses the existing Styles text and rebuilds from the intent it can identify. Recognized genre order, BPM, named instruments, groove/bass cues and vocal traits are treated as anchors; conflicting or negative wording is not copied blindly into the rebuilt prompt.",
  ],
  [
    "Why are artist names not part of generated Styles?",
    "Workbench organizes prompts around production attributes rather than identity imitation. Genre, era, instrumentation, groove, vocal characteristics, arrangement and mix are more controllable inputs and easier to reuse.",
  ],
  [
    "Can I get the same prompt again?",
    "Each normal run uses a new seed and avoids recent recipe fingerprints from matching history, so it is designed to explore alternatives. Your browser history keeps the newest 200 runs so you can copy an earlier result directly.",
  ],
  [
    "Which genres does it know?",
    `The library currently recognizes ${LIBRARY_STATS.genres} genres across ${LIBRARY_STATS.families} sound families. The Genre Coverage chart summarizes family membership; hybrid genres may contribute to more than one family.`,
  ],
  [
    "Why set Suno Variety to 0 / Off?",
    "Suno documents Variety as a control that adjusts or updates style prompts. At 0 you retain full control of your style tags, which makes it easier to test a Workbench prompt without Suno changing the Styles text first.",
  ],
  [
    "Does the Guide stay current automatically?",
    "No. The app is deliberately offline-capable and does not scrape Suno. Product details in the Guide are source-backed snapshots; exact UI labels, plan gates and credit costs should be checked against Suno's current Help Center or Release Notes.",
  ],
  [
    "Where is the privacy information?",
    "Privacy is now a dedicated Privacy Policy page linked in the footer. It explains local browser storage, GitHub Pages hosting and the fact that SEVNTHLABS does not receive your creative content.",
  ],
];

export default function ReferenceGuide() {
  return (
    <Section id="faq" title="FAQ" intro="Select a question to expand its answer.">
      <div className="flex flex-col gap-3 w-full">
        {FAQ.map(([q, a]) => (
          <details
            key={q}
            className="group surface rounded-[var(--r-xl)] border border-[var(--border)] overflow-hidden"
          >
            <summary className="list-none cursor-pointer px-5 py-4 flex items-center justify-between gap-4 text-sm font-semibold text-[var(--fg)]">
              <span>{q}</span>
              <span className="text-[var(--fg-subtle)] group-open:rotate-45 transition-transform text-lg" aria-hidden="true">+</span>
            </summary>
            <div className="px-5 pb-5 text-sm text-[var(--fg-muted)] leading-relaxed border-t border-[var(--border)] pt-4">
              {a}
            </div>
          </details>
        ))}
      </div>
    </Section>
  );
}
