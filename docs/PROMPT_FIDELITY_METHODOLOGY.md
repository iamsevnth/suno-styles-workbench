# Prompt Fidelity Inspector — Methodology and Evidence (v5.3)

**Purpose:** Compare a user-authored creative brief or pre-Fix Styles prompt against the text produced by the Styles Compiler, and show what can and cannot be established from *text alone*. The inspector does **not** score musical creativity or predict Suno's audio quality.

## Evidence hierarchy

1. **Direct observations:** source and output text, the separate Exclude field, literal phrases, explicit numbers, and regex-detected values. Supported by text snippets in every finding and locally exportable JSON.
2. **Normalized observations:** explicit tempo/range, key, meter, selected instruments, vocal markers, arrangement vocabulary, and explicit exclusions, allowing limited spelling variation. Normalization rules live in `src/lib/suno/fidelity.ts`.
3. **Heuristic suggestions:** genre parsing, scene extraction, musical synonyms, phrasing implications and context-only tempo are inherently incomplete. Where supported explicit wording cannot be found, the status is **Not Detected** or **Review Needed**, not proof that Suno will omit that sound.
4. **Not measured:** actual generated musical key, tempo, meter, vocal timbre, harmony, arrangement, source fidelity of an audio result, successful creative direction, or perceptual audio quality.

### Status definitions

| Status | Meaning |
| --- | --- |
| Text Matched | Identifiable requested wording or a narrowly normalized equivalent was found in the candidate Styles or separate Exclude field |
| Explicit Difference | A conflicting explicit tempo, key, meter, instrument modifier or other supported exclusion was detected |
| Not Detected | Required source wording was not found by the detector; an unrecognized paraphrase may still express the concept |
| Review Needed | Multiple conflicting values, source/reference tempo ambiguity, or other cases the rule cannot responsibly decide |

Counts are **counts of detected source facts**, never a complete-coverage percentage or quality score. The denominator excludes requirements the current finite extractor does not identify. An empty findings list is *not* a passing grade.

### Original / pre-Fix / fixed comparison

- Create From Brief: the original user's brief is the source; each generated candidate is compared separately.
- Fix Existing Prompt: the unmodified input is shown as the **pre-Fix baseline**, including length and detected target/context musical facts. The inspector compares the original input with each fixed candidate.
- The pre-Fix baseline is not a self-comparison claiming improvement. There is no before/after quality score. A phrase written as `no choir` in Styles is not proof the separate Exclude field is configured.
- Input is sourced from the compiler's saved parsed original, not the currently editable brief field, so changing inputs without generating does not silently change what earlier results are audited against.
- Export Findings JSON includes the original input, final candidate, separate Exclude value, item-level match observations, status, caveats, and referenced official documentation. This file is downloaded locally.

### Published Suno source documentation

Checked **2026-11-04**:

- [Suno Help — Exclude](https://help.suno.com/en/articles/3161921): Suno offers an explicit Exclude field in Advanced Options for undesired instruments and other elements. This supports the inspector's distinction between an explicit Exclude-field value and negative prose in Styles.
- [Suno Help — Custom Mode](https://help.suno.com/en/articles/2415873): users can supply their own lyrics and creation context. This supports the distinction between music-style instructions and lyrics.
- [Suno Help — Creative Sliders](https://help.suno.com/en/articles/6141377): Style Influence influences adherence to the Styles text. Textual matching alone does not capture that setting.
- [Suno Help — v6 FAQ](https://help.suno.com/en/articles/13924481): v6 Variety can modify style prompts; Suno documents Variety at zero for full text control. Input fidelity is therefore not a guarantee of generation or audio adherence.

These are **official statements about platform behavior**, not published controlled experiments validating text heuristics or quantifying audio quality.

## Validation boundaries and adversarial cases

Automated tests in `tests/fidelity.test.ts` cover mixed BPM, source vs destination BPM, BPM ranges, key/meter differences, instrument modifiers, excluded concepts, omitted arrangements, source-only voice traits and ambiguous/no-fact inputs.

The inspector deliberately does not assert that:
- a matched genre or instrument will be audible in the resulting track;
- 800–975 characters is an empirically optimum Suno prompt length;
- an internally calculated `scorePrompt()` result is a music-quality metric;
- synonyms, implied sound-design behavior, or conflicting artistic concepts are semantically resolved;
- a successful lexical check proves a finished song is faithful.

### Privacy and security

All analysis runs in the browser. No new dependencies, API keys, remote model, analytics or content uploads are required. Source text can include confidential creative material. Export JSON includes full source and output, so users must handle downloaded files appropriately. Existing GitHub Pages CSP and standalone offline build remain release gates.

### Future experimental validation

If the team wishes to publish an **audio-outcome** score in a later release, first obtain an authorized, repeatable human listening dataset or a published Suno/independent benchmark with defined models, prompt variants, generation settings, blinded ratings, control groups, reliability, uncertainty and negative tests. Only after calibration, external validation and disclosure of model-specific limitations should any resulting quality indicator be considered. That research is out of scope for v5.3.
