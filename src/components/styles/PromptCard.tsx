import { useState } from "react";
import { toTitleCase } from "../../lib/suno/title-case.ts";
import { PromptCandidate } from "../../lib/suno/types.ts";

function PlanCell({ label, value }: { label: string; value: string | number | undefined }) {
  return (
    <div className="rounded-[var(--r-sm)] border border-[var(--border)] bg-[var(--bg)] p-2.5 text-xs text-[var(--fg-muted)]">
      <div className="label-caps-sm">{label}</div>
      <div className="text-[var(--fg)] mt-0.5">{value || "—"}</div>
    </div>
  );
}

function vocalSummary(plan: PromptCandidate["plan"]): string {
  if (!plan.vocals?.present) return "instrumental";
  return `${plan.vocals.presentation || "lead"} ${plan.vocals.timbre || ""} ${plan.vocals.style || ""}`.trim();
}

export default function PromptCard({ prompt, onCopy }: { prompt: PromptCandidate; onCopy: (styles: string) => void }) {
  const [planOpen, setPlanOpen] = useState(false);
  const plan = prompt.plan;
  const genreLine = [plan.primaryGenre, plan.secondaryGenre, plan.accentGenre].filter(Boolean).join(" × ");

  return (
    <article className="bg-[var(--bg-elevated)] border border-[var(--border)] rounded-[var(--r-xl)] shadow-[var(--shadow)] overflow-hidden">
      <div className="flex flex-wrap items-start justify-between gap-3 p-4 border-b border-[var(--border)]">
        <div>
          <h3 className="text-base font-semibold text-[var(--fg)]">{toTitleCase(prompt.title)}</h3>
          <span className="inline-block mt-1 font-mono text-xs rounded-full border border-[var(--border)] bg-[var(--bg)] px-2 py-0.5 text-[var(--fg-muted)]">
            {prompt.characters} total characters
          </span>
          {prompt.issues?.length ? (
            <p className="text-xs text-[var(--danger)] mt-1.5">{prompt.issues.join(" · ")}</p>
          ) : null}
        </div>
        <button
          type="button"
          onClick={() => onCopy(prompt.styles)}
          className="h-8 px-3 rounded-[var(--r-md)] border border-[var(--border)] bg-[var(--bg)] hover:bg-[var(--bg-subtle)] text-xs text-[var(--fg-muted)] hover:text-[var(--fg)] font-medium transition-colors"
        >
          Copy Style
        </button>
      </div>

      <p className="p-4 whitespace-pre-wrap text-sm leading-relaxed text-[var(--fg-muted)]">{prompt.styles}</p>

      <button
        type="button"
        onClick={() => setPlanOpen((open) => !open)}
        aria-expanded={planOpen}
        className="w-full flex items-center justify-between border-t border-[var(--border)] bg-transparent text-[var(--fg-muted)] hover:text-[var(--fg)] text-xs font-medium px-4 py-3 text-left transition-colors"
      >
        <span>Sonic Plan · {genreLine}</span>
        <span aria-hidden="true">{planOpen ? "▴" : "▾"}</span>
      </button>

      {planOpen && (
        <div className="grid gap-2 p-4 pt-0 grid-cols-1 sm:grid-cols-2">
          <PlanCell label="BPM" value={plan.bpm} />
          <PlanCell label="Mood" value={plan.moodPrimary} />
          <PlanCell label="Metric Feel" value={plan.metricFeel} />
          <PlanCell label="Rhythm Donor" value={plan.donors?.rhythm} />
          <PlanCell label="Bass Donor" value={plan.donors?.bass} />
          <PlanCell label="Bass Stack" value={(plan.bass || []).slice(0, 3).join(", ")} />
          <PlanCell label="Variant Axes" value={(plan.variantAxes || []).join(" · ")} />
          <PlanCell label="Vocals" value={vocalSummary(plan)} />
        </div>
      )}
    </article>
  );
}
