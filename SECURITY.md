# Security Policy

## Supported versions

Only the current `main` branch, which is what https://iamsevnth.github.io/suno-styles-workbench/ serves, receives fixes. Download a fresh copy of the offline file after a fix to pick it up.

## How the site handles data

Suno Workbench runs entirely in the browser. It has no backend, accounts, analytics, cookies or API keys, and it makes no network requests with what you type. Briefs and results are kept in `sessionStorage`. Styles history is kept in `localStorage` until you clear it, capped at the newest 200 runs, and everything read back from storage is validated before use.

## Hardening

- **Content Security Policy:** the hosted page allows scripts and styles only from its own origin and blocks all network connections, plugins, `<base>` changes and form submissions. The offline file allows only its own inlined code, by SHA-256 hash. `npm run build` fails if either policy does not match the built files.
- **Dependencies:** `package-lock.json` pins every package, and CI installs with `npm ci`. Dependabot proposes weekly updates, and a dependency review check fails pull requests that add a package with a known vulnerability of moderate severity or higher.
- **CI:** every GitHub Action is pinned to a full commit SHA, workflows run with read-only permissions except the Pages deploy job, and CodeQL scans each pull request and runs weekly.
- **Local development:** `npm run dev` and `npm run preview` listen on 127.0.0.1 only.

## Reporting a vulnerability

Please report vulnerabilities privately through GitHub's **Report a vulnerability** button on the repository's Security tab, not in a public issue. Include the steps to reproduce and the browser you used.

If the report is confirmed, a fix is published to `main` and the reporter is credited unless they ask not to be. If it is declined, you'll get an explanation.
