import { useEffect, useMemo, useState } from "react";
import { ContentPage } from "../../components/content/Content.tsx";
import { LogoFull } from "../../components/layout/Logo.tsx";
import LiveGenreCoverage from "./LiveGenreCoverage.tsx";
import { GUIDE_CONTENT, type GuideChapter } from "../../lib/guide/content.ts";
import { GUIDE_ANCHOR_REDIRECTS, GUIDE_GROUPS } from "../../lib/guide/manifest.ts";
import { parseGuideBlocks } from "../../lib/guide/blocks.ts";
import { searchGuide } from "../../lib/guide/search.ts";
import { LIBRARY_STATS } from "../../lib/suno/families.ts";
import { MAX_CHARS, MIN_CHARS } from "../../lib/suno/render.ts";
import { hrefFor } from "../../routes.ts";

function initialChapter(): string {
  if (typeof window === "undefined") return "current-workbench";
  const query = new URLSearchParams(window.location.search).get("chapter");
  const legacy = window.location.protocol === "file:" ? "" : window.location.hash.replace(/^#/, "");
  const candidate = query ?? GUIDE_ANCHOR_REDIRECTS[legacy] ?? "current-workbench";
  return GUIDE_CONTENT.some((chapter) => chapter.id === candidate) ? candidate : "current-workbench";
}

/** Render text as React elements, never as untrusted HTML. */
function InlineText({ text }: { text: string }) {
  const segments = text.split(/(https?:\/\/[^\s<>]+|\*\*[^*]+\*\*|`[^`]+`)/g);
  return (
    <>
      {segments.map((part, i) => {
        if (/^https?:\/\//.test(part)) {
          const url = part.replace(/[.,;)]+$/, "");
          return (
            <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="guide-doc-link">
              {url}
            </a>
          );
        }
        if (part.startsWith("**") && part.endsWith("**")) return <strong key={i} className="text-[var(--fg)]">{part.slice(2, -2)}</strong>;
        if (part.startsWith("`") && part.endsWith("`")) return <code key={i} className="guide-doc-code">{part.slice(1, -1)}</code>;
        return <span key={i}>{part}</span>;
      })}
    </>
  );
}

function ManualBody({ chapter }: { chapter: GuideChapter }) {
  const blocks = useMemo(() => parseGuideBlocks(chapter.body), [chapter.body]);
  return (
    <div className="guide-doc-prose">
      {blocks.map((block, i) => {
        if (block.type === "heading") {
          if (block.level === 1 && i === 0) return null; // Article already has one h1.
          const headingId = `${chapter.id}-part-${i}`;
          return block.level === 3 ? (
            <h3 id={headingId} key={i} className="guide-doc-h3"><InlineText text={block.text} /></h3>
          ) : (
            <h2 id={headingId} key={i} className="guide-doc-h2"><InlineText text={block.text} /></h2>
          );
        }
        if (block.type === "list") return (
          <ul key={i} className="guide-doc-list">
            {block.items.map((item, j) => <li key={j}><InlineText text={item} /></li>)}
          </ul>
        );
        if (block.type === "pre") return <pre key={i} className="guide-doc-pre">{block.text}</pre>;
        return <p key={i} className="guide-doc-paragraph"><InlineText text={block.text} /></p>;
      })}
    </div>
  );
}

function StatusPill({ status }: { status: GuideChapter["status"] }) {
  const label = status === "current" ? "Current Workbench" : status === "official" ? "Suno Official" : "Source Manuscript";
  return <span className={`guide-doc-status guide-doc-status-${status}`}>{label}</span>;
}

function ChapterNav({ activeId, onChoose }: { activeId: string; onChoose: (id: string) => void }) {
  return (
    <nav className="guide-manual-chapters" aria-label="Guide chapters">
      {GUIDE_GROUPS.map((group) => (
        <div key={group} className="guide-manual-group">
          <p className="guide-manual-group-label">{group}</p>
          {GUIDE_CONTENT.filter((chapter) => chapter.group === group).map((chapter) => (
            <button
              key={chapter.id}
              type="button"
              onClick={() => onChoose(chapter.id)}
              aria-current={activeId === chapter.id ? "page" : undefined}
              className={`guide-manual-chapter ${activeId === chapter.id ? "is-current" : ""}`}
            >
              {chapter.title}
            </button>
          ))}
        </div>
      ))}
    </nav>
  );
}

export default function GuidePage() {
  const [activeId, setActiveId] = useState(initialChapter);
  const [search, setSearch] = useState("");
  const [mobileOpen, setMobileOpen] = useState(false);
  const activeIndex = GUIDE_CONTENT.findIndex((chapter) => chapter.id === activeId);
  const active = GUIDE_CONTENT[activeIndex] ?? GUIDE_CONTENT[0];
  const hits = useMemo(() => searchGuide(GUIDE_CONTENT, search), [search]);
  const previous = activeIndex > 0 ? GUIDE_CONTENT[activeIndex - 1] : null;
  const next = activeIndex + 1 < GUIDE_CONTENT.length ? GUIDE_CONTENT[activeIndex + 1] : null;

  useEffect(() => {
    const refresh = () => setActiveId(initialChapter());
    window.addEventListener("popstate", refresh);
    return () => window.removeEventListener("popstate", refresh);
  }, []);

  function chooseChapter(id: string) {
    if (!GUIDE_CONTENT.some((chapter) => chapter.id === id)) return;
    setActiveId(id);
    setMobileOpen(false);
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      url.searchParams.set("chapter", id);
      if (window.location.protocol !== "file:") url.hash = "";
      try { window.history.pushState({ chapter: id }, "", url.href); } catch { /* local file history is optional */ }
      document.getElementById("guide-reader")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  return (
    <ContentPage className="guide-page guide-docs-page">
      <header className="guide-hero guide-doc-hero flex flex-col gap-4 w-full">
        <LogoFull width={190} />
        <p className="label-caps eyebrow">Complete Reference Manual · v4</p>
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-[var(--fg)]">
          The complete Suno Workbench Guide
        </h1>
        <p className="text-sm sm:text-base text-[var(--fg-muted)] leading-relaxed max-w-3xl">
          A searchable, chapter-based edition of the full production and engineering manuscript, with verified v4
          guidance and authoritative Suno v6 updates separated from historical reference material.
        </p>
        <label className="guide-doc-search-label" htmlFor="guide-search">Search every chapter, recipe and appendix</label>
        <input
          id="guide-search"
          type="search"
          autoComplete="off"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Try: Phrygian, vocal budget, sidechain, studio, 140 BPM..."
          className="guide-doc-search"
          aria-controls="guide-search-results"
        />
        <div className="guide-doc-metrics" aria-label="Guide and compiler facts">
          <span>{GUIDE_CONTENT.length} chapters &amp; reference parts</span>
          <span>{LIBRARY_STATS.genres} recognized genres</span>
          <span>{MIN_CHARS}–{MAX_CHARS} Styles characters</span>
          <span>Offline searchable</span>
        </div>
      </header>

      <div id="guide-reader" className="guide-reader-grid scroll-mt-24">
        <aside className="guide-reader-sidebar">
          <div className="guide-reader-sidebar-inner">
            <div className="guide-reader-sidebar-head">
              <strong>Contents</strong>
              <span>{GUIDE_CONTENT.length} entries</span>
            </div>
            <div className="guide-reader-desktop-nav">
              <ChapterNav activeId={active.id} onChoose={chooseChapter} />
            </div>
            <div className="guide-reader-mobile-nav">
              <button type="button" className="guide-manual-mobile-toggle" onClick={() => setMobileOpen((value) => !value)} aria-expanded={mobileOpen}>
                Browse chapters {mobileOpen ? "−" : "+"}
              </button>
              {mobileOpen && <ChapterNav activeId={active.id} onChoose={chooseChapter} />}
              <label htmlFor="guide-chapter-select" className="sr-only">Select guide chapter</label>
              <select id="guide-chapter-select" value={active.id} onChange={(e) => chooseChapter(e.target.value)} className="guide-chapter-select">
                {GUIDE_CONTENT.map((chapter) => <option value={chapter.id} key={chapter.id}>{chapter.title}</option>)}
              </select>
            </div>
          </div>
        </aside>

        <div className="guide-reader-main">
          {search.trim() && (
            <section id="guide-search-results" className="guide-search-results" aria-live="polite">
              <div className="guide-search-results-head">
                <h2>Search results</h2>
                <span>{hits.length} matching chapters</span>
              </div>
              {hits.length ? (
                <div className="guide-search-hit-grid">
                  {hits.map(({ chapter, excerpt }) => (
                    <button type="button" key={chapter.id} className="guide-search-hit" onClick={() => { chooseChapter(chapter.id); setSearch(""); }}>
                      <strong>{chapter.title}</strong>
                      <span>{excerpt}</span>
                    </button>
                  ))}
                </div>
              ) : (
                <p className="guide-search-empty">No chapter matches all your search terms. Try fewer or more specific words.</p>
              )}
            </section>
          )}

          <article key={active.id} className="guide-doc-article" aria-labelledby="guide-active-title">
            <div className="guide-doc-article-head">
              <StatusPill status={active.status} />
              <p className="guide-doc-position">Chapter {activeIndex + 1} of {GUIDE_CONTENT.length}</p>
              <h1 id="guide-active-title">{active.title}</h1>
              {active.status === "manuscript" && (
                <p className="guide-doc-warning">
                  Historical manuscript reference: this section preserves the author's detailed source material.
                  Its older UI instructions and numeric prescriptions may not match v4.
                  {active.note ? ` ${active.note}` : ""}
                  {" "}Start with <button type="button" onClick={() => chooseChapter("reconciliation")}>Reconciliation &amp; Source Status</button> when in doubt.
                </p>
              )}
              {active.status === "official" && (
                <p className="guide-doc-source-date">Official Suno documentation checked October 26, 2026. Controls and plans may change.</p>
              )}
            </div>

            {active.id === "ch04" && <LiveGenreCoverage />}
            <ManualBody chapter={active} />

            <footer className="guide-doc-pager">
              {previous ? <button type="button" onClick={() => chooseChapter(previous.id)}>← {previous.title}</button> : <span />}
              {next ? <button type="button" onClick={() => chooseChapter(next.id)}>{next.title} →</button> : <span />}
            </footer>
          </article>
          <p className="guide-doc-privacy-note">
            Everything is searchable directly in your browser. No guide text or search query is sent to a server.
            <a href={hrefFor("privacy")}> Read the Privacy Policy.</a>
          </p>
        </div>
      </div>
    </ContentPage>
  );
}
