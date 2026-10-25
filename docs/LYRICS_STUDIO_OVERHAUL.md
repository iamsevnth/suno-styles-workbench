# Lyrics Studio Overhaul Plan

## Purpose

Rebuild Lyrics Studio around the capability that most clearly differentiates it from Suno itself: **Modular Song Structure Order (Custom Sequence)**. The core job is not “generate generic lyrics.” It is:

> Define the exact song architecture first, then generate, revise and iterate lyrics that fit that architecture without losing narrative flow, rhyme continuity, hook identity or energy progression.

This document is an implementation plan only. It does not implement the rewrite engine described below.

## Product principle

The section sequence is the source of truth.

A user should be able to design a structure such as:

```
Intro → Verse 1 → Pre-Chorus → Chorus → Verse 2 → Pre-Chorus → Chorus → Bridge → Drop → Final Chorus → Outro
```

or a nonstandard electronic structure such as:

```
Intro → Chorus → Build Up → Drop → Build Up → Drop → Breakdown → Drop → Outro
```

Lyrics Studio should then make every generation, rewrite and validation decision against that ordered sequence.

The existing `ModularSectionItem[]` model and `sectionSequence` generator parameter already provide the correct architectural foundation.

## Primary user flow

### 1. Define the song identity

The user supplies only the creative context needed across the whole song:

- theme / story;
- optional genre;
- mood / energy target;
- vocal delivery;
- rhyme strategy;
- optional existing lyrics;
- optional project notes; and
- optional Styles Compiler context.

This information describes the song globally. It must not determine section order.

### 2. Build the exact custom sequence

The sequence builder becomes the visual center of the page rather than a secondary control.

For every section, the user can:

- add any supported section type;
- drag or move it anywhere in the sequence;
- duplicate it;
- delete it;
- change its line count;
- rename the visible label where useful;
- optionally attach a section-specific instruction; and
- see its ordinal identity, e.g. Verse 1, Verse 2, Drop 3.

Supported base section types continue to include:

- Intro
- Verse
- Chorus
- Build Up / Pre-Chorus
- Drop
- Breakdown
- Bridge
- Outro

Future versions may add custom semantic types without changing the ordered-sequence model.

### 3. Inspect the structure before generation

Before any lyric generation, show a compact “song map” summarizing:

- exact section order;
- total sections;
- total planned lyric lines;
- repeated-section counts;
- where hooks repeat;
- expected energy direction; and
- warnings such as an unusually long sequence or a chorus that never returns.

This gives the user a chance to correct architecture before text is created.

### 4. Generate to the sequence

Generation must traverse `sectionSequence` in order.

Each generated section receives context from:

- the global theme;
- prior generated sections;
- the next section's role;
- recurring-hook state;
- rhyme/meter state;
- energy state; and
- the section's exact requested line count.

The engine must not silently reorder sections or invent missing sections.

### 5. Revise without breaking structure

Iteration should support three scopes:

**Line rewrite**
- Replace selected lines only.
- Keep section identity, line count and surrounding context.

**Section rewrite**
- Regenerate one section.
- Preserve the exact section type and requested line count.
- Use the preceding and following sections as continuity constraints.

**Full-song rewrite**
- Regenerate all lyric content while keeping the entire custom sequence fixed.
- Rebuild narrative and energy progression across the same architecture.

A rewrite must never collapse a custom structure back into a conventional Verse/Chorus template.

## Maintaining flow across arbitrary sequences

### Narrative state

Track what each section contributes:

- setup;
- new information;
- escalation;
- hook statement;
- reversal;
- release;
- reflection; or
- closure.

Repeated verses should advance the story rather than paraphrase earlier verses.

### Hook state

When a Chorus or other hook-bearing section repeats, track:

- exact locked lines;
- optional variation lines;
- title phrase;
- call-and-response pattern; and
- final-chorus lift behavior.

Users should be able to mark a section as:

- exact repeat;
- controlled variation; or
- fully new text with the same hook function.

### Rhyme and meter state

Per section, retain:

- target rhyme scheme;
- approximate syllable density;
- cadence notes;
- repeated end-rhyme families; and
- phrase-length expectations.

A rewrite should preserve the selected structural and metrical contract unless the user explicitly changes it.

### Energy state

Each section should have an intended energy role, not only a name.

Example:

| Section | Energy role |
| --- | --- |
| Intro | establish texture / low density |
| Verse | narrative / restrained |
| Pre-Chorus | tension lift |
| Chorus | hook payoff |
| Bridge | contrast / reset |
| Drop | peak physical energy |
| Outro | release / resolution |

The generated language, line density, repetition and performance tags should reflect that role.

## Integration with Styles Compiler

The two tools should exchange **structured context**, not paste one tool's output blindly into the other.

### Compiler → Lyrics Studio

Proposed transferable fields:

- primary / secondary genres;
- BPM;
- key, when present;
- mood;
- vocal presentation and delivery;
- groove;
- arrangement hints;
- energy / section-language hints; and
- named instruments only when they affect lyric imagery or performance direction.

A “Use in Lyrics Studio” action on a Styles result could populate these fields while leaving the user's custom section sequence untouched.

### Lyrics Studio → Styles Compiler

Lyrics Studio can expose a compact structure summary such as:

```
Intro → Verse → Pre-Chorus → Chorus → Verse → Chorus → Bridge → Drop → Final Chorus → Outro
```

The Styles Compiler could optionally use this as an arrangement hint, but the sequence must remain owned by Lyrics Studio. The compiler should not rewrite the section order.

### Shared project state

Future implementation can define a local, versioned project object stored in browser storage:

```ts
interface SongProject {
  version: number;
  title?: string;
  creativeBrief?: string;
  stylesContext?: StylesContext;
  lyricsContext: LyricsContext;
  sectionSequence: SongSection[];
  generatedLyrics?: GeneratedLyricsState;
  updatedAt: string;
}
```

No server persistence is required.

## Proposed data-model changes

The current `ModularSectionItem` is a good MVP base:

```ts
interface ModularSectionItem {
  id: string;
  type: SectionType;
  lines: number;
  customLabel?: string;
}
```

Proposed next version:

```ts
interface SongSection {
  id: string;
  type: SectionType;
  label: string;
  lines: number;
  instructions?: string;
  energy?: "low" | "rising" | "medium" | "high" | "release";
  hookMode?: "none" | "new" | "repeat" | "variation";
  hookSourceId?: string;
  rhymeScheme?: RhymeScheme;
  targetSyllablesPerLine?: { min: number; max: number };
  lockedLines?: string[];
}
```

Generation state should be separate from the user's structural intent:

```ts
interface GeneratedSectionState {
  sectionId: string;
  lines: string[];
  revision: number;
  rhymeNotes?: string[];
  continuityNotes?: string[];
}
```

This separation makes it possible to rewrite text without mutating the structure.

## Proposed UI flow

### Layout

**Left / top: Song Blueprint**
- global theme and vocal controls;
- optional Styles Compiler context;
- concise generation controls.

**Center: Custom Sequence**
- largest visual area;
- drag/reorder cards;
- Add Section controls;
- per-section line counts;
- duplicate/delete;
- section-specific instruction drawer;
- structure summary.

**Right / bottom: Lyrics**
- generated text grouped by section;
- per-line and per-section rewrite actions;
- lock controls;
- continuity warnings;
- copy/download/send-to-phonetics.

Responsive layouts should stack these regions without changing the structural model.

### Sequence card behavior

Each section card should show:

- ordinal label;
- section type;
- line count;
- energy role;
- hook/repeat status;
- a short custom instruction;
- move / duplicate / delete actions.

The user should understand the entire song order without opening another panel.

### Rewrite interaction

A rewrite action opens a small scoped panel:

- What should change?
- Preserve rhyme?
- Preserve cadence / syllable density?
- Preserve hook lines?
- More / less energy?
- Generate 1–3 alternatives.

The resulting alternatives replace only the selected scope after explicit selection.

## MVP scope

The first overhaul release should focus on structural reliability rather than a large number of generative controls.

### MVP must include

- Custom Sequence as the primary Lyrics Studio workflow.
- Add, remove, duplicate and reorder all supported sections.
- Exact per-section line counts.
- Persist sequence in session/local project state.
- Generate lyrics strictly in sequence order.
- Correct ordinal labeling for repeated types.
- Full-song rewrite that preserves sequence.
- Section rewrite that preserves section ID/type/line count.
- Lock repeated chorus/hook text.
- Basic continuity state across sections.
- Basic energy role per section.
- Import relevant Styles Compiler context.
- Existing copy, download and phonetics workflow.
- Validation that generated output contains every planned section exactly once and in order.

### Explicitly out of MVP

- Audio analysis.
- Melody-to-syllable alignment from uploaded recordings.
- Cloud project sync.
- Collaborative editing.
- AI API/server calls.
- Automatic publishing to Suno.
- Advanced prosody scoring.
- Large language-model freeform rewriting that can ignore the sequence.

## Future enhancements

### Structural intelligence

- drag-and-drop timeline;
- reusable user presets;
- conditional section templates;
- medley / reprise semantics;
- alternate outro variants;
- section duration estimates from BPM and line density.

### Lyric intelligence

- per-character point of view;
- narrative beat map;
- internal-rhyme density controls;
- multisyllabic rhyme tracking;
- motif recurrence;
- semantic repetition warnings;
- hook strength comparisons;
- automatic final-chorus escalation.

### Performance intelligence

- breath-point suggestions;
- delivery density by BPM;
- rap/sung cadence templates;
- performance-tag validation;
- section-specific phonetic conversion.

### Styles / arrangement intelligence

- structure-aware Styles Compiler handoff;
- energy-curve visualization;
- detect mismatch between lyric structure and Styles arrangement language;
- suggest structure-compatible arrangement notes without changing the user's order.

## Validation strategy

### Unit tests

- sequence reorder preserves IDs;
- duplicate creates a new stable ID;
- delete removes only the selected section;
- line-count edits affect only that section;
- ordinal labels update correctly;
- hook repeat links remain valid after reorder;
- serialization round-trip preserves sequence.

### Generation tests

For a supplied sequence, assert:

- output section count equals input section count;
- section IDs/order match exactly;
- each section meets requested line count;
- no unrequested section is introduced;
- locked lines survive rewrite;
- section rewrite leaves neighboring sections unchanged;
- full rewrite changes text but not structure.

### Regression tests

Keep fixtures for:

- multiple drops;
- chorus before verse;
- no chorus at all;
- repeated bridge;
- two outros;
- one-section songs;
- long club structures;
- mixed rap/sung delivery;
- phonetics after structural rewrite.

## Success criteria

The overhaul is successful when:

1. A user can reproduce any supported custom sequence without the tool normalizing it to a standard pop form.
2. Generated lyrics match the exact ordered section list and line counts.
3. Rewriting one section does not mutate the rest of the structure.
4. Repeated hooks can be intentionally locked or varied.
5. Narrative and rhyme continuity remain understandable across nonstandard orders.
6. Styles Compiler context can be imported without changing the section sequence.
7. The whole workflow remains client-side and functional in the offline build.
8. Automated tests make structural regressions visible before deployment.
9. The UI makes Custom Sequence obviously the primary reason to use Lyrics Studio.
