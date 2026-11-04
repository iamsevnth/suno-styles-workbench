# Lyrics Studio — Source-Preserving Arranger v5.2+

## What changed in Lyrics Studio

Lyrics Studio now **rearranges lyrics supplied by you**, rather than composing new lyrical words. It works entirely in the browser. User-provided source lines can be reordered, repeated, or divided into existing-word fragments; every output phrase is mapped back to the original input.

The separate **American Phonetics Converter** remains available. Its phonetic rendering is a text transformation, not a certification of real-world pronunciation or Suno performance.

## Choose an input workflow

- **Paste Entire Song:** Paste your original authorized draft into one box. Optional labels such as `[Verse]`, `[Chorus]`, `[Build Up]` and `[Drop]` identify source groups.
- **Separate Sections:** Paste source material into individually labeled section boxes. Each source can have a genre-neutral structural label and an optional **Keep Order** setting.

The tool does not create new lyrical words. Section headings added to export are structural metadata, not authored lyric lines. Only use material you wrote or are authorized to transform.

## Configure the destination structure

1. Use **Suggest Structure** or manually add destination sections.
2. Assign each destination a type, source section, operation, and requested **bar slots**. Reorder the destination sections to create your preferred song structure.
3. Choose **Reorder Lines** to reuse complete original lyric lines, or **Chop Long Lines** to divide the existing source into shorter word-boundary fragments.
4. Select target BPM (40–240); optionally enter an original BPM to receive a coarse delivery warning when tempos diverge. Use a numerical variation seed for reproducible rearrangements.
5. Choose the approximate rhyme-group option when you want recognizable adjacent end-rhyme pairs or four-line AABB/ABAB patterns retained where feasible.
6. Press **Arrange Supplied Lyrics**, inspect the result, then **Copy to Suno**, **Download TXT**, or open **Show Source Map**.

**Important:** The arranger treats one existing line or fragment as one **planned bar slot**. This is not the same as verifying that a sung line fits one performed musical bar. Cadence, stressed syllables, melodic phrasing and delivery must be evaluated by ear.

## Example: 16-line chorus to buildup and drop

A single original 16-line chorus may become an **8-slot Build Up** followed by a **16-slot Drop**. Twenty-four planned slots exceed the sixteen unique source lines, so the arranger must repeat original wording or subdivide phrases. It does not secretly generate eight new lyric lines.

To retain a phrase's original order, use **Keep Order** on the source; otherwise the seeded arrangement can reorder source groups. The source map identifies the source section ID, line number, character span and repeated segments.

## Save and restore your project

- **Save to Browser:** Opt-in local storage. Saving is never automatic.
- **Restore Saved / Clear Saved Copy:** Read or remove the local project stored in that browser profile.
- **Export Project JSON / Import JSON:** Versioned local backup and recovery. Keep your own backups before clearing site data.
- **Download TXT:** Export the validated, Suno-ready arrangement.
- **Send to Phonetics:** Transform the text in the separate phonetic tool when appropriate.

The arranger verifies output phrases against exact source character ranges before enabling copy/export. This is a **text-integrity guarantee within its source mapping**, not a guarantee that the lyrics will rhyme, flow or fit the intended musical meter.

## Accuracy and privacy boundaries

- Rhyme detection uses approximate **spelled** word endings, not complete phonetic dictionaries or stress-aware analysis.
- Syllable counts and BPM-related warnings are approximations, not audio transcription.
- Randomized arrangements are deterministic for the same source, settings and seed; this is not neural-network generation.
- Source and output remain in the browser. There is no lyric-generation backend, third-party inference API or account requirement.
- An exported JSON project or TXT file contains your lyric material, so protect it as you would any other creative manuscript.

For implementation details and limitations, see [Lyrics Studio Design](https://github.com/iamsevnth/suno-styles-workbench/blob/main/docs/LYRICS_STUDIO_OVERHAUL.md).
