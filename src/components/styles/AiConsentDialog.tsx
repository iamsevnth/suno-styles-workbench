import { useEffect, useRef } from "react";
import Icon from "../icons/Icon.tsx";
import type { AiAvailability } from "../../lib/ai/on-device.ts";

/** Asks before on-device AI is turned on. "Keep AI Off" is the default button. */
export default function AiConsentDialog({ availability, onAgree, onDecline }: {
  availability: AiAvailability;
  onAgree: () => void;
  onDecline: () => void;
}) {
  const keepOff = useRef<HTMLButtonElement>(null);
  const box = useRef<HTMLDivElement>(null);
  const declineRef = useRef(onDecline);
  declineRef.current = onDecline;
  useEffect(() => {
    // Return focus to whatever opened the dialog (the AI switch) when it closes.
    const opener = document.activeElement as HTMLElement | null;
    keepOff.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") return declineRef.current();
      if (e.key !== "Tab" || !box.current) return;
      // Keep Tab and Shift+Tab inside the dialog while the decision is pending.
      const items = Array.from(box.current.querySelectorAll<HTMLElement>("button, a[href], input, select, textarea, [tabindex]:not([tabindex='-1'])"));
      if (!items.length) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey && (document.activeElement === first || !box.current.contains(document.activeElement))) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && (document.activeElement === last || !box.current.contains(document.activeElement))) {
        e.preventDefault();
        first.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      opener?.focus?.();
    };
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" role="dialog" aria-modal="true"
      aria-labelledby="ai-consent-title" aria-describedby="ai-consent-body">
      <div ref={box} className="bg-[var(--bg-elevated)] border border-[var(--border)] rounded-[var(--r-xl)] shadow-[var(--shadow)] w-full max-w-lg p-5 flex flex-col gap-3">
        <h2 id="ai-consent-title" className="flex items-center gap-2 text-base font-semibold text-[var(--fg)] m-0">
          <Icon name="sparkles" size={18} className="text-[var(--tile-violet-fg)]" />
          Turn On On-Device AI?
        </h2>
        <div id="ai-consent-body" className="text-sm text-[var(--fg-muted)] leading-relaxed flex flex-col gap-2">
          <p className="m-0">With AI on, each result gets a <strong className="text-[var(--fg)]">Reword with AI</strong> button. Here is exactly what happens:</p>
          <ul className="m-0 pl-5 list-disc flex flex-col gap-1">
            <li><strong className="text-[var(--fg)]">AI only runs when you click Reword with AI</strong>, on one result at a time. It never runs by itself.</li>
            <li>It changes only the wording of that prompt. The Workbench engine still builds every prompt, and the plan, genres, BPM and roles stay the same.</li>
            <li>AI wording is shown only if it passes the Workbench's checks, and it is always labeled <strong className="text-[var(--fg)]">AI wording</strong>. Prompts without that label were written without AI.</li>
            <li>The model runs in Chrome on this computer. The Workbench sends nothing to an AI service.</li>
            {availability !== "available" && (
              <li>Chrome doesn't have the model yet. It will ask you again before it downloads the model from Google, the first time you reword.</li>
            )}
          </ul>
          <p className="m-0">You can turn AI off at any time in AI Assist.</p>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <button ref={keepOff} type="button" onClick={onDecline}
            className="h-9 px-4 rounded-[var(--r-md)] border border-[var(--border)] text-[var(--fg)] text-xs font-semibold hover:bg-[var(--bg-subtle)]">
            Keep AI Off
          </button>
          <button type="button" onClick={onAgree}
            className="h-9 px-4 rounded-[var(--r-md)] bg-[var(--accent)] hover:opacity-90 text-[var(--accent-fg)] font-semibold text-xs">
            Turn On AI
          </button>
        </div>
      </div>
    </div>
  );
}
