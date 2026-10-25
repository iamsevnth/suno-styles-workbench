import { StylesWorkbench } from "../../hooks/useStylesWorkbench.ts";
import Icon from "../icons/Icon.tsx";

const TRUST_NOTES = [
  "Only Generate Styles or Fix Prompt compiles prompts — examples, profile changes and the variation slider never run by themselves",
  "Every prompt lands between 925 and 975 characters, with an integer BPM and no artist names",
  "Export History downloads a uniquely dated JSON file to your computer",
];

export default function BriefPanel({ wb }: { wb: StylesWorkbench }) {
  const showParsed = wb.prompts.length > 0 || wb.input.trim().length > 0;
  const fixing = wb.compilerMode === "fix";

  return (
    <section aria-label="Brief and controls" className="surface rounded-[var(--r-xl)] p-5 flex flex-col gap-5">
      <div className="grid grid-cols-2 gap-2 rounded-[var(--r-md)] border border-[var(--border)] bg-[var(--bg)] p-1">
        <button
          type="button"
          aria-pressed={!fixing}
          onClick={() => wb.setCompilerMode("create")}
          className={`rounded-[calc(var(--r-md)-4px)] px-3 py-2 text-xs font-semibold transition-colors ${
            !fixing
              ? "bg-[var(--nav-active-bg)] text-[var(--nav-active-fg)]"
              : "text-[var(--fg-muted)] hover:text-[var(--fg)]"
          }`}
        >
          Create From Brief
        </button>
        <button
          type="button"
          aria-pressed={fixing}
          onClick={() => wb.setCompilerMode("fix")}
          className={`rounded-[calc(var(--r-md)-4px)] px-3 py-2 text-xs font-semibold transition-colors ${
            fixing
              ? "bg-[var(--nav-active-bg)] text-[var(--nav-active-fg)]"
              : "text-[var(--fg-muted)] hover:text-[var(--fg)]"
          }`}
        >
          Fix Existing Prompt
        </button>
      </div>

      <div>
        <label htmlFor="brief" className="flex items-center gap-2 text-sm font-semibold mb-2 text-[var(--fg)]">
          <Icon name="fileText" size={17} className="text-[var(--tile-violet-fg)]" />
          {fixing ? "Existing Suno Styles Prompt" : "Your Creative Brief"}
        </label>
        <textarea
          id="brief"
          ref={wb.briefRef}
          rows={8}
          value={wb.input}
          onChange={(e) => wb.setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) wb.generate();
          }}
          placeholder={
            fixing
              ? "Paste the Styles prompt you already tried in Suno."
              : "e.g. Trap + Baile Funk + Deep Dubstep, kinetic, 140 BPM, female vocals"
          }
          className="w-full rounded-[var(--r-md)] border border-[var(--border)] bg-[var(--input-bg)] text-[var(--fg)] p-3 text-sm focus:border-[var(--ring)] transition-all resize-y"
        />
        <p className="text-[11px] text-[var(--fg-subtle)] mt-1.5">
          {fixing
            ? "Rebuilds the prompt around the intent it can identify: clearer hierarchy, positive wording, focused genres and fewer conflicting instructions. Named tempo, genres, instruments and vocal details are preserved when detected."
            : "Name genres, a BPM, vocals, instruments and mood. Ctrl+Enter (Cmd+Enter on a Mac) generates."}
        </p>
      </div>

      {!fixing && (
        <div>
        <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
          <span className="flex items-center gap-2 text-sm font-semibold text-[var(--fg)]">
            <Icon name="lightbulb" size={17} className="text-[var(--tile-amber-fg)]" />
            Example Briefs
          </span>
          <button
            type="button"
            onClick={wb.refreshSuggestions}
            className="inline-flex items-center gap-1.5 h-8 px-2.5 rounded-[var(--r-md)] text-xs font-medium hover:text-[var(--fg)] bg-[var(--bg-elevated)] hover:bg-[var(--bg-subtle)] border border-[var(--border)] transition-colors text-[var(--link)]"
          >
            <Icon name="refresh" size={13} />
            Refresh
          </button>
        </div>
        <div className="flex flex-col gap-2">
          {wb.suggestions.map((example, i) => (
            <button
              key={example}
              type="button"
              onClick={() => wb.applySuggestion(example)}
              className="group w-full text-left whitespace-normal break-words rounded-[var(--r-md)] border border-[var(--border)] bg-[var(--input-bg)] p-3 text-xs leading-relaxed text-[var(--fg-muted)] hover:border-[var(--border-strong)] hover:text-[var(--fg)] transition-all flex items-center gap-3"
            >
              {i === 0 && (
                <Icon
                  name="sparkles"
                  size={16}
                  className="text-[var(--tile-magenta-fg)]"
                />
              )}
              <span className="flex-1 min-w-0">
                {i === 0 && <span className="label-caps-sm block mb-0.5 light:text-[var(--fg)]">Always Available</span>}
                {example}
              </span>
              <Icon
                name="chevronRight"
                size={15}
                className="text-[var(--fg-subtle)] opacity-60 group-hover:opacity-100 transition-opacity"
              />
            </button>
          ))}
        </div>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="count" className="flex items-center gap-2 text-sm font-semibold mb-1.5 text-[var(--fg)]">
            <Icon name="sliders" size={16} className="text-[var(--tile-blue-fg)]" />
            Variations
          </label>
          <div className="flex items-center gap-3">
            <input
              id="count"
              type="range"
              min={1}
              max={6}
              value={wb.count}
              onChange={(e) => wb.setCount(Number(e.target.value))}
              className="w-full accent-[var(--accent)] cursor-pointer"
            />
            <span className="font-mono text-sm tabular-nums w-6 text-center text-[var(--fg)]">{wb.count}</span>
          </div>
        </div>

        <label
          className="flex h-11 items-center justify-between gap-3 rounded-[var(--r-md)] border border-[var(--border)] bg-[var(--input-bg)] px-3 text-sm cursor-pointer select-none self-end"
          title="Blends in the built-in hybrid bass library when the brief leaves genres or moods open"
        >
          <span className="flex items-center gap-2 text-[var(--fg)] font-medium">
            <Icon name="audio" size={16} className="text-[var(--tile-violet-fg)]" />
            Hybrid Bass Profile
          </span>
          <input
            type="checkbox"
            checked={wb.profileEnabled}
            onChange={(e) => wb.toggleProfile(e.target.checked)}
            className="w-4 h-4 accent-[var(--accent)] rounded cursor-pointer"
          />
        </label>
      </div>

      <div className="flex flex-wrap gap-2 pt-1">
        <button
          type="button"
          onClick={wb.generate}
          disabled={wb.isGenerating}
          className="btn-primary flex-1 inline-flex items-center justify-center gap-2 h-11 rounded-[var(--r-md)] font-semibold text-sm transition-all"
        >
          <Icon name="sparkles" size={16} />
          {wb.isGenerating ? "Generating..." : fixing ? "Fix Prompt" : "Generate Styles"}
        </button>
        <button
          type="button"
          onClick={wb.reset}
          className="inline-flex items-center justify-center gap-1.5 h-11 px-4 rounded-[var(--r-md)] border border-[var(--border)] bg-[var(--bg-elevated)] hover:border-red-400/40 hover:bg-red-500/10 text-[var(--fg)] text-sm font-medium transition-all light:hover:border-red-300 light:hover:bg-red-50"
        >
          <Icon name="reset" size={14} />
          Reset
        </button>
      </div>

      <p className="text-xs text-[var(--fg-muted)] min-h-[1rem]" role="status" aria-live="polite">
        {wb.lastAction}
      </p>

      <div className="rounded-[var(--r-md)] border border-[var(--border)] bg-[var(--bg)] light:bg-[var(--bg-subtle)] p-3 text-xs text-[var(--fg-muted)]">
        <div className="flex items-center gap-2 font-semibold text-sm text-[var(--fg)] mb-1.5">
          <Icon name="listChecks" size={16} className="text-[var(--tile-orange-fg)]" />
          Parsed Intent
        </div>
        {!showParsed ? (
          <p className="text-[var(--fg-subtle)]">{fixing ? "Waiting for an existing prompt." : "Waiting for a brief — nothing loads by default."}</p>
        ) : (
          <div className="font-mono tabular-nums flex flex-col gap-1">
            <div>
              Genres:{" "}
              <span className="text-[var(--fg)]">
                {wb.parsed?.genres?.join(" · ") || (wb.input.trim() ? "inferred on generate" : "—")}
              </span>
            </div>
            <div>
              BPM: <span className="text-[var(--fg)]">{wb.parsed?.bpm ?? "—"}</span> · Moods:{" "}
              <span className="text-[var(--fg)]">{(wb.parsed?.moods || []).slice(0, 4).join(", ") || "—"}</span>
            </div>
            <div>
              Mode: <span className="text-[var(--fg)]">{wb.parsed?.mode || "—"}</span> · Profile:{" "}
              <span className="text-[var(--fg)]">{wb.profileEnabled ? "on" : "off"}</span> · Seed:{" "}
              <span className="text-[var(--fg)]">{wb.seedUsed || "—"}</span>
            </div>
          </div>
        )}
      </div>

      <ul className="list-none p-0 m-0 flex flex-col gap-1.5 text-xs text-[var(--fg-subtle)] pt-1">
        {TRUST_NOTES.map((note) => (
          <li key={note} className="flex items-start gap-2">
            <span className="w-2 h-2 rounded-full bg-[var(--ok)] mt-1 shrink-0" aria-hidden="true" />
            <span>{note}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
