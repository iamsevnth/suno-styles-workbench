# Experiment Project Schema v1

Status: v5.4 slice 1 (contract and fixtures). There is no Experiment Lab UI yet; this defines the file format the `/experiments` workspace will read and write.

Source of truth: [`src/lib/experiments/schema.ts`](../../src/lib/experiments/schema.ts). Examples: [`tests/fixtures/experiments/`](../../tests/fixtures/experiments/).

## Principles

- **Local only.** Experiments are saved in this browser (`suno-workbench:experiments:v1`) or exported as JSON by the user. Workbench never uploads them.
- **Metadata, not control.** Suno settings are what the user recorded. Workbench cannot read or set Suno.
- **Observations, not scores.** Listening notes carry a user confidence (`low`, `medium` or `high`). There is no effectiveness or quality metric.
- **No embedded audio.** A run can reference audio only by SHA-256, with an optional file name, duration and analysis values (reserved for v5.9), so copyrighted audio is never copied into a project.
- **Strict and bounded.** Unknown fields are dropped; every value is type- and range-checked; sizes are capped. Errors name the exact failing path, such as `runs[0].settings.weirdness`.
- **Versioned.** `schema` is `"suno-workbench.experiment"` and `schemaVersion` is `1`. Older versions are migrated step by step (`MIGRATIONS`); newer versions are rejected with "Update Workbench to open it" instead of being guessed at.

## Document

| Field | Type | Notes |
|---|---|---|
| `schema` | `"suno-workbench.experiment"` | Required |
| `schemaVersion` | `1` | Required |
| `id` | id | Letters, digits, `-`, `_`; up to 100 characters |
| `title` | text | Up to 200 characters |
| `brief` | text | Optional; up to 10,000 characters |
| `createdAt`, `updatedAt` | ISO 8601 UTC | For example `2026-11-23T10:00:00Z` |
| `baselineRunId` | id or `null` | Must match a run |
| `runs` | Run[] | Up to 200; ids unique |
| `tags` | text[] | Up to 50 |
| `hypotheses` | text[] | Up to 50; stated before listening |

## Run

| Field | Type | Notes |
|---|---|---|
| `id`, `label`, `createdAt` | | As above |
| `workbenchVersion` | text | The Workbench release that produced `styles` |
| `seed` | whole number or `null` | Workbench seed, if any |
| `promptVariant` | text | Optional free label |
| `styles`, `exclude` | text | Up to 2,000 characters each; `exclude` optional |
| `settings` | Suno settings | `model`; `variety`, `styleInfluence`, `weirdness` and `audioInfluence` (0–100); `maxMode` (boolean); `extra` (name → text, up to 50). All optional; missing means "not recorded" |
| `changedFields` | controlled field[] | What this run intentionally changes versus the baseline |
| `observations` | Observation[] | Up to 100: `id`, `createdAt`, `note`, `confidence`, `labels`, optional `blindLabel` |
| `audio` | Audio reference[] | Up to 20: `sha256` (lowercase hex), optional `fileName`, `durationSec`, `analysis` {`tool`, `version`, `values`} |

Controlled fields: `styles`, `exclude`, `seed`, `promptVariant`, `workbenchVersion`, `settings.model`, `settings.variety`, `settings.styleInfluence`, `settings.weirdness`, `settings.audioInfluence`, `settings.maxMode`, `settings.extra`.

## Comparability check

`checkComparability(experiment)` compares each variant with the baseline and reports:

- **undeclared-change**: a controlled field differs but is not in `changedFields`;
- **declared-but-unchanged**: a field is declared as changed but matches the baseline;
- **missing-setting**: a Suno setting is recorded for only one of the two runs;
- **no-baseline**: several runs exist but none is the baseline.

It never ranks runs. The roadmap's reproducibility panel will present these issues before the user interprets results.
