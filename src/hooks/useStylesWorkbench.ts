import { useEffect, useRef, useState } from "react";
import { ShowDialog } from "../components/Dialog.tsx";
import { copyToClipboard } from "../lib/browser/clipboard.ts";
import { downloadFile } from "../lib/browser/download.ts";
import {
  HISTORY_KEY,
  isRestorableResult,
  LEGACY_HISTORY_KEY,
  loadHistory,
  readRaw,
  removeKey,
  saveHistory,
  writeRaw,
} from "../lib/browser/storage.ts";
import { generateStylesPrompts } from "../lib/suno/generate.ts";
import { pickSuggestions, SURPRISE_BRIEF } from "../lib/suno/suggestions.ts";
import { historyFileStamp } from "../lib/suno/title-case.ts";
import { GenerateResult, HistoryEntry, PromptCandidate } from "../lib/suno/types.ts";
import { formatAllPromptsTxt } from "../lib/suno/v6.ts";

const STORAGE_KEY = "suno-styles-generator:v1";
const SUGGEST_KEY = "suno-styles-suggestions:v1";
export const DEFAULT_COUNT = 3;
export type CompilerMode = "create" | "fix";

type Parsed = GenerateResult["parsed"];

interface SessionSnapshot {
  input: string;
  compilerMode: CompilerMode;
  count: number;
  profileEnabled: boolean;
  generation: number;
  seedUsed: number;
  lastAction: string;
  prompts: PromptCandidate[];
  parsed: Parsed | null;
}

type StorageArea = "session" | "local";

// Touching window.sessionStorage itself can throw in sandboxed frames, so resolve it inside try.
function storageFor(area: StorageArea): Storage | null {
  try {
    return area === "session" ? window.sessionStorage : window.localStorage;
  } catch {
    return null;
  }
}

/** Session data: a failed write only means the draft is not restored on reload. */
function writeJson(area: StorageArea, key: string, value: unknown): void {
  writeRaw(storageFor(area), key, value);
}

/** The stored session, keeping only fields of the expected type. */
function readSession(): StoredSession {
  const raw = readRaw(storageFor("session"), STORAGE_KEY);
  if (typeof raw !== "object" || raw === null || Array.isArray(raw)) return {};
  const r = raw as Record<string, unknown>;
  const str = (v: unknown) => (typeof v === "string" ? v : undefined);
  const num = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? v : undefined);
  const count = num(r.count);
  return {
    input: str(r.input),
    compilerMode: r.compilerMode === "fix" ? "fix" : "create",
    count: count != null && count >= 1 && count <= 12 ? Math.round(count) : undefined,
    profileEnabled: typeof r.profileEnabled === "boolean" ? r.profileEnabled : undefined,
    generation: num(r.generation),
    seedUsed: num(r.seedUsed),
    lastAction: str(r.lastAction),
    hasResults: r.hasResults === true && isRestorableResult(r.result),
    result: isRestorableResult(r.result) ? (r.result as StoredSession["result"]) : undefined,
  };
}

interface StoredSession {
  input?: string;
  compilerMode?: CompilerMode;
  count?: number;
  profileEnabled?: boolean;
  generation?: number;
  seedUsed?: number;
  lastAction?: string;
  hasResults?: boolean;
  result?: { prompts: PromptCandidate[]; parsed: Parsed };
}

function saveSession(s: SessionSnapshot): void {
  const stored: StoredSession = {
    input: s.input,
    compilerMode: s.compilerMode,
    count: s.count,
    profileEnabled: s.profileEnabled,
    generation: s.generation,
    seedUsed: s.seedUsed,
    lastAction: s.lastAction,
    hasResults: s.prompts.length > 0,
    result: s.prompts.length && s.parsed ? { prompts: s.prompts, parsed: s.parsed } : undefined,
  };
  writeJson("session", STORAGE_KEY, stored);
}

function initialSuggestions(): string[] {
  const raw = readRaw(storageFor("session"), SUGGEST_KEY);
  const chips = Array.isArray(raw) ? raw.filter((c): c is string => typeof c === "string" && c.length > 0) : [];
  if (chips.length) {
    return chips[0] === SURPRISE_BRIEF ? chips : [SURPRISE_BRIEF, ...chips];
  }
  const fresh = pickSuggestions(Date.now() >>> 0);
  writeJson("session", SUGGEST_KEY, fresh);
  return fresh;
}

function toHistoryEntry(brief: string, seed: number, profileEnabled: boolean, prompts: PromptCandidate[]): HistoryEntry {
  return {
    id: `${Date.now()}-${seed}`,
    createdAt: new Date().toISOString(),
    brief,
    seed,
    profileEnabled,
    prompts: prompts.map((p) => ({
      title: p.title,
      styles: p.styles,
      characters: p.characters,
      bpm: p.bpm,
      score: p.score,
      primaryGenre: p.plan.primaryGenre,
      secondaryGenre: p.plan.secondaryGenre,
      accentGenre: p.plan.accentGenre,
      recipeId: p.plan.recipeId,
    })),
  };
}

/** State and actions for the Styles Compiler, persisted per session; history persists across visits. */
export function useStylesWorkbench(showDialog: ShowDialog) {
  const [stored] = useState(readSession);
  const restored = stored.hasResults ? stored.result : undefined;

  const [input, setInput] = useState(stored.input ?? "");
  const [compilerMode, setCompilerMode] = useState<CompilerMode>(stored.compilerMode ?? "create");
  const [count, setCount] = useState(stored.count ?? DEFAULT_COUNT);
  const [profileEnabled, setProfileEnabled] = useState(stored.profileEnabled ?? true);
  const [generation, setGeneration] = useState(stored.generation ?? 0);
  const [seedUsed, setSeedUsed] = useState(stored.seedUsed ?? 0);
  const [prompts, setPrompts] = useState<PromptCandidate[]>(restored?.prompts ?? []);
  const [parsed, setParsed] = useState<Parsed | null>(restored?.parsed ?? null);
  const [lastAction, setLastAction] = useState(stored.lastAction ?? "");
  const [suggestions, setSuggestions] = useState<string[]>(initialSuggestions);
  const [history, setHistory] = useState<HistoryEntry[]>(() => loadHistory(storageFor("local")));
  const [isGenerating, setIsGenerating] = useState(false);
  const briefRef = useRef<HTMLTextAreaElement>(null);

  // Persist the whole session on every change so switching pages never loses a draft brief.
  useEffect(() => {
    saveSession({ input, compilerMode, count, profileEnabled, generation, seedUsed, lastAction, prompts, parsed });
  }, [input, compilerMode, count, profileEnabled, generation, seedUsed, lastAction, prompts, parsed]);

  const generate = () => {
    const brief = input.trim();
    if (!brief) {
      setLastAction(
        compilerMode === "fix"
          ? "Paste an existing Suno Styles prompt first — nothing was generated."
          : "Enter a creative brief first — nothing was generated."
      );
      return;
    }

    setIsGenerating(true);
    try {
      const seed = (Math.floor(Math.random() * 1e9) ^ Date.now()) >>> 0;
      const avoidFingerprints = history
        .filter((e) => e.brief.trim() === brief)
        .flatMap((e) => (e.prompts || []).map((p) => p.recipeId).filter(Boolean))
        .slice(-80) as string[];
      const out = generateStylesPrompts(brief, {
        count,
        profileEnabled,
        seed,
        avoidFingerprints,
        mode: compilerMode === "fix" ? "rewrite" : undefined,
      });
      const nextGeneration = generation + 1;

      setSeedUsed(seed);
      setPrompts(out.prompts);
      setParsed(out.parsed);
      setGeneration(nextGeneration);

      const saved = saveHistory(storageFor("local"), [...history, toHistoryEntry(brief, seed, profileEnabled, out.prompts)]);
      setHistory(saved.kept);

      const head = out.prompts[0]?.styles.slice(0, 48).replace(/\s+/g, " ") ?? "";
      const bpmNote = out.parsed.bpm != null ? `${out.parsed.bpm} BPM` : "BPM inferred";
      setLastAction(
        `${compilerMode === "fix" ? "fixed" : "created"} · seed ${seed} · ${bpmNote} · ${out.prompts.length} styles · "${head}..."`
      );
      if (saved.reason === "quota") {
        showDialog(
          "error",
          "History Not Saved",
          "This browser's storage is full, so this run was not added to your saved history. Export History to keep a copy, then Clear History to free space."
        );
      } else if (saved.trimmed > 0) {
        setLastAction(
          `seed ${seed} · ${out.prompts.length} styles · history full, so the ${saved.trimmed} oldest ${
            saved.trimmed === 1 ? "entry was" : "entries were"
          } removed. Export History to keep everything.`
        );
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "unknown error";
      setLastAction(`Generate failed: ${message}. Try again.`);
    } finally {
      setIsGenerating(false);
    }
  };

  const reset = () => {
    setInput("");
    setCompilerMode("create");
    setCount(DEFAULT_COUNT);
    setProfileEnabled(true);
    setGeneration(0);
    setSeedUsed(0);
    setPrompts([]);
    setParsed(null);
    setLastAction("Reset — input, mode and current variations cleared. History kept.");
    briefRef.current?.focus();
  };

  const clearResults = () => {
    setPrompts([]);
    setLastAction("Current results cleared. Brief and history kept.");
  };

  const refreshSuggestions = () => {
    const next = pickSuggestions((Math.random() * 1e9) >>> 0);
    setSuggestions(next);
    writeJson("session", SUGGEST_KEY, next);
    setLastAction("Example briefs refreshed — click one to fill the brief box.");
  };

  const applySuggestion = (text: string) => {
    setCompilerMode("create");
    setInput(text);
    setLastAction("Brief filled from an example — press Generate Styles to compile.");
    briefRef.current?.focus();
  };

  const toggleProfile = (enabled: boolean) => {
    setProfileEnabled(enabled);
    setLastAction(
      enabled
        ? "Hybrid bass profile on — used on the next Generate Styles."
        : "Hybrid bass profile off — used on the next Generate Styles."
    );
  };

  const copyStyle = async (styles: string) => {
    const ok = await copyToClipboard(styles);
    showDialog(
      ok ? "ok" : "error",
      ok ? "Copied" : "Clipboard Blocked",
      ok
        ? "This style is on your clipboard. Paste it into Suno's Styles field."
        : "This browser blocked clipboard access. Allow clipboard access for this site, or select the style text and copy it manually (Ctrl+C / Cmd+C)."
    );
  };

  const downloadAllPrompts = async () => {
    if (!prompts.length) return;
    const text = formatAllPromptsTxt(prompts);
    const filename = `suno-styles-${historyFileStamp()}.txt`;
    downloadFile(filename, text, "text/plain;charset=utf-8");
    const ok = await copyToClipboard(text);
    showDialog(
      "ok",
      ok ? "Copied All Prompts" : "Prompts Downloaded",
      ok
        ? `${filename} was downloaded. The same pack is on your clipboard.`
        : `${filename} was saved. Clipboard access is blocked — open the text file if you need to paste.`
    );
    setLastAction(`Downloaded ${filename}`);
  };

  const exportHistory = () => {
    if (!history.length) return;
    const filename = `suno-history-${historyFileStamp()}.json`;
    const payload = { exportedAt: new Date().toISOString(), count: history.length, entries: history };
    downloadFile(filename, JSON.stringify(payload, null, 2), "application/json");
    setLastAction(`Exported ${filename}`);
  };

  const clearHistory = () => {
    setHistory([]);
    removeKey(storageFor("local"), HISTORY_KEY);
    removeKey(storageFor("local"), LEGACY_HISTORY_KEY);
    setLastAction("History cleared.");
  };

  return {
    briefRef,
    input,
    compilerMode,
    setCompilerMode,
    setInput,
    count,
    setCount,
    profileEnabled,
    toggleProfile,
    generation,
    seedUsed,
    prompts,
    parsed,
    lastAction,
    suggestions,
    history,
    isGenerating,
    generate,
    reset,
    clearResults,
    refreshSuggestions,
    applySuggestion,
    copyStyle,
    downloadAllPrompts,
    exportHistory,
    clearHistory,
  };
}

export type StylesWorkbench = ReturnType<typeof useStylesWorkbench>;
