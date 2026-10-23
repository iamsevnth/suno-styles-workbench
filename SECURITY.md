# Security Policy

## Supported versions

Only the current `main` branch, which is what https://iamsevnth.github.io/suno-styles-workbench/ serves, receives fixes. Download a fresh copy of the offline file after a fix to pick it up.

## How the site handles data

Suno Workbench runs entirely in the browser. It has no backend, accounts, analytics, cookies or API keys, and it makes no network requests with what you type. Briefs and results are kept in `sessionStorage`. Styles history is kept in `localStorage` until you clear it.

## Reporting a vulnerability

Please report vulnerabilities privately through GitHub's **Report a vulnerability** button on the repository's Security tab, not in a public issue. Include the steps to reproduce and the browser you used.

If the report is confirmed, a fix is published to `main` and the reporter is credited unless they ask not to be. If it is declined, you'll get an explanation.
