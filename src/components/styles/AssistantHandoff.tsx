import { useId, useState } from "react";
import type { PromptCandidate } from "../../lib/suno/types.ts";
import { assistantRequest, checkAssistantAnswer } from "../../lib/ai/handoff.ts";
import type { AiCheck } from "../../lib/ai/check.ts";
import { copyToClipboard } from "../../lib/browser/clipboard.ts";
import Icon from "../icons/Icon.tsx";

const BTN = "h-8 px-3 rounded-[var(--r-md)] border border-[var(--border)] text-xs text-[var(--fg)] hover:bg-[var(--bg-subtle)]";

/**
 * Reword with the user's own AI assistant (Brave Leo, Microsoft Copilot, ChatGPT, Claude...). Websites can't
 * call those assistants, so this is copy and paste: the Workbench sends nothing, and a pasted answer is shown
 * only after it passes the Workbench checks. Everything here is labeled as AI.
 */
export default function AssistantHandoff({ prompt, onUse }: {
  prompt: PromptCandidate;
  /** Shows the checked answer as this card's wording. */
  onUse: (text: string) => void;
}) {
  const [answer, setAnswer] = useState("");
  const [copied, setCopied] = useState<"" | "ok" | "blocked">("");
  const [check, setCheck] = useState<AiCheck | null>(null);
  const answerId = useId();

  async function copyRequest() {
    setCopied((await copyToClipboard(assistantRequest(prompt))) ? "ok" : "blocked");
  }

  function checkAnswer() {
    setCheck(answer.trim() ? checkAssistantAnswer(answer, prompt) : { ok: false, text: "", problems: ["paste the assistant's answer first"] });
  }

  return (
    <details data-testid="assistant-handoff" className="mx-4 mb-3 rounded-[var(--r-md)] border border-[var(--tile-violet-fg)] bg-[var(--tile-violet-bg)] text-xs text-[var(--fg-muted)]">
      <summary className="flex cursor-pointer items-center gap-2 p-3 text-[var(--fg)] font-medium">
        <span className="inline-flex items-center gap-1 rounded-full bg-[var(--tile-violet-fg)] px-2 py-0.5 text-[11px] font-semibold text-white">
          <Icon name="sparkles" size={12} /> AI
        </span>
        Reword with your own AI assistant (Leo, Copilot, ChatGPT…)
      </summary>
      <div className="flex flex-col gap-3 px-3 pb-3">
        <p className="m-0 leading-relaxed">
          Works in any browser. The Workbench sends nothing: you copy a request, paste it into the assistant you choose, and paste
          its answer back here. <strong className="text-[var(--fg)]">What you paste into an assistant goes to that company's service</strong>{" "}
          (Brave, Microsoft, OpenAI…), unless it runs a model on your own computer.
        </p>

        <div className="flex flex-wrap items-center gap-2">
          <span className="font-semibold text-[var(--fg)]">1.</span>
          <button type="button" className={BTN} onClick={() => void copyRequest()}>Copy Request</button>
          <span role="status" aria-live="polite">
            {copied === "ok" && "Copied. Paste it into your assistant."}
            {copied === "blocked" && "Clipboard blocked. Allow clipboard access for this site and try again."}
          </span>
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor={answerId} className="text-[var(--fg)]">
            <span className="font-semibold">2.</span> Paste the assistant's answer
          </label>
          <textarea id={answerId} value={answer} rows={4}
            onChange={(e) => { setAnswer(e.target.value); setCheck(null); }}
            className="w-full rounded-[var(--r-md)] border border-[var(--border)] bg-[var(--input-bg)] p-2 text-sm text-[var(--fg)]" />
          <div>
            <button type="button" className={BTN} onClick={checkAnswer}>Check Answer</button>
          </div>
        </div>

        <div role="status" aria-live="polite">
          {check && !check.ok && (
            <p className="m-0" data-testid="assistant-rejected">
              Not used: {check.problems.join("; ")}. The prompt above is unchanged.
            </p>
          )}
          {check?.ok && (
            <div data-testid="assistant-accepted" className="flex flex-col gap-2">
              <p className="m-0 font-semibold text-[var(--fg)]">
                AI wording from your assistant · passed the Workbench checks · {check.text.length} characters
              </p>
              <div>
                <button type="button" className={`${BTN} font-semibold`} onClick={() => onUse(check.text)}>Use This Wording</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </details>
  );
}
