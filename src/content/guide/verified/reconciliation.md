# Reconciliation — Manuscript vs. Workbench v4

The complete documentation has been migrated from the author's **157-page DOCX manuscript**. It contains substantial production teaching, code descriptions, examples, tables, lexicon inventories and genre reference material. The original text is retained as **source-manuscript material**, not silently presented as the final authority on the current code.

Current v4 facts from the running repository and current official Suno Help Center content take priority when a historical source passage disagrees.

## Corrections applied to the public reading experience

1. **Skills Studio is retired.** Its dedicated Chapter 12 and obsolete catalog portion of Appendix F are excluded from active documentation.
2. **Lyrics Remixer is retired.** Lyrics Studio Custom Sequence remains, but a complete automatic sequence-preserving lyric rewrite is still a future plan.
3. **Old title and ID are obsolete.** v4 uses the real 10-digit unsigned plan seed plus BPM, key (or `--`) and character count; the random hexadecimal identifier and decorative three-word track name no longer apply.
4. **Compiler path changes.** Core source files now reside in `src/lib/suno/`, not the older `src/compiler/` tree.
5. **Suno models changed.** The active family is v6, v6-wild and v6-mini. All pre-v6 models are retired for new generation.
6. **Slider percentages are contextual.** Weirdness is Safe → Chaos with 50% the documented normal; Style Influence is Loose → Strong; Audio Influence appears for uploads; Variety 0 preserves exact Styles tags. Old absolute settings recipes are producer suggestions, not Suno mandates.
7. **Some historical “925–975” examples are longer than 975 characters.** Appendix D is retained for study, but is explicitly **not paste-ready validated output**.
8. **The manuscript includes old lock/provenance/role-rotation labels and blend-band descriptions.** Treat them as historical architecture commentary unless verified against current TypeScript.
9. **Privacy is a separate policy.** See `/privacy-policy` for SEVNTHLABS legal/privacy information.
10. **“Code-verified” is a claim on the original manuscript cover**, not a new certification of every archived paragraph.

## Reading the source material

**Current v4** means the running Workbench implementation.

**Suno official** means a Suno Help Center or Terms fact, checked on the date specified.

**Source manuscript** means the author's long-form historical text. Its production techniques and illustrations may still be valuable, but some UI paths, source file names and numeric prescriptions are outdated.

**Producer guidance** is a musical heuristic, not an official platform guarantee.

The reference chapters retain depth and searchable text. Where a chapter carries a caution above its content, follow the caution and the current introductory chapters rather than treating every old code statement literally.

## Maintenance rule

When the app or Suno evolves, reconcile the current-summary chapters first. Keep manuscript changes trackable in Git and do not rewrite the historical record to conceal differences.

## Useful links

- Source repository: https://github.com/iamsevnth/suno-styles-workbench
- Suno v6 FAQ: https://help.suno.com/en/articles/13924481
- Creative Sliders: https://help.suno.com/en/articles/6141377
- Release Notes: https://suno.com/release-notes

## Diagrams in the manuscript

The source DOCX contains visual summaries of vocal character budgeting, genre-family coverage and slider interactions. The web reader supplies **code-backed live visualizations** for the first two and an updated **illustrative** slider interaction map. The original dated images are not used as authoritative current data; the surrounding explanations and underlying reference material remain in the migrated chapters.
