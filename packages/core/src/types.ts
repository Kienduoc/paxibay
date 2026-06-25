// =============================================================================
// Shared types — mirror Postgres schema in infrastructure/supabase/migrations
// =============================================================================

export type Plan = "free" | "pro" | "business";

export type TemplateId =
  | "app-intro"
  | "review"
  | "product-ad"
  | "report"
  | "news"
  | "tutorial";

export type ProjectStatus = "draft" | "ready" | "archived";

export type RenderStatus = "queued" | "running" | "succeeded" | "failed" | "cancelled";

export type RenderLocation = "local" | "cloud";

export type AspectRatio = "16:9" | "9:16" | "1:1";

export type Quality = "720p" | "1080p" | "4K";

export type VoiceProvider = "edge-tts" | "vbee" | "piper";

export type LlmProvider =
  | "claude"
  | "openai"
  | "openrouter"
  | "gemini"
  | "local-ollama";

export type AssetKind =
  | "logo"
  | "custom-footage"
  | "custom-music"
  | "thumbnail"
  | "render-output";

// -----------------------------------------------------------------------------
// Domain models
// -----------------------------------------------------------------------------
export type UserRole = "admin" | "user";

export interface Profile {
  id: string;
  email: string | null;
  display_name: string | null;
  avatar_url: string | null;
  role: UserRole;
  plan: Plan;
  credits_total: number;
  credits_used: number;
  is_active: boolean;
  phone: string | null;
  company: string | null;
  videos_this_month: number;
  render_minutes: number;
  quota_reset_at: string;
  default_llm: LlmProvider;
  default_voice: VoiceProvider;
  default_voice_code: string;
  created_at: string;
  updated_at: string;
}

export interface Subscription {
  id: string;
  user_id: string;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  stripe_price_id: string | null;
  plan: Plan;
  status: string | null;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
}

export interface Project {
  id: string;
  user_id: string;
  title: string;
  template: TemplateId;
  status: ProjectStatus;
  topic: string;
  audience: string;
  tone: string;
  duration_target_s: number;
  llm_provider: LlmProvider;
  llm_model: string;
  voice_provider: VoiceProvider;
  voice_code: string;
  voice_speed: number;
  music_vibe: string;
  music_track_id: string | null;
  music_volume: number;
  aspect_ratio: AspectRatio;
  quality: Quality;
  scene_count: number;
  total_frames: number;
  total_duration_s: number | null;
  thumbnail_url: string | null;
  last_rendered_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Scene {
  id: string;
  project_id: string;
  position: number;
  slug: string;
  text: string;
  visual_prompt: string | null;
  voice_url: string | null;
  voice_duration_s: number | null;
  voice_generated_at: string | null;
  footage_url: string | null;
  footage_source: string | null;
  footage_meta: Record<string, unknown>;
  start_frame: number | null;
  duration_frames: number | null;
  text_overlay_style: Record<string, unknown>;
}

export interface Render {
  id: string;
  project_id: string;
  user_id: string;
  template: TemplateId;
  aspect_ratio: AspectRatio;
  quality: Quality;
  location: RenderLocation;
  status: RenderStatus;
  progress_frames: number;
  total_frames: number;
  output_url: string | null;
  output_size_bytes: number | null;
  duration_ms: number | null;
  error_code: string | null;
  error_message: string | null;
  started_at: string | null;
  finished_at: string | null;
  created_at: string;
}

export interface Asset {
  id: string;
  user_id: string | null;
  kind: AssetKind;
  title: string | null;
  url: string;
  mime_type: string | null;
  size_bytes: number | null;
  duration_s: number | null;
  width: number | null;
  height: number | null;
  metadata: Record<string, unknown>;
  license: string | null;
  attribution: string | null;
  tags: string[];
  created_at: string;
}

// -----------------------------------------------------------------------------
// Render manifest — what the Render Engine receives
// -----------------------------------------------------------------------------
export interface SceneManifest {
  slug: string;
  text: string;
  start_frame: number;
  duration_frames: number;
  voice_url: string;
  footage_url: string;
}

export interface RenderManifest {
  render_id: string;
  remotion_composition: TemplateId;
  fps: number;
  width: number;
  height: number;
  total_frames: number;
  scenes: SceneManifest[];
  music_url: string;
  music_volume: number;
  upload_url: string;
  upload_token: string;
}

// -----------------------------------------------------------------------------
// API request/response envelopes
// -----------------------------------------------------------------------------
export interface ApiError {
  error: string;
  message: string;
  details?: Record<string, unknown>;
}

export interface CreateProjectInput {
  template: TemplateId;
  topic: string;
  audience?: string;
  tone?: string;
  duration_target_s?: number;
  llm_provider?: LlmProvider;
  llm_model?: string;
  voice_provider?: VoiceProvider;
  voice_code?: string;
  voice_speed?: number;
  music_vibe?: string;
  aspect_ratio?: AspectRatio;
  quality?: Quality;
}

export interface UsageSummary {
  videos_this_month: number;
  videos_quota: number;
  render_minutes_this_month: number;
  render_minutes_quota: number;
}
