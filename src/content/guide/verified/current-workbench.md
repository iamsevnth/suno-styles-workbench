# Suno Workbench v5.3 — Start Here

**Current Workbench documentation, checked November 4, 2026.** The earlier v4 manuscript remains available as historical reference; use this chapter and the other **Current** chapters when instructions conflict.

## What Workbench Does

Suno Workbench is a **browser-only, deterministic Styles Compiler, source-preserving Lyrics Arranger and Prompt Fidelity Inspector** with a searchable production Guide and a downloadable, self-contained offline HTML edition. It does not create music, call Suno's generation API, or send original prompts or lyric content to an application backend.

Workbench's Styles Compiler targets 800–975 characters with a 1,000-character hard cap. These are **Workbench application constraints**, not Suno-published optimal prompt lengths. Suno determines the generated audio, so compliance with a text rule never proves an audible result.

## Quick Workflow: Generate or Repair Styles

1. Select **Styles Compiler**, then **Create From Brief** or **Fix Existing Prompt**.
2. Provide a lead genre, target BPM, voice/instrumental direction, mood, groove and required instruments, sonic details and arrangement changes. An example: `140 BPM EDM Trap and Future Bass, female alto, half-time, Rhodes, LFO wobble, pre-drop choke`.
3. Example Briefs fill the input without running the generator. Choose **Variations** and the Hybrid Bass Profile as needed. The existing compiler variation options include Precision and Exploration; its *A/B Lab* creates a constrained two-prompt bass-articulation comparison. This is **not** the separately proposed future empirical experiment laboratory.
4. Press **Generate Styles** or **Fix Prompt**. Inspect the candidate's BPM, genres, musical directions, Source Retention warnings (if present) and **Separate Exclude** field.
5. Expand **Prompt Fidelity Inspector** to review textual preservation against the original input, with explicit matched/different/not-detected/review statuses. You may download a JSON report with the observations.
6. Copy the selected **Styles** into Suno's Styles input; copy prohibited phrases to Suno's separate **Exclude** control. For an exact style-tag comparison in Suno v6, Suno's official FAQ suggests **Variety = 0**.

**Suno v6 slider context:** [Creative Sliders](https://help.suno.com/en/articles/6141377) describes Style Influence as adherence to text, Weirdness as Safe–Chaos, and Audio Influence when source audio is uploaded. [Suno v6 FAQ](https://help.suno.com/en/articles/13924481) explains Variety. These product controls live in Suno; Workbench does not control or verify them.

## What's New Since the Historical v4 Guide

### v5.1: Compiler Intent and Fix Improvements

The parser handles explicit target vs. reference tempos, BPM ranges, musical keys/modes and meters, voice details, instruments, source exclusions and arrangement cues such as Drop 2, motifs, silence, pre-drop chokes and bar lengths. Fix Mode tries conservative source editing first and recompiles when needed. The existing native genre banks and genre-family consistency checks constrain unrelated sonic vocabulary.

### v5.1.1: Corrective Maintenance

Dancehall and reggae vocabulary such as **riddim** and **one-drop** are no longer mistaken for inappropriate EDM terms when correctly scoped. Fix Mode's fallback candidate selection prefers retention of recognizable source facts and exposes **Check source retention** warnings for selected omitted details.

### v5.2: User-Supplied Lyrics Arranger

The old generic lyric creation interface was replaced with a **source-preserving arrangement workspace**. Paste an entire original song or separately labeled source sections; choose destination order, source material and planned bar slots; then reorder, repeat or chop existing phrases. Each output span is checked against the exact user-authored source. Estimated syllable density and rhyme preservation are advisory. Explicit browser saving and JSON/TXT exports are supported. The American Phonetics Converter remains accessible.

For a guided example with a 16-line chorus, eight-slot buildup and sixteen-slot drop, read **Lyrics Studio — Source-Preserving Arranger v5.2+**.

### v5.3: Prompt Fidelity Inspector

Every Styles result has an expandable **Prompt Fidelity Inspector**. It compares the run's actual source input with the produced Styles text and the separately suggested Exclude field. The inspector finds selected explicit BPM, key, meter, genre, instruments, voice, groove, bar count, arrangement and scene/texture details.

Its four evidence labels are **Text Matched**, **Explicit Difference**, **Not Detected** and **Review Needed**. These are outcomes of a limited text detector, **not audio-quality ratings** and **not percentages of all user intent**. Undetected words can reflect paraphrase or unsupported concepts. Inspect the evidence rather than treating a green count as success.

In Fix Mode, an optional **Original Intent / Brief** lets you compare both the pre-Fix prompt and fixed output against that same earlier source. Without that separate brief, Workbench cannot determine whether the original pre-Fix prompt already diverged from the user's true intentions. Reports can be exported locally in JSON format.

Read **Prompt Fidelity Inspector — v5.3 Field Guide** and the repository [methodology](https://github.com/iamsevnth/suno-styles-workbench/blob/main/docs/PROMPT_FIDELITY_METHODOLOGY.md).

## Genre, Timing and Production Interpretation

- **BPM and musical key:** A recognized integer BPM and optional named key can be carried into the compiler plan. Treat reference/source tempos differently from requested target tempo.
- **Voice:** Vocal register, timbre, delivery and processing matter; a vocal-chop effect alone is not consent to invent a singer.
- **Bass and drums:** 808, Reese, wobble/LFO, FM growl, portamento, snare-roll and syncopated-groove instructions are mapped to genre-compatible production elements.
- **Instruments and motifs:** Named instruments are important anchors but may not survive a dense recompile; use source-retention warnings and the Inspector to find possible omissions.
- **Arrangement:** Specify contrasts, second-drop changes, silence/fakeouts, build/drop transitions and bar counts if they are important.
- **Mix:** Describe concrete engineering roles such as mono low end, controlled stereo width, sidechain space and low-mid separation.
- **Exclude:** Phrases you explicitly prohibit belong in Suno's separate Exclude field. Negative prose in Styles alone does not verify that an exclusion was applied.

## Seeds, Variation and Internal Scoring

Generated candidate titles report a real ten-digit unsigned seed alongside BPM, key (or `--`) and character count. Retain your original input, compilation settings and seed for reproduction; a seed alone is not a project file.

The compiler still uses an **internal 0–100 selection heuristic** to help pick candidate texts. That number is not a validated forecast of how a song will sound. The **v5.3 Fidelity Inspector deliberately does not give an audio-quality score**.

## Lyrics and Phonetics

To rearrange original words, use **Lyrics Studio**. The composer will not invent new lyrical text: larger destination structures must use repetition or existing-word chops. One lyric line or phrase is one *planned slot*, not automatically a performed musical bar. The user can save projects locally or export JSON and Suno-ready TXT.

The separate American Phonetics Converter helps represent words with alternate phonetic spelling. This is not pronunciation certification.

## Privacy, Downloads and Offline Use

The hosted site and offline application process creative material locally; there is no prompt-upload backend, AI API or Workbench analytics. Some features keep session history in local browser storage; Lyrics Studio's persistent project save is explicit and optional. See the [/privacy-policy](https://sunoworkbench.com/privacy-policy) for hosting and data details.

The standalone HTML includes the app, this full Guide and the searchable reference index. Open the file directly in a modern desktop browser. Links to external Suno documentation require internet access, but core Workbench functions do not.

The **official v5.3 release** includes a self-contained HTML file named `suno-workbench-sevnthlabs-v5.3.html`. The GitHub release is [v5.3.0](https://github.com/iamsevnth/suno-styles-workbench/releases/tag/v5.3.0); the tag corresponds to the v5.3.0 package. Verify the SHA-256 checksum before redistribution when provided.

## Source Status and Official Documentation

- **Current Workbench:** statements checked against the running source and v5.3 release.
- **Suno official:** vendor Help Center or Release Notes, linked for platform-specific behavior.
- **Historical manuscript:** archival production guidance that may discuss retired tabs or previous versions.
- **Producer heuristic:** a useful starting suggestion, not a Suno certification or audio benchmark.

Official references checked November 4, 2026: [Exclude](https://help.suno.com/en/articles/3161921), [Creative Sliders](https://help.suno.com/en/articles/6141377), [v6 FAQ](https://help.suno.com/en/articles/13924481), and [Release Notes](https://suno.com/release-notes). Current official documentation takes precedence when Suno changes its controls, models or terminology.
