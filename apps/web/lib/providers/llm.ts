/**
 * Multi-provider LLM client.
 *
 * Selects backend based on `llm_provider`. Each backend implements the same
 * `generate(opts)` interface that returns parsed JSON.
 *
 * MVP only implements Claude (server-managed) + OpenRouter (BYOK).
 * Other providers throw NOT_IMPLEMENTED — wire up in subsequent passes.
 */
import Anthropic from "@anthropic-ai/sdk";
import type { LlmProvider } from "@paxibay/core";
import { ApiException } from "@/lib/api/errors";

export interface LlmGenerateOptions {
  system: string;
  user: string;
  max_tokens?: number;
  temperature?: number;
}

export interface LlmGenerateResult {
  text: string;
  input_tokens: number;
  output_tokens: number;
  cost_usd: number;
}

export async function callLlm(
  provider: LlmProvider,
  model: string,
  opts: LlmGenerateOptions,
  byokSecret?: string,
): Promise<LlmGenerateResult> {
  switch (provider) {
    case "claude":
      return callClaude(model, opts, byokSecret);
    case "openrouter":
      return callOpenRouter(model, opts, byokSecret);
    case "openai":
    case "gemini":
    case "local-ollama":
      throw new ApiException(
        "VALIDATION_ERROR",
        `LLM provider "${provider}" chưa được hỗ trợ trong MVP. Dùng claude hoặc openrouter.`,
      );
  }
}

// --- CLAUDE ---------------------------------------------------------------
async function callClaude(
  model: string,
  opts: LlmGenerateOptions,
  byokSecret?: string,
): Promise<LlmGenerateResult> {
  const apiKey = byokSecret ?? process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new ApiException(
      "EXTERNAL_API_ERROR",
      "Thiếu ANTHROPIC_API_KEY — set server env hoặc cung cấp BYOK.",
    );
  }
  const client = new Anthropic({ apiKey });
  const response = await client.messages.create({
    model,
    max_tokens: opts.max_tokens ?? 4096,
    temperature: opts.temperature ?? 0.7,
    system: opts.system,
    messages: [{ role: "user", content: opts.user }],
  });
  const text = response.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("");
  return {
    text,
    input_tokens: response.usage.input_tokens,
    output_tokens: response.usage.output_tokens,
    cost_usd: estimateClaudeCost(model, response.usage.input_tokens, response.usage.output_tokens),
  };
}

function estimateClaudeCost(model: string, inTok: number, outTok: number): number {
  // Rough pricing per million tokens (update from Anthropic pricing page).
  const tiers: Record<string, [number, number]> = {
    "claude-haiku-4-5": [0.8, 4.0],
    "claude-sonnet-4-6": [3.0, 15.0],
    "claude-opus-4-8": [15.0, 75.0],
  };
  const [inPrice, outPrice] = tiers[model] ?? [3.0, 15.0];
  return (inTok * inPrice + outTok * outPrice) / 1_000_000;
}

// --- OPENROUTER -----------------------------------------------------------
async function callOpenRouter(
  model: string,
  opts: LlmGenerateOptions,
  byokSecret?: string,
): Promise<LlmGenerateResult> {
  const apiKey = byokSecret ?? process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new ApiException(
      "EXTERNAL_API_ERROR",
      "Thiếu OPENROUTER_API_KEY — set server env hoặc cung cấp BYOK.",
    );
  }
  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "https://paxibay.cloud",
      "X-Title": "Paxibay",
    },
    body: JSON.stringify({
      model,
      max_tokens: opts.max_tokens ?? 4096,
      temperature: opts.temperature ?? 0.7,
      messages: [
        { role: "system", content: opts.system },
        { role: "user", content: opts.user },
      ],
    }),
  });
  if (!response.ok) {
    throw new ApiException("EXTERNAL_API_ERROR", `OpenRouter ${response.status}: ${await response.text()}`);
  }
  const data = await response.json();
  return {
    text: data.choices?.[0]?.message?.content ?? "",
    input_tokens: data.usage?.prompt_tokens ?? 0,
    output_tokens: data.usage?.completion_tokens ?? 0,
    cost_usd: data.usage?.total_cost ?? 0,
  };
}

/**
 * Strict JSON parser. LLMs sometimes wrap JSON in ```json fences or add prose —
 * this rips out the JSON body. Throws if no valid JSON object found.
 */
export function parseJsonResponse<T>(raw: string): T {
  let text = raw.trim();
  // Strip markdown code fences
  const fenceMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  if (fenceMatch && fenceMatch[1]) {
    text = fenceMatch[1].trim();
  }
  // Find first { ... } block
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end === -1 || end < start) {
    throw new ApiException("EXTERNAL_API_ERROR", "LLM returned no JSON object");
  }
  const jsonStr = text.substring(start, end + 1);
  try {
    return JSON.parse(jsonStr) as T;
  } catch (e) {
    throw new ApiException("EXTERNAL_API_ERROR", `LLM JSON parse failed: ${e}`);
  }
}
