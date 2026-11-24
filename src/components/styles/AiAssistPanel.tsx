import Icon from "../icons/Icon.tsx";
import type { OnDeviceAi } from "../../hooks/useOnDeviceAi.ts";

/** Always-visible AI section: status, a switch that asks first, and why it may be unavailable. */
export default function AiAssistPanel({ ai }: { ai: OnDeviceAi }) {
  const unavailable = ai.availability === "unavailable";
  const status = unavailable ? "Not Available" : ai.on ? "AI On" : "AI Off";
  return (
    <section aria-labelledby="ai-assist-title" data-testid="ai-assist"
      className={`rounded-[var(--r-md)] border p-3 flex flex-col gap-2 ${ai.on ? "border-[var(--tile-violet-fg)] bg-[var(--tile-violet-bg)]" : "border-[var(--border)] bg-[var(--input-bg)]"}`}>
      <div className="flex items-center gap-2">
        <Icon name="sparkles" size={16} className="text-[var(--tile-violet-fg)]" />
        <h3 id="ai-assist-title" className="m-0 text-sm font-semibold text-[var(--fg)]">AI Assist</h3>
        <span className="text-[11px] text-[var(--fg-subtle)]">optional · experimental</span>
        <span data-testid="ai-status"
          className={`ml-auto rounded-full px-2 py-0.5 text-[11px] font-semibold ${ai.on ? "bg-[var(--tile-violet-fg)] text-white" : "border border-[var(--border)] text-[var(--fg-muted)]"}`}>
          {status}
        </span>
      </div>
      <p className="m-0 text-xs text-[var(--fg-muted)] leading-relaxed">
        The Workbench builds every prompt <strong className="text-[var(--fg)]">without AI</strong>. With AI on, each result gets a
        <strong className="text-[var(--fg)]"> Reword with AI</strong> button. AI runs only when you click it, on this device, and its wording is always labeled.
      </p>
      <div className="flex items-center justify-between gap-3">
        <span id="ai-switch-label" className="text-sm text-[var(--fg)]">Use on-device AI</span>
        <button type="button" role="switch" aria-checked={ai.on} aria-labelledby="ai-switch-label"
          aria-describedby={unavailable ? "ai-unavailable" : undefined}
          disabled={unavailable}
          onClick={() => (ai.on ? ai.turnOff() : ai.requestOn())}
          className={`relative h-6 w-11 shrink-0 rounded-full border transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${ai.on ? "bg-[var(--tile-violet-fg)] border-[var(--tile-violet-fg)]" : "bg-[var(--bg-subtle)] border-[var(--border)]"}`}>
          <span aria-hidden="true" className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-all ${ai.on ? "left-6" : "left-0.5"}`} />
        </button>
      </div>
      {unavailable && (
        <p id="ai-unavailable" className="m-0 text-xs text-[var(--fg-muted)] leading-relaxed">
          This browser doesn't offer on-device AI. It needs desktop Chrome with Chrome's built-in AI (Gemini Nano) on a computer that
          can run it; Safari, Firefox and phones don't have it.{" "}
          <a href="https://developer.chrome.com/docs/ai/prompt-api" target="_blank" rel="noreferrer noopener" className="underline">
            Chrome's requirements
          </a>
          . Everything else in the Workbench works without it.
        </p>
      )}
      {!unavailable && !ai.on && ai.availability !== "available" && (
        <p className="m-0 text-xs text-[var(--fg-muted)]">Chrome will need to download its AI model from Google before the first rewording. You'll be asked first.</p>
      )}
    </section>
  );
}
