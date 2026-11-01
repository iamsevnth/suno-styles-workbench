# Contributing to Suno Workbench

Thank you for helping improve Suno Workbench. Keep contributions focused, reproducible, privacy-preserving, and easy to review.

## Before You Start

- Work from the current <code>main</code> branch.
- Create a focused feature or documentation branch.
- Keep unrelated refactors out of the same pull request.
- Do not add a backend, telemetry, analytics, cookies, tracking, or external AI/API calls without explicit project approval.
- Do not add copyrighted lyrics, unlicensed audio, proprietary datasets, credentials, or other material you are not authorized to contribute.

## Local Setup

Suno Workbench requires Node.js 22 or later.

```bash
git clone https://github.com/iamsevnth/suno-styles-workbench.git
cd suno-styles-workbench
npm ci
```

Use <code>npm install package-name</code> only when intentionally adding or changing a dependency. Commit the resulting <code>package.json</code> and <code>package-lock.json</code> changes together.

## Required Validation

Before opening a pull request, run:

```bash
npm run lint
npm test
npm run build
```

The build must continue to produce both the hosted site and the self-contained offline file.

## Change Guidelines

### Styles Compiler

Preserve the compiler's core contracts unless the change explicitly modifies them:

- 925–975 character Styles output;
- one whole-number BPM;
- preservation of recognized genres, named instruments, and important vocal details;
- coherent genre hierarchy;
- positive production language; and
- no artist-name imitation language.

Add or update tests when changing parser, planning, rendering, validation, or genre-family behavior.

### Lyrics Studio

Treat the user's ordered section sequence as structural intent. Changes should not silently normalize a custom sequence into a conventional Verse/Chorus form.

See [docs/LYRICS_STUDIO_OVERHAUL.md](docs/LYRICS_STUDIO_OVERHAUL.md) for the current structural design direction.

### Guide Content

Update Markdown under <code>src/content/guide/</code> and the relevant manifest/index rather than hard-coding long-form manual text into UI components.

When documenting current Suno product behavior, prefer current official Suno Help Center or Release Notes evidence. Clearly distinguish historical material from current behavior.

### Privacy and Security

Preserve the browser-only data model:

- user creative content should remain local;
- no unexpected outbound requests;
- no credentials in client code;
- no weakening of the hosted or offline Content Security Policy;
- no expansion of GitHub Actions permissions without a documented need.

See [SECURITY.md](SECURITY.md) for vulnerability-reporting requirements.

## Pull Requests

A pull request should explain:

1. what changed;
2. why the change is needed;
3. what behavior is intentionally unchanged;
4. how the change was validated; and
5. any known limitations or follow-up work.

Keep generated or incidental files out of commits unless they are part of the supported build output that the repository intentionally tracks.

## Licensing

Do not submit code, text, media, or other material unless you have the right to contribute it. This contribution guide does not change the repository's existing licensing status or grant a new open-source license.

Third-party components must retain their required license and attribution notices.
