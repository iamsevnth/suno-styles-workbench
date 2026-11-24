import { useState } from "react";
import FidelityInspector from "./FidelityInspector.tsx";
import AiReword from "./AiReword.tsx";
import { PromptCandidate } from "../../lib/suno/types.ts";
import { ownershipMap } from "../../lib/suno/lint.ts";
import type { SemanticAxis } from "../../lib/suno/semantic.ts";

const AXIS_LABELS: Record<SemanticAxis, string> = {
  rhythm: "Rhythm",
  bass: "Bass",
  soundDesign: "Sound design",
  arrangement: "Arrangement",
  vocals: "Vocals",
};

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

export default function PromptCard({ prompt, onCopy, sourceText, changedFromFirst, aiOn }: {
  prompt: PromptCandidate;
  onCopy: (styles: string) => void;
  sourceText: string;
  /** Musical axes that differ from the first variant; undefined for the first one. */
  changedFromFirst?: SemanticAxis[];
  /** Show the experimental on-device AI rewording (only when the browser has it and the user turned it on). */
  aiOn?: boolean;
}) {
  const [planOpen, setPlanOpen] = useState(false);
  const plan = prompt.plan;
  const genreLine = [plan.primaryGenre, plan.secondaryGenre, plan.accentGenre].filter(Boolean).join(" × ");

  return (
    <article className="bg-[var(--bg-elevated)] border border-[var(--border)] rounded-[var(--r-xl)] shadow-[var(--shadow)] overflow-hidden">
      <div className="flex flex-wrap items-start justify-between gap-3 p-4 border-b border-[var(--border)]">
        <div>
          <h3 className="text-base font-semibold text-[var(--fg)]">{prompt.title}</h3>
          {prompt.fixStrategy ? (
            <span className="inline-block mt-1 mr-2 text-xs font-semibold text-[var(--fg-muted)]">
              Fix: {prompt.fixStrategy === "recompiled" ? "recompiled from brief" : prompt.fixStrategy + " source instructions"}
            </span>
          ) : null}
          <span className="inline-block mt-1 font-mono text-xs rounded-full border border-[var(--border)] bg-[var(--bg)] px-2 py-0.5 text-[var(--fg-muted)]">
            {prompt.characters} total characters
          </span>
          {changedFromFirst && (
            <span className="inline-block mt-1 ml-2 text-xs text-[var(--fg-muted)]" data-testid="changed-axes">
              {changedFromFirst.length
                ? <>Differs from the first in: <span className="text-[var(--fg)]">{changedFromFirst.map((a) => AXIS_LABELS[a]).join(" · ")}</span></>
                : "Same musical axes as the first"}
            </span>
          )}
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

      {prompt.exclude ? (
        <div className="mx-4 mt-3 flex flex-wrap items-center gap-2 rounded-[var(--r-md)] border border-[var(--border)] bg-[var(--bg)] p-3">
          <div className="flex-1 min-w-0">
            <div className="label-caps-sm">Separate Suno Exclude Field</div>
            <div className="mt-1 text-sm break-words text-[var(--fg)]">{prompt.exclude}</div>
          </div>
          <button type="button" onClick={() => onCopy(prompt.exclude ?? "")}
            className="px-3 h-8 rounded-[var(--r-md)] border border-[var(--border)] text-xs text-[var(--fg)] hover:bg-[var(--bg-subtle)]">
            Copy Exclude
          </button>
        </div>
      ) : null}
      <p className="p-4 whitespace-pre-wrap text-sm leading-relaxed text-[var(--fg-muted)]">{prompt.styles}</p>
      {aiOn && <AiReword prompt={prompt} onCopy={onCopy} />}

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
          <PlanCell label="Sonic Identity" value={plan.sonicIdentity} />
          <PlanCell label="A/B Changed Axis" value={plan.abAxis} />
          {ownershipMap(plan).map((r) => (
            <PlanCell key={r.role} label={`${r.role} Owner`} value={r.phrase ? `${r.owner} — ${r.phrase}` : r.owner} />
          ))}
          <PlanCell label="Bass Stack" value={(plan.bass || []).slice(0, 3).join(", ")} />
          <PlanCell label="Variation Recipe" value={(plan.variantAxes || []).filter((a) => !/^(?:seed|recipe):/.test(a)).join(" · ")} />
          <PlanCell label="Vocals" value={vocalSummary(plan)} />
        </div>
      )}
      <FidelityInspector sourceText={sourceText} styleText={prompt.styles} excludeText={prompt.exclude ?? ""}
        fixMode={!!prompt.fixStrategy} label={prompt.title} />
    </article>
  );
}
