<p align="center">
  <img src="docs/assets/logo.png" alt="Suno Workbench Styles Pro" width="420">
</p>

# Suno Workbench

[![Test and deploy](https://github.com/iamsevnth/suno-styles-workbench/actions/workflows/deploy.yml/badge.svg)](https://github.com/iamsevnth/suno-styles-workbench/actions/workflows/deploy.yml)

A free, browser-only toolkit for writing songs with Suno v6. Type a one-line brief and get detailed Styles prompts that Suno can follow, then finish the lyrics and the rest of the song.

**Live site:** https://sunoworkbench.com
**Guide:** https://sunoworkbench.com/guide

Each tool has its own address: [/compiler](https://sunoworkbench.com/compiler), [/lyrics](https://sunoworkbench.com/lyrics), [/skills](https://sunoworkbench.com/skills) and [/guide](https://sunoworkbench.com/guide). Older links such as `#styles` still work and are moved to the new address.

| Tool | What it does |
| --- | --- |
| **Styles Compiler** | Turns a brief into one to six production prompts for Suno's Styles field. Each is 925–975 characters, names one whole-number BPM, and describes the genres, groove, drums, bass, harmony, vocal, mix and instruments. |
| **Lyrics Studio** | Builds a song section by section with exact line counts, generates or finishes lyrics with Suno section tags, and respells words the way they are spoken in American English. |
| **Skills Studio** | Eight playbooks: prompt optimizer, covers and influences, mashups and samples, lyrics remixer, Song Editor, Studio workflows, rights and safety, and a v6 source snapshot. |

There is no server, account, analytics, cookie or API key, and no AI service is called. Everything is compiled by rules and a phrase library in your browser. The whole site also ships as one self-contained HTML file (`suno-workbench.html`) that runs offline.

## Example

Brief:

```
melodic R&B with flute and Rhodes electric piano
```

One compiled prompt for that brief (seed 42, 957 characters, as of this release):

> 92 BPM Emotional R&B and Pop R&B hybrid built for warm and polished nights — intimate R&B-forward production. Drums lead with tight pop kick and snare, gentle shaker, tight live kit with warm room inside a natural live-band groove, locking laid-back behind-the-beat pocket and gentle shuffle groove so each section has somewhere to land. The bass conversation is warm electric bass guitar, warm detuned saw bass, moving through gospel-style bass runs into the chorus and punchy fingerstyle bass with slap and pop and bright attack. Lead vocals deliver laid-back male Afro-fusion vocal, anthemic chorus lead with stacked peaks, stacking doubles only on the hook so verses stay close. The production keeps Rhodes electric piano front and center. Translation stays clear on every playback system. Acoustic palette includes ambient chorus-modulated Rhodes, reverb-washed bamboo flute, warm electric bass guitar, soft drum kit, organic shaker, cinematic impacts.

The brief names no sub-genre, tempo, bass or drum kit; the compiler chose R&B ones from the R&B family's vocabulary and kept the flute and Rhodes. The Guide compiles this example live, so it always shows the current engine's exact output.

## What every prompt guarantees

| Rule | Detail |
| --- | --- |
| Fits the field | 925–975 characters, inside Suno's 1,000-character Styles limit |
| One tempo | A single whole-number BPM: yours, or the genre's home tempo |
| Keeps your words | Genres, BPM, named instruments and your vocal description appear in every variation |
| Genre-faithful | Each of the 259 genres maps to one of 21 sound families with its own groove, drums, bass, harmony, textures, song forms, mix and mastering vocabulary |
| Positive prompting | Describes what to play; never “no”, “avoid” or “without” lists |
| No artist names | No named artists and no “in the style of” phrasing |
| Production first | The vocal gets one short line (up to 150 characters) unless your brief describes the voice in detail, so most of the prompt describes the production |
| Styles only | No lyric lines or section tags in the Styles text |

### How vocals are written

The production carries a Styles prompt, so the vocal gets one sentence and the rest of the characters describe the drums, bass, harmony, texture and mix. How long that sentence is depends on how much the brief says about the voice:

| Your brief says | The vocal sentence |
| --- | --- |
| Nothing about the voice (`dark trap`) | A vocal the genre suits, up to 150 characters |
| The basics (`male rap`, `female vocals`) | Built around the voice you named, up to 150 characters |
| Four or more vocal traits (`breathy female alto, close-mic, light autotune, slapback delay`) | Up to 300 characters, so all of them fit |
| A full vocal description | Your own words, quoted as written, plus a short note on the vocal's space in the mix |
| `instrumental` | No vocal sentence; the whole prompt describes the production |

Who sings comes first, then any effects you named, then planned details only while they fit. Planned wording uses "with" at most once and never repeats a word already in the sentence. When the brief describes the voice in its own words, the prompt quotes that description instead of replacing it, and once the vocal sentence names the voice you asked for, no second "front and center" sentence repeats it.

### UKG is not UK garage

The two are different styles, and the compiler keeps them apart:

| You type | Compiles as |
| --- | --- |
| `UKG`, `UKG dubstep`, `ukg-dubstep` | **UKG Dubstep**: 140 BPM half-time trap drums under heavy sub and 808 pressure, with a skippy, syncopated hi-hat and shaker layer on top |
| `UK garage`, `garage`, `2-step` | **UK Garage**: swung 2-step drums, warm chords and soulful vocals around 134 BPM |

Every genre with "UKG" in its name (140 UKG, Half-Time UKG, Deep UKG-Dubstep, UKG Trap and others) belongs to the UKG family, so none of them borrow UK garage's 2-step swing, organ stabs or diva vocals, and UK Garage prompts never mention UKG, dubstep, wobble or growl bass.

## Using it with Suno

1. Write a brief such as `140 BPM trap future bass, female vocals, high energy` and press **Generate Styles**.
2. Copy a result into the Styles field in Suno's Advanced mode.
3. Set **Variety** to Off. Suno's v6 FAQ says the slider “is designed to introduce variety in your outputs by adjusting and updating your style prompts”, and that setting it to 0 lets you “retain full control of your style tags”.
4. Put anything you want kept out in Suno's **Exclude styles** field, not in the brief.

| Setting | Use | Source |
| --- | --- | --- |
| Model | v6 (Pro and Premier) or v6-mini (all plans) | [Suno blog](https://suno.com/blog/introducing-v6) |
| Variety | Off | [Suno v6 FAQ](https://help.suno.com/en/articles/13924481) |
| Max Mode | On for songs longer than two minutes; costs more credits | [Suno v6 FAQ](https://help.suno.com/en/articles/13924481) |
| Personalize (My Taste) | Off | Workbench recommendation |
| Weirdness | 20–30% | Workbench recommendation |
| Style Influence | 75–85% | Workbench recommendation |

Suno does not publish slider defaults or ideal values; the last three rows are starting points from testing compiled prompts. The [Guide](https://sunoworkbench.com/guide) covers brief writing, a worked example, genre coverage, quality gates, troubleshooting, a glossary and all sources.

## How the compiler works

| Stage | File | What it does |
| --- | --- | --- |
| Parse | `src/lib/suno/parse.ts` | Reads genres, tempo, key, moods, vocals, instruments and groove, bass and drum hints from the brief |
| Classify | `src/lib/suno/families.ts` | Maps each genre to sound families from the library's own data, and decides which families have drops and which basses they use |
| Plan | `src/lib/suno/plan.ts` | Builds a sonic plan per variation: feel, drums, bass, harmony, melody, textures, form, mix, master, vocal and instruments |
| Render | `src/lib/suno/render.ts` | Writes the plan as prose in a fixed sentence order and fits it to the character window, protecting the vocal, the tempo and the brief's anchors |
| Validate | `src/lib/suno/validate.ts` | Checks the quality gates and repairs or recompiles until they pass |

Vocabulary lives in `src/lib/suno/lexicon.ts` and, for each sound family, in `src/lib/suno/lexicon-genres/`: about 2,950 phrases in all.

### Adding vocabulary for a genre family

Each family in `src/lib/suno/lexicon-genres/` is one `FamilyLexicon` object with fields for moods, production, groove, drums, harmony, melody, sound design, mix, master, song forms, padding sentences and titles. Add phrases to the right field and run `npm test`. The tests check that every phrase is free of artist names and negative wording, that genres without drops never mention them, and that the whole library still compiles within the rules.

## Development

Requires Node.js 22 or later.

```bash
npm ci           # installs the exact versions in package-lock.json
npm run dev      # http://127.0.0.1:3000 (this computer only; add -- --host to test on a phone)
npm test         # all node:test suites via tsx
npm run lint     # TypeScript type-check
npm run build    # dist/ with index.html, one page per address, sitemap.xml and the offline dist/suno-workbench.html, then checks their CSP
npm run preview  # serve the production build
```

Every push to `main` runs the type-check, the tests and the build, then deploys `dist/` to GitHub Pages (`.github/workflows/deploy.yml`). Pull requests run the same checks without deploying, plus CodeQL and a dependency review that blocks newly added packages with known vulnerabilities. Dependabot opens weekly update pull requests for npm packages and GitHub Actions, and every Action is pinned to a full commit SHA.

### Tests

| Suite | Covers |
| --- | --- |
| `tests/acceptance.test.ts` | Core compiler behavior: tempo, genres, vocals, instrumentals, recipe uniqueness, exports |
| `tests/regressions.test.ts` | Bugs that were fixed and must stay fixed: R&B parsing, vocal sentence survival, prompt wording |
| `tests/genre-fidelity.test.ts` | Genre families, drop-free genres, sung leads, house and DnB feel, a sweep of every genre in the library, and phrase-library hygiene |
| `tests/ukg.test.ts` | UKG dubstep and UK garage stay separate: how briefs are read, 140 BPM half-time trap drums with the skippy hat and shaker layer, and no shared vocabulary |
| `tests/lyrics.test.ts` | Lyrics generator sections and phonetic respellings |
| `tests/routes.test.ts` | Page addresses, old `#` links, and that the build's page list matches the app's |
| `tests/build-routes.test.ts` | One page file per address with its own title and canonical link, plus 404, sitemap and robots files |
| `tests/build-offline.test.ts` | The offline-file builder inlines assets and refuses files outside the build folder |

### Project layout

```
src/
  App.tsx                 page switch, dialog
  routes.ts               page addresses (/, /compiler, /lyrics, /skills, /guide) and their titles
  pages/                  Home page and the Guide (pages/guide/)
  components/
    content/              shared building blocks for content pages
    layout/               site header, footer, offline download link
    studio/               studio tabs and the resizable workspace
    styles/               Styles Compiler: brief panel, prompt card, history
    skills/               Skills Studio and its report view
    LyricsStudio.tsx      Lyrics Studio
  hooks/                  routing, Styles Compiler state, workspace resizing
  lib/
    suno/                 the compiler (see "How the compiler works")
    lyrics/               lyrics generator and phonetics
    browser/              clipboard and file download helpers
scripts/
  build-routes.mjs        one page file per address, plus 404.html, sitemap.xml and robots.txt
  build-offline.mjs       inlines the built JS and CSS into one HTML file
tests/                    node:test suites
```

## Privacy

The current brief and results are kept in the tab's `sessionStorage`, and Styles history in the browser's `localStorage` until you clear it. History keeps the newest 200 runs; when it fills up, or the browser runs out of storage, the oldest runs are removed and the page says so. Stored data is checked when it is read back, so an old or damaged entry is skipped instead of breaking the page. Your light or dark mode choice is also kept in `localStorage`, on this device only. Export History is the only way data leaves the page, as a file saved to your own computer. The site ships with a Content Security Policy that lets it load only its own files and blocks every network request. See [SECURITY.md](SECURITY.md) to report a vulnerability.

## Light and dark mode

The sun and moon button in the header switches between light and dark mode. The site follows your device's setting until you pick one, then remembers your choice in this browser. Light mode uses the brand palette (pearl canvas `#F3F6FB`, white cards, near-black text, blue `#0059F8` and violet `#6005E7` actions, and the logo's spectrum for highlights); dark mode uses the same brand colors on the near-black canvas (the blue-to-orange gradient on main buttons, brighter blue links and violet focus rings). Theme colors are CSS variables in `src/index.css`. Every text and color pair meets WCAG AA contrast (4.5:1) in light mode, and the brand text colors in dark mode reach 7:1 or better.

## Credits

- Label font: [Atkinson Hyperlegible](https://www.brailleinstitute.org/freefont/) by the Braille Institute, SIL Open Font License (`src/assets/fonts/`).
- Icons: [Lucide](https://lucide.dev) (ISC License) and the GitHub mark from [Octicons](https://primer.style/octicons) (MIT License); notices in `src/components/icons/LICENSES.md`.

## Contact

Questions, ideas or a broken feature: [mateus@sevnthlabs.com](mailto:mateus@sevnthlabs.com). The site footer has the same link. To report a security vulnerability, use the private process in [SECURITY.md](SECURITY.md).

## Not affiliated with Suno

Suno Workbench is an independent project. It is not affiliated with or endorsed by Suno, Inc. Claims about Suno in this README and the Guide are checked against Suno's own pages, and each is labeled with its source.
