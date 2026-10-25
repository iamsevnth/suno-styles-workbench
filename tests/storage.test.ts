import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  HISTORY_KEY,
  isRestorableResult,
  LEGACY_HISTORY_KEY,
  loadHistory,
  MAX_HISTORY,
  parseHistory,
  saveHistory,
} from "../src/lib/browser/storage.ts";
import { generateStylesPrompts } from "../src/lib/suno/generate.ts";
import { HistoryEntry } from "../src/lib/suno/types.ts";

/** In-memory Storage that throws the browser's QuotaExceededError once it holds `quota` characters. */
class FakeStorage implements Storage {
  private data = new Map<string, string>();
  constructor(private quota = Infinity) {}
  get length() {
    return this.data.size;
  }
  clear() {
    this.data.clear();
  }
  getItem(key: string) {
    return this.data.get(key) ?? null;
  }
  key(i: number) {
    return [...this.data.keys()][i] ?? null;
  }
  removeItem(key: string) {
    this.data.delete(key);
  }
  setItem(key: string, value: string) {
    const others = [...this.data].filter(([k]) => k !== key).reduce((n, [, v]) => n + v.length, 0);
    if (others + value.length > this.quota) {
      const err = new Error("The quota has been exceeded.");
      err.name = "QuotaExceededError";
      throw err;
    }
    this.data.set(key, value);
  }
}

function entry(i: number): HistoryEntry {
  return {
    id: `id-${i}`,
    createdAt: new Date(1_700_000_000_000 + i * 1000).toISOString(),
    brief: `brief ${i}`,
    seed: i,
    profileEnabled: true,
    prompts: [{ title: `T${i}`, styles: "x".repeat(950), characters: 950, bpm: 140, score: 90, recipeId: `r${i}` }],
  };
}

describe("history storage", () => {
  it(`keeps only the newest ${MAX_HISTORY} entries`, () => {
    const storage = new FakeStorage();
    const all = Array.from({ length: MAX_HISTORY + 25 }, (_, i) => entry(i));
    const result = saveHistory(storage, all);
    assert.equal(result.kept.length, MAX_HISTORY);
    assert.equal(result.trimmed, 25);
    assert.equal(result.kept[0].id, "id-25");
    assert.equal(loadHistory(storage).length, MAX_HISTORY);
  });

  it("trims the oldest entries and reports it when the browser's storage is full", () => {
    const storage = new FakeStorage(40_000);
    const all = Array.from({ length: 60 }, (_, i) => entry(i));
    const result = saveHistory(storage, all);
    assert.equal(result.saved, false);
    assert.ok(result.trimmed > 0 && result.kept.length > 0);
    assert.equal(result.kept[result.kept.length - 1].id, "id-59", "the newest entry is kept");
    assert.deepEqual(loadHistory(storage), result.kept);
  });

  it("reports a quota failure when not even one entry fits", () => {
    const result = saveHistory(new FakeStorage(100), [entry(1)]);
    assert.equal(result.saved, false);
    assert.equal(result.reason, "quota");
  });

  it("reports blocked storage without throwing", () => {
    const result = saveHistory(null, [entry(1)]);
    assert.equal(result.reason, "blocked");
    assert.deepEqual(loadHistory(null), []);
  });

  it("migrates the first release's bare-array history to the current key", () => {
    const storage = new FakeStorage();
    storage.setItem(LEGACY_HISTORY_KEY, JSON.stringify([entry(1), entry(2)]));
    const loaded = loadHistory(storage);
    assert.deepEqual(
      loaded.map((e) => e.id),
      ["id-1", "id-2"],
    );
    assert.equal(storage.getItem(LEGACY_HISTORY_KEY), null);
    assert.ok(storage.getItem(HISTORY_KEY));
  });

  it("drops malformed entries and fills missing fields instead of crashing", () => {
    const parsed = parseHistory({
      version: 2,
      entries: [
        null,
        "text",
        { brief: 5, prompts: [] },
        { brief: "no prompts", prompts: [{ title: "x" }] },
        { brief: "old entry", prompts: [{ styles: "140 BPM Trap" }] },
        entry(3),
      ],
    });
    assert.equal(parsed.length, 2);
    assert.equal(parsed[0].brief, "old entry");
    assert.equal(parsed[0].prompts[0].characters, "140 BPM Trap".length);
    assert.equal(parsed[0].prompts[0].title, "Untitled");
    assert.equal(parsed[1].id, "id-3");
  });

  it("treats unreadable JSON as empty history", () => {
    const storage = new FakeStorage();
    storage.setItem(HISTORY_KEY, "{not json");
    assert.deepEqual(loadHistory(storage), []);
  });
});

describe("restoring a session", () => {
  it("accepts a result the compiler produced", () => {
    const { prompts, parsed } = generateStylesPrompts("dark trap", { count: 2, seed: 1 });
    assert.equal(isRestorableResult(JSON.parse(JSON.stringify({ prompts, parsed }))), true);
  });

  it("rejects results with missing or wrong-typed fields", () => {
    const { prompts, parsed } = generateStylesPrompts("dark trap", { count: 1, seed: 1 });
    const broken = JSON.parse(JSON.stringify({ prompts, parsed }));
    delete broken.prompts[0].plan.bass;
    assert.equal(isRestorableResult(broken), false);
    assert.equal(isRestorableResult({ prompts: "nope", parsed }), false);
    assert.equal(isRestorableResult(null), false);
  });
});
