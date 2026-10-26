import { ContentPage } from "../../components/content/Content.tsx";
import BriefGuide from "./BriefGuide.tsx";
import EngineGuide from "./EngineGuide.tsx";
import ReferenceGuide from "./ReferenceGuide.tsx";
import SunoGuide from "./SunoGuide.tsx";
import { headlineCase } from "../../lib/text/headline-case.ts";
import { LogoFull } from "../../components/layout/Logo.tsx";

const TOC: [string, string][] = [
  ["quick-start", "Quick Start"],
  ["briefs", "Writing a Brief"],
  ["vocals", "Vocal Logic"],
  ["better-briefs", "Strong Briefs"],
  ["how-it-works", "How the Compiler Works"],
  ["coverage", "Genre Coverage"],
  ["quality", "Quality Gates"],
  ["create-mode", "Create Mode Explained"],
  ["editor-workflows", "Song Editor"],
  ["studio-workflows", "Studio Workflows"],
  ["rights", "Rights & Publishing"],
  ["faq", "FAQ"],
];

export default function GuidePage() {
  return (
    <ContentPage className="guide-page">
      <header className="guide-hero flex flex-col gap-4 w-full">
        <LogoFull width={220} className="sm:-ml-1" />
        <p className="label-caps eyebrow">Guide</p>
        <h1 className="text-4xl font-bold tracking-tight text-[var(--fg)]">
          {headlineCase("How to get the most out of Suno Workbench")}
        </h1>
        <p className="text-base text-[var(--fg-muted)] w-full leading-relaxed">
          Practical guidance for writing better briefs, understanding what the compiler changes, choosing Suno Create
          controls, editing a take, organizing Studio work and keeping uploads rights-aware.
        </p>
        <nav aria-label="On this page" className="flex flex-wrap gap-2 pt-1 w-full">
          {TOC.map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => document.getElementById(id)?.scrollIntoView({ behavior: "smooth" })}
              className="guide-toc-link rounded-full border border-[var(--border)] bg-[var(--bg-elevated)] px-3 py-1 text-xs font-medium text-[var(--fg-muted)] hover:text-[var(--fg)] hover:border-[var(--border-strong)]"
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
