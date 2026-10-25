import { useState } from "react";
import { toTitleCase } from "../../lib/suno/title-case.ts";
import { HistoryEntry } from "../../lib/suno/types.ts";

interface HistoryPanelProps {
  history: HistoryEntry[];
  onCopy: (styles: string) => void;
  onExport: () => void;
  onClear: () => void;
}

const SMALL_BUTTON =
  "h-8 px-3 rounded-[var(--r-md)] border border-[var(--border)] bg-[var(--bg)] text-xs text-[var(--fg-muted)] hover:text-[var(--fg)] font-medium transition-colors";

export default function HistoryPanel({ history, onCopy, onExport, onClear }: HistoryPanelProps) {
  const [listOpen, setListOpen] = useState(true);
  const [openEntries, setOpenEntries] = useState<Record<string, boolean>>({});

  return (
    <section
      aria-label="History"
      className="mt-8 bg-[var(--bg-elevated)] border border-[var(--border)] rounded-[var(--r-xl)] shadow-[var(--shadow)] p-5 flex flex-col gap-4"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => setListOpen((open) => !open)}
          aria-expanded={listOpen}
          className="text-sm font-semibold text-[var(--fg)] hover:text-[var(--accent)] transition-colors"
        >
          History · {history.length} {listOpen ? "▴" : "▾"}
        </button>
        <div className="flex items-center gap-2">
          <button type="button" onClick={onExport} disabled={!history.length} className={`${SMALL_BUTTON} hover:bg-[var(--bg-subtle)]`}>
            Export History
          </button>
          <button
            type="button"
            onClick={() => {
              setOpenEntries({});
              onClear();
            }}
            disabled={!history.length}
            className={`${SMALL_BUTTON} hover:bg-red-500/10 hover:border-red-400/40 hover:text-red-300 light:hover:text-red-700`}
          >
            Clear History
          </button>
        </div>
      </div>

      <p className="text-xs text-[var(--fg-subtle)] leading-relaxed">
        Every Generate Styles run is saved in this browser only. Export History downloads a dated JSON file so no export
        overwrites another.
      </p>

      {listOpen && (
        <div className="flex flex-col gap-2">
          {history.length === 0 ? (
            <p className="text-xs text-[var(--fg-subtle)]">No styles generated yet.</p>
          ) : (
            [...history].reverse().map((entry) => {
              const open = !!openEntries[entry.id];
              return (
                <div key={entry.id} className="rounded-[var(--r-md)] border border-[var(--border)] bg-[var(--bg)] overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setOpenEntries((prev) => ({ ...prev, [entry.id]: !prev[entry.id] }))}
                    aria-expanded={open}
                    className="w-full text-left p-3 hover:bg-[var(--bg-subtle)]/40 transition-colors"
                  >
                    <div className="text-xs font-medium text-[var(--fg)] truncate">{entry.brief}</div>
                    <div className="text-[11px] text-[var(--fg-subtle)] mt-0.5">
                      {new Date(entry.createdAt).toLocaleString("en-US")} · {entry.prompts.length} styles · seed {entry.seed}
                    </div>
                  </button>

                  {open && (
                    <div className="border-t border-[var(--border)] p-3 flex flex-col gap-3">
                      {entry.prompts.map((p) => (
                        <div key={p.recipeId ?? p.title}>
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-xs font-medium text-[var(--fg)]">{toTitleCase(p.title)}</p>
                            <button
                              type="button"
                              onClick={() => onCopy(p.styles)}
                              className="text-[11px] text-[var(--fg-muted)] hover:text-[var(--fg)]"
                            >
                              Copy Style
                            </button>
                          </div>
                          <p className="whitespace-pre-wrap text-xs text-[var(--fg-muted)] mt-1 leading-relaxed">{p.styles}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}
    </section>
  );
}
