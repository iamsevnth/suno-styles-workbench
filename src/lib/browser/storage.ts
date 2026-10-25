import type { HistoryEntry, HistoryPromptItem } from "../suno/types.ts";

/**
 * Browser storage for the Styles Compiler. Everything read back is validated, because storage
 * can hold data from an older release, from another tab mid-write, or edited by hand; an entry
 * that does not match the current shape is dropped instead of crashing the page.
 */

/** Newest entries kept in history; older ones are trimmed on save. */
export const MAX_HISTORY = 200;

export const HISTORY_KEY = "suno-styles-history:v2";
/** The first release stored history as a bare array under this key; it is migrated on load. */
export const LEGACY_HISTORY_KEY = "suno-styles-history:v1";

export type WriteResult = { ok: true } | { ok: false; reason: "quota" | "blocked" };

export function readRaw(storage: Storage | null, key: string): unknown {
  if (!storage) return null;
  try {
    const raw = storage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function writeRaw(storage: Storage | null, key: string, value: unknown): WriteResult {
  if (!storage) return { ok: false, reason: "blocked" };
  try {
    storage.setItem(key, JSON.stringify(value));
    return { ok: true };
  } catch (err) {
    return { ok: false, reason: isQuotaError(err) ? "quota" : "blocked" };
  }
}

export function removeKey(storage: Storage | null, key: string): void {
  try {
    storage?.removeItem(key);
  } catch {
    // Storage blocked: nothing was saved, so nothing to remove.
  }
}

function isQuotaError(err: unknown): boolean {
  if (!(err instanceof Error)) return false;
  return /quota/i.test(err.name) || /quota|exceeded|full/i.test(err.message) || (err as { code?: number }).code === 22;
}

const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null && !Array.isArray(v);
const isString = (v: unknown): v is string => typeof v === "string";
const isNumber = (v: unknown): v is number => typeof v === "number" && Number.isFinite(v);

function toHistoryPrompt(v: unknown): HistoryPromptItem | null {
  if (!isRecord(v) || !isString(v.styles) || v.styles.length === 0) return null;
  const item: HistoryPromptItem = {
    title: isString(v.title) ? v.title : "Untitled",
    styles: v.styles,
    characters: isNumber(v.characters) ? v.characters : v.styles.length,
    bpm: isNumber(v.bpm) ? v.bpm : 0,
    score: isNumber(v.score) ? v.score : 0,
  };
  // Optional fields are copied only when present, so a stored entry reads back unchanged.
  for (const key of ["primaryGenre", "secondaryGenre", "accentGenre", "recipeId"] as const) {
    if (isString(v[key])) item[key] = v[key];
  }
  return item;
}

function toHistoryEntry(v: unknown): HistoryEntry | null {
  if (!isRecord(v) || !isString(v.brief) || !Array.isArray(v.prompts)) return null;
  const prompts = v.prompts.map(toHistoryPrompt).filter((p): p is HistoryPromptItem => p !== null);
  if (prompts.length === 0) return null;
  const createdAt =
    isString(v.createdAt) && !Number.isNaN(Date.parse(v.createdAt)) ? v.createdAt : new Date(0).toISOString();
  return {
    id: isString(v.id) ? v.id : `${Date.parse(createdAt)}-${prompts[0].recipeId ?? "entry"}`,
    createdAt,
    brief: v.brief,
    seed: isNumber(v.seed) ? v.seed : 0,
    profileEnabled: typeof v.profileEnabled === "boolean" ? v.profileEnabled : true,
    prompts,
  };
}

/** Valid history entries from any stored shape: the v2 envelope or the v1 bare array. */
export function parseHistory(raw: unknown): HistoryEntry[] {
  const list = Array.isArray(raw) ? raw : isRecord(raw) && Array.isArray(raw.entries) ? raw.entries : [];
  return list
    .map(toHistoryEntry)
    .filter((e): e is HistoryEntry => e !== null)
    .slice(-MAX_HISTORY);
}

/** Loads history, migrating the v1 key to v2 the first time. */
export function loadHistory(storage: Storage | null): HistoryEntry[] {
  const current = readRaw(storage, HISTORY_KEY);
  if (current != null) return parseHistory(current);
  const legacy = readRaw(storage, LEGACY_HISTORY_KEY);
  if (legacy == null) return [];
  const migrated = parseHistory(legacy);
  if (saveHistory(storage, migrated).saved) removeKey(storage, LEGACY_HISTORY_KEY);
  return migrated;
}

export interface SaveHistoryResult {
  /** True when every entry passed in was saved. */
  saved: boolean;
  /** The entries actually stored (oldest trimmed to fit the cap or the browser's quota). */
  kept: HistoryEntry[];
  /** Entries dropped to make room, oldest first. */
  trimmed: number;
  reason?: "quota" | "blocked";
}

/**
 * Saves the newest MAX_HISTORY entries. When the browser's storage is full it keeps halving the
 * oldest entries until the rest fit, and reports how many were dropped.
 */
export function saveHistory(storage: Storage | null, entries: HistoryEntry[]): SaveHistoryResult {
  let kept = entries.slice(-MAX_HISTORY);
  for (;;) {
    const result = writeRaw(storage, HISTORY_KEY, { version: 2, entries: kept });
    if (result.ok) {
      const trimmed = entries.length - kept.length;
      return { saved: trimmed === 0, kept, trimmed };
    }
    if (result.reason !== "quota" || kept.length <= 1) {
      return { saved: false, kept: entries.slice(-MAX_HISTORY), trimmed: 0, reason: result.reason };
    }
    kept = kept.slice(Math.ceil(kept.length / 2));
  }
}

/**
 * True when a restored session result has the fields the prompt cards read. A failed check
 * drops the stored result; the brief and settings are kept.
 */
export function isRestorableResult(v: unknown): boolean {
  if (!isRecord(v) || !Array.isArray(v.prompts) || !isRecord(v.parsed)) return false;
  if (!Array.isArray(v.parsed.genres) || !Array.isArray(v.parsed.moods)) return false;
  return v.prompts.every(
    (p) =>
      isRecord(p) &&
      isString(p.styles) &&
      isString(p.title) &&
      isNumber(p.characters) &&
      isNumber(p.bpm) &&
      isRecord(p.plan) &&
      isString(p.plan.primaryGenre) &&
      Array.isArray(p.plan.bass) &&
      Array.isArray(p.plan.drums) &&
      Array.isArray(p.plan.instruments) &&
      Array.isArray(p.plan.variantAxes) &&
      isRecord(p.plan.vocals) &&
      isRecord(p.hardGates) &&
      Array.isArray(p.issues),
  );
}
