// =============================================================================
// Constants — single source of truth for limits, defaults, mappings
// =============================================================================
import type { Plan } from "./types";

export const FPS = 30;

export const PLAN_QUOTAS = {
  free: {
    videos_per_month: 3,
    render_minutes_per_month: 30,
    max_duration_s: 60,
    max_quality: "720p" as const,
    watermark: true,
    vbee_byok: false,
    custom_branding: false,
    team_seats: 1,
  },
  pro: {
    videos_per_month: 30,
    render_minutes_per_month: 200,
    max_duration_s: 300,
    max_quality: "1080p" as const,
    watermark: false,
    vbee_byok: true,
    custom_branding: false,
    team_seats: 1,
  },
  business: {
    videos_per_month: Infinity,
    render_minutes_per_month: 2000,
    max_duration_s: 900,
    max_quality: "4K" as const,
    watermark: false,
    vbee_byok: true,
    custom_branding: true,
    team_seats: 5,
  },
} as const;

export const ASPECT_DIMENSIONS = {
  "16:9": { width: 1920, height: 1080 },
  "9:16": { width: 1080, height: 1920 },
  "1:1": { width: 1080, height: 1080 },
} as const;

export const QUALITY_DIMENSIONS = {
  "720p": { width: 1280, height: 720 },
  "1080p": { width: 1920, height: 1080 },
  "4K": { width: 3840, height: 2160 },
} as const;

// Vbee voice presets (curated subset — full list queried at runtime)
export const VBEE_VOICES = [
  { code: "hn_male_minhquan_yt-stable", name: "HN — Minh Quân", gender: "male", region: "HN" },
  { code: "hn_female_ngochuyen_full_48k-fhg", name: "HN — Ngọc Huyền", gender: "female", region: "HN" },
  { code: "sg_male_minhhoang_full_48k-fhg", name: "SG — Minh Hoàng", gender: "male", region: "SG" },
  { code: "sg_female_tuongvy_call_44k-fhg", name: "SG — Tường Vy", gender: "female", region: "SG" },
] as const;

// Edge-TTS Vietnamese voices
export const EDGE_TTS_VOICES = [
  { code: "vi-VN-HoaiMyNeural", name: "HoaiMy", gender: "female" },
  { code: "vi-VN-NamMinhNeural", name: "NamMinh", gender: "male" },
] as const;

// LLM model presets per provider
export const LLM_MODELS = {
  claude: [
    { id: "claude-sonnet-4-6", name: "Sonnet 4.6", tier: "balanced" },
    { id: "claude-opus-4-8", name: "Opus 4.8", tier: "premium" },
    { id: "claude-haiku-4-5", name: "Haiku 4.5", tier: "fast" },
  ],
  openai: [
    { id: "gpt-5", name: "GPT-5", tier: "premium" },
    { id: "gpt-4o", name: "GPT-4o", tier: "balanced" },
  ],
  openrouter: [
    { id: "anthropic/claude-sonnet-4-6", name: "Claude Sonnet (via OR)", tier: "balanced" },
    { id: "openai/gpt-5", name: "GPT-5 (via OR)", tier: "premium" },
    { id: "deepseek/deepseek-r1", name: "DeepSeek R1", tier: "cheap" },
  ],
  gemini: [
    { id: "gemini-2.5-pro", name: "Gemini 2.5 Pro", tier: "balanced" },
    { id: "gemini-2.5-flash", name: "Gemini 2.5 Flash", tier: "fast" },
  ],
  "local-ollama": [
    { id: "qwen2.5:14b", name: "Qwen 2.5 14B", tier: "local" },
    { id: "llama3.3:8b", name: "Llama 3.3 8B", tier: "local" },
  ],
} as const;

// ---------------------------------------------------------------------------
// Credits — point system. Each action costs credits; admin/plan grants them.
// ---------------------------------------------------------------------------
export const CREDIT_COSTS = {
  script: 10, // generate full script (1 LLM call)
  voice_per_scene: 2, // TTS per scene
  footage_per_scene: 1, // Pexels download per scene
  render: 20, // one render
} as const;

// Default credit grant per plan (admin can override per user)
export const CREDIT_GRANTS: Record<Plan, number> = {
  free: 100,
  pro: 3000,
  business: 50000,
};

export function creditsRemaining(p: { credits_total: number; credits_used: number }): number {
  return Math.max(0, p.credits_total - p.credits_used);
}

// Music vibe → tag mapping (for asset library lookup)
export const MUSIC_VIBES = [
  { id: "cinematic", label: "Cinematic", tags: ["cinematic", "epic", "orchestra"] },
  { id: "energetic", label: "Năng động", tags: ["upbeat", "electronic", "dance"] },
  { id: "calm", label: "Calm", tags: ["ambient", "chill", "soft"] },
  { id: "dramatic", label: "Drama", tags: ["dramatic", "tense", "dark"] },
  { id: "corporate", label: "Corporate", tags: ["corporate", "motivational", "uplifting"] },
  { id: "none", label: "Không nhạc", tags: [] },
] as const;
