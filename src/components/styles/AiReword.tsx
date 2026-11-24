import { useEffect, useRef, useState } from "react";
import type { PromptCandidate } from "../../lib/suno/types.ts";
import { checkAiRewrite, type AiCheck } from "../../lib/ai/check.ts";
import { rewordOnDevice } from "../../lib/ai/on-device.ts";
import Icon from "../icons/Icon.tsx";

type State =
  | { kind: "idle" }
  | { kind: "confirm-download" }
  | { kind: "working"; note: string }
  | { kind: "done"; check: AiCheck }
  | { kind: "error"; message: string };

const BTN = "h-8 px-3 rounded-[var(--r-md)] border border-[var(--border)] text-xs text-[var(--fg)] hover:bg-[var(--bg-subtle)]";

/**
 * Experimental: asks the browser's on-device model (Chrome, Edge preview) for new wording of this prompt, only when the user
 * clicks. The result is shown, labeled as AI wording, only if it passes the Workbench's checks.
 */
export default function AiReword({ prompt, onCopy, modelReady, onAllowDownload }: {
  prompt: PromptCandidate;
  onCopy: (text: string) => void;
  /** Shared across cards: once the user agrees to the download, no card asks again. */
  modelReady: boolean;
  onAllowDownload: () => void;
}) {
  const [state, setState] = useState<State>({ kind: "idle" });
  const abort = useRef<AbortController | null>(null);
  // Cancel a request still running when the card goes away (new results, Clear Results).
  useEffect(() => () => abort.current?.abort(), []);
  // A download question left open here closes once the user agrees on another result.
  useEffect(() => {
    if (modelReady) setState((s) => (s.kind === "confirm-download" ? { kind: "idle" } : s));
  }, [modelReady]);

  function start() {
    // The browser downloads its model the first time (Chrome from Google, Edge from Microsoft): ask before that happens.
    if (!modelReady) return setState({ kind: "confirm-download" });
    void run();
  }

  async function run() {
    abort.current?.abort();
    const ctl = new AbortController();
    abort.current = ctl;
    setState({ kind: "working", note: "AI is rewording this prompt on your device…" });
    try {
      const raw = await rewordOnDevice(prompt, {
        signal: ctl.signal,
        onDownload: (f) => setState({ kind: "working", note: `Your browser is downloading its AI model (${Math.round(f * 100)}%)…` }),
      });
      if (!ctl.signal.aborted) setState({ kind: "done", check: checkAiRewrite(raw, prompt) });
    } catch (e) {
      if (!ctl.signal.aborted) setState({ kind: "error", message: e instanceof Error ? e.message : "The on-device model did not answer." });
    }
  }

  const working = state.kind === "working";
  return (
    <section aria-label="AI wording" data-testid="ai-reword" aria-busy={working}
      className="mx-4 mb-3 rounded-[var(--r-md)] border-2 border-[var(--tile-violet-fg)] bg-[var(--tile-violet-bg)] p-3 text-xs text-[var(--fg-muted)]">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1 rounded-full bg-[var(--tile-violet-fg)] px-2 py-0.5 text-[11px] font-semibold text-white">
            <Icon name="sparkles" size={12} /> AI
          </span>
          <span className="text-[var(--fg)]">Optional: new wording for this prompt, made on your device when you click.</span>
        </span>
        {working ? (
          <button type="button" className={BTN} onClick={() => { abort.current?.abort(); setState({ kind: "idle" }); }}>Stop AI</button>
        ) : state.kind !== "confirm-download" && (
          <button type="button" className={BTN} onClick={start}>
            {state.kind === "done" ? "Reword with AI Again" : "Reword with AI"}
          </button>
        )}
      </div>

      {state.kind === "confirm-download" && (
        <div className="mt-2 flex flex-col gap-2" data-testid="ai-download-confirm">
          <p className="m-0 text-[var(--fg)]">
            Your browser needs to download its AI model before the first rewording (Chrome downloads it from Google, Edge from Microsoft). This happens once, in the browser; the Workbench sends nothing.
          </p>
          <div className="flex gap-2">
            <button type="button" className={BTN} onClick={() => setState({ kind: "idle" })}>Cancel</button>
            <button type="button" className={`${BTN} font-semibold`} onClick={() => { onAllowDownload(); void run(); }}>
              Download Model and Reword
            </button>
          </div>
        </div>
      )}

      <div role="status" aria-live="polite" className="mt-2">
        {working && (
          <p className="m-0 flex items-center gap-2 text-[var(--fg)] font-medium" data-testid="ai-working">
            <span className="h-2 w-2 rounded-full bg-[var(--tile-violet-fg)] animate-pulse" aria-hidden="true" />
            {state.note}
          </p>
        )}
        {state.kind === "error" && <p className="m-0 text-[var(--danger)]">{state.message}</p>}
        {state.kind === "done" && !state.check.ok && (
          <p className="m-0" data-testid="ai-rejected">
            The AI wording was discarded: {state.check.problems.join("; ")}. The prompt above is unchanged.
          </p>
        )}
      </div>

      {state.kind === "done" && state.check.ok && (
        <div className="mt-2" data-testid="ai-accepted">
          <p className="m-0 font-semibold text-[var(--fg)]">AI wording · passed the Workbench checks · {state.check.text.length} characters</p>
          <p className="m-0 mt-1 whitespace-pre-wrap text-sm leading-relaxed text-[var(--fg)]">{state.check.text}</p>
          <button type="button" onClick={() => onCopy(state.check.text)} className={`${BTN} mt-2`}>Copy AI Wording</button>
        </div>
      )}
    </section>
  );
}
