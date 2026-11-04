# Prompt Fidelity Inspector — v5.3 Field Guide

## What This Inspector Measures

The v5.3 **Prompt Fidelity Inspector** compares the musical requirements the app can recognize in your source text with the wording in a generated or repaired Styles prompt. It also checks that recognized negative instructions appear in the **separate Suno Exclude field** rather than being treated as positive instructions.

The report is **textual evidence**, not a music-quality score. A matching instrument name does not prove that Suno will produce the audible instrument; an unmatched phrase does not prove the underlying musical idea was lost.

## Inspect a Generated Styles Prompt

1. Open the **Styles Compiler**, choose **Create From Brief**, and provide your original directions. Include explicit details that matter: target BPM, musical key or meter if necessary, genre, voice, instruments, groove, arrangement and Mix/FX priorities.
2. Select the desired variation controls and press **Generate Styles**. Merely editing a brief or selecting an example never compiles a new result.
3. Expand **Prompt Fidelity Inspector** beneath a result card. The inspector uses the original input saved with that particular generation, not any unsaved edits currently in the text box.
4. Read the summary counts for recognized facts, then inspect all **Explicit Difference**, **Not Detected** and **Review Needed** rows. Enable **Show Matches** to inspect supported positive evidence.
5. Review the original and produced Styles text side by side. Each row identifies the detected source phrase, the output observation where available, and why the tool assigned its status.
6. Select **Export Findings JSON** to save a local audit containing the original input, generated text, separate Exclude value, findings and references. The file may include confidential creative work; share it deliberately.

## Inspect a Fixed Prompt

1. Switch the compiler to **Fix Existing Prompt**, paste the pre-Fix Styles text, and select **Fix Prompt**.
2. Expand the inspector beneath the resulting fixed candidate. By default, it compares the **original pre-Fix prompt** with the fixed Styles text.
3. **Optional:** If you still have an earlier creative brief that guided the pre-Fix version, paste it into **Original Intent / Brief**. The inspector then compares that same earlier intent against both the pre-Fix and fixed versions.
4. Identify introduced conflicts, lost explicit instructions and exclusions not represented in the separate Exclude field. Human review is still necessary for reworded or implied musical concepts.

Without an original-intent brief, **before vs. after musical improvement cannot be inferred**: the pre-Fix prompt is the only known baseline. The optional earlier brief is held in the open inspector UI and is not added to persistent history.

## Interpret the Four Result Categories

- **Text Matched:** A supported source fact or narrowly normalized equivalent is present in Styles or Exclude. This confirms wording, not audio.
- **Explicit Difference:** An incompatible value or text-level conflict is observed, such as an original 145 BPM requirement paired with 160 BPM in the output.
- **Not Detected:** A supported term was not found. It might have been omitted, paraphrased or replaced by an equivalent the detector does not recognize.
- **Review Needed:** The source or output is ambiguous, such as multiple destination tempos or a source/reference tempo without an unambiguous final target.

A result with **zero findings is not perfect fidelity**. The detector only counts recognized requirements; there is no justified denominator for a percentage of all musical intent.

## Examples for Interpretation

Original: `145 BPM, C# minor, female alto, Rhodes, second drop, no choir.`

Candidate: `145 BPM in C# minor, female vocals, Rhodes chord voicings and a wide final drop.` Exclude: `choir`.

The inspector can confirm the explicit BPM, key, female voice, Rhodes and choir exclusion. It should flag missing **alto register** and **second drop** wording for review. It cannot infer whether “wide final drop” conveys the intended second-drop transformation without listening or richer semantic evidence.

A source reference such as `original sample at 90 BPM` must not silently become a required final 90 BPM track tempo. Explicit target BPM and contextual/reference BPM are distinct.

## Evidence Boundaries and Citations

Suno's official [Exclude documentation](https://help.suno.com/en/articles/3161921) describes entering unwanted elements in Advanced Options. The [Creative Sliders guide](https://help.suno.com/en/articles/6141377) describes Style Influence and related controls. Suno's [v6 FAQ](https://help.suno.com/en/articles/13924481) explains that Variety may modify style prompts; set Variety to zero when exact Styles tags are a controlled-test requirement.

These official pages describe **platform controls**, not empirical validation of Workbench's lexical detection or musical outcome. The Workbench 800–975-character target is an application rule, not a published Suno optimal-quality threshold.

**Limitations:** No audio is analyzed; synonyms and lyric content are not fully interpreted; status counts cannot predict listener preference. The legacy compiler's 0–100 internal ranking is likewise not an independently validated audio-quality score.

For technical criteria, limitations and test methodology, see the repository's [Prompt Fidelity Methodology](https://github.com/iamsevnth/suno-styles-workbench/blob/main/docs/PROMPT_FIDELITY_METHODOLOGY.md).
