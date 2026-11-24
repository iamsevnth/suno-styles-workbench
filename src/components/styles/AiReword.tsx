import { useEffect, useRef, useState } from "react";
import type { PromptCandidate } from "../../lib/suno/types.ts";
import { checkAiRewrite, type AiCheck } from "../../lib/ai/check.ts";
import { rewordOnDevice } from "../../lib/ai/on-device.ts";

type State =
  | { kind: "idle" }
  | { kind: "working"; note: string }
  | { kind: "done"; check: AiCheck }
  | { kind: "error"; message: string };

/**
 * Experimental: asks Chrome's on-device model for new wording of this prompt. The result is shown
 * only if it passes the same checks as the Workbench's own prompts; otherwise it is discarded.
 */
export default function AiReword({ prompt, onCopy }: { prompt: PromptCandidate; onCopy: (text: string) => void }) {
  const [state, setState] = useState<State>({ kind: "idle" });
  const abort = useRef<AbortController | null>(null);
  // Cancel a request still running when the card goes away (new results, Clear Results).
  useEffect(() => () => abort.current?.abort(), []);

  async function run() {
    abort.current?.abort();
    const ctl = new AbortController();
    abort.current = ctl;
    setState({ kind: "working", note: "Rewording on this device…" });
    try {
      const raw = await rewordOnDevice(prompt, {
        signal: ctl.signal,
        onDownload: (f) => setState({ kind: "working", note: `Chrome is downloading its on-device model (${Math.round(f * 100)}%)…` }),
      });
      if (!ctl.signal.aborted) setState({ kind: "done", check: checkAiRewrite(raw, prompt) });
    } catch (e) {
      if (!ctl.signal.aborted) setState({ kind: "error", message: e instanceof Error ? e.message : "The on-device model did not answer." });
    }
  }

  return (
    <div className="mx-4 mb-3 rounded-[var(--r-md)] border border-dashed border-[var(--border)] p-3 text-xs text-[var(--fg-muted)]" data-testid="ai-reword">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span>
          <span className="font-semibold text-[var(--fg)]">On-device AI rewording</span> (experimental): same plan, new wording, checked like every prompt.
        </span>
        {state.kind === "working" ? (
          <button type="button" onClick={() => { abort.current?.abort(); setState({ kind: "idle" }); }}
            className="h-8 px-3 rounded-[var(--r-md)] border border-[var(--border)] text-xs text-[var(--fg)] hover:bg-[var(--bg-subtle)]">
            Stop
          </button>
        ) : (
          <button type="button" onClick={run}
            className="h-8 px-3 rounded-[var(--r-md)] border border-[var(--border)] text-xs text-[var(--fg)] hover:bg-[var(--bg-subtle)]">
            {state.kind === "done" ? "Try Again" : "Reword on This Device"}
          </button>
        )}
      </div>
      <div role="status" aria-live="polite" className="mt-2">
        {state.kind === "working" && <p className="m-0">{state.note}</p>}
        {state.kind === "error" && <p className="m-0 text-[var(--danger)]">{state.message}</p>}
        {state.kind === "done" && !state.check.ok && (
          <p className="m-0" data-testid="ai-rejected">
            Discarded: {state.check.problems.join("; ")}. Try again for different wording.
          </p>
        )}
      </div>
      {state.kind === "done" && state.check.ok && (
        <div className="mt-2" data-testid="ai-accepted">
          <p className="m-0 text-[var(--fg)]">Passed the Workbench checks · {state.check.text.length} characters</p>
          <p className="m-0 mt-1 whitespace-pre-wrap text-sm leading-relaxed">{state.check.text}</p>
          <button type="button" onClick={() => onCopy(state.check.text)}
            className="mt-2 h-8 px-3 rounded-[var(--r-md)] border border-[var(--border)] text-xs text-[var(--fg)] hover:bg-[var(--bg-subtle)]">
            Copy AI Wording
          </button>
        </div>
      )}
    </div>
  );
}
