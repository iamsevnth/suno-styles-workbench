# Suno Workbench

A free, browser-only toolkit for writing songs with Suno v6.

**Live site:** https://iamsevnth.github.io/suno-styles-workbench/

- **Styles Compiler** turns a one-line brief into one to six production prompts for Suno's Styles field. Each prompt is 925–975 characters with a single whole-number BPM and covers the genres, groove, bass, harmony, vocals, mix and instruments. It never names artists.
- **Lyrics Studio** builds a song section by section with exact line counts, generates or finishes lyrics, and converts them to American English phonetic spellings.
- **Skills Studio** has eight playbooks: prompt optimizer, covers, mashups and samples, lyrics remixer, Song Editor, Studio workflows, rights and safety, and a v6 source snapshot.

There is no server, account, analytics or API key. Briefs and results stay in the browser: the current session in `sessionStorage`, Styles history in `localStorage`. The same site also ships as one self-contained HTML file (`suno-workbench.html`) that runs offline.

## Using it with Suno

1. Write a brief such as `140 BPM trap future bass, female vocals, high energy` and press **Generate Styles**.
2. Copy a result into the Styles field in Suno's Custom mode.
3. Set **Variety** to Off. Suno's v6 FAQ says the Variety slider "is designed to introduce variety in your outputs by adjusting and updating your style prompts". At Off, Suno uses your Styles text word for word.

The site's [Guide](https://iamsevnth.github.io/suno-styles-workbench/#guide) explains every signal the compiler reads in a brief, the Hybrid Bass Profile toggle, and recommended v6 settings.

## Development

Requires Node.js 22 or later.

```bash
npm install
npm run dev      # http://localhost:3000
npm test         # engine, regression and lyrics tests (node:test via tsx)
npm run lint     # TypeScript type-check
npm run build    # dist/ with index.html and the offline dist/suno-workbench.html
npm run preview  # serve the production build
```

Every push to `main` runs the type-check, the tests and the build, then deploys `dist/` to GitHub Pages (see `.github/workflows/deploy.yml`). Pull requests run the same checks without deploying.

### Project layout

```
src/
  App.tsx                 page switch, dialog
  routes.ts               hash routes (#/, #styles, #lyrics, #skills, #guide)
  pages/                  Home and Guide content pages
  components/
    layout/               site header, footer, offline download link
    studio/               studio tabs and the resizable workspace
    styles/               Styles Compiler: brief panel, prompt card, history
    skills/               Skills Studio and its report view
    LyricsStudio.tsx      Lyrics Studio
  hooks/                  routing, Styles Compiler state, workspace resizing
  lib/
    suno/                 the compiler: parse → plan → render → validate
    lyrics/               lyrics generator and phonetics
    browser/              clipboard and file download helpers
scripts/build-offline.mjs inlines the built JS and CSS into one HTML file
tests/                    node:test suites
```

### How the compiler works

`parse.ts` pulls genres, BPM, vocals, instruments, moods and hints out of the brief. `plan.ts` builds a sonic plan for each variation, choosing the groove, bass family, harmony, melody, vocal and instruments. `render.ts` writes the plan as prose and fits it to the 925–975 character window, keeping the vocal line, the BPM and the brief's anchors. `validate.ts` checks the hard gates: character range, integer BPM, no artist names, positive prompting, and no lyric tags.

## Not affiliated with Suno

Suno Workbench is an independent project. It is not affiliated with or endorsed by Suno, Inc.
