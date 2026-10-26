# Guide Migration & v4 Reconciliation Audit

Date: 2026-10-26
Branch: `workbench/full-manual-guide-v4`
Source manuscript: `suno-workbench-guide-authoritative-overhaul.docx` (157 pages)
Target: `/guide`, including the single-file offline HTML.

## Migration design

- The author's prose and extensive reference material were normalized into `src/content/guide/manuscript/*.md`.
- Three new v4-facing chapters are in `src/content/guide/verified/*.md`: current Workbench operations, official Suno v6 controls, and reconciliation.
- `src/lib/guide/manifest.ts` provides stable chapter IDs, groups, status and warnings.
- `src/lib/guide/content.ts` bundles the text using eager Vite `?raw` imports. No CMS, network request, tracking, backend or extra runtime dependency is required.
- `src/lib/guide/search.ts` searches the entire bundled corpus locally.
- `src/pages/guide/GuidePage.tsx` implements search, chapters, excerpt previews, highlighting, desktop/mobile navigation and deep links.
- Large original DOCX table text is preserved in scrollable reference blocks. It has not been hand-rebuilt into all 77 original Word tables; readers should treat layout-specific originals as manuscript evidence rather than pixel-exact Word reproductions.
- The original diagrams were reconciled as theme-aware live genre and vocal-budget visualizations plus a conceptual v6 slider matrix.

## Reconciliation priority

1. **Live TypeScript** determines Workbench controls, type names, rendering, constraints, seeds and family routing.
2. **Official Suno sources** determine platform models, sliders, release notes and contractual terms.
3. **Source manuscript** provides the extensive production reference, illustrations, workflows, recipes, terminology and historical architecture.
4. **Producer guidance** is advisory rather than proof of a guaranteed acoustic result.

## Chapter-by-chapter disposition

| Source chapter | Destination | Current status / required caution |
| --- | --- | --- |
| 1. Deterministic paradigm | ch01 | Conceptual; older model explanations are historical |
| 2. Quick Start/UI | ch02 | Superseded by current-workbench; historical tabs/locks noted |
| 3. Parser | ch03 | Current modules under `src/lib/suno/`; old parser details require code checking |
| 4. Genre ontology | ch04 | Preserved, with live `allStyles()` / `familyKeys()` chart |
| 5. Blend bands | ch05 | Historical methodology; do not assume blend weights are current code |
| 6. Sonic planner | ch06 | Historical tier/variant/provenance details separated from actual 1–6 variations |
| 7. Vocal budgeting | ch07 | Live `VOCAL_BUDGET.compact=150`, `detailed=300` visual; older five-tier discussion marked historical |
| 8. Renderer/titles | ch08 | Retains source discussion, but old three-word title and random hex ID superseded |
| 9. Validation | ch09 | Current hard/critical gate behavior in `validate.ts` and `generate.ts` takes priority |
| 10. Lexicon | ch10 | Historical bank inventory; v4 includes more corpus-derived phrases |
| 11. Lyrics/phonetics | ch11 | Custom Sequence present; rewrite overhaul only planned |
| 12. Skills Studio | omitted | Retired skill framework must not return as a current site feature |
| 13. Model settings | ch13 | Historical comparisons only; current v6 official controls in verified chapter |
| 14. Editor | ch14 | Reference workflow; exact current UI from Suno Release Notes |
| 15. Studio | ch15 | Reference workflow; official Oct 8 Studio improvements supersede dated controls |
| 16. Persistence/offline | ch16 | Code-backed local runtime; `/privacy-policy` governs public privacy statements |
| 17. Rights/commercial | ch17 | Historical advice; current Suno Terms and actual licenses control |
| 18. Troubleshooting | ch18 | Retained as practical producer hypotheses |
| 19. Thirty recipes | ch19 | Retained as examples, not guaranteed tested prompts |
| Appendix A. Genre tables | app-a | Historical snapshot; live library is primary |
| Appendix B. Profile formulas | app-b | Historical snapshot; `profile.ts` current data is primary |
| Appendix C. Lexicon | app-c | Historical snapshot; v4 lexicons are primary |
| Appendix D. Prompts | app-d | Some original examples exceed 975 chars; do **not** label paste-ready |
| Appendix E. 59-section encyclopedia | app-e-01 through app-e-06 | Preserved in six parts, split at numbered section boundaries |
| Appendix F. Suggestions | app-f | Retains historic suggestions; obsolete Skills Studio catalog omitted |

## Confirmed high-impact corrections

- **Models:** all pre-v6 models retired for new generations; v6 and v6-wild require Pro/Premier, v6-mini available on all plans. Source: https://help.suno.com/en/articles/13924481
- **Sliders:** Weirdness Safe → Chaos, 50% normal; Style Influence Loose → Strong; Audio Influence only with upload. Source: https://help.suno.com/en/articles/6141377
- **Variety:** 0 retains exact Styles tags; high or low values are not official universal creative prescriptions. Source: https://help.suno.com/en/articles/13924481
- **Max Mode:** higher credit/compute, useful for longer/covers/transfers/consistency. Source: https://help.suno.com/en/articles/13924481
- **Prompt identity:** actual 10-digit unsigned planning seed, BPM, Key or `--`, Total Characters. Source: `src/lib/suno/render.ts`, `generate.ts`.
- **Output window:** 925–975 characters. Source: `src/lib/suno/render.ts` / `validate.ts`.
- **Vocal budgets:** 150 compact / 300 detailed, not five independent current renderer budgets. Source: `src/lib/suno/render.ts`.
- **Studio:** official Oct 8 update covers downbeat detection, shift-drag clip stretching, editable fade curves and pop-out windows. Source: https://suno.com/release-notes
- **Privacy:** browser-only rendering and search; search terms are never placed into URLs. The separate SEVNTHLABS privacy page remains authoritative.

## Explicit limitations

The original DOCX's typographic page design and three bitmap figures were **not** copied pixel-for-pixel. The migration preserves text and substantially all reference material other than retired standalone Skills Studio content. Tables are rendered as safe, scrollable archival blocks when they cannot be reconstructed confidently from a flattened source. The replacement dynamic illustrations are intentionally source-backed or labelled as conceptual.

The document's claims of being “code-verified” are not adopted wholesale. Historical examples and old source-path descriptions remain visible only with source-status warnings.

## Validation expectations

- All chapters exist, are nonempty, and load from stable IDs.
- Search indexes every chapter and appendix and executes entirely client-side.
- The old `/guide#...` links map to appropriate new chapters.
- Layout works on mobile and desktop, preserving light/dark theme tokens.
- Vite, TypeScript, tests, production build and offline CSP validation all pass.
- No changes to Styles Compiler or Lyrics Studio generation behavior.
