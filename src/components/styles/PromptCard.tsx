import { useState } from "react";
import FidelityInspector from "./FidelityInspector.tsx";
import AiReword from "./AiReword.tsx";
import AssistantHandoff from "./AssistantHandoff.tsx";
import { canRephrase, rephrase } from "../../lib/suno/rephrase.ts";
import type { OnDeviceAi } from "../../hooks/useOnDeviceAi.ts";
import { PromptCandidate } from "../../lib/suno/types.ts";
import { ownershipMap } from "../../lib/suno/lint.ts";
import { formatTitle, vocalPortion } from "../../lib/suno/render.ts";
import { lengthWindow } from "../../lib/suno/limits.ts";
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

/** "Detailed · 912 characters · vocals 18% (cap 25%)": the prompt's length against its window. */
function lengthReport(prompt: PromptCandidate, text: string): string {
  const plan = prompt.plan;
  const window = lengthWindow(plan.length);
  const name = plan.length === "tight" ? "Tight" : "Detailed";
  const vocals = plan.vocals?.present === false
    ? "instrumental"
    : `vocals ${Math.round((vocalPortion(text, plan) / Math.max(1, text.length)) * 100)}% (cap ${Math.round(window.vocalShare * 100)}%)`;
  return `${name} · ${text.length} characters · ${vocals}`;
}

/** The wording a card shows: the engine's, a Rephrase (no AI), or a checked answer from the user's assistant. */
interface Wording {
  text: string;
  source: "engine" | "rephrase" | "assistant";
  /** Last Rephrase number used, so the next click moves on. */
  wording: number;
  /** Rephrasings already shown, so none repeats. */
  seen: string[];
}

function vocalSummary(plan: PromptCandidate["plan"]): string {
  if (!plan.vocals?.present) return "instrumental";
  return `${plan.vocals.presentation || "lead"} ${plan.vocals.timbre || ""} ${plan.vocals.style || ""}`.trim();
}

export default function PromptCard({ prompt, onCopy, sourceText, changedFromFirst, ai }: {
  prompt: PromptCandidate;
  onCopy: (styles: string) => void;
  sourceText: string;
  /** Musical axes that differ from the first variant; undefined for the first one. */
  changedFromFirst?: SemanticAxis[];
  /** On-device AI state; the Reword with AI section appears only when the user turned AI on. */
  ai?: OnDeviceAi;
}) {
  const [planOpen, setPlanOpen] = useState(false);
  const [view, setView] = useState<Wording>({ text: prompt.styles, source: "engine", wording: 0, seen: [] });
  const [rephraseNote, setRephraseNote] = useState("");
  const plan = prompt.plan;
  const rephrasable = canRephrase(prompt);

  function nextWording() {
    const next = rephrase(prompt, view.wording, view.seen);
    if (!next) {
      setRephraseNote("No other wording passes the checks for this prompt.");
      return;
    }
    setRephraseNote("");
    setView({ text: next.text, source: "rephrase", wording: next.wording, seen: [...view.seen, next.text] });
  }
  const genreLine = [plan.primaryGenre, plan.secondaryGenre, plan.accentGenre].filter(Boolean).join(" × ");

  return (
    <article className="bg-[var(--bg-elevated)] border border-[var(--border)] rounded-[var(--r-xl)] shadow-[var(--shadow)] overflow-hidden">
      <div className="flex flex-wrap items-start justify-between gap-3 p-4 border-b border-[var(--border)]">
        <div>
          <h3 className="text-base font-semibold text-[var(--fg)]">{view.source === "engine" ? prompt.title : formatTitle(prompt.seed, prompt.bpm, prompt.key, view.text.length)}</h3>
          {prompt.fixStrategy ? (
            <span className="inline-block mt-1 mr-2 text-xs font-semibold text-[var(--fg-muted)]">
              Fix: {prompt.fixStrategy === "recompiled" ? "recompiled from brief" : prompt.fixStrategy + " source instructions"}
            </span>
          ) : null}
          <span data-testid="length-report" className="inline-block mt-1 font-mono text-xs rounded-full border border-[var(--border)] bg-[var(--bg)] px-2 py-0.5 text-[var(--fg-muted)]">
            {lengthReport(prompt, view.text)}
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
          onClick={() => onCopy(view.text)}
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
      <div className="px-4 pt-3 -mb-2 flex flex-wrap items-center gap-2">
        {view.source === "assistant" ? (
          <span data-testid="engine-badge" className="inline-flex items-center gap-1 rounded-full bg-[var(--tile-violet-fg)] px-2 py-0.5 text-[11px] font-semibold text-white">
            AI wording from your assistant · passed the Workbench checks
          </span>
        ) : (
          <span data-testid="engine-badge" className="inline-flex items-center gap-1 rounded-full border border-[var(--border)] px-2 py-0.5 text-[11px] text-[var(--fg-muted)]">
            {view.source === "rephrase" ? "Rephrased by the Workbench engine · no AI · passed the checks" : "Workbench engine · no AI"}
          </span>
        )}
        <button type="button" onClick={nextWording} disabled={!rephrasable} data-testid="rephrase"
          title={rephrasable ? "New wording for the same musical plan, made by the Workbench engine. No AI." : "Rephrase works on prompts the Workbench wrote; this one keeps your pasted wording."}
          className="h-7 px-2.5 rounded-[var(--r-md)] border border-[var(--border)] text-[11px] text-[var(--fg)] hover:bg-[var(--bg-subtle)] disabled:opacity-50 disabled:cursor-not-allowed">
          Rephrase · no AI
        </button>
        {view.source !== "engine" && (
          <button type="button" onClick={() => { setView({ text: prompt.styles, source: "engine", wording: view.wording, seen: view.seen }); setRephraseNote(""); }}
            className="h-7 px-2.5 rounded-[var(--r-md)] border border-[var(--border)] text-[11px] text-[var(--fg-muted)] hover:text-[var(--fg)] hover:bg-[var(--bg-subtle)]">
            Show Original
          </button>
        )}
        <span role="status" aria-live="polite" className="text-[11px] text-[var(--fg-muted)]">{rephraseNote}</span>
      </div>
      <p data-testid="prompt-text" className="p-4 whitespace-pre-wrap text-sm leading-relaxed text-[var(--fg-muted)]">{view.text}</p>
      {ai?.on && <AiReword prompt={prompt} onCopy={onCopy} modelReady={ai.modelReady} onAllowDownload={ai.allowDownload} />}
      <AssistantHandoff prompt={prompt} styles={view.text} onUse={(text) => setView({ text, source: "assistant", wording: view.wording, seen: view.seen })} />

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
      <FidelityInspector sourceText={sourceText} styleText={view.text} excludeText={prompt.exclude ?? ""}
        fixMode={!!prompt.fixStrategy} label={prompt.title} />
    </article>
  );
}
