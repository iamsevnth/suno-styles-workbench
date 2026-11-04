# Create Mode — Official Suno v6 Controls

**Checked November 4, 2026.** These descriptions come from Suno's Help Center and Release Notes; Suno controls do not become Workbench controls merely because they are discussed here. Workbench v5.3 only audits detectable textual intent; it cannot read Suno's actual slider settings or audio output.

## Available Models

**v6:** flagship, precise and polished for Pro and Premier subscriptions. Best suited to well-defined musical directions.

**v6-wild:** exploratory Pro/Premier model with more unpredictable combinations and musical texture; useful for idea discovery before controlled refinement.

**v6-mini:** fastest, lighter v6 model, available to all plans including Free; useful for quick ideas and iterations.

**Older models:** Suno states that pre-v6 models are retired from new generation. Previously made songs remain in users' libraries.

## Creative Sliders

**Weirdness — Safe to Chaos.** Suno documents **50%** as the normal expected-result position. Move away from it according to the amount of creative unpredictability you want; no single narrow range applies to every genre.

**Style Influence — Loose to Strong.** Controls how strongly Suno follows the supplied Styles input.

**Audio Influence — Loose to Strong.** Appears only when an audio upload is present and controls its influence on the resulting generation.

**Variety.** Suno may adjust/update Styles prompts to introduce variety. Set to **0** if you want control of the exact Styles tags. This is useful for controlled Workbench comparisons, not a universal requirement for enjoyable music.

**Max Mode.** Higher compute and credit cost, intended especially for songs longer than two minutes, covers close to an original, style transfers, and voice/style consistency across a full track.

## Editing and Studio Context

Suno v6 also supports plain-language editing, combining multiple sources, sampling/isolation workflows and targeted lyric changes. These actions happen within Suno, not in Workbench.

Suno Studio Release Notes from October 8, 2026 document downbeat detection improvements, shift-drag clip timestretching and adjustable fade curves. The October 29, 2026 Studio update adds a clearer Clip Settings sidebar, Clip Info, optional auto-stretching of added audio, fine pitch adjustment and hide/show track controls. These are Suno Studio features, not Workbench tools. Exact availability, UI wording and credit costs may change; check current release notes.

## Using Suno with Workbench v5.3

- Use the **Styles Compiler** for deterministic text planning or Fix Existing Prompt. Copy prohibited elements into Suno's separate **Exclude** control.
- Use **Prompt Fidelity Inspector** to compare your original brief against generated Styles, or the pre-Fix prompt against its repair. It reports recognized text facts, not audio results.
- For controlled comparisons of exact Style tags in Suno v6, the vendor recommends **Variety = 0**. Style Influence and other settings still affect generation; Workbench does not set or capture those controls.
- Use **Lyrics Studio** to arrange original supplied words; use Suno to generate, edit or perform the music. A planned lyric bar slot does not establish an audible bar length.

## Official References

- Creative Sliders: https://help.suno.com/en/articles/6141377
- v6 FAQ: https://help.suno.com/en/articles/13924481
- What's new in v6: https://help.suno.com/en/articles/13924801
- Official Release Notes: https://suno.com/release-notes
- Terms of Service: https://suno.com/terms
