/**
 * Experiment Project schema v1 — the v5.4 Prompt Experiment Lab contract (roadmap slice 1).
 *
 * An experiment groups a baseline run and its variants so their Suno results can be compared
 * responsibly. Everything here is user-entered or Workbench-generated text and metadata:
 * Workbench cannot read or set Suno, and nothing in this module leaves the browser.
 *
 * Contract:
 * - Every document carries `schema` and a `schemaVersion`. Older versions are migrated through
 *   MIGRATIONS; newer versions are rejected rather than guessed at.
 * - Parsing is strict and bounded: unknown fields are dropped, every value is type- and
 *   range-checked, and sizes are capped. A valid document round-trips through
 *   serializeExperiment → parseExperimentJSON unchanged.
 * - Listening observations are user notes, never scores. There is no effectiveness metric.
 * - Audio is never embedded. `audio` holds a SHA-256 and optional analysis metadata, reserved
 *   for v5.9, so adding audio evidence later will not require a breaking schema change.
 */

export const EXPERIMENT_SCHEMA = "suno-workbench.experiment" as const;
export const EXPERIMENT_SCHEMA_VERSION = 1 as const;

export const EXPERIMENT_LIMITS = {
  jsonChars: 2_000_000,
  runs: 200,
  observationsPerRun: 100,
  audioPerRun: 20,
  tags: 50,
  hypotheses: 50,
  shortText: 200,
  stylesText: 2_000,
  longText: 10_000,
} as const;

export type Confidence = "low" | "medium" | "high";
export const CONFIDENCE_LEVELS: readonly Confidence[] = ["low", "medium", "high"];

/** Suno controls as the user recorded them. All optional: missing means "not recorded". */
export interface SunoSettings {
  model?: string;
  /** 0–100, as shown in Suno. */
  variety?: number;
  styleInfluence?: number;
  weirdness?: number;
  audioInfluence?: number;
  maxMode?: boolean;
  /** Any other control, by its Suno name (for example "Persona"). */
  extra?: Record<string, string>;
}

export const SUNO_NUMERIC_SETTINGS = ["variety", "styleInfluence", "weirdness", "audioInfluence"] as const;

/** Fields a variant may declare as intentionally changed relative to the baseline. */
export const CONTROLLED_FIELDS = [
  "styles",
  "exclude",
  "seed",
  "promptVariant",
  "workbenchVersion",
  "settings.model",
  "settings.variety",
  "settings.styleInfluence",
  "settings.weirdness",
  "settings.audioInfluence",
  "settings.maxMode",
  "settings.extra",
] as const;
export type ControlledField = (typeof CONTROLLED_FIELDS)[number];

export interface ListeningObservation {
  id: string;
  createdAt: string;
  note: string;
  confidence: Confidence;
  labels: string[];
  /** Set when the listener did not know which run they heard. */
  blindLabel?: string;
}

/** Reserved for v5.9 audio analysis: a hash and metadata, never the audio itself. */
export interface AudioReference {
  sha256: string;
  fileName?: string;
  durationSec?: number;
  analysis?: { tool: string; version: string; values: Record<string, number | string> };
}

export interface ExperimentRun {
  id: string;
  label: string;
  createdAt: string;
  workbenchVersion: string;
  seed: number | null;
  promptVariant: string;
  styles: string;
  exclude: string;
  settings: SunoSettings;
  /** What this run intentionally changes relative to the baseline. Empty for the baseline. */
  changedFields: ControlledField[];
  observations: ListeningObservation[];
  audio: AudioReference[];
}

export interface Experiment {
  schema: typeof EXPERIMENT_SCHEMA;
  schemaVersion: typeof EXPERIMENT_SCHEMA_VERSION;
  id: string;
  title: string;
  brief: string;
  createdAt: string;
  updatedAt: string;
  baselineRunId: string | null;
  runs: ExperimentRun[];
  tags: string[];
  hypotheses: string[];
}

export class ExperimentFormatError extends Error {
  constructor(
    message: string,
    readonly path: string,
  ) {
    super(path ? `${path}: ${message}` : message);
    this.name = "ExperimentFormatError";
  }
}

/**
 * Upgrades older documents one version at a time. Key N converts version N to N + 1.
 * Version 1 is the first published version, so the table is empty; keep it so later
 * versions have a single, tested place to add migrations.
 */
export const MIGRATIONS: Readonly<Record<number, (doc: Record<string, unknown>) => Record<string, unknown>>> = {};

type Obj = Record<string, unknown>;

const isObj = (value: unknown): value is Obj =>
  typeof value === "object" && value !== null && !Array.isArray(value);

function text(value: unknown, path: string, max: number, { optional = false } = {}): string {
  if (value === undefined && optional) return "";
  if (typeof value !== "string") throw new ExperimentFormatError("must be text", path);
  if (value.length > max) throw new ExperimentFormatError(`must be at most ${max} characters`, path);
  return value;
}

function id(value: unknown, path: string): string {
  const s = text(value, path, 100);
  if (!/^[A-Za-z0-9_-]{1,100}$/.test(s)) {
    throw new ExperimentFormatError("must use letters, digits, - or _", path);
  }
  return s;
}

function timestamp(value: unknown, path: string): string {
  const s = text(value, path, 40);
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{1,3})?Z$/.test(s) || Number.isNaN(Date.parse(s))) {
    throw new ExperimentFormatError("must be an ISO 8601 UTC timestamp", path);
  }
  return s;
}

function list<T>(value: unknown, path: string, max: number, each: (item: unknown, path: string) => T): T[] {
  if (value === undefined) return [];
  if (!Array.isArray(value)) throw new ExperimentFormatError("must be a list", path);
  if (value.length > max) throw new ExperimentFormatError(`must have at most ${max} items`, path);
  return value.map((item, i) => each(item, `${path}[${i}]`));
}

function percent(value: unknown, path: string): number | undefined {
  if (value === undefined) return undefined;
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0 || value > 100) {
    throw new ExperimentFormatError("must be a number from 0 to 100", path);
  }
  return value;
}

function settings(value: unknown, path: string): SunoSettings {
  if (value === undefined) return {};
  if (!isObj(value)) throw new ExperimentFormatError("must be an object", path);
  const out: SunoSettings = {};
  if (value.model !== undefined) out.model = text(value.model, `${path}.model`, EXPERIMENT_LIMITS.shortText);
  for (const key of SUNO_NUMERIC_SETTINGS) {
    const n = percent(value[key], `${path}.${key}`);
    if (n !== undefined) out[key] = n;
  }
  if (value.maxMode !== undefined) {
    if (typeof value.maxMode !== "boolean") throw new ExperimentFormatError("must be true or false", `${path}.maxMode`);
    out.maxMode = value.maxMode;
  }
  if (value.extra !== undefined) {
    if (!isObj(value.extra)) throw new ExperimentFormatError("must be an object", `${path}.extra`);
    const entries = Object.entries(value.extra);
    if (entries.length > 50) throw new ExperimentFormatError("must have at most 50 entries", `${path}.extra`);
    out.extra = Object.fromEntries(
      entries.map(([k, v]) => [
        text(k, `${path}.extra key`, EXPERIMENT_LIMITS.shortText),
        text(v, `${path}.extra.${k}`, EXPERIMENT_LIMITS.shortText),
      ]),
    );
  }
  return out;
}

function observation(value: unknown, path: string): ListeningObservation {
  if (!isObj(value)) throw new ExperimentFormatError("must be an object", path);
  const confidence = value.confidence;
  if (!CONFIDENCE_LEVELS.includes(confidence as Confidence)) {
    throw new ExperimentFormatError("must be low, medium or high", `${path}.confidence`);
  }
  const out: ListeningObservation = {
    id: id(value.id, `${path}.id`),
    createdAt: timestamp(value.createdAt, `${path}.createdAt`),
    note: text(value.note, `${path}.note`, EXPERIMENT_LIMITS.longText),
    confidence: confidence as Confidence,
    labels: list(value.labels, `${path}.labels`, EXPERIMENT_LIMITS.tags, (v, p) => text(v, p, EXPERIMENT_LIMITS.shortText)),
  };
  if (value.blindLabel !== undefined) out.blindLabel = text(value.blindLabel, `${path}.blindLabel`, EXPERIMENT_LIMITS.shortText);
  return out;
}

function audio(value: unknown, path: string): AudioReference {
  if (!isObj(value)) throw new ExperimentFormatError("must be an object", path);
  const sha = text(value.sha256, `${path}.sha256`, 64);
  if (!/^[0-9a-f]{64}$/.test(sha)) throw new ExperimentFormatError("must be a lowercase SHA-256 hex digest", `${path}.sha256`);
  const out: AudioReference = { sha256: sha };
  if (value.fileName !== undefined) out.fileName = text(value.fileName, `${path}.fileName`, EXPERIMENT_LIMITS.shortText);
  if (value.durationSec !== undefined) {
    const d = value.durationSec;
    if (typeof d !== "number" || !Number.isFinite(d) || d < 0 || d > 86_400) {
      throw new ExperimentFormatError("must be seconds from 0 to 86400", `${path}.durationSec`);
    }
    out.durationSec = d;
  }
  if (value.analysis !== undefined) {
    const a = value.analysis;
    if (!isObj(a) || !isObj(a.values)) throw new ExperimentFormatError("must have tool, version and values", `${path}.analysis`);
    const entries = Object.entries(a.values);
    if (entries.length > 100) throw new ExperimentFormatError("must have at most 100 values", `${path}.analysis.values`);
    out.analysis = {
      tool: text(a.tool, `${path}.analysis.tool`, EXPERIMENT_LIMITS.shortText),
      version: text(a.version, `${path}.analysis.version`, EXPERIMENT_LIMITS.shortText),
      values: Object.fromEntries(
        entries.map(([k, v]) => {
          if (typeof v === "number" ? !Number.isFinite(v) : typeof v !== "string" || v.length > EXPERIMENT_LIMITS.shortText) {
            throw new ExperimentFormatError("must be a finite number or short text", `${path}.analysis.values.${k}`);
          }
          return [text(k, `${path}.analysis.values key`, EXPERIMENT_LIMITS.shortText), v as number | string] as const;
        }),
      ),
    };
  }
  return out;
}

function run(value: unknown, path: string): ExperimentRun {
  if (!isObj(value)) throw new ExperimentFormatError("must be an object", path);
  const seed = value.seed;
  if (seed !== null && seed !== undefined && !Number.isSafeInteger(seed)) {
    throw new ExperimentFormatError("must be a whole number or null", `${path}.seed`);
  }
  return {
    id: id(value.id, `${path}.id`),
    label: text(value.label, `${path}.label`, EXPERIMENT_LIMITS.shortText),
    createdAt: timestamp(value.createdAt, `${path}.createdAt`),
    workbenchVersion: text(value.workbenchVersion, `${path}.workbenchVersion`, 40),
    seed: (seed ?? null) as number | null,
    promptVariant: text(value.promptVariant, `${path}.promptVariant`, EXPERIMENT_LIMITS.shortText, { optional: true }),
    styles: text(value.styles, `${path}.styles`, EXPERIMENT_LIMITS.stylesText),
    exclude: text(value.exclude, `${path}.exclude`, EXPERIMENT_LIMITS.stylesText, { optional: true }),
    settings: settings(value.settings, `${path}.settings`),
    changedFields: list(value.changedFields, `${path}.changedFields`, CONTROLLED_FIELDS.length, (v, p) => {
      if (!CONTROLLED_FIELDS.includes(v as ControlledField)) throw new ExperimentFormatError("is not a controlled field", p);
      return v as ControlledField;
    }),
    observations: list(value.observations, `${path}.observations`, EXPERIMENT_LIMITS.observationsPerRun, observation),
    audio: list(value.audio, `${path}.audio`, EXPERIMENT_LIMITS.audioPerRun, audio),
  };
}

/** Validates and normalizes an already-parsed document (for example from browser storage). */
export function validateExperiment(value: unknown): Experiment {
  if (!isObj(value)) throw new ExperimentFormatError("Not an experiment document", "");
  if (value.schema !== EXPERIMENT_SCHEMA) throw new ExperimentFormatError(`must be "${EXPERIMENT_SCHEMA}"`, "schema");
  let doc: Obj = value;
  let version = doc.schemaVersion;
  if (!Number.isSafeInteger(version) || (version as number) < 1) {
    throw new ExperimentFormatError("must be a positive whole number", "schemaVersion");
  }
  if ((version as number) > EXPERIMENT_SCHEMA_VERSION) {
    throw new ExperimentFormatError(
      `is ${String(version)}, but this Workbench reads up to ${EXPERIMENT_SCHEMA_VERSION}. Update Workbench to open it.`,
      "schemaVersion",
    );
  }
  while ((version as number) < EXPERIMENT_SCHEMA_VERSION) {
    const migrate = MIGRATIONS[version as number];
    if (!migrate) throw new ExperimentFormatError(`has no migration from version ${String(version)}`, "schemaVersion");
    doc = migrate(doc);
    version = doc.schemaVersion;
  }

  const runs = list(doc.runs, "runs", EXPERIMENT_LIMITS.runs, run);
  const ids = new Set<string>();
  runs.forEach((r, i) => {
    if (ids.has(r.id)) throw new ExperimentFormatError(`duplicate run id "${r.id}"`, `runs[${i}].id`);
    ids.add(r.id);
  });
  const baselineRunId = doc.baselineRunId === undefined || doc.baselineRunId === null ? null : id(doc.baselineRunId, "baselineRunId");
  if (baselineRunId !== null && !ids.has(baselineRunId)) {
    throw new ExperimentFormatError("does not match any run id", "baselineRunId");
  }
  return {
    schema: EXPERIMENT_SCHEMA,
    schemaVersion: EXPERIMENT_SCHEMA_VERSION,
    id: id(doc.id, "id"),
    title: text(doc.title, "title", EXPERIMENT_LIMITS.shortText),
    brief: text(doc.brief, "brief", EXPERIMENT_LIMITS.longText, { optional: true }),
    createdAt: timestamp(doc.createdAt, "createdAt"),
    updatedAt: timestamp(doc.updatedAt, "updatedAt"),
    baselineRunId,
    runs,
    tags: list(doc.tags, "tags", EXPERIMENT_LIMITS.tags, (v, p) => text(v, p, EXPERIMENT_LIMITS.shortText)),
    hypotheses: list(doc.hypotheses, "hypotheses", EXPERIMENT_LIMITS.hypotheses, (v, p) => text(v, p, EXPERIMENT_LIMITS.longText)),
  };
}

/** Parses an exported experiment file. Throws ExperimentFormatError with the failing path. */
export function parseExperimentJSON(json: string): Experiment {
  if (json.length > EXPERIMENT_LIMITS.jsonChars) {
    throw new ExperimentFormatError(`File exceeds ${EXPERIMENT_LIMITS.jsonChars.toLocaleString("en-US")} characters`, "");
  }
  let value: unknown;
  try {
    value = JSON.parse(json);
  } catch {
    throw new ExperimentFormatError("File is not valid JSON", "");
  }
  return validateExperiment(value);
}

/** Exports an experiment as stable, readable JSON (keys in schema order). */
export function serializeExperiment(experiment: Experiment): string {
  return `${JSON.stringify(validateExperiment(experiment), null, 2)}\n`;
}

/** Reads a dotted controlled field from a run, for comparison. */
export function fieldValue(r: ExperimentRun, field: ControlledField): unknown {
  if (field.startsWith("settings.")) {
    const key = field.slice("settings.".length) as keyof SunoSettings;
    const value = r.settings[key];
    return key === "extra" && value ? JSON.stringify(Object.entries(value).sort(([a], [b]) => a.localeCompare(b))) : value;
  }
  return r[field as Exclude<ControlledField, `settings.${string}`>];
}

export interface ComparabilityIssue {
  runId: string;
  kind: "undeclared-change" | "declared-but-unchanged" | "missing-setting" | "no-baseline";
  field?: ControlledField;
  message: string;
}

/**
 * Flags runs that should not be compared at face value: differences from the baseline that the
 * run does not declare, declared changes that are not actually different, and Suno settings
 * recorded on one side but not the other. It never says which run is better.
 */
export function checkComparability(experiment: Experiment): ComparabilityIssue[] {
  const baseline = experiment.runs.find((r) => r.id === experiment.baselineRunId);
  if (!baseline) {
    return experiment.runs.length > 1
      ? [{ runId: "", kind: "no-baseline", message: "Choose a baseline run before comparing variants." }]
      : [];
  }
  const issues: ComparabilityIssue[] = [];
  for (const variant of experiment.runs) {
    if (variant.id === baseline.id) continue;
    for (const field of CONTROLLED_FIELDS) {
      const a = fieldValue(baseline, field);
      const b = fieldValue(variant, field);
      const declared = variant.changedFields.includes(field);
      if (field.startsWith("settings.") && (a === undefined) !== (b === undefined)) {
        issues.push({
          runId: variant.id,
          kind: "missing-setting",
          field,
          message: `${variant.label}: ${field} is recorded for only one of the two runs.`,
        });
        continue;
      }
      if (a !== b && !declared) {
        issues.push({
          runId: variant.id,
          kind: "undeclared-change",
          field,
          message: `${variant.label}: ${field} differs from the baseline but is not declared as changed.`,
        });
      } else if (a === b && declared) {
        issues.push({
          runId: variant.id,
          kind: "declared-but-unchanged",
          field,
          message: `${variant.label}: ${field} is declared as changed but matches the baseline.`,
        });
      }
    }
  }
  return issues;
}
