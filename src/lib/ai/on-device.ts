/**
 * Chrome's built-in Prompt API (Gemini Nano, on device). Feature-detected: in other browsers, or
 * when Chrome can't run the model, everything here reports "unavailable" and nothing is shown.
 * The Workbench sends nothing anywhere; Chrome runs the model on this computer.
 */
import type { PromptCandidate } from "../suno/types.ts";
import { rewordInstruction } from "./check.ts";

export type AiAvailability = "unavailable" | "downloadable" | "downloading" | "available";

interface LanguageModelSession {
  prompt(input: string, options?: { signal?: AbortSignal }): Promise<string>;
  destroy?(): void;
}
interface LanguageModelApi {
  availability(options?: unknown): Promise<AiAvailability>;
  create(options?: unknown): Promise<LanguageModelSession>;
}

const OPTIONS = {
  expectedInputs: [{ type: "text", languages: ["en"] }],
  expectedOutputs: [{ type: "text", languages: ["en"] }],
};

function api(): LanguageModelApi | null {
  const lm = (globalThis as { LanguageModel?: LanguageModelApi }).LanguageModel;
  return lm && typeof lm.availability === "function" && typeof lm.create === "function" ? lm : null;
}

export async function aiAvailability(): Promise<AiAvailability> {
  const lm = api();
  if (!lm) return "unavailable";
  try {
    return await lm.availability(OPTIONS);
  } catch {
    return "unavailable";
  }
}

/** Asks the model for new wording. The caller must pass the result through checkAiRewrite. */
export async function rewordOnDevice(
  original: PromptCandidate,
  opts: { signal?: AbortSignal; onDownload?: (fraction: number) => void } = {},
): Promise<string> {
  const lm = api();
  if (!lm) throw new Error("On-device AI is not available in this browser.");
  const session = await lm.create({
    ...OPTIONS,
    signal: opts.signal,
    initialPrompts: [{ role: "system", content: rewordInstruction(original) }],
    monitor(m: EventTarget) {
      m.addEventListener("downloadprogress", (e) => opts.onDownload?.((e as Event & { loaded?: number }).loaded ?? 0));
    },
  });
  try {
    return await session.prompt(original.styles, { signal: opts.signal });
  } finally {
    session.destroy?.();
  }
}

/**
 * "on" is stored only after the user agrees in the permission dialog (v5.7.0+). The v5.5/v5.6
 * key was set by a plain checkbox, so it is ignored and removed: those users are asked again.
 */
const PREF = "suno-workbench:on-device-ai-consented";
const LEGACY_PREF = "suno-workbench:on-device-ai";
export function loadAiPref(): boolean {
  try {
    window.localStorage.removeItem(LEGACY_PREF);
    return window.localStorage.getItem(PREF) === "on";
  } catch {
    return false;
  }
}
export function saveAiPref(on: boolean): void {
  try {
    window.localStorage.setItem(PREF, on ? "on" : "off");
  } catch {
    /* storage blocked: the setting lasts for this visit only */
  }
}
