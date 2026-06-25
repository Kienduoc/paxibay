import { z } from "zod";

// -----------------------------------------------------------------------------
// Enum schemas — single source of truth for valid values
// -----------------------------------------------------------------------------
export const planSchema = z.enum(["free", "pro", "business"]);
export const templateIdSchema = z.enum([
  "app-intro",
  "review",
  "product-ad",
  "report",
  "news",
  "tutorial",
]);
export const projectStatusSchema = z.enum(["draft", "ready", "archived"]);
export const renderStatusSchema = z.enum([
  "queued",
  "running",
  "succeeded",
  "failed",
  "cancelled",
]);
export const aspectRatioSchema = z.enum(["16:9", "9:16", "1:1"]);
export const qualitySchema = z.enum(["720p", "1080p", "4K"]);
export const voiceProviderSchema = z.enum(["edge-tts", "vbee", "piper"]);
export const llmProviderSchema = z.enum([
  "claude",
  "openai",
  "openrouter",
  "gemini",
  "local-ollama",
]);

// -----------------------------------------------------------------------------
// API input schemas
// -----------------------------------------------------------------------------
export const createProjectInputSchema = z.object({
  template: templateIdSchema,
  topic: z.string().min(5).max(2000),
  audience: z.string().max(50).optional(),
  tone: z.string().max(50).optional(),
  duration_target_s: z.number().int().min(15).max(900).default(90),
  llm_provider: llmProviderSchema.default("claude"),
  llm_model: z.string().max(100).default("claude-sonnet-4-6"),
  voice_provider: voiceProviderSchema.default("edge-tts"),
  voice_code: z.string().max(100).default("vi-VN-HoaiMyNeural"),
  voice_speed: z.number().min(0.5).max(2).default(1.0),
  music_vibe: z.string().max(30).default("cinematic"),
  aspect_ratio: aspectRatioSchema.default("16:9"),
  quality: qualitySchema.default("1080p"),
});

export const updateProjectInputSchema = createProjectInputSchema.partial().extend({
  title: z.string().min(1).max(200).optional(),
  music_volume: z.number().min(0).max(1).optional(),
});

export const updateSceneInputSchema = z.object({
  text: z.string().min(1).max(2000).optional(),
  footage_url: z.string().url().optional(),
  visual_prompt: z.string().max(500).optional(),
});

export const generateVoiceInputSchema = z.object({
  scene_id: z.string().uuid().optional(),
  project_id: z.string().uuid().optional(),
  scope: z.enum(["missing-only", "all"]).default("missing-only"),
  force: z.boolean().default(false),
}).refine((v) => v.scene_id || v.project_id, {
  message: "Either scene_id or project_id required",
});

export const pexelsSearchInputSchema = z.object({
  query: z.string().min(2).max(200),
  per_page: z.number().int().min(1).max(20).default(8),
  orientation: z.enum(["landscape", "portrait", "square"]).default("landscape"),
});

export const startRenderInputSchema = z.object({
  project_id: z.string().uuid(),
  location: z.enum(["local", "cloud"]).default("local"),
  quality: qualitySchema.optional(),
});

// -----------------------------------------------------------------------------
// Render manifest (engine receives)
// -----------------------------------------------------------------------------
export const sceneManifestSchema = z.object({
  slug: z.string(),
  text: z.string(),
  start_frame: z.number().int().nonnegative(),
  duration_frames: z.number().int().positive(),
  voice_url: z.string().url(),
  footage_url: z.string().url(),
});

export const renderManifestSchema = z.object({
  render_id: z.string().uuid(),
  remotion_composition: templateIdSchema,
  fps: z.number().int().positive(),
  width: z.number().int().positive(),
  height: z.number().int().positive(),
  total_frames: z.number().int().positive(),
  scenes: z.array(sceneManifestSchema),
  music_url: z.string().url(),
  music_volume: z.number().min(0).max(1),
  upload_url: z.string().url(),
  upload_token: z.string(),
});

// -----------------------------------------------------------------------------
// BYOK key creation
// -----------------------------------------------------------------------------
export const apiKeyInputSchema = z.object({
  provider: z.enum(["vbee", "openrouter", "openai", "anthropic"]),
  label: z.string().min(1).max(50),
  secret: z.string().min(10),
  extra_meta: z.record(z.string(), z.string()).optional(),
});
