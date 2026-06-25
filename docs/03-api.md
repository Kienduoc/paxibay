# Paxal — API Contract

REST API (Next.js App Router), WebSocket for render progress, deep link for cloud↔local handshake.

Base URL: `https://paxal.vercel.app/api` (replace with custom domain later).

---

## 0. Conventions

### Auth
- All authenticated endpoints expect `Cookie: sb-access-token` (Supabase session cookie) **or** `Authorization: Bearer <jwt>`.
- Service-role tokens (for webhooks / render engine) use `Authorization: Bearer <SUPABASE_SERVICE_ROLE_KEY>` — never expose client-side.

### Response envelope
Successful responses return raw data (no envelope) so types are clean:
```json
{ "id": "...", "title": "..." }
```
Errors use HTTP status + JSON body:
```json
{ "error": "SCENE_NOT_FOUND", "message": "Scene xxx not found" }
```
Standard error codes: `UNAUTHORIZED` (401), `FORBIDDEN` (403), `NOT_FOUND` (404), `VALIDATION_ERROR` (400), `RATE_LIMIT` (429), `QUOTA_EXCEEDED` (402), `EXTERNAL_API_ERROR` (502), `INTERNAL` (500).

### Versioning
- Path prefix: `/api/v1/...` (recommended). MVP uses `/api/...` flat; bump to `v1` when stable.
- Breaking changes go in new version. Deprecate v0 with `Sunset` header.

### Idempotency
- POST endpoints accept `Idempotency-Key: <uuid>` header. Server caches result for 24h.

### Rate limits (per user)
| Endpoint | Free | Pro | Business |
|---|---|---|---|
| `/generate/script` | 5/hour | 30/hour | 100/hour |
| `/generate/voice` | 100 calls/day | 1000/day | 10k/day |
| `/pexels/*` | 50/hour | 200/hour | 1000/hour |
| Everything else | 60/min | 120/min | 600/min |

---

## 1. Authentication endpoints

Handled entirely by Supabase Auth client SDK — no custom endpoints needed.

**Client SDK calls** (`@supabase/ssr` in Next.js):
```ts
supabase.auth.signInWithOAuth({ provider: 'google' })
supabase.auth.signInWithOtp({ email })          // Magic link
supabase.auth.signOut()
supabase.auth.getSession()
```

OAuth callback: `/auth/callback` (Next.js page calls `supabase.auth.exchangeCodeForSession`).

Magic link callback: same `/auth/callback`.

After successful sign-in, the DB trigger `on_auth_user_created` creates a `profiles` row + `subscriptions` row (plan='free').

---

## 2. Projects CRUD

### `POST /api/projects` — Create draft
**Body**:
```json
{
  "template": "app-intro",
  "topic": "StockChat VN...",
  "audience": "smb",
  "tone": "energetic",
  "duration_target_s": 90,
  "llm_provider": "claude",
  "llm_model": "claude-sonnet-4-6",
  "voice_provider": "edge-tts",
  "voice_code": "vi-VN-HoaiMyNeural",
  "voice_speed": 1.0,
  "music_vibe": "cinematic",
  "aspect_ratio": "16:9",
  "quality": "1080p"
}
```
**Response 201**:
```json
{ "id": "uuid", "status": "draft", "created_at": "..." }
```

### `GET /api/projects` — List
**Query**: `?q=&template=&status=&sort=updated_desc&page=1&per_page=10`
**Response**: `{ "items": [ProjectOverview], "total": 42, "page": 1 }`

### `GET /api/projects/:id` — Detail (with scenes)
**Response**:
```json
{
  "id": "...",
  "title": "...",
  "template": "review",
  "status": "ready",
  "topic": "...",
  "scenes": [
    {
      "id": "...",
      "position": 0,
      "slug": "bg-01-hook",
      "text": "Tin nóng đến tay bạn...",
      "voice_url": "https://.../voice/bg-01-hook.mp3",
      "voice_duration_s": 6.62,
      "footage_url": "https://.../footage/bg-01-hook.mp4",
      "start_frame": 0,
      "duration_frames": 199
    }
  ],
  "total_frames": 14477,
  "total_duration_s": 482.6,
  "config": { /* llm, voice, music ... */ }
}
```

### `PATCH /api/projects/:id` — Update metadata
**Body** (partial): `{ "title": "new title", "music_volume": 0.20 }`
**Response 200**: updated project.

### `DELETE /api/projects/:id` — Soft delete (sets `status='archived'`)
**Response 204**.

### `POST /api/projects/:id/duplicate` — Clone
Copies project + scenes (without renders). Returns new project.

---

## 3. Scene CRUD

### `PATCH /api/scenes/:id` — Update text/footage
**Body**:
```json
{
  "text": "new narration text",
  "footage_url": "https://...",        // optional, swap
  "visual_prompt": "new search query"  // optional
}
```
**Behavior**:
- If `text` changed → server triggers async voice regen (returns 202 with `voice_pending: true`).
- If `footage_url` changed → just save URL.
- Returns updated scene.

### `POST /api/scenes` — Add scene
**Body**: `{ "project_id": "uuid", "position": 5, "text": "...", "visual_prompt": "..." }`

### `DELETE /api/scenes/:id` — Remove scene + reorder

### `POST /api/scenes/reorder` — Bulk reorder
**Body**: `{ "project_id": "uuid", "order": ["sceneId1", "sceneId2", ...] }`

---

## 4. Generation endpoints

### `POST /api/generate/script` — LLM → script + scene list
**Body**:
```json
{
  "project_id": "uuid",
  "force_regenerate": false
}
```
Uses project's config (topic, template, audience, tone, duration, llm_provider, llm_model). Server:
1. Loads prompt template from `packages/prompts/<template>.md`.
2. Fills variables.
3. Calls LLM (with user's BYOK or Paxal default).
4. Parses LLM response → array of `{slug, text, visual_prompt}`.
5. Inserts scenes into DB.
6. Records `usage_events` with token counts.

**Response 200**:
```json
{
  "project_id": "...",
  "scenes_created": 13,
  "llm_input_tokens": 1280,
  "llm_output_tokens": 2840,
  "cost_usd": 0.0118
}
```

### `POST /api/generate/voice` — TTS for single scene OR full project
**Body** (single):
```json
{ "scene_id": "uuid", "force": false }
```
**Body** (full project):
```json
{ "project_id": "uuid", "scope": "missing-only" }   // or "all"
```
Server:
1. For each scene without `voice_url` (or all if `force`):
   a. If provider == `edge-tts`: call MS Edge TTS via internal proxy.
   b. If provider == `vbee`: use user's BYOK (decrypt from `api_keys`).
   c. If provider == `piper`: queue for render-engine to generate locally.
2. Upload MP3 → Supabase Storage.
3. Run ffprobe → measure duration.
4. Update scene with `voice_url`, `voice_duration_s`.

**Response 200**:
```json
{
  "scenes_processed": 13,
  "scenes_failed": 0,
  "total_chars": 8420,
  "total_duration_s": 482.6
}
```

### `POST /api/pexels/search` — Find footage candidates
**Body**:
```json
{ "query": "vintage italian street", "per_page": 8, "orientation": "landscape" }
```
**Response**:
```json
{
  "items": [
    {
      "pexels_id": 12345,
      "duration_s": 18,
      "thumbnail": "https://images.pexels.com/...",
      "files": [
        { "quality": "hd", "width": 1920, "height": 1080, "url": "...", "size_mb": 12.4 }
      ]
    }
  ]
}
```

### `POST /api/pexels/assign` — Assign Pexels result to a scene
**Body**: `{ "scene_id": "uuid", "pexels_id": 12345, "file_url": "..." }`
Server downloads MP4 → uploads to Supabase Storage → updates scene's `footage_url`.

### `POST /api/manifest/build` — Compute scene timeline
**Body**: `{ "project_id": "uuid" }`
**Behavior**: Reads all scenes, calculates `start_frame` cumulatively, sets `total_frames` on project. Used after voice regen or scene reorder.
**Response**: Updated project with computed timeline.

---

## 5. Render endpoints

### `POST /api/renders` — Trigger a render
**Body**:
```json
{
  "project_id": "uuid",
  "location": "local",          // "local" | "cloud"
  "quality": "1080p"
}
```
**Server behavior**:
1. Build manifest from scenes.
2. Create `renders` row with status `queued`.
3. If `location: "cloud"`:
   - Enqueue Remotion Lambda render job (Business tier only).
   - Return immediately with render_id.
4. If `location: "local"`:
   - Generate short-lived JWT (5 min) embedding `render_id` + user_id.
   - Return `deep_link` for opening Paxal Render Engine.

**Response (local)**:
```json
{
  "render_id": "uuid",
  "deep_link": "paxal://render?token=eyJhbGc...",
  "fallback_download_url": "https://.../download/engine?os=win"
}
```

**Response (cloud)**:
```json
{ "render_id": "uuid", "status": "queued", "estimated_seconds": 180 }
```

### `GET /api/renders/:id` — Poll render status
**Response**:
```json
{
  "id": "uuid",
  "status": "running",
  "progress_frames": 4231,
  "total_frames": 14477,
  "progress_pct": 29.2,
  "engine_version": "paxal-engine-1.0.3",
  "output_url": null,
  "error_message": null
}
```

### `GET /api/renders?project_id=...` — Render history for a project
**Response**: `{ "items": [Render], "total": 3 }`

### WebSocket `wss://paxal.vercel.app/api/renders/:id/ws` — Live updates
Server pushes events from render engine:
```json
{ "type": "progress", "frame": 4231, "total": 14477 }
{ "type": "log", "message": "Encoded 14400/14477" }
{ "type": "complete", "output_url": "https://...", "duration_ms": 142000 }
{ "type": "error", "code": "FFMPEG_FAILED", "message": "..." }
```

---

## 6. Render Engine ↔ Web protocol

The desktop app (Electron) does the heavy lifting. It needs to authenticate, fetch manifest + assets, render, then report back.

### Deep link handshake
Web opens: `paxal://render?token=eyJhbGc...`

Engine receives this via OS protocol handler. Token JWT contains:
```json
{
  "render_id": "uuid",
  "user_id": "uuid",
  "exp": 1750000000,
  "manifest_url": "https://paxal.vercel.app/api/renders/uuid/manifest",
  "callback_ws": "wss://paxal.vercel.app/api/renders/uuid/ws"
}
```

### Engine workflow
```
1. Validate token (verify signature with public key bundled in engine)
2. GET manifest_url → receive full project + scene list + asset URLs
3. Connect WS callback_ws for live progress reporting
4. Download all assets (voice MP3s, footage MP4s, music) to local cache
5. Run Remotion bundle → render frames → encode MP4
6. POST progress every 100 frames via WS
7. On finish: upload MP4 to signed Supabase Storage URL
8. POST /api/renders/:id/complete with output_url + duration
```

### `GET /api/renders/:id/manifest` — Engine fetches full render bundle
**Auth**: short-lived JWT from deep link
**Response**:
```json
{
  "render_id": "uuid",
  "remotion_composition": "review",
  "fps": 30,
  "width": 1920,
  "height": 1080,
  "total_frames": 14477,
  "scenes": [
    {
      "slug": "bg-01-hook",
      "text": "Tin nóng đến tay bạn...",
      "start_frame": 0,
      "duration_frames": 199,
      "voice_url": "https://.../voice/bg-01-hook.mp3",
      "footage_url": "https://.../footage/bg-01-hook.mp4"
    }
  ],
  "music_url": "https://.../music/dark-triad.mp3",
  "music_volume": 0.22,
  "upload_url": "https://...supabase.../storage/.../upload?token=...",
  "upload_token": "..."
}
```

### `POST /api/renders/:id/complete` — Engine reports finish
**Body**:
```json
{
  "status": "succeeded",
  "output_url": "https://...mp4",
  "output_size_bytes": 260134315,
  "duration_ms": 142000,
  "engine_version": "paxal-engine-1.0.3"
}
```
On failure:
```json
{ "status": "failed", "error_code": "FFMPEG_OOM", "error_message": "..." }
```

---

## 7. Billing (Stripe)

### `POST /api/billing/checkout` — Start subscription
**Body**: `{ "plan": "pro" }`  // or "business"
**Response**: `{ "checkout_url": "https://checkout.stripe.com/..." }`

### `POST /api/billing/portal` — Open Stripe customer portal
**Response**: `{ "portal_url": "https://billing.stripe.com/..." }`

### `POST /api/webhooks/stripe` — Webhook handler (signed by Stripe)
Handles events:
- `checkout.session.completed` → update subscription
- `customer.subscription.updated` → update plan/status
- `customer.subscription.deleted` → downgrade to free
- `invoice.payment_failed` → flag account

Webhook signature verified using `STRIPE_WEBHOOK_SECRET`. Idempotent via Stripe event ID.

---

## 8. User profile & settings

### `GET /api/me` — Current user profile + plan
**Response**:
```json
{
  "id": "uuid",
  "email": "...",
  "display_name": "Kien Nguyen",
  "avatar_url": "...",
  "plan": "pro",
  "usage": {
    "videos_this_month": 12,
    "videos_quota": 30,
    "render_minutes_this_month": 87,
    "render_minutes_quota": 200
  },
  "preferences": {
    "default_llm": "claude",
    "default_voice": "edge-tts",
    "default_voice_code": "vi-VN-HoaiMyNeural"
  }
}
```

### `PATCH /api/me` — Update profile / preferences

### `GET /api/me/keys` — List BYOK API keys (masked)
**Response**: `[ { "id":"...", "provider":"vbee", "label":"work", "last_used_at":"..." } ]`

### `POST /api/me/keys` — Add a BYOK key
**Body**:
```json
{ "provider": "vbee", "label": "work", "secret": "eyJhbGci...", "extra_meta": { "app_id": "..." } }
```
Server encrypts via pgsodium, stores `encrypted_key` + `key_nonce`. Returns metadata only — never the plaintext.

### `DELETE /api/me/keys/:id` — Remove

---

## 9. Asset library

### `GET /api/assets?kind=music&q=cinematic` — Browse Paxal-curated + user assets
**Response**: `{ "items": [Asset] }`

### `POST /api/assets/upload` — Get signed upload URL
**Body**: `{ "kind": "logo", "filename": "logo.png", "size": 12400 }`
**Response**: `{ "upload_url": "https://...", "asset_id": "uuid", "expires_at": "..." }`
Client uploads directly to Supabase Storage with the signed URL.

---

## 10. TypeScript types (shared package `@paxal/core/types`)

```ts
export type Template = 'app-intro' | 'review' | 'product-ad' | 'report' | 'news' | 'tutorial';
export type Plan = 'free' | 'pro' | 'business';
export type ProjectStatus = 'draft' | 'ready' | 'archived';
export type RenderStatus = 'queued' | 'running' | 'succeeded' | 'failed' | 'cancelled';
export type AspectRatio = '16:9' | '9:16' | '1:1';

export interface Scene {
  id: string;
  project_id: string;
  position: number;
  slug: string;
  text: string;
  visual_prompt: string | null;
  voice_url: string | null;
  voice_duration_s: number | null;
  footage_url: string | null;
  start_frame: number | null;
  duration_frames: number | null;
}

export interface Project {
  id: string;
  user_id: string;
  title: string;
  template: Template;
  status: ProjectStatus;
  topic: string;
  audience: string;
  tone: string;
  duration_target_s: number;
  llm_provider: string;
  llm_model: string;
  voice_provider: string;
  voice_code: string;
  music_vibe: string;
  aspect_ratio: AspectRatio;
  quality: '720p' | '1080p' | '4K';
  scene_count: number;
  total_frames: number;
  total_duration_s: number | null;
  thumbnail_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface RenderManifest {
  render_id: string;
  remotion_composition: Template;
  fps: number;
  width: number;
  height: number;
  total_frames: number;
  scenes: Array<{
    slug: string;
    text: string;
    start_frame: number;
    duration_frames: number;
    voice_url: string;
    footage_url: string;
  }>;
  music_url: string;
  music_volume: number;
  upload_url: string;
  upload_token: string;
}
```

---

## 11. Error reference

| Code | HTTP | Meaning | Recovery |
|---|---|---|---|
| `UNAUTHORIZED` | 401 | No session / expired token | Redirect to sign-in |
| `FORBIDDEN` | 403 | Not your resource | Show error toast |
| `NOT_FOUND` | 404 | Project/scene/render missing | 404 page |
| `VALIDATION_ERROR` | 400 | Body schema invalid | Show field errors |
| `QUOTA_EXCEEDED` | 402 | Plan quota reached | Upgrade modal |
| `RATE_LIMIT` | 429 | Too many requests | Retry-After header |
| `EXTERNAL_API_ERROR` | 502 | Vbee/Pexels/Claude failed | Retry + fallback provider |
| `MANIFEST_INVALID` | 400 | Scene timing inconsistent | Rebuild manifest |
| `RENDER_TIMEOUT` | 504 | Cloud render >10 min | Retry / contact support |
| `INTERNAL` | 500 | Unexpected | Sentry log |

---

## 12. Open questions / future work

- **Realtime collaboration**: Multiple users editing same project (Supabase Realtime channels). Out of MVP.
- **Versioning of script**: Save script history for undo across sessions. Add `script_versions` table later.
- **Export formats**: WebM, GIF, image sequence. Stub now, ship later.
- **Subtitle export**: SRT/VTT from scene text + voice timing. Easy to add (uses existing data).
- **API for external developers**: Public REST API with API keys (separate from BYOK). Phase 2.
- **Mobile app**: React Native consumer of same API. Phase 3.
