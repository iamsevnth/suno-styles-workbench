import { ContentPage } from "../../components/content/Content.tsx";
import BriefGuide from "./BriefGuide.tsx";
import EngineGuide from "./EngineGuide.tsx";
import ReferenceGuide from "./ReferenceGuide.tsx";
import SunoGuide from "./SunoGuide.tsx";

const TOC: [string, string][] = [
  ["quick-start", "Quick start"],
  ["briefs", "Writing a brief"],
  ["better-briefs", "Strong briefs"],
  ["example", "Worked example"],
  ["how-it-works", "How it works"],
  ["coverage", "Genre coverage"],
  ["quality", "Quality gates"],
  ["profile", "Hybrid Bass Profile"],
  ["suno-settings", "Suno v6 settings"],
  ["troubleshooting", "Troubleshooting"],
  ["lyrics", "Lyrics Studio"],
  ["skills", "Skills Studio"],
  ["privacy", "Privacy"],
  ["faq", "FAQ"],
  ["glossary", "Glossary"],
  ["sources", "Sources"],
];

export default function GuidePage() {
  return (
    <ContentPage>
      <header className="flex flex-col gap-4">
        <p className="text-[11px] font-mono uppercase tracking-[0.18em] text-[var(--fg-subtle)]">Guide</p>
        <h1 className="text-4xl font-bold tracking-tight text-[var(--fg)]">
          How to get the most out of Suno Workbench
        </h1>
        <p className="text-base text-[var(--fg-muted)] max-w-2xl leading-relaxed">
          How to write a brief, how the compiler turns it into a Styles prompt, the Suno v6 settings that keep that
          prompt intact, and what to do when a take goes wrong.
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
      <BriefGuide />
      <EngineGuide />
      <SunoGuide />
      <ReferenceGuide />
    </ContentPage>
  );
}
