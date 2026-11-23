import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import {
  checkComparability,
  EXPERIMENT_LIMITS,
  type Experiment,
  ExperimentFormatError,
  type Migration,
  migrateDocument,
  parseExperimentJSON,
  serializeExperiment,
  validateExperiment,
} from "../src/lib/experiments/schema.ts";
import { EXPERIMENTS_KEY, loadExperiments, saveExperiments } from "../src/lib/experiments/storage.ts";

const fixture = (name: string) =>
  readFileSync(new URL(`./fixtures/experiments/${name}`, import.meta.url), "utf8");
const controlled = () => parseExperimentJSON(fixture("controlled.v1.json"));
const clone = (e: Experiment): Experiment => JSON.parse(JSON.stringify(e)) as Experiment;

function rejects(doc: unknown, path: string | RegExp) {
  assert.throws(
    () => validateExperiment(doc),
    (err: unknown) =>
      err instanceof ExperimentFormatError &&
      (typeof path === "string" ? err.path === path : path.test(err.message)),
  );
}

describe("Experiment schema v1", () => {
  it("parses the fixtures and fills optional fields with explicit defaults", () => {
    const minimal = parseExperimentJSON(fixture("minimal.v1.json"));
    assert.equal(minimal.runs[0]?.exclude, "");
    assert.equal(minimal.runs[0]?.promptVariant, "");
    assert.deepEqual(minimal.runs[0]?.settings, {});
    assert.deepEqual(minimal.runs[0]?.observations, []);
    assert.deepEqual(minimal.tags, []);
    assert.equal(controlled().runs.length, 2);
  });

  it("round-trips export → import without data loss", () => {
    const original = controlled();
    const once = serializeExperiment(original);
    assert.deepEqual(parseExperimentJSON(once), original);
    assert.equal(serializeExperiment(parseExperimentJSON(once)), once);
  });

  it("drops unknown fields instead of carrying them forward", () => {
    const doc = JSON.parse(fixture("minimal.v1.json")) as Record<string, unknown>;
    doc.secret = "should not survive";
    (doc.runs as Record<string, unknown>[])[0]!.extraField = 1;
    const parsed = validateExperiment(doc) as unknown as Record<string, unknown>;
    assert.equal("secret" in parsed, false);
    assert.equal("extraField" in (parsed.runs as Record<string, unknown>[])[0]!, false);
  });

  it("rejects other document types and newer schema versions with a clear message", () => {
    const doc = JSON.parse(fixture("minimal.v1.json")) as Record<string, unknown>;
    rejects({ ...doc, schema: "something-else" }, "schema");
    rejects({ ...doc, schemaVersion: 0 }, "schemaVersion");
    rejects({ ...doc, schemaVersion: 2 }, /reads up to 1\. Update Workbench/);
    assert.throws(() => parseExperimentJSON("{not json"), /not valid JSON/);
  });

  it("reports the exact path of an invalid value", () => {
    const doc = JSON.parse(fixture("controlled.v1.json")) as { runs: Record<string, unknown>[] } & Record<string, unknown>;
    const withRun = (patch: Record<string, unknown>) => ({ ...doc, runs: [{ ...doc.runs[0], ...patch }, doc.runs[1]] });
    rejects(withRun({ settings: { weirdness: 101 } }), "runs[0].settings.weirdness");
    rejects(withRun({ settings: { maxMode: "yes" } }), "runs[0].settings.maxMode");
    rejects(withRun({ seed: 1.5 }), "runs[0].seed");
    rejects(withRun({ createdAt: "23/11/2026" }), "runs[0].createdAt");
    rejects(withRun({ changedFields: ["tempo"] }), "runs[0].changedFields[0]");
    rejects(withRun({ id: "has space" }), "runs[0].id");
    rejects(withRun({ audio: [{ sha256: "ABC" }] }), "runs[0].audio[0].sha256");
    rejects(withRun({ observations: [{ id: "o", createdAt: "2026-11-23T10:00:00Z", note: "", confidence: "certain" }] }), "runs[0].observations[0].confidence");
    rejects({ ...doc, baselineRunId: "run-z" }, "baselineRunId");
    rejects({ ...doc, runs: [doc.runs[0], doc.runs[0]] }, "runs[1].id");
  });

  it("enforces size limits", () => {
    const doc = JSON.parse(fixture("minimal.v1.json")) as { runs: Record<string, unknown>[] } & Record<string, unknown>;
    rejects({ ...doc, runs: [{ ...doc.runs[0], styles: "x".repeat(EXPERIMENT_LIMITS.stylesText + 1) }] }, "runs[0].styles");
    rejects({ ...doc, tags: Array.from({ length: EXPERIMENT_LIMITS.tags + 1 }, () => "t") }, "tags");
    assert.throws(() => parseExperimentJSON(" ".repeat(EXPERIMENT_LIMITS.jsonChars + 1)), /exceeds/);
  });

  it("never embeds audio: only a hash and analysis metadata are representable", () => {
    const ref = controlled().runs[0]!.audio[0]!;
    assert.deepEqual(Object.keys(ref).sort(), ["analysis", "durationSec", "fileName", "sha256"]);
    const doc = JSON.parse(fixture("controlled.v1.json")) as { runs: Record<string, unknown>[] } & Record<string, unknown>;
    const withBytes = { ...doc, runs: [{ ...doc.runs[0], audio: [{ sha256: ref.sha256, data: "UklGRg==" }] }, doc.runs[1]] };
    assert.equal("data" in validateExperiment(withBytes).runs[0]!.audio[0]!, false);
  });
});

describe("Schema migrations", () => {
  it("applies each step in order up to the target version", () => {
    const steps = new Map<number, Migration>([
      [1, (d) => ({ ...d, schemaVersion: 2, renamed: d.old })],
      [2, (d) => ({ ...d, schemaVersion: 3 })],
    ]);
    assert.deepEqual(migrateDocument({ schemaVersion: 1, old: "x" }, 1, 3, steps), {
      schemaVersion: 3,
      old: "x",
      renamed: "x",
    });
  });

  it("fails loudly on a missing or faulty migration instead of looping", () => {
    assert.throws(() => migrateDocument({ schemaVersion: 1 }, 1, 2, new Map()), /no migration from version 1/);
    const stuck = new Map<number, Migration>([[1, (d) => ({ ...d })]]);
    assert.throws(() => migrateDocument({ schemaVersion: 1 }, 1, 2, stuck), /did not produce version 2/);
    const gap = new Map<number, Migration>([
      [1, (d) => ({ ...d, schemaVersion: 2 })],
      [3, (d) => ({ ...d, schemaVersion: 4 })],
    ]);
    assert.throws(() => migrateDocument({ schemaVersion: 1 }, 1, 4, gap), /no migration from version 2/);
  });

  it("is a no-op for the current version", () => {
    const doc = { schemaVersion: 1 };
    assert.equal(migrateDocument(doc, 1), doc);
  });
});

describe("Comparability check", () => {
  it("accepts a variant whose only difference is declared", () => {
    assert.deepEqual(checkComparability(controlled()), []);
  });

  it("flags an undeclared difference", () => {
    const e = clone(controlled());
    e.runs[1]!.seed = 999;
    const issues = checkComparability(e);
    assert.deepEqual(issues.map((i) => [i.kind, i.field]), [["undeclared-change", "seed"]]);
  });

  it("flags a declared change that did not happen", () => {
    const e = clone(controlled());
    e.runs[1]!.changedFields.push("styles");
    assert.deepEqual(checkComparability(e).map((i) => [i.kind, i.field]), [["declared-but-unchanged", "styles"]]);
  });

  it("flags a Suno setting recorded on only one side", () => {
    const e = clone(controlled());
    delete e.runs[1]!.settings.styleInfluence;
    assert.deepEqual(checkComparability(e).map((i) => [i.kind, i.field]), [["missing-setting", "settings.styleInfluence"]]);
  });

  it("compares extra settings independent of key order", () => {
    const e = clone(controlled());
    e.runs[0]!.settings.extra = { Persona: "none", Tag: "a" };
    e.runs[1]!.settings.extra = { Tag: "a", Persona: "none" };
    assert.deepEqual(checkComparability(e), []);
  });

  it("asks for a baseline before comparing several runs", () => {
    const e = clone(controlled());
    e.baselineRunId = null;
    assert.deepEqual(checkComparability(e).map((i) => i.kind), ["no-baseline"]);
  });
});

class MemoryStorage implements Storage {
  private data = new Map<string, string>();
  get length() {
    return this.data.size;
  }
  clear() {
    this.data.clear();
  }
  getItem(key: string) {
    return this.data.get(key) ?? null;
  }
  key(index: number) {
    return [...this.data.keys()][index] ?? null;
  }
  removeItem(key: string) {
    this.data.delete(key);
  }
  setItem(key: string, value: string) {
    this.data.set(key, value);
  }
}

describe("Experiment storage", () => {
  it("saves newest first and reloads identical experiments", () => {
    const storage = new MemoryStorage();
    const older = parseExperimentJSON(fixture("minimal.v1.json"));
    const newer = controlled();
    assert.deepEqual(saveExperiments(storage, [older, newer]), { ok: true });
    const loaded = loadExperiments(storage);
    assert.deepEqual(loaded.experiments.map((e) => e.id), ["exp-weirdness", "exp-minimal"]);
    assert.deepEqual(loaded.experiments[0], newer);
    assert.equal(loaded.dropped, 0);
  });

  it("drops corrupt entries and reports how many", () => {
    const storage = new MemoryStorage();
    storage.setItem(EXPERIMENTS_KEY, JSON.stringify([JSON.parse(fixture("minimal.v1.json")), { schema: "x" }, 42]));
    const loaded = loadExperiments(storage);
    assert.equal(loaded.experiments.length, 1);
    assert.equal(loaded.dropped, 2);
  });

  it("treats missing or unreadable storage as empty", () => {
    assert.deepEqual(loadExperiments(null), { experiments: [], dropped: 0 });
    const storage = new MemoryStorage();
    storage.setItem(EXPERIMENTS_KEY, "{broken");
    assert.deepEqual(loadExperiments(storage), { experiments: [], dropped: 0 });
    assert.deepEqual(saveExperiments(null, []), { ok: false, reason: "blocked" });
  });
});
