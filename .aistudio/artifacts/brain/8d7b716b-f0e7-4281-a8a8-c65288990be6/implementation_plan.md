# Implementation Plan: Suno Prompt Engine Enhancement

Resolve vocal prompt duplication and conflicting archetypes, audit and streamline prompt structure for Suno compatibility, implement melodic instrument diversification, and faithfully preserve user-specified instruments across variations.

---

## 1. Problem Analysis & Root Causes

1. **Conflicting Vocal Descriptions**:
   - In `src/lib/suno/render.ts`, vocals were being rendered in up to 4 separate places:
     - Pre-pended/appended to Sentence 1 (`with ${vocalCue}`)
     - Generated again in Sentence 4 (`Vocal delivery: ${identity}, ${arc} with ${proc}`) using an unconstrained archetype randomizer (`pick2(rng, VOCAL_STYLE.rap)` which picked `"SoundCloud mumble rapper"` even for melodic rap)
     - Injected into the instrument list via `selectInstruments` (`inst.push(who)`)
     - Appended as filler padding in `fitToWindow`
   - In `src/lib/suno/parse.ts`, user vocal input was reduced to rigid discrete enums (`style`, `timbre`, `delivery`), discarding the rich nuance of inputs like *"Black Male vocal tone delivering melodic sung-rap phrases with smooth tone, laid back cadence, prominent autotune gloss"*.

2. **Rigid "Primary Instrumentation" Header**:
   - Authoritative Suno prompting research and documentation show that pseudo-code headers (such as `"Primary instrumentation: ..."`, `"Rhythm foundation: ..."`) waste prompt token budget and can confuse Suno's token attention into treating headers as lyrics or spoken text.
   - User selected: **"Flowing descriptive prompt without rigid label headers"**.

3. **Melodic Instrumentation Monotony**:
   - `buildMelody` in `plan.ts` narrowly defaulted to `"clean electric guitar"` or `MELODY.trap` (`"cold pluck hooks"`).
   - Melodic elements should draw from an expansive, genre-appropriate sonic palette (e.g., Rhodes electric piano, filtered analog keys, atmospheric pads, bells, muted guitars, lush synths, tape strings).

4. **Exact User Instrument Preservation**:
   - User selected: **"Keep exact instruments and vary only their tone, texture, and effects"**.
   - If the user specifies instruments, variations must retain those exact instruments and vary their acoustic color (e.g. *"warm tape-saturated Rhodes"*, *"ambient filtered Rhodes with stereo tremolo"*, *"crisp dry Rhodes chords"*).

---

## 2. Proposed Changes

### A. Parser Enhancements (`src/lib/suno/parse.ts`)
- **Preserve User Vocal Input**:
  - Add `rawVocalDescription` and `vocalDescriptors` to `VocalPreferences` and `ParsedInput`.
  - Intelligently parse rich user vocal traits (cultural/tonal identity, delivery cadence, melodic sung-rap phrasing, autotune gloss) without collapsing or overriding them with conflicting archetype presets.
- **Instrument Extraction & Preservation**:
  - Distinguish explicitly named instruments from generic melodic tags (`"melodic"`, `"harmonies"`, `"melodic elements"`).
  - Mark user-specified instruments as `explicitInstruments` so downstream engines never swap them out.

### B. Sonic Planner Improvements (`src/lib/suno/plan.ts`)
- **Single Unified Vocal Plan (`buildVocals`)**:
  - If the user provides a vocal description, optimize and polish their exact traits into high-yield Suno vocal directives (e.g., *"black male vocal tone, smooth melodic sung-rap delivery, laid-back cadence, polished autotune sheen, lead vocal presence"*).
  - Stop picking random, contradictory vocal styles (`mumble-rap` vs `lyrical-rap` vs `melodic-rap`).
  - Across variations, vary subtle vocal performance nuances (e.g. *"intimate upfront delivery"*, *"reverb-haloed melodic cadences"*, *"rhythmic pocket focus"*) while strictly locking vocal identity.
- **Melodic Instrument Engine (`buildMelody` & `selectInstruments`)**:
  - Replace the single-instrument trap with a multi-layered melodic palette matrix (Rhodes, warm electric keys, muted guitars, analog plucks, celestial bell textures, lush pads).
  - When exact instruments are specified by the user, keep those exact instruments and diversify their processing, tonal register, and acoustic space per variation.
  - Remove vocal items from `selectInstruments` so vocals never leak into the instrumentation stream.

### C. Prompt Renderer Streamlining (`src/lib/suno/render.ts`)
- **Remove Conflicting Vocal Clones**:
  - Consolidate all vocal instructions into **one single, unified, coherent vocal section**.
  - Remove `vocalCue` in Sentence 1.
  - Remove vocal lines from instrument lists and padding extras.
- **Eliminate Rigid "Primary Instrumentation:" Header**:
  - Integrate instrumentation seamlessly into the descriptive flow (e.g., *"Instrumentation features warm tape-dusted Rhodes, sliding 808s, and crisp skippy rimshots"* or flowing natural descriptors).
  - Ensure zero meta-labels like `"Primary instrumentation:"` disrupt Suno generation.
- **Suno Prompt Length & Token Window Optimization**:
  - Keep prompt length perfectly tuned to Suno's sweet spot (under 1000 characters, ideally 850–980 characters for v3.5/v4) with high information density and zero redundancy.

### D. Lexicon & Tests (`src/lib/suno/lexicon.ts`, `tests`)
- Expand `lexicon.ts` and `lexicon-vocals.ts` to support high-fidelity melodic rap, R&B, soul, and hybrid vocal translations.
- Update test suites to verify:
  1. No duplicate or conflicting vocal descriptions in any generated prompt.
  2. No `"Primary instrumentation:"` label in generated outputs.
  3. "Melodic" input generates diverse melodic instruments across seeds without single-instrument bias.
  4. Explicitly requested instruments are preserved across all variations with varied textures.

---

## 3. Verification & Validation Plan

1. **Compilation & Packaging**:
   - Run `compile_applet` to verify TypeScript clean build.
2. **Deterministic Prompt Generation Test**:
   - Test with the user's exact example:
     `"Black Male vocal tone delivering melodic sung-rap phrases with smooth tone, laid back cadence, prominent autotune gloss"`
   - Verify prompt outputs across 3 variations:
     - Check: Exactly **one** unified vocal section per prompt.
     - Check: No conflicting descriptors (e.g. "SoundCloud mumble rapper" eliminated).
     - Check: No `"Primary instrumentation:"` header.
     - Check: Rich, multi-instrument melodic layers.
3. **Explicit Instrument Test**:
   - Test prompt with `"melodic R&B with flute and Rhodes electric piano"`:
     - Check: Flute and Rhodes are preserved in all variations with diverse tonal textures.
