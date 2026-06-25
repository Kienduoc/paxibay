import type { TemplateId } from "./types";

export interface TemplateMeta {
  id: TemplateId;
  label: string;
  icon: string;
  tagline: string;
  description: string;
  recommendedDuration: number; // seconds
  audienceHints: string[];
  toneOptions: string[];
}

export const TEMPLATES: TemplateMeta[] = [
  {
    id: "app-intro",
    label: "App / Web Intro",
    icon: "📱",
    tagline: "Giới thiệu sản phẩm",
    description:
      "Giới thiệu app, website, hoặc dịch vụ SaaS. Cấu trúc: Hook → Features → USP → CTA.",
    recommendedDuration: 60,
    audienceHints: ["smb", "startup", "developer"],
    toneOptions: ["professional", "energetic", "humor"],
  },
  {
    id: "review",
    label: "Review",
    icon: "📚",
    tagline: "Sách / sản phẩm",
    description:
      "Review sách, sản phẩm, dịch vụ. Cấu trúc: Hook → Tóm tắt → Bài học/phân tích → Kết luận.",
    recommendedDuration: 300,
    audienceHints: ["booktuber", "creator", "educator"],
    toneOptions: ["professional", "dramatic", "casual"],
  },
  {
    id: "product-ad",
    label: "Quảng cáo",
    icon: "🛒",
    tagline: "Bán hàng",
    description:
      "Video quảng cáo sản phẩm cho FB/TikTok/IG Ads. Cấu trúc: Pain → Solution → USP → Offer → CTA.",
    recommendedDuration: 30,
    audienceHints: ["ecommerce", "smb"],
    toneOptions: ["energetic", "humor", "dramatic"],
  },
  {
    id: "report",
    label: "Báo cáo",
    icon: "📊",
    tagline: "Doanh nghiệp",
    description:
      "Báo cáo tháng/quý nội bộ. Hiển thị KPI, tăng trưởng, mục tiêu. Cấu trúc: Tóm tắt → KPI → Phân tích → Kế hoạch.",
    recommendedDuration: 90,
    audienceHints: ["smb", "team"],
    toneOptions: ["professional"],
  },
  {
    id: "news",
    label: "Tin tức",
    icon: "📰",
    tagline: "Sự kiện",
    description:
      "Tin tức, sự kiện thời sự. Cấu trúc: Headline → Bối cảnh → Diễn biến → Phân tích → Ý kiến.",
    recommendedDuration: 90,
    audienceHints: ["media", "creator"],
    toneOptions: ["professional", "dramatic"],
  },
  {
    id: "tutorial",
    label: "Tutorial",
    icon: "💡",
    tagline: "Hướng dẫn",
    description:
      "Explainer / tutorial step-by-step. Cấu trúc: Vấn đề → Cách giải → Step 1-N → Tóm tắt.",
    recommendedDuration: 120,
    audienceHints: ["educator", "creator", "developer"],
    toneOptions: ["professional", "casual"],
  },
];

export function getTemplate(id: TemplateId): TemplateMeta | undefined {
  return TEMPLATES.find((t) => t.id === id);
}
