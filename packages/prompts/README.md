# @paxibay/prompts

LLM prompt templates for generating video scripts per template type.

## Usage

```ts
import { getPrompt } from "@paxibay/prompts";

const bundle = getPrompt("review");
if (!bundle) throw new Error("Template not supported");

const response = await callLlm({
  system: bundle.system,
  user: bundle.user({
    topic: "Sách Đắc Nhân Tâm",
    audience: "smb",
    tone: "professional",
    duration_target_s: 300,
  }),
});

// LLM returns JSON: { scenes: [{ slug, text, visual_prompt }] }
```

## Adding a new template prompt

1. Create `src/<slug>.ts` exporting a `PromptBundle`.
2. Register in `src/index.ts` `PROMPTS` map.

## Design principles

- **System prompt fixes the JSON schema** — so any LLM (Claude/GPT/Gemini/local) returns the same structure.
- **User prompt is parametric** — topic, audience, tone, duration interpolated in.
- **Visual prompts are English** — Pexels API doesn't index Vietnamese keywords well.
- **Slug convention** — `XX-name` for sorting; `lessonN` substring triggers lesson badge in review template.
