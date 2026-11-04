# Lyrics Studio — Source-Preserving Arrangement

Status: v5.2 MVP implemented on a development branch; production release requires passing CI and review.

## Product decision

The earlier generic lyric-creation overhaul is superseded. Lyrics Studio is now intended to rearrange **user-supplied original or authorized lyrical material only**. The app never authors or completes lyric lines; it rearranges, chops, and repeats source phrases. Original-text attribution is represented by a source-section ID, a source-line ID and an exact character range per output phrase. Section tags such as `[Chorus]` and `[Drop]` are structural metadata added to the export, not lyrical words.

The legacy phrase-bank generator remains in the repository for historical tests but is no longer exposed in Lyrics Studio's creator tab. Existing American Phonetics Converter behavior remains separately available.

## v5.2 user flow

1. Paste an entire draft using optional section headings or enter separately labeled original sections.
2. Choose a source section and lock its order where appropriate.
3. Suggest a sequence from source sections or manually add, remove, reorder and configure destination sections.
4. Specify 1–64 planned bar slots per destination, and choose full-line rearrangement or exact-source phrase chopping.
5. Optionally supply source BPM, set destination BPM, and choose a seed and approximate rhyme grouping preference.
6. Arrange. The engine generates traceable source spans and verifies every output phrase against the submitted source sections before enabling export.
7. Inspect source map, repetition and rhythm warnings, then copy Suno-ready text, export TXT, send to phonetics, or save/import/export a local JSON project.

## Core invariants

- No lyric words may be introduced by the arranger. Every displayed lyric phrase comes from the exact text of a parsed source line.
- Source integrity validation compares the reconstructed output against all source spans and section tags. Unverified results are not exportable.
- Output is read-only. Editing source or configuration invalidates the previous result.
- One source lyric line is not intrinsically one musical bar. The user assigns *planned slots*; the app neither transcribes audio nor proves rhythmic fit.
- Extending 16 bars of input into 8 plus 16 bar slots requires repeated or subdivided original phrases. No original music is synthesized.
- Repeated segments are labeled in the source map. Sources are stored in the browser only when the user explicitly clicks Save.
- JSON project imports are schema- and bounds-validated; no network API or model inference is used.

## Rhyme and rhythmic limitations

The engine uses a spelling-based approximation of line-ending rhyme. When recognizable, it groups adjacent rhyming lines and four-line AABB or ABAB patterns before shuffling groups. It cannot certify phonetic or internal rhymes, stressed-syllable alignment, phrase performance, genre compatibility, or preservation of a complete rhyme scheme after truncation or chopping.

A lightweight text-only syllable estimator reports approximate density. For 4/4, seconds per bar = 240 / target BPM. A destination tempo over 20% faster than a supplied source tempo produces a delivery warning. These checks are advisory and have not been calibrated against Suno audio results.

## Privacy and offline operation

The engine is pure TypeScript; no APIs, new dependencies, model downloads, remote logging, or external lyric processing. Local persistence uses the existing browser's localStorage when the user explicitly saves. Data loss is possible when site data is cleared; JSON export is available for backup. The standalone offline bundle must pass the current CSP and build pipeline.

## Deferred topics

- Optional local inference/WebGPU for classifying or ranking candidate arrangements. This is not part of v5.2 and must remain optional and offline.
- True speech-dictionary rhyme analysis, stressed-syllable alignment and meaningful BPM-native rhythm segmentation.
- Fidelity Inspector and Prompt Experiment Lab are separate compiler-focused development releases.
- Advanced drag/drop, audio-aware phrase timing, additional user-controlled silence placement and harmonic analysis can be considered after the MVP is validated with real user material.

## Release gate

Verify all original compiler and phonetics tests remain green, new provenance/tamper/repeat/rhyme/locking/import tests pass, TypeScript succeeds, both hosted and offline builds pass CSP, security checks pass, and the final README reflects v5.2 **after** code and release documentation have stabilized.
