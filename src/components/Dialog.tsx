import { useEffect, useRef } from "react";

export type DialogKind = "ok" | "error";
export type ShowDialog = (kind: DialogKind, title: string, body: string) => void;

export interface DialogState {
  open: boolean;
  kind: DialogKind;
  title: string;
  body: string;
}

export const CLOSED_DIALOG: DialogState = { open: false, kind: "ok", title: "", body: "" };

interface DialogProps {
  state: DialogState;
  onClose: () => void;
}

export default function Dialog({ state, onClose }: DialogProps) {
  const confirmRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!state.open) return;
    confirmRef.current?.focus();
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [state.open, onClose]);

  if (!state.open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="dialog-title"
      aria-describedby="dialog-body"
    >
      <div className="bg-[var(--bg-elevated)] border border-[var(--border)] rounded-[var(--r-xl)] shadow-[var(--shadow)] w-full max-w-md p-5 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 id="dialog-title" className="text-base font-semibold text-[var(--fg)]">
            {state.title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-sm text-[var(--fg-muted)] hover:text-[var(--fg)] p-1"
            aria-label="Close"
          >
            ✕
          </button>
        </div>
        <p id="dialog-body" className="text-xs text-[var(--fg-muted)] leading-relaxed">
          {state.body}
        </p>
        <div className="flex justify-end pt-2">
          <button
            ref={confirmRef}
            type="button"
            onClick={onClose}
            className="h-9 px-4 rounded-[var(--r-md)] bg-[var(--accent)] hover:opacity-90 text-[var(--accent-fg)] font-semibold text-xs transition-colors"
          >
            {state.kind === "ok" ? "OK" : "Got It"}
          </button>
        </div>
      </div>
    </div>
  );
}
