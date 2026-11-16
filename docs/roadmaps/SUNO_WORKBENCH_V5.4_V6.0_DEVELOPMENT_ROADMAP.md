# Suno Workbench v5.4-v6.0 Development Roadmap

**Status:** Formal product-development roadmap  
**Baseline:** Suno Workbench v5.3.1 (`b0f3d249`)  
**Roadmap date:** 2026-11-15  
**Planning model:** Milestone-based; no calendar release dates are committed by this document.  
**Architecture constraint:** Browser-first, local processing, offline-capable core.  
**Canonical archive:** This Markdown file is authoritative. The companion `.docx` is a generated export of the same content; if the formats ever disagree, trust the Markdown.

## Executive Summary

This roadmap takes Suno Workbench from the current v5.3.1 evidence-bound text toolkit to a v6.0 platform that can organize controlled experiments, model arrangement state, improve source-preserving lyric analysis, adapt prompt information budgets, optionally use local inference, analyze authorized audio locally, and - only if an empirical research gate is satisfied - publish calibrated audio-effectiveness indicators. The sequencing is dependency-driven: capture reproducible evidence first, then add richer composition models, then optional local intelligence and audio analysis, and only then consider outcome scoring.

### Non-negotiable product guardrails
- **Local-first privacy:** Creative briefs, lyrics, experiment content, and optional audio analysis remain on-device unless the user explicitly exports files.
- **Evidence before scoring:** Workbench may describe observed text facts and estimates, but it must not convert them into musical-quality or effectiveness claims without validation.
- **Source preservation:** Lyrics Studio never invents lyric words; Fix and arrangement tooling must preserve explicit user intent wherever hard constraints permit.
- **Deterministic core:** Every optional ML/audio feature requires a deterministic or manual fallback so core workflows remain available offline.
- **Progressive enhancement:** New releases add capability without forcing users into accounts, backends, remote AI, or heavyweight runtimes.
- **Versioned reproducibility:** Project schemas, experiment metadata, runtime/model versions, and migration behavior must be explicit and testable.
- **Accessible interaction:** Drag/drop and visual timelines require keyboard-accessible equivalents and readable non-visual structure.

## Roadmap at a Glance

| Release | Theme | Primary outcome |
|---|---|---|
| **v5.4** | Prompt Experiment Lab | Create the reproducible evidence-capture layer that future Workbench recommendations can rely on, without claiming audio quality or introducing remote content processing. |
| **v5.5** | Advanced Arrangement Intelligence | Move arrangement handling from flat textual cues toward explicit song-state modeling while preserving deterministic, inspectable behavior. |
| **v5.6** | Lyrics Studio Pro | Upgrade source-preserving lyric arrangement with stronger pronunciation, rhyme, cadence, and editing tools while retaining the rule that Workbench never invents lyric words. |
| **v5.7** | Adaptive Compiler | Make the compiler allocate prompt space and genre intelligence according to brief complexity instead of forcing every case into one static information budget. |
| **v5.8** | Optional Local Intelligence | Introduce optional browser-local inference for ranking and classification where deterministic rules are insufficient, without making remote AI or model downloads mandatory for core use. |
| **v5.9** | Audio Analysis Preview | Add local analysis of user-authorized audio as an experimental evidence source for timing and musical structure, without converting analysis into an unvalidated quality score. |
| **v6.0** | Evidence-Calibrated Workbench | Unify deterministic prompt engineering, source-preserving lyrics, experiments, optional local intelligence, and audio evidence into a mature Workbench whose claims are calibrated to what has actually been validated. |

## Sequencing Logic

1. **v5.4 establishes reproducible experiment data.** Without a stable experiment schema, later listening and audio evidence cannot be compared responsibly.
2. **v5.5-v5.7 strengthen deterministic musical structure.** Arrangement state, lyric prosody, prompt budgeting, and genre hierarchy should mature before ML/audio layers are allowed to influence recommendations.
3. **v5.8 introduces optional local intelligence only after deterministic contracts exist.** Local models are advisers, not hidden dependencies.
4. **v5.9 adds audio as evidence, not as a score.** Timing, tempo/meter, and harmonic estimates remain inspectable and correctable.
5. **v6.0 integrates the evidence system.** Any audio-effectiveness metric is conditional on an approved validation study; otherwise v6.0 ships without such a score.

## v5.4 - Prompt Experiment Lab

**Mission:** Create the reproducible evidence-capture layer that future Workbench recommendations can rely on, without claiming audio quality or introducing remote content processing.

### Target outcomes
- Versioned local Experiment Project schema that stores brief, generated Styles, Exclude, Workbench version, seed, prompt variant, and user-entered Suno model/settings metadata.
- Experiment workspace for controlled variants, repeated trials, run notes, listening observations, labels, tags, and side-by-side comparisons.
- Import/export of complete experiments as validated JSON, plus concise CSV/Markdown summaries suitable for external analysis.
- A reproducibility panel that identifies missing settings, changed prompt variables, and non-comparable runs before the user interprets results.
- Clear separation between observed evidence, user listening notes, Workbench text diagnostics, and hypotheses.

### Epics
- **Experiment schema and persistence:** Define schema versioning, migration rules, local save/restore, and validated import/export.
- **Controlled-run builder:** Clone a baseline into variants while explicitly declaring changed and held-constant fields.
- **Suno settings capture:** Record model, Variety, Style Influence, Weirdness, Audio Influence, Max Mode, and other user-entered settings as metadata only; do not imply Workbench can read or set Suno.
- **Listening log:** Structured observations, confidence, notes, and optional blinded labels; no automatic effectiveness score.
- **Comparison and export:** Diff prompt text, settings, and observations; export reproducible experiment bundles.

### Release acceptance criteria
- Every saved experiment is schema-versioned and round-trips through export/import without data loss.
- The application flags uncontrolled differences between candidate runs instead of silently treating them as comparable.
- No creative content or experiment payload leaves the browser through Workbench.
- The existing Styles Compiler, Fidelity Inspector, Lyrics Studio, Guide, offline build, and privacy behavior remain regression-safe.
- Documentation explicitly states that listening notes are user observations, not validated model-performance measurements.

### Dependencies
- Current v5.3.1 compiler/Fidelity Inspector
- Browser-local persistence helpers

### Primary risks
- Schema churn before later audio-analysis features are known
- Users over-interpreting subjective observations

### Expected deliverables
- /experiments route
- Experiment JSON schema v1
- Comparison/export UI
- Guide chapter and release notes

### Recommended implementation slices
1. **Contract and fixtures:** Experiment schema and persistence - Define schema versioning, migration rules, local save/restore, and validated import/export.
2. **Core integration:** Controlled-run builder - Clone a baseline into variants while explicitly declaring changed and held-constant fields.
3. **User workflow and evidence:** Suno settings capture - Record model, Variety, Style Influence, Weirdness, Audio Influence, Max Mode, and other user-entered settings as metadata only; do not imply Workbench can read or set Suno.
4. **Hardening and release:** Complete remaining epics, negative tests, documentation, offline/CSP validation, migration checks, and release packaging.

### Critical test scenarios
- Every saved experiment is schema-versioned and round-trips through export/import without data loss.
- The application flags uncontrolled differences between candidate runs instead of silently treating them as comparable.
- No creative content or experiment payload leaves the browser through Workbench.

**Release decision gate:** Advance only when the release's core outcome is reproducible, the highest-risk failure mode is covered by a negative test or safe fallback, and all standard release gates pass.

## v5.5 - Advanced Arrangement Intelligence

**Mission:** Move arrangement handling from flat textual cues toward explicit song-state modeling while preserving deterministic, inspectable behavior.

### Target outcomes
- Structured arrangement graph representing sections, transitions, motif states, bar-count intentions, silence/fakeout events, and Drop 2 transformations.
- Motif evolution model that can describe introduction, repetition, mutation, reduction, register change, and final-resolution intent without synthesizing audio.
- Section-by-section Fix controls that let users preserve, revise, or lock individual arrangement intentions instead of rebuilding an entire prompt blindly.
- Arrangement-aware Fidelity findings that distinguish a named cue from its position and transformation across the song.
- Visual arrangement map designed for keyboard and screen-reader navigation as well as pointer use.

### Epics
- **Arrangement graph schema:** Introduce typed section/transition/motif nodes with stable IDs and serialization.
- **Parser and planner integration:** Map supported brief cues into structured arrangement state while retaining raw source evidence.
- **Section-level Fix:** Allow targeted repairs and locks, with warnings when the 1,000-character Styles limit forces compression.
- **Fidelity expansion:** Compare source arrangement facts to structured output and rendered Styles text.
- **Arrangement visualization:** Readable timeline/map that remains useful without drag-and-drop.

### Release acceptance criteria
- Supported arrangement cues retain provenance to source text and survive deterministic round-trip serialization.
- Section locks prevent unrelated sections from changing during targeted Fix operations unless a hard gate makes preservation impossible.
- Motif and Drop 2 state changes are testable as structured data, not only regex markers.
- No generated arrangement claim is represented as an audible result without listening evidence.
- Legacy prompts without structured arrangement data remain supported through compatibility adapters.

### Dependencies
- v5.4 experiment schema for later outcome studies
- v5.3 Fidelity Inspector evidence model

### Primary risks
- State model becoming too complex for the Styles field
- UI complexity on small screens

### Expected deliverables
- Arrangement graph types
- Section-level Fix UI
- Expanded Fidelity rules
- Arrangement map
- Migration tests

### Recommended implementation slices
1. **Contract and fixtures:** Arrangement graph schema - Introduce typed section/transition/motif nodes with stable IDs and serialization.
2. **Core integration:** Parser and planner integration - Map supported brief cues into structured arrangement state while retaining raw source evidence.
3. **User workflow and evidence:** Section-level Fix - Allow targeted repairs and locks, with warnings when the 1,000-character Styles limit forces compression.
4. **Hardening and release:** Complete remaining epics, negative tests, documentation, offline/CSP validation, migration checks, and release packaging.

### Critical test scenarios
- Supported arrangement cues retain provenance to source text and survive deterministic round-trip serialization.
- Section locks prevent unrelated sections from changing during targeted Fix operations unless a hard gate makes preservation impossible.
- Motif and Drop 2 state changes are testable as structured data, not only regex markers.

**Release decision gate:** Advance only when the release's core outcome is reproducible, the highest-risk failure mode is covered by a negative test or safe fallback, and all standard release gates pass.

## v5.6 - Lyrics Studio Pro

**Mission:** Upgrade source-preserving lyric arrangement with stronger pronunciation, rhyme, cadence, and editing tools while retaining the rule that Workbench never invents lyric words.

### Target outcomes
- Local pronunciation dictionary support for end-rhyme and phonetic similarity analysis.
- Stress-aware syllable and cadence analysis that distinguishes approximate text density from stronger prosodic evidence.
- Improved BPM/meter-aware slot guidance with explicit uncertainty and no claim that a lyric line equals a performed bar.
- Advanced drag/drop arrangement editing with accessible keyboard alternatives.
- Explicit rest/silence slots and richer source-span mapping for chopped phrases.

### Epics
- **Pronunciation/rhyme engine:** Add dictionary-backed phoneme lookup with fallback behavior and confidence states.
- **Prosody model:** Estimate stressed syllables and phrase density while preserving uncertainty.
- **Timeline editor:** Drag/drop sections and phrases; support deterministic keyboard reorder and undo/redo.
- **Silence/rest model:** Represent intentional non-lyrical slots separately from source words.
- **Provenance hardening:** Extend exact source-span checks through all new editing modes.

### Release acceptance criteria
- 100% of exported lyric words remain traceable to exact authorized/user-supplied source spans.
- Rest/silence metadata cannot be mistaken for lyric text.
- Dictionary misses degrade gracefully to existing heuristics and are labeled as lower-confidence analysis.
- Keyboard-only users can complete every reordering action available by drag/drop.
- Existing JSON projects migrate safely or fail with an explicit recoverable validation message.

### Dependencies
- v5.5 arrangement concepts where shared section semantics are useful
- Existing v5.2 source-provenance engine

### Primary risks
- False confidence in pronunciation/stress estimates
- Large dictionaries increasing offline bundle size

### Expected deliverables
- Phonetic rhyme engine
- Prosody analysis
- Accessible timeline editor
- Rest slots
- Project schema update

### Recommended implementation slices
1. **Contract and fixtures:** Pronunciation/rhyme engine - Add dictionary-backed phoneme lookup with fallback behavior and confidence states.
2. **Core integration:** Prosody model - Estimate stressed syllables and phrase density while preserving uncertainty.
3. **User workflow and evidence:** Timeline editor - Drag/drop sections and phrases; support deterministic keyboard reorder and undo/redo.
4. **Hardening and release:** Complete remaining epics, negative tests, documentation, offline/CSP validation, migration checks, and release packaging.

### Critical test scenarios
- 100% of exported lyric words remain traceable to exact authorized/user-supplied source spans.
- Rest/silence metadata cannot be mistaken for lyric text.
- Dictionary misses degrade gracefully to existing heuristics and are labeled as lower-confidence analysis.

**Release decision gate:** Advance only when the release's core outcome is reproducible, the highest-risk failure mode is covered by a negative test or safe fallback, and all standard release gates pass.

## v5.7 - Adaptive Compiler

**Mission:** Make the compiler allocate prompt space and genre intelligence according to brief complexity instead of forcing every case into one static information budget.

### Target outcomes
- Adaptive length modes such as Compact, Standard, Detailed, and Preservation-First, all respecting Suno field limits.
- Information-budget planner that prioritizes user-locked facts, genre identity, arrangement, vocals, and mix details according to explicit policy.
- Deeper genre/subgenre segmentation with provenance and controlled inheritance rather than a monolithic catalog.
- Expanded support for world and regional genres using documented terminology ownership and anti-bleed rules.
- Explainable compression warnings that identify which supported facts could not fit.

### Epics
- **Adaptive length policy:** Select a target window from brief complexity, preservation needs, and selected mode while keeping the hard field cap.
- **Information budget planner:** Rank explicit source facts above inferred enrichment and expose dropped/condensed facts.
- **Genre hierarchy:** Add parent/child relationships, region/context metadata, and bank ownership.
- **World-genre expansion:** Add genres incrementally with dedicated tests, provenance, and cultural terminology review.
- **Compiler diagnostics:** Show why a mode or compression decision was selected.

### Release acceptance criteria
- No adaptive mode exceeds the hard Styles field cap.
- Explicit user constraints are never displaced by optional filler without a visible warning.
- Genre additions must have dedicated vocabulary ownership and anti-bleed tests before release.
- Fix mode can select Preservation-First automatically for dense coherent source prompts.
- The Guide clearly distinguishes Workbench design targets from Suno-certified behavior.

### Dependencies
- v5.5 structured arrangement priorities
- v5.3/v5.4 evidence and diagnostics

### Primary risks
- More modes creating confusing UX
- Genre taxonomy implying cultural authority beyond evidence

### Expected deliverables
- Adaptive length engine
- Budget diagnostics
- Hierarchical genre model
- New genre bank acceptance framework

### Recommended implementation slices
1. **Contract and fixtures:** Adaptive length policy - Select a target window from brief complexity, preservation needs, and selected mode while keeping the hard field cap.
2. **Core integration:** Information budget planner - Rank explicit source facts above inferred enrichment and expose dropped/condensed facts.
3. **User workflow and evidence:** Genre hierarchy - Add parent/child relationships, region/context metadata, and bank ownership.
4. **Hardening and release:** Complete remaining epics, negative tests, documentation, offline/CSP validation, migration checks, and release packaging.

### Critical test scenarios
- No adaptive mode exceeds the hard Styles field cap.
- Explicit user constraints are never displaced by optional filler without a visible warning.
- Genre additions must have dedicated vocabulary ownership and anti-bleed tests before release.

**Release decision gate:** Advance only when the release's core outcome is reproducible, the highest-risk failure mode is covered by a negative test or safe fallback, and all standard release gates pass.

## v5.8 - Optional Local Intelligence

**Mission:** Introduce optional browser-local inference for ranking and classification where deterministic rules are insufficient, without making remote AI or model downloads mandatory for core use.

### Target outcomes
- Optional WebGPU/local inference adapter with explicit capability detection and user opt-in.
- Candidate-arrangement ranking for Lyrics Studio and experiment triage, using local features only.
- Model/runtime version capture so local-inference results remain reproducible.
- Deterministic non-ML fallback for every core workflow.
- Resource controls for memory, model size, execution time, and low-power devices.

### Epics
- **Runtime abstraction:** Separate deterministic core logic from optional local-model adapters.
- **Capability and consent UX:** Detect supported browser/runtime; explain storage and compute costs before activation.
- **Arrangement ranking:** Rank valid source-preserving candidates without generating new lyric text.
- **Reproducibility metadata:** Record model/runtime version and feature inputs in experiments.
- **Performance safeguards:** Lazy loading, cancellation, memory ceilings, and fallback paths.

### Release acceptance criteria
- Core compiler, Lyrics Studio, Guide, and Experiment Lab remain fully functional with local inference disabled.
- No model is fetched or initialized without a deliberate user action when the runtime requires additional assets.
- Local-inference outputs are labeled recommendations, not facts, and include model/runtime metadata.
- Offline build behavior and CSP remain explicit and testable.
- Failure or unsupported WebGPU cannot corrupt saved projects or block deterministic workflows.

### Dependencies
- v5.4 experiment metadata
- v5.6 candidate-arrangement framework

### Primary risks
- Browser compatibility and GPU variability
- Offline bundle growth or model asset complexity

### Expected deliverables
- Local-inference adapter
- Capability UI
- Ranking prototype
- Performance telemetry limited to local diagnostics only

### Recommended implementation slices
1. **Contract and fixtures:** Runtime abstraction - Separate deterministic core logic from optional local-model adapters.
2. **Core integration:** Capability and consent UX - Detect supported browser/runtime; explain storage and compute costs before activation.
3. **User workflow and evidence:** Arrangement ranking - Rank valid source-preserving candidates without generating new lyric text.
4. **Hardening and release:** Complete remaining epics, negative tests, documentation, offline/CSP validation, migration checks, and release packaging.

### Critical test scenarios
- Core compiler, Lyrics Studio, Guide, and Experiment Lab remain fully functional with local inference disabled.
- No model is fetched or initialized without a deliberate user action when the runtime requires additional assets.
- Local-inference outputs are labeled recommendations, not facts, and include model/runtime metadata.

**Release decision gate:** Advance only when the release's core outcome is reproducible, the highest-risk failure mode is covered by a negative test or safe fallback, and all standard release gates pass.

## v5.9 - Audio Analysis Preview

**Mission:** Add local analysis of user-authorized audio as an experimental evidence source for timing and musical structure, without converting analysis into an unvalidated quality score.

### Target outcomes
- Local audio import for user-owned/authorized material with clear rights and privacy messaging.
- Tempo and meter estimation with confidence and manual correction controls.
- Phrase/onset timing assistance that can align Lyrics Studio planned slots to observed audio events.
- Basic harmonic/key/chord-feature analysis presented as estimates, not authoritative transcription.
- Experiment Lab linkage so users can associate analyzed audio with a specific run and settings snapshot.

### Epics
- **Audio ingestion boundary:** Decode locally, never upload through Workbench, and document supported formats/limits.
- **Tempo/meter estimation:** Produce evidence with confidence, alternatives, and manual override.
- **Phrase timing:** Generate editable timing markers and map them to lyric/source spans.
- **Harmonic analysis:** Estimate tonal center/chord features with uncertainty.
- **Experiment attachment:** Reference analysis metadata and hashes in experiment projects without forcing large audio into browser storage.

### Release acceptance criteria
- Audio processing occurs locally and can be disabled entirely.
- Every automated estimate displays confidence/uncertainty and allows user correction.
- Audio analysis is never labeled proof of Suno adherence or musical quality.
- Experiment exports can include metadata/hashes without silently embedding copyrighted audio.
- Performance limits and unsupported codecs fail safely and preserve the project state.

### Dependencies
- v5.4 Experiment Lab
- v5.6 lyric timing model
- v5.8 optional local runtime abstraction

### Primary risks
- Codec/browser inconsistency
- Rights/privacy confusion
- Users treating estimates as transcription truth

### Expected deliverables
- Audio analysis preview
- Timing editor
- Tempo/meter estimator
- Harmonic feature view
- Experiment linkage

### Recommended implementation slices
1. **Contract and fixtures:** Audio ingestion boundary - Decode locally, never upload through Workbench, and document supported formats/limits.
2. **Core integration:** Tempo/meter estimation - Produce evidence with confidence, alternatives, and manual override.
3. **User workflow and evidence:** Phrase timing - Generate editable timing markers and map them to lyric/source spans.
4. **Hardening and release:** Complete remaining epics, negative tests, documentation, offline/CSP validation, migration checks, and release packaging.

### Critical test scenarios
- Audio processing occurs locally and can be disabled entirely.
- Every automated estimate displays confidence/uncertainty and allows user correction.
- Audio analysis is never labeled proof of Suno adherence or musical quality.

**Release decision gate:** Advance only when the release's core outcome is reproducible, the highest-risk failure mode is covered by a negative test or safe fallback, and all standard release gates pass.

## v6.0 - Evidence-Calibrated Workbench

**Mission:** Unify deterministic prompt engineering, source-preserving lyrics, experiments, optional local intelligence, and audio evidence into a mature Workbench whose claims are calibrated to what has actually been validated.

### Target outcomes
- Unified project model linking briefs, Styles variants, Exclude, settings snapshots, lyric arrangements, experiment runs, and optional audio-analysis evidence.
- Reusable local settings profiles for controlled experiments, without pretending Workbench can remotely configure Suno unless a supported integration exists.
- Cross-project evidence summaries that separate counts, user observations, detected text facts, local analysis estimates, and validated research findings.
- Conditional audio-effectiveness indicators only if an approved study has sufficient repeatability, calibration, external validation, and model-version disclosure.
- Migration and compatibility layer for v5.x projects and exports.

### Epics
- **Unified project schema:** Versioned container for compiler, lyrics, experiments, and optional audio evidence.
- **Evidence dashboard:** Trace every conclusion to source text, settings, listening data, or analysis evidence.
- **Settings profiles:** Reusable experiment metadata profiles with model-version drift warnings.
- **Validation research gate:** Define study protocol, blinded ratings, controls, uncertainty, negative tests, and external review before any effectiveness score exists.
- **v5 migration and release hardening:** Import legacy projects, preserve offline/privacy behavior, and document breaking changes.

### Release acceptance criteria
- All v5.x supported project/export formats have tested migration or a documented conversion path.
- No UI metric collapses text fidelity, user opinion, audio analysis, and validated research into one misleading score.
- Any effectiveness indicator is withheld unless the research gate is formally satisfied and model-specific limitations are disclosed.
- Browser-only core workflows and deterministic fallbacks remain supported.
- v6.0 ships with a complete methodology, release notes, offline artifact, checksum, and reproducible validation record.

### Dependencies
- All prior roadmap releases or equivalent capabilities
- Approved empirical validation protocol for any effectiveness scoring

### Primary risks
- Pressure to publish a score before evidence supports it
- Migration complexity
- Suno model/control changes invalidating older experiment comparability

### Expected deliverables
- Unified project system
- Evidence dashboard
- Settings profiles
- v5 migration tools
- Conditional validated outcome layer

### Recommended implementation slices
1. **Contract and fixtures:** Unified project schema - Versioned container for compiler, lyrics, experiments, and optional audio evidence.
2. **Core integration:** Evidence dashboard - Trace every conclusion to source text, settings, listening data, or analysis evidence.
3. **User workflow and evidence:** Settings profiles - Reusable experiment metadata profiles with model-version drift warnings.
4. **Hardening and release:** Complete remaining epics, negative tests, documentation, offline/CSP validation, migration checks, and release packaging.

### Critical test scenarios
- All v5.x supported project/export formats have tested migration or a documented conversion path.
- No UI metric collapses text fidelity, user opinion, audio analysis, and validated research into one misleading score.
- Any effectiveness indicator is withheld unless the research gate is formally satisfied and model-specific limitations are disclosed.

**Release decision gate:** Advance only when the release's core outcome is reproducible, the highest-risk failure mode is covered by a negative test or safe fallback, and all standard release gates pass.

## Cross-Release Engineering Workstreams

- **Schemas and migration:** Every persistent object must carry a schema version. Migration fixtures must cover at least the immediately previous production format and every format still declared supported.
- **Testing and CI:** Each release extends unit/regression coverage, TypeScript checks, production/offline build validation, CSP verification, dependency review, CodeQL, and release-package integrity checks.
- **Privacy/security:** No new network transmission of creative content is allowed by default. Optional local models and audio processing require explicit boundaries, least privilege, safe file handling, and no hidden telemetry.
- **Documentation:** README, Guide, methodology, privacy statements, release notes, and feature limitations are updated from the final implementation rather than written as promises before code stabilizes.
- **Accessibility:** New visual interactions require keyboard equivalents, clear focus order, semantic labels, readable contrast, and non-color-only status communication.
- **Research governance:** Experimental conclusions must identify source, method, model/settings, uncertainty, and whether the result is direct observation, heuristic inference, or validated evidence.

## Release Quality Gate

- Scope implemented behind stable, documented contracts; no hidden or partially wired UI.
- All relevant automated tests pass; TypeScript, production build, offline build, and CSP validation succeed.
- No regression in browser-only privacy, local persistence, or existing export/import behavior.
- New persistent schemas have migration and corruption/invalid-input tests.
- User-visible claims match what is actually measured; limitations are documented in-product and in the Guide.
- Accessibility review covers keyboard navigation, contrast, labels, and error recovery.
- Release notes, package metadata, README/Guide updates, offline artifact, and checksum are produced from the validated release commit.
- Post-release verification confirms the hosted deployment and standalone artifact match the tagged source.

## Measurement Framework

| Area | Decision-useful measure | Guardrail |
|---|---|---|
| Experiment reproducibility | Percentage of projects with complete baseline/variant/settings metadata; import/export round-trip success. | Do not convert subjective notes into a quality score. |
| Compiler fidelity | Supported source facts retained, explicit differences, hard-gate pass rate, compression warnings. | Counts cover detected facts only; they are not total-intent percentages. |
| Lyrics provenance | Exported phrases traceable to source spans; project validation success. | Must remain 100% for exportable lyric words. |
| Arrangement state | Structured cue preservation and lock behavior across Fix operations. | Structured state is not proof of audible execution. |
| Local inference | Fallback success, runtime compatibility, ranking stability, resource usage. | ML recommendations must remain optional and labeled. |
| Audio analysis | Estimator confidence, manual correction rate, repeatability on the same input. | No automatic quality/adherence score in v5.9. |
| v6 outcome research | Inter-rater reliability, model/settings controls, repeatability, calibration, negative tests, model drift. | No public effectiveness indicator unless the research gate is approved. |

## Risk Register

| Risk | Level | Why it matters | Mitigation |
|---|---|---|---|
| Suno platform volatility | High | Model names, controls, plan gates, and behaviors can change. | Re-verify official Suno documentation before each release; store model/settings as user-entered metadata with timestamps; avoid hard-coding vendor claims as universal truths. |
| False precision | High | Text matches, audio estimates, or subjective notes can look more authoritative than they are. | Use evidence labels, uncertainty, confidence states, and research gates; ban composite quality scores until validated. |
| Offline bundle growth | Medium | Dictionaries, local models, and audio libraries can undermine the single-file experience. | Lazy-load optional assets where allowed; keep deterministic core slim; publish size budgets and separate optional packages if needed. |
| Browser/GPU variability | Medium | WebGPU and audio decoding differ across devices. | Capability detection, graceful fallback, resource limits, cancellation, and deterministic alternatives. |
| Schema migration debt | Medium | Seven releases can create incompatible saved-project formats. | Version every schema, maintain migration fixtures, test forward/backward boundaries, and preserve raw source fields. |
| Feature complexity | Medium | Arrangement graphs, experiments, and audio analysis can overwhelm a tool that is currently simple. | Progressive disclosure, task-focused routes, concise defaults, and advanced panels only when needed. |
| Rights/privacy confusion | High | Users may import third-party audio or assume analysis implies redistribution rights. | Local processing, explicit authorization reminder, metadata-only experiment linkage by default, and no automatic upload/storage of audio in repository or remote service. |

## Definition of Done for a Roadmap Epic

- User outcome is implemented and demonstrable in hosted and offline builds.
- Acceptance criteria and negative/failure cases are automated where practical.
- Persistence changes are versioned and migration-tested.
- Privacy/network behavior is documented and verified.
- Feature limitations and abstention states are visible to users.
- Guide and developer documentation are aligned with code.
- Rollback or safe-disable path exists for runtime-sensitive features.

## Primary Decision Triggers

- If optional local inference materially increases offline complexity or bundle size, separate it from the core artifact rather than weakening core accessibility.
- If audio-analysis accuracy is inconsistent across browsers, keep the feature in Preview and emphasize manual correction rather than forcing a v6.0 dependency.
- If a proposed metric cannot clearly state its denominator, uncertainty, and evidence source, it does not become a public score.
- If Suno changes model/settings semantics, affected experiments are marked non-comparable until metadata and methodology are updated.

## Governance and GitHub Delivery Model

- Maintain this roadmap under `docs/roadmaps/` with both Markdown and DOCX archival copies. Markdown is canonical; regenerate the DOCX from Markdown when the roadmap changes.
- Use one focused feature branch/PR per major epic or cohesive release slice; avoid long-lived branches that duplicate compiler architecture.
- Treat release notes as implementation evidence, not advance marketing copy. Finalize README/Guide after behavior stabilizes.
- Record superseded plans instead of deleting them when they provide useful provenance, but label them clearly as historical.
- Do not merge a release until required CI/security checks pass and the offline artifact is rebuilt from the validated commit.
- Tag formal releases only after hosted deployment and standalone package verification succeed.

### Suggested Release Branch Convention

| Purpose | Branch pattern |
|---|---|
| Roadmap archive | `docs/roadmap-v5.4-v6.0-20261115` |
| Feature work | `feat/v54-experiment-lab-*`, `feat/v55-arrangement-*`, etc. |
| Release prep | `release/v5.4`, `release/v5.5`, … |
| Documentation | `docs/<release-or-topic>-*` |

## v6.0 Research Gate for Any Audio-Effectiveness Indicator

- Pre-register or otherwise freeze the evaluation protocol before using results to tune a score.
- Use a repeatable dataset with authorized prompts/audio and clearly defined Suno model/settings versions.
- Include controlled prompt variants, repeated generations, blinded human ratings, negative controls, and uncertainty reporting.
- Measure inter-rater reliability and demonstrate that the proposed indicator generalizes beyond the calibration set.
- Validate against a later/held-out sample or independent benchmark when feasible.
- Document failure modes, model-version drift, genre coverage gaps, and situations where the indicator must abstain.
- If these conditions are not met, ship v6.0 without an effectiveness score and retain evidence tables/observations instead.

## Source Baseline and Provenance

Provenance links are pinned to baseline commit `b0f3d249` so later `main` edits cannot silently change the evidence this roadmap was written against.

| Source | Location | Roadmap evidence |
|---|---|---|
| Current baseline | [README.md](https://github.com/iamsevnth/suno-styles-workbench/blob/b0f3d249f0e2d64040493806c40e4013161b6541/README.md) | Current package v5.3.1, browser-only architecture, compiler/Fidelity/Lyrics/Guide capabilities. |
| Deferred Lyrics work | [docs/LYRICS_STUDIO_OVERHAUL.md](https://github.com/iamsevnth/suno-styles-workbench/blob/b0f3d249f0e2d64040493806c40e4013161b6541/docs/LYRICS_STUDIO_OVERHAUL.md) | WebGPU/local inference, pronunciation/rhyme, stressed syllables, BPM-native segmentation, drag/drop, audio timing, silence, harmonic analysis. |
| Lyrics release future notes | [docs/releases/v5.2.0.md](https://github.com/iamsevnth/suno-styles-workbench/blob/b0f3d249f0e2d64040493806c40e4013161b6541/docs/releases/v5.2.0.md) | Browser-local ML ranking, phonetic-dictionary rhyme analysis, more accurate tempo/meter analysis. |
| Fidelity methodology | [docs/PROMPT_FIDELITY_METHODOLOGY.md](https://github.com/iamsevnth/suno-styles-workbench/blob/b0f3d249f0e2d64040493806c40e4013161b6541/docs/PROMPT_FIDELITY_METHODOLOGY.md) | Requirements for future audio-outcome validation before publishing an effectiveness indicator. |
| Superseded VNext roadmap | [PR #30](https://github.com/iamsevnth/suno-styles-workbench/pull/30) | Planned but unimplemented: arrangement/motif state graphs, adaptive length modes, deep world-genre segmentation, model/settings controls, listening-derived effectiveness feedback. |

**Baseline status:** At roadmap creation, the repository baseline is Suno Workbench v5.3.1. The v5.2 source-preserving Lyrics Studio and v5.3 Prompt Fidelity Inspector are treated as implemented foundations, not future roadmap items.

## Explicitly Completed or Superseded Items

- Source-preserving Lyrics Studio redesign — shipped in v5.2.
- Prompt Fidelity Inspector — shipped in v5.3.
- Precision tempo/key/meter parsing, separate Exclude handling, improved Fix preservation, Precision/Exploration, and controlled A/B — shipped in v5.1/v5.1.1.
- Dancehall validation correction — shipped in v5.1.1.
- Legacy VNext PR #30 — preserved as historical research and must not be merged wholesale.

---

Suno Workbench is an independent SEVNTHLABS project and is not affiliated with or endorsed by Suno, Inc. This roadmap describes planned Workbench development and does not represent commitments by Suno, Inc.