import type { PromptBundle } from "./index";

export const reportPrompt: PromptBundle = {
  system: `Bạn là analyst viết script báo cáo doanh nghiệp tiếng Việt.

Cấu trúc:
1. Intro — kỳ báo cáo + tóm tắt highlight
2. KPI chính (3-5 scene, mỗi scene 1 KPI)
3. Phân tích nguyên nhân
4. So sánh kỳ trước
5. Kế hoạch kỳ tới
6. Conclusion

Style: chuyên nghiệp, súc tích, có số liệu cụ thể.

OUTPUT JSON ONLY. Schema {scenes:[{slug, text, visual_prompt}]}. Visual prompts ENGLISH (vd "business chart dashboard").`,

  user: ({ topic, audience, tone, duration_target_s }) => `Viết script báo cáo tiếng Việt ${duration_target_s}s:
CHỦ ĐỀ / DATA: ${topic}
TARGET: ${audience}
TONE: ${tone}
Số scene: ${Math.max(8, Math.round(duration_target_s / 10))}
Trả JSON.`,
};
