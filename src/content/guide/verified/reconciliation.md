# Documentation Reconciliation — Workbench v5.3 and Historical Manuscript

This Guide preserves the author's long-form **157-page source manuscript** as an archive of production practices, examples, charts and lexicon material. Chapters marked **Source manuscript** are not independently re-certified to describe the current Workbench code or current Suno controls.

**Current baseline:** Suno Workbench **v5.3.0**, checked November 4, 2026. The primary current chapters are **Workbench v5.3 — Start Here**, **Prompt Fidelity Inspector — v5.3**, **Lyrics Studio Arranger — v5.2+**, and the officially sourced **Create Mode — Suno v6 Controls**.

## Changes reconciled through v5.3

1. **Retired Skills Studio and old Lyrics Remixer UI:** The dedicated Skills Studio chapter is excluded. Old Lyrics Remixer descriptions remain historical only. The shipped v5.2 **source-preserving Lyrics Arranger** replaces the generic lyric-generation UI, and preserves the American Phonetics Converter.
2. **Current song-structure workflow:** Users can paste whole lyrics or separate sections and manually/suggestedly map existing words to destination bar slots. Source spans, repetition, approximate rhyme and BPM warnings, explicit save/export and phonetics are present. The historical claim that a complete automatic arranger is only a plan is now obsolete.
3. **v5.3 Prompt Fidelity Inspector:** New text-level source-versus-output comparison covers selected BPM, key, meter, genres, instruments, voice, arrangements, source phrases and Exclude-field instructions. It reports matched, different, undetected or review-needed findings. The optional Original Intent / Brief in Fix Mode enables a common source baseline for pre-Fix and fixed comparisons. No measured audio-quality rating is provided.
4. **v5.1 / v5.1.1:** Negative instructions are separated into Exclude; Fix Mode uses preservation-first editing and fallback recompilation warnings. Legitimate Dancehall *riddim* and reggae *one-drop* terms have genre-scoped exceptions without exempting unrelated bass-music language.
5. **Candidate titles and IDs:** The live version uses the real ten-digit unsigned planning seed alongside BPM, key or `--`, and character count. Decorative generated track names and old hex IDs in the manuscript are superseded.
6. **Current source code:** The compiler lives in `src/lib/suno/`, Lyrics Arranger in `src/lib/lyrics/arranger.ts`, fidelity analysis in `src/lib/suno/fidelity.ts` and Guide content in `src/content/guide/`. Historical paths should not be treated as current.
7. **Suno v6 models:** Suno's official [v6 FAQ](https://help.suno.com/en/articles/13924481) says the v6/v6-wild/v6-mini family is current and older models are retired for new creation. Suno may change plan availability and features; use live official documentation.
8. **Controls and percentages:** Weirdness, Style Influence, Audio Influence and Variety refer to Suno controls, not Workbench sliders. The 800–975-character compiler target and the old manuscript's suggested slider percentages are not empirically certified performance optima. Set Variety to zero **for controlled exact-tag experiments**, not as a universal musical recommendation.
9. **Historical prompt examples:** Some examples labeled 925–975 characters exceed that window. They remain instructive archival text but are **not validated paste-ready Styles output**.
10. **Browser-only privacy:** Workbench's current app operates without its own analytics or remote generation API. Its persistent project save and exported files are user-directed. See the dedicated [/privacy-policy](https://sunoworkbench.com/privacy-policy) for hosting and data handling.
11. **Official v5.3 offline release:** A self-contained HTML build is distributed with the official tag `v5.3.0` as `suno-workbench-sevnthlabs-v5.3.html`; the release is built from the tagged commit and accompanied by a SHA-256 checksum when available.

## Evidentiary labels

**Current Workbench:** Checked against the active repository implementation and release commit.

**Suno official:** Verified vendor Help Center, Terms or Release Notes; authoritative for platform-specific product controls, not for Workbench's algorithm correctness.

**Source manuscript:** Archival writing and illustrations, potentially describing retired UI and source layout.

**Producer guidance:** Practical musical judgment or experiment starting point, not a guaranteed audible result.

## Reading the Guide safely

Search the full manuscript and appendices for conceptual and production vocabulary, but rely on the **current v5.3 chapters** for user-facing controls and supported features. Earlier descriptions of “lock,” provenance, source preservation, role rotation and blend bands do not establish that those exact historical components still exist.

The included illustrations of vocal character budgeting and genre-family coverage remain historical or illustrative where not matched against current code. No static visual diagram proves an external audio outcome.

## Maintenance rule

When Workbench changes, first update the current chapters, Guide manifest/index, source-status notes, source-backed references, release documentation and README. Keep historical manuscripts intact and separately labeled; do not erase the source record to conceal disagreement.

## Relevant references

- [Workbench repository](https://github.com/iamsevnth/suno-styles-workbench)
- [v5.3 Release Notes](https://github.com/iamsevnth/suno-styles-workbench/blob/main/docs/releases/v5.3.0.md)
- [Prompt Fidelity Methodology](https://github.com/iamsevnth/suno-styles-workbench/blob/main/docs/PROMPT_FIDELITY_METHODOLOGY.md)
- [Suno v6 FAQ](https://help.suno.com/en/articles/13924481)
- [Exclude](https://help.suno.com/en/articles/3161921)
- [Creative Sliders](https://help.suno.com/en/articles/6141377)
- [Suno Release Notes](https://suno.com/release-notes)
