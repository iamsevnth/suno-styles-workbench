/**
 * "Use your own AI assistant": for browsers without on-device AI (Brave, Edge, Firefox, Safari, phones).
 * Websites cannot call Brave Leo, Microsoft Copilot or other assistants directly, so the user copies a
 * ready-made request, pastes it into the assistant they choose, and pastes the answer back. The Workbench
 * sends nothing itself; the answer is shown only if it passes the same checks as on-device AI wording.
 */
import type { PromptCandidate } from "../suno/types.ts";
import { checkAiRewrite, rewordInstruction, type AiCheck } from "./check.ts";

/** The text the user copies into their assistant: the instruction, then the prompt to reword. */
export function assistantRequest(prompt: PromptCandidate, styles = prompt.styles): string {
  return `${rewordInstruction(prompt)}\n\nPrompt to rewrite:\n${styles}`;
}

/** Checks an answer pasted back from an assistant. */
export function checkAssistantAnswer(answer: string, prompt: PromptCandidate): AiCheck {
  return checkAiRewrite(answer, prompt);
}
