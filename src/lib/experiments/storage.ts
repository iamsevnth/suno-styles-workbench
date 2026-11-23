import { readRaw, writeRaw, type WriteResult } from "../browser/storage.ts";
import { type Experiment, validateExperiment } from "./schema.ts";

/**
 * Local persistence for Experiment Projects. Like Styles history, everything read back is
 * validated: an entry from an older release, a half-written tab or a hand edit is dropped
 * (and reported) instead of breaking the page. Nothing is sent anywhere.
 */
export const EXPERIMENTS_KEY = "suno-workbench:experiments:v1";
export const MAX_SAVED_EXPERIMENTS = 100;

export interface LoadedExperiments {
  experiments: Experiment[];
  /** Saved entries that failed validation and were skipped. */
  dropped: number;
}

export function loadExperiments(storage: Storage | null): LoadedExperiments {
  const raw = readRaw(storage, EXPERIMENTS_KEY);
  if (!Array.isArray(raw)) return { experiments: [], dropped: 0 };
  const experiments: Experiment[] = [];
  let dropped = 0;
  for (const entry of raw.slice(0, MAX_SAVED_EXPERIMENTS)) {
    try {
      experiments.push(validateExperiment(entry));
    } catch {
      dropped += 1;
    }
  }
  return { experiments, dropped: dropped + Math.max(0, raw.length - MAX_SAVED_EXPERIMENTS) };
}

/** Saves experiments, newest first by updatedAt, keeping at most MAX_SAVED_EXPERIMENTS. */
export function saveExperiments(storage: Storage | null, experiments: readonly Experiment[]): WriteResult {
  const valid = experiments
    .map((e) => validateExperiment(e))
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    .slice(0, MAX_SAVED_EXPERIMENTS);
  return writeRaw(storage, EXPERIMENTS_KEY, valid);
}
