-- ============================================================================
-- Paxal — Supabase Postgres schema
-- ============================================================================
-- Run order: enums → tables → indexes → triggers → RLS policies
-- All tables use auth.users(id) from Supabase Auth as the user foreign key.
-- ============================================================================

-- ============================================================================
-- 0. EXTENSIONS
-- ============================================================================
create extension if not exists "pgcrypto";       -- gen_random_uuid()
create extension if not exists "pgsodium";       -- key encryption (Supabase)
create extension if not exists "pg_trgm";        -- trigram search


-- ============================================================================
-- 1. ENUMS
-- ============================================================================
create type plan_tier as enum ('free', 'pro', 'business');

create type template_kind as enum (
  'app-intro',
  'review',
  'product-ad',
  'report',
  'news',
  'tutorial'
);

create type project_status as enum (
  'draft',          -- script chưa generate xong / user đang edit
  'ready',          -- script + assets sẵn sàng, có thể render
  'archived'        -- user xóa mềm
);

create type render_status as enum (
  'queued',
  'running',
  'succeeded',
  'failed',
  'cancelled'
);

create type render_location as enum ('local', 'cloud');

create type aspect_ratio as enum ('16:9', '9:16', '1:1');

create type voice_provider as enum ('edge-tts', 'vbee', 'piper');

create type llm_provider as enum (
  'claude',
  'openai',
  'openrouter',
  'gemini',
  'local-ollama'
);

create type asset_kind as enum (
  'logo',
  'custom-footage',
  'custom-music',
  'thumbnail',
  'render-output'
);


-- ============================================================================
-- 2. CORE TABLES
-- ============================================================================

-- ----------------------------------------------------------------------------
-- profiles — 1:1 with auth.users
-- ----------------------------------------------------------------------------
create table public.profiles (
  id                uuid primary key references auth.users(id) on delete cascade,
  display_name      text,
  avatar_url        text,
  plan              plan_tier not null default 'free',

  -- Quota (resets monthly via cron)
  videos_this_month integer not null default 0,
  render_minutes    integer not null default 0,
  quota_reset_at    timestamptz not null default date_trunc('month', now() + interval '1 month'),

  -- Preferences
  default_llm       llm_provider default 'claude',
  default_voice     voice_provider default 'edge-tts',
  default_voice_code text default 'vi-VN-HoaiMyNeural',

  -- Timestamps
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create index idx_profiles_plan on public.profiles(plan);

-- ----------------------------------------------------------------------------
-- subscriptions — Stripe billing state (1:1 with profile)
-- ----------------------------------------------------------------------------
create table public.subscriptions (
  id                       uuid primary key default gen_random_uuid(),
  user_id                  uuid not null unique references public.profiles(id) on delete cascade,

  stripe_customer_id       text unique,
  stripe_subscription_id   text unique,
  stripe_price_id          text,

  plan                     plan_tier not null default 'free',
  status                   text,             -- active, trialing, past_due, canceled, incomplete
  current_period_start     timestamptz,
  current_period_end       timestamptz,
  cancel_at_period_end     boolean default false,

  created_at               timestamptz not null default now(),
  updated_at               timestamptz not null default now()
);

create index idx_subscriptions_status on public.subscriptions(status);

-- ----------------------------------------------------------------------------
-- api_keys — User BYOK (Vbee, OpenRouter, OpenAI...). Encrypted at rest.
-- ----------------------------------------------------------------------------
create table public.api_keys (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references public.profiles(id) on delete cascade,
  provider     text not null,                -- 'vbee', 'openrouter', 'openai', 'anthropic'
  label        text,                          -- "Vbee work", "OpenRouter test"

  -- Encrypted secret. Server decrypts only when calling external API.
  -- Use pgsodium or Vault — never store plaintext.
  encrypted_key bytea not null,
  key_nonce     bytea not null,

  -- For Vbee specifically — App-Id is not secret but pairs with token
  extra_meta   jsonb default '{}',            -- e.g. {"app_id": "f9d1d68d-..."}

  last_used_at timestamptz,
  created_at   timestamptz not null default now(),

  unique (user_id, provider, label)
);

create index idx_api_keys_user on public.api_keys(user_id);

-- ----------------------------------------------------------------------------
-- projects — A video project (one per video)
-- ----------------------------------------------------------------------------
create table public.projects (
  id                 uuid primary key default gen_random_uuid(),
  user_id            uuid not null references public.profiles(id) on delete cascade,
  title              text not null default 'Untitled',
  template           template_kind not null,
  status             project_status not null default 'draft',

  -- User input that started the project
  topic              text,                    -- raw prompt from user
  audience           text,                    -- 'smb', 'creator', 'educator', 'other'
  tone               text,                    -- 'professional', 'energetic', 'drama', 'humor'
  duration_target_s  integer not null default 90,

  -- Generation config snapshot
  llm_provider       llm_provider not null default 'claude',
  llm_model          text,                    -- exact model id, e.g. 'claude-sonnet-4-6'
  voice_provider     voice_provider not null default 'edge-tts',
  voice_code         text not null default 'vi-VN-HoaiMyNeural',
  voice_speed        numeric(3,2) not null default 1.00 check (voice_speed between 0.5 and 2.0),
  music_vibe         text,                    -- 'cinematic', 'energetic', 'calm', 'drama', 'none'
  music_track_id     uuid,                    -- references public.assets(id) — picked music
  music_volume       numeric(3,2) not null default 0.22,

  -- Output config
  aspect_ratio       aspect_ratio not null default '16:9',
  quality            text not null default '1080p',  -- '720p' | '1080p' | '4K'

  -- Cached counters
  scene_count        integer not null default 0,
  total_frames       integer not null default 0,
  total_duration_s   numeric(7,2),

  -- UI
  thumbnail_url      text,
  last_rendered_at   timestamptz,

  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

create index idx_projects_user_updated on public.projects(user_id, updated_at desc);
create index idx_projects_user_status on public.projects(user_id, status);
create index idx_projects_template on public.projects(template);

-- Full-text search on title + topic
alter table public.projects add column search_vector tsvector
  generated always as (
    to_tsvector('simple', coalesce(title,'') || ' ' || coalesce(topic,''))
  ) stored;
create index idx_projects_search on public.projects using gin(search_vector);

-- ----------------------------------------------------------------------------
-- scenes — Ordered list per project
-- ----------------------------------------------------------------------------
create table public.scenes (
  id                uuid primary key default gen_random_uuid(),
  project_id        uuid not null references public.projects(id) on delete cascade,
  position          integer not null,         -- 0-indexed order within project

  -- Content
  slug              text not null,            -- "bg-01-hook" (filename-safe)
  text              text not null,            -- voice script
  visual_prompt     text,                     -- search query used for Pexels

  -- Generated assets
  voice_url         text,                     -- Storage URL of MP3
  voice_duration_s  numeric(6,2),             -- measured via ffprobe
  voice_generated_at timestamptz,

  footage_url       text,                     -- Pexels MP4 link or storage URL
  footage_source    text,                     -- 'pexels', 'user-upload', 'paxal-library'
  footage_meta      jsonb default '{}',       -- { pexels_id, width, height, duration }

  -- Computed timeline (set by manifest builder)
  start_frame       integer,
  duration_frames   integer,

  -- Per-scene overrides (optional)
  text_overlay_style jsonb default '{}',      -- font, color, position overrides

  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),

  unique (project_id, position)
);

create index idx_scenes_project on public.scenes(project_id, position);

-- ----------------------------------------------------------------------------
-- renders — Render history per project
-- ----------------------------------------------------------------------------
create table public.renders (
  id                  uuid primary key default gen_random_uuid(),
  project_id          uuid not null references public.projects(id) on delete cascade,
  user_id             uuid not null references public.profiles(id) on delete cascade,

  -- Snapshot of project at render time (for reproducibility / billing)
  manifest_snapshot   jsonb not null,         -- full SCENES array + timeline
  template            template_kind not null,
  aspect_ratio        aspect_ratio not null,
  quality             text not null,

  -- Execution
  location            render_location not null default 'local',
  status              render_status not null default 'queued',
  progress_frames     integer default 0,      -- updated by render engine via WS
  total_frames        integer not null,

  -- Render engine info (for local renders)
  engine_version      text,                   -- "paxal-engine-1.0.3"
  engine_machine_id   text,                   -- hash of user's machine

  -- Output
  output_url          text,                   -- final MP4 URL (after upload)
  output_size_bytes   bigint,
  duration_ms         integer,                -- wall-clock render time

  -- Errors
  error_code          text,
  error_message       text,

  started_at          timestamptz,
  finished_at         timestamptz,
  created_at          timestamptz not null default now()
);

create index idx_renders_project_created on public.renders(project_id, created_at desc);
create index idx_renders_user_status on public.renders(user_id, status);

-- ----------------------------------------------------------------------------
-- assets — User-uploaded files + Paxal library items
-- ----------------------------------------------------------------------------
create table public.assets (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid references public.profiles(id) on delete cascade,
                                              -- NULL means Paxal-curated library item
  kind         asset_kind not null,
  title        text,
  url          text not null,                -- Supabase Storage URL
  mime_type    text,
  size_bytes   bigint,
  duration_s   numeric(6,2),                 -- for audio/video
  width        integer,
  height       integer,
  metadata     jsonb default '{}',

  -- For Paxal library items: license info
  license      text,                          -- 'CC0', 'CC-BY-4.0', etc.
  attribution  text,                          -- "Mindfront via archive.org"

  -- Search / discovery
  tags         text[] default array[]::text[],

  created_at   timestamptz not null default now()
);

create index idx_assets_user_kind on public.assets(user_id, kind);
create index idx_assets_library on public.assets(kind) where user_id is null;
create index idx_assets_tags on public.assets using gin(tags);

-- ----------------------------------------------------------------------------
-- usage_events — Analytics / billing audit
-- ----------------------------------------------------------------------------
create table public.usage_events (
  id           bigserial primary key,
  user_id      uuid not null references public.profiles(id) on delete cascade,
  event        text not null,                 -- 'project_created', 'voice_generated', 'render_completed', ...
  project_id   uuid references public.projects(id) on delete set null,
  render_id    uuid references public.renders(id) on delete set null,
  payload      jsonb default '{}',            -- e.g. {"llm_tokens": 1280, "voice_chars": 540, "cost_usd": 0.012}
  created_at   timestamptz not null default now()
);

create index idx_usage_user_time on public.usage_events(user_id, created_at desc);
create index idx_usage_event on public.usage_events(event, created_at desc);


-- ============================================================================
-- 3. TRIGGERS
-- ============================================================================

-- Auto-create profile when user signs up
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, display_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.email),
    new.raw_user_meta_data->>'avatar_url'
  );
  insert into public.subscriptions (user_id, plan) values (new.id, 'free');
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Auto-update updated_at
create or replace function public.touch_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger profiles_touch        before update on public.profiles      for each row execute function public.touch_updated_at();
create trigger subscriptions_touch   before update on public.subscriptions for each row execute function public.touch_updated_at();
create trigger projects_touch        before update on public.projects      for each row execute function public.touch_updated_at();
create trigger scenes_touch          before update on public.scenes        for each row execute function public.touch_updated_at();

-- Keep project.scene_count + total_duration_s in sync
create or replace function public.refresh_project_counters()
returns trigger as $$
declare
  pid uuid;
begin
  pid := coalesce(new.project_id, old.project_id);
  update public.projects p
  set scene_count = (select count(*) from public.scenes where project_id = pid),
      total_duration_s = (select coalesce(sum(voice_duration_s), 0) from public.scenes where project_id = pid),
      total_frames = (select coalesce(sum(duration_frames), 0) from public.scenes where project_id = pid)
  where p.id = pid;
  return null;
end;
$$ language plpgsql;

create trigger scenes_refresh_counters
  after insert or update or delete on public.scenes
  for each row execute function public.refresh_project_counters();


-- ============================================================================
-- 4. ROW LEVEL SECURITY (RLS)
-- ============================================================================
alter table public.profiles       enable row level security;
alter table public.subscriptions  enable row level security;
alter table public.api_keys       enable row level security;
alter table public.projects       enable row level security;
alter table public.scenes         enable row level security;
alter table public.renders        enable row level security;
alter table public.assets         enable row level security;
alter table public.usage_events   enable row level security;

-- profiles: user reads/updates own
create policy profiles_own on public.profiles
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- subscriptions: read own, no client write (webhook updates via service role)
create policy subscriptions_read_own on public.subscriptions
  for select using (auth.uid() = user_id);

-- api_keys: full CRUD on own only
create policy api_keys_own on public.api_keys
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- projects: full CRUD on own only
create policy projects_own on public.projects
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- scenes: linked via project ownership
create policy scenes_via_project on public.scenes
  using (
    exists (select 1 from public.projects p where p.id = project_id and p.user_id = auth.uid())
  )
  with check (
    exists (select 1 from public.projects p where p.id = project_id and p.user_id = auth.uid())
  );

-- renders: read own; create via service role (server-side only)
create policy renders_read_own on public.renders
  for select using (auth.uid() = user_id);

-- assets: read own + read public library (user_id is null)
create policy assets_read on public.assets
  for select using (user_id = auth.uid() or user_id is null);
create policy assets_write_own on public.assets
  for insert with check (auth.uid() = user_id);
create policy assets_delete_own on public.assets
  for delete using (auth.uid() = user_id);

-- usage_events: read own only; insert via service role
create policy usage_read_own on public.usage_events
  for select using (auth.uid() = user_id);


-- ============================================================================
-- 5. HELPER VIEWS
-- ============================================================================

-- Quick view: project list page (joined with latest render status)
create or replace view public.project_overview as
select
  p.id,
  p.user_id,
  p.title,
  p.template,
  p.status,
  p.aspect_ratio,
  p.quality,
  p.scene_count,
  p.total_duration_s,
  p.thumbnail_url,
  p.updated_at,
  p.last_rendered_at,
  (select r.status from public.renders r
    where r.project_id = p.id order by r.created_at desc limit 1) as latest_render_status,
  (select r.output_url from public.renders r
    where r.project_id = p.id and r.status = 'succeeded'
    order by r.created_at desc limit 1) as latest_render_url
from public.projects p
where p.status <> 'archived';

-- Usage summary per user (for billing dashboard)
create or replace view public.user_monthly_usage as
select
  user_id,
  date_trunc('month', created_at) as month,
  count(*) filter (where event = 'project_created')       as projects_created,
  count(*) filter (where event = 'render_completed')      as renders_completed,
  sum((payload->>'voice_chars')::int)                     as voice_chars_total,
  sum((payload->>'llm_input_tokens')::int)                as llm_input_tokens,
  sum((payload->>'llm_output_tokens')::int)               as llm_output_tokens,
  sum((payload->>'cost_usd')::numeric)                    as estimated_cost_usd
from public.usage_events
group by user_id, date_trunc('month', created_at);


-- ============================================================================
-- 6. SCHEDULED JOBS (via pg_cron — Supabase)
-- ============================================================================

-- Monthly quota reset (1st of month at 00:00 UTC)
-- select cron.schedule(
--   'reset-monthly-quotas',
--   '0 0 1 * *',
--   $$ update public.profiles
--      set videos_this_month = 0,
--          render_minutes = 0,
--          quota_reset_at = date_trunc('month', now() + interval '1 month');
--   $$
-- );


-- ============================================================================
-- END
-- ============================================================================
