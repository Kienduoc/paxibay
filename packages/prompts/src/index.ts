import type { TemplateId } from "@paxibay/core";
import { reviewPrompt } from "./review";
import { appIntroPrompt } from "./app-intro";
import { productAdPrompt } from "./product-ad";
import { reportPrompt } from "./report";
import { newsPrompt } from "./news";
import { tutorialPrompt } from "./tutorial";

/**
 * Returns the system + user prompt for a given template.
 * Prompts are designed to make any LLM (Claude/GPT/Gemini/local) output a
 * consistent JSON structure that the manifest builder can consume.
 */
export interface PromptBundle {
  system: string;
  user: (input: PromptInput) => string;
}

export interface PromptInput {
  topic: string;
  audience: string;
  tone: string;
  duration_target_s: number;
}

export const PROMPTS: Partial<Record<TemplateId, PromptBundle>> = {
  review: reviewPrompt,
  "app-intro": appIntroPrompt,
  "product-ad": productAdPrompt,
  report: reportPrompt,
  news: newsPrompt,
  tutorial: tutorialPrompt,
};

export function getPrompt(id: TemplateId): PromptBundle | undefined {
  return PROMPTS[id];
}
