import React from "react";
import { useResizableDeck } from "../../hooks/useResizableDeck.ts";
import { StudioRouteId } from "../../routes.ts";
import ResizeHandles from "./ResizeHandles.tsx";
import StudioTabs from "./StudioTabs.tsx";
import { headlineCase } from "../../lib/text/headline-case.ts";
import { LogoMark } from "../layout/Logo.tsx";

const HEADINGS: Record<StudioRouteId, { title: string; intro: string; chip: string }> = {
  styles: {
    title: "Styles Compiler",
    intro:
      "Create a Styles prompt from a brief or switch to Fix Existing Prompt to rebuild a prompt that is vague, conflicted or hard for Suno to follow. Everything compiles locally in your browser.",
    chip: "925–975 characters",
  },
  lyrics: {
    title: "Lyrics Studio",
    intro:
      "Build a song structure with exact section and line counts, draft or finish lyrics, then convert them to American English phonetic spellings for Suno's Lyrics field.",
    chip: "Structure & phonetics",
  },
};

export default function StudioDeck({ route, children }: { route: StudioRouteId; children: React.ReactNode }) {
  const deck = useResizableDeck();
  const heading = HEADINGS[route];
  const hasCustomSize = deck.width != null || deck.height != null;

  return (
    <main
      id="main"
      className="mx-auto px-2 sm:px-4 py-4 sm:py-6 flex-1 w-full flex flex-col items-center gap-6"
      style={{ width: deck.width ? `${deck.width}px` : "100%", maxWidth: deck.width ? `${deck.width}px` : "76rem" }}
    >
      <div
        ref={deck.deckRef}
        className={`rounded-2xl border border-[var(--border)] bg-[var(--bg-elevated)] shadow-2xl flex flex-col relative w-full overflow-hidden ${
          deck.resizing ? "select-none ring-2 ring-[var(--accent)]/50" : ""
        }`}
        style={{ height: deck.height ? `${deck.height}px` : "auto" }}
      >
        <StudioTabs active={route} />

        <div className="px-5 sm:px-6 py-4 bg-[var(--bg-elevated)] border-b border-[var(--border)] flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-3">
              <LogoMark height={36} />
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[var(--fg)]">
                {headlineCase(heading.title)}
              </h1>
            </div>
            <p className="text-xs text-[var(--fg-muted)] mt-1 max-w-2xl leading-relaxed">{heading.intro}</p>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs font-mono text-[var(--fg-subtle)]">
            <span className="px-3 py-1 rounded-lg bg-[var(--bg)] border border-[var(--border)] text-[var(--fg-muted)]">
              {heading.chip}
            </span>
            {hasCustomSize && (
              <>
                <span className="px-2.5 py-1 rounded-lg bg-[var(--accent)]/15 text-[var(--accent)] border border-[var(--accent)]/30 font-semibold text-[11px]">
                  ⤢ {deck.width ? `${deck.width}w` : "Auto"} × {deck.height ? `${deck.height}h` : "Auto"}
                </span>
                <button
                  type="button"
                  onClick={deck.resetSize}
                  className="px-2.5 py-1 rounded-lg bg-[var(--bg)] hover:bg-[var(--bg-subtle)] text-[var(--fg-muted)] hover:text-[var(--fg)] border border-[var(--border)] transition-colors text-[11px]"
                  title="Reset the workspace to its default size"
                >
                  ⟲ Reset Size
                </button>
              </>
            )}
            <button
              type="button"
              onClick={deck.toggleFullWidth}
              className="px-2.5 py-1 rounded-lg bg-[var(--bg)] hover:bg-[var(--bg-subtle)] text-[var(--fg-muted)] hover:text-[var(--fg)] border border-[var(--border)] transition-colors hidden md:inline-flex items-center gap-1 text-[11px]"
            >
              {deck.isFullWidth ? "⤡ Default Width" : "⤢ Full Width"}
            </button>
          </div>
        </div>

        <div className="p-4 sm:p-6 bg-[var(--bg)] flex-1 overflow-y-auto">{children}</div>

        <ResizeHandles onStart={deck.startResize} />
      </div>
    </main>
  );
}
