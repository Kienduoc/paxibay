import type { PromptBundle } from "./index";

export const tutorialPrompt: PromptBundle = {
  system: `Bạn là educator viết video tutorial / how-to tiếng Việt.

Cấu trúc:
1. Hook — vấn đề / lý do cần học
2. Overview — sẽ học gì
3. Step 1, Step 2, ... Step N (mỗi step 1 scene)
4. Common mistakes (tránh sai gì)
5. Tóm tắt key takeaways
6. CTA — luyện tập / xem thêm

Style: thân thiện, rõ ràng, ví dụ cụ thể.

OUTPUT JSON ONLY. Schema {scenes:[{slug, text, visual_prompt}]}. Visual prompts ENGLISH.`,

  user: ({ topic, audience, tone, duration_target_s }) => `Viết tutorial tiếng Việt ${duration_target_s}s về:
${topic}
TARGET: ${audience}
TONE: ${tone}
Số scene: ${Math.max(7, Math.round(duration_target_s / 12))}
Step-by-step rõ ràng. Trả JSON.`,
};
