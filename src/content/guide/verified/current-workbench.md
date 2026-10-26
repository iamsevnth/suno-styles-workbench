# Workbench v4 — Start Here

## What Workbench does

Suno Workbench is a browser-only, deterministic Styles Compiler and Lyrics Studio. Compilation uses local parsing, genre families, planning, phrase libraries and validation. It does not call an AI service or send prompts to a backend. The downloadable offline file contains the same application.

The Styles Compiler builds **925–975-character** prompts and tries to preserve recognized user intent. Suno still decides how to perform the music; a Workbench output is not a guarantee of a specific acoustic result.

## Practical six-step workflow

1. Open **Styles Compiler**. Choose **Create From Brief** for a new idea or **Fix Existing Prompt** for an existing Styles prompt that needs clearer organization.
2. Provide a lead genre, BPM, voice, mood, groove, instruments and any decisive bass/arrangement details. Example: `140 BPM EDM Trap + Future Bass, female alto, half-time, Rhodes, LFO wobble response, pre-drop choke`.
3. **Example Briefs** are clickable learning inputs. **Always Available** keeps an exploration example accessible. Selecting an example does not run the generator.
4. Choose **Variations** (1–6). Different seeds lead to different deterministic production plans. **Hybrid Bass Profile** supplies a default creative taste only when your brief leaves room; disable it for more neutral genre-led decisions.
5. Press **Generate Styles** or **Fix Prompt**, inspect the candidate cards and quality status, and compare the variants. Controls do not compile until you explicitly generate.
6. Copy the selected Styles prompt into Suno's Advanced Create Styles field. For a controlled A/B experiment, set Suno Variety to **0** to retain exact style tags, then vary one musical control at a time.

## Input-to-output mapping

- **Genre order:** a lead identity plus secondary/accent traits; genre families restrict inappropriate drop/bass vocab.
- **BPM and key:** one recognized integer BPM is rendered; a typed musical key can guide harmony and appears in the header.
- **Voice:** recognized timbre, register, sung/rap delivery, treatment and instrumental status change vocal planning and the remaining character budget.
- **Instruments and sampling:** explicit instruments are anchor cues. In v4, MPC/chopped samples can be melodic or harmonic identity elements.
- **Bass/drums:** sliding 808, growl, Reese, LFO modulation, portamento, snare rolls, rim ticks and similar requests are routed to their respective production axes.
- **Arrangement:** negative space, fakeouts, pre-drop chokes and evolved second drops are planned where genre-appropriate.
- **Mix:** mono low end, wide upper texture, sidechain, headroom and low-mid separation map to mix language rather than generic mood adjectives.

The strongest briefs describe each element's **role**: sample = melodic hook; sub = foundation; mid-bass = motion; vocal = focal point; drums = pocket; FX = transition punctuation.

## New v4 seed identity

The old three-word generated title and 8-character random ID were removed. Every candidate identifies the actual unsigned 32-bit planning seed, zero-padded to 10 digits:

`Seed #: 0123456789 | BPM: 140 | Key: F minor | Total Characters: 950`

With no explicit key, the heading uses **Key: --**. Retain the original input, settings and seed for repeatability; a seed by itself is not a complete project state.

## Quality and iteration

The core gates check 925–975 characters, one whole-number BPM, safe artist reference handling, positive Styles wording and the separation of Lyrics from Styles. Variants are also checked for meaningful distinction. A final genre safety pass prevents EDM-drop wording in non-drop families.

Use positive phrasing: `dry close-mic vocal` communicates a desired result more clearly than `no autotune`. Keep one or two primary genre identities prominent, then describe the supporting donor roles.

## Lyrics Studio

Lyrics Studio includes structured section sequences, section-level line counts, Suno structural tags and an American English phonetics converter. The **Modular Song Structure Order (Custom Sequence)** is already present. A full automatic rewrite engine that preserves an exact arbitrary sequence is documented in `docs/LYRICS_STUDIO_OVERHAUL.md` as a plan, not a shipped v4 feature.

## Local privacy and offline operation

Prompt generation and lyric processing stay in your browser. History and preferences are local device state. No Workbench analytics, cookies or prompt-upload backend are used. Hosting-level GitHub Pages logging is described in the dedicated **Privacy Policy** at `/privacy-policy`.

This Guide and its search index ship inside the single-file offline HTML. External documentation links need an internet connection, but the Guide itself does not.
