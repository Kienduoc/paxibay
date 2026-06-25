# Paxibay

> **AI-driven Vietnamese video generation SaaS** — gõ ý tưởng → AI sinh script → render MP4 chuyên nghiệp trong 5 phút.

**Domain**: paxibay.cloud
**Status**: MVP v0.1 — foundation complete, ready for Supabase + Vercel deploy.

## Quick start

```bash
npm install
cp apps/web/.env.example apps/web/.env.local    # fill env vars
npm run dev                                      # http://localhost:3000
```

Chi tiết setup tại [TODO.md](TODO.md).

## Workspace structure

```
paxibay/
├── apps/
│   ├── web/                            Next.js 15 — main app
│   │   ├── app/
│   │   │   ├── page.tsx                Landing
│   │   │   ├── auth/                   Sign-in, callback, sign-out
│   │   │   ├── dashboard/              Authenticated home
│   │   │   ├── create/[template]/      Template form
│   │   │   ├── create/auto/            Auto template picker
│   │   │   ├── library/                Project list
│   │   │   ├── editor/[id]/            Editor + pipeline runner
│   │   │   └── api/
│   │   │       ├── projects/           CRUD
│   │   │       ├── scenes/[id]/        PATCH, DELETE
│   │   │       ├── generate/script/    LLM → scenes
│   │   │       ├── generate/voice/     Edge-TTS / Vbee → MP3
│   │   │       ├── pexels/search/      Find footage
│   │   │       ├── pexels/assign/      Download + Storage
│   │   │       ├── manifest/build/     Compute timeline
│   │   │       ├── renders/            Trigger render
│   │   │       ├── renders/[id]/       Status + manifest download
│   │   │       └── me/                 User profile + usage
│   │   ├── lib/
│   │   │   ├── supabase/               client, server, storage helpers
│   │   │   ├── providers/              llm, tts, pexels, music
│   │   │   ├── api/                    auth, errors, byok, manifest
│   │   │   └── crypto.ts               AES-256-GCM for BYOK at rest
│   │   ├── components/                 Shared UI
│   │   └── middleware.ts               Route protection
│   │
│   └── render-engine/                  Electron (Phase 2 — not built yet)
│
├── packages/
│   ├── core/                           @paxibay/core
│   │   └── src/
│   │       ├── types.ts                10 domain types
│   │       ├── schemas.ts              15 zod validators
│   │       ├── templates.ts            6 TEMPLATES metadata
│   │       └── constants.ts            PLAN_QUOTAS, voices, models, music vibes
│   │
│   ├── templates/                      @paxibay/templates
│   │   └── src/
│   │       ├── Root.tsx                Remotion Studio entry
│   │       ├── registry.ts             Template ID → Component
│   │       ├── shared/                 SceneFader, etc.
│   │       └── templates/
│   │           ├── review/             ✅ Bố Già pattern (Ken Burns + lesson badges)
│   │           └── app-intro/          ✅ StockChat pattern (brand-tinted, energetic)
│   │
│   └── prompts/                        @paxibay/prompts — LLM prompt templates
│       └── src/{review,app-intro,product-ad,report,news,tutorial}.ts
│
├── infrastructure/supabase/
│   ├── config.toml                     Supabase CLI config
│   ├── migrations/
│   │   ├── 00001_init.sql              8 tables + RLS + triggers + views
│   │   └── 00002_seed_library.sql      Curated CC0/CC-BY music
│   └── SETUP.md                        Step-by-step Supabase walkthrough
│
├── docs/                               Product spec
│   ├── 01-wireframes.md                5 screens
│   ├── 02-database.sql                 Schema (same as migration)
│   └── 03-api.md                       Full API contract
│
├── remotion.config.ts                  Monorepo-aware Remotion config
├── tsconfig.base.json                  Strict TypeScript
├── tsconfig.json                       Root tsconfig (for Remotion entry)
├── package.json                        npm workspaces
├── README.md                           ← you are here
└── TODO.md                             Setup steps for first-time launch
```

## Pipeline (end-to-end)

```
User                                 Web app                          External
────────────────────────             ────────────────                  ─────────
1. Sign in (Google)         ──────►  /auth/callback     ◄────────►   Supabase Auth
2. Pick template            ──────►  /create/<id>
3. Submit form              ──POST►  /api/projects                  ◄──── Postgres
                                     /api/generate/script  ──HTTP──►  Claude/OpenRouter
                                     /api/generate/voice   ──WS────►  Edge-TTS / Vbee
                                     /api/pexels/search    ──HTTP──►  Pexels API
                                     /api/pexels/assign    ──HTTP──►  Pexels CDN
                                                                       ▼
                                                              Supabase Storage
                                     /api/manifest/build
4. Click "Render local"     ──POST►  /api/renders          (creates render row + manifest)
5. Download manifest.json   ◄──GET── /api/renders/:id/manifest
6. (Phase 2) Electron       ◄───────  paxibay://render?token=<jwt>
   Render Engine consumes
   manifest → renders MP4
   → uploads back to Storage
```

## Scripts (workspace root)

| Script | Purpose |
|---|---|
| `npm run dev` | Next.js dev server |
| `npm run build` | Build all workspaces |
| `npm run typecheck` | tsc --noEmit across all packages |
| `npm run lint` | Next + workspace lints |
| `npm run studio` | Remotion Studio (preview templates) → http://localhost:3001 |
| `npm run render` | Remotion CLI render (manual) |

## Architecture decisions

1. **npm workspaces** thay vì pnpm — simpler, npm 11 đã đủ tốt cho 4 packages
2. **Composition takes RenderManifest as props** — không hardcode scenes, 1 composition phục vụ mọi project
3. **Remotion runs from monorepo root** — fixes "cannot read outside project" do hoisted node_modules
4. **All external calls server-side** (Next.js API routes) — token không expose client, rate-limit dễ
5. **Supabase Storage cho assets** — voice + footage + renders, signed URLs cho private
6. **BYOK encrypted bằng AES-256-GCM** server-side, master key trong env
7. **Manifest snapshot trong renders table** — reproducibility 100%, debug được render lỗi
8. **Hybrid render** — Web build manifest, user download Render Engine Electron app render local (MVP: manifest JSON download cho manual CLI)

## Pricing tiers (configured in `@paxibay/core/constants`)

| | Free | Pro (199k/mo) | Business (599k/mo) |
|---|---|---|---|
| Videos/month | 3 | 30 | Unlimited |
| Max duration | 60s | 5 phút | 15 phút |
| Quality | 720p | 1080p | 4K |
| Watermark | ✓ | – | – |
| Vbee BYOK | – | ✓ | ✓ |
| Custom branding | – | – | ✓ |
| Team seats | 1 | 1 | 5 |

## Tech stack

- **Frontend**: Next.js 15 (App Router) + React 19 + TypeScript 5.9 strict
- **Styling**: Tailwind CSS 3.4 + shadcn-style components (custom)
- **Backend**: Supabase (Postgres + Auth + Storage + RLS)
- **AI**: Claude Sonnet 4.6 (default) / OpenRouter (BYOK) / OpenAI / Gemini (planned)
- **TTS**: Edge-TTS (free) / Vbee (BYOK) / Piper (local-only)
- **Video render**: Remotion 4 (server bundle + local Electron — Phase 2)
- **Stock footage**: Pexels Videos API
- **Music**: Internet Archive CC0/CC-BY pool
- **Hosting**: Vercel (web) + Supabase Cloud (data)
- **Billing**: Stripe (planned — webhook handler stubbed)

## Status

- ✅ Auth flow (Google OAuth + Magic link)
- ✅ 6 templates metadata (`@paxibay/core/templates`)
- ✅ 2 Remotion compositions: `review`, `app-intro`
- ✅ 6 LLM prompts (one per template)
- ✅ 11 API endpoints (projects, scenes, generate, pexels, renders, me)
- ✅ Multi-provider LLM client (Claude + OpenRouter, others stub)
- ✅ Multi-provider TTS (Edge-TTS + Vbee, Piper stub)
- ✅ Pexels search + download + Storage upload
- ✅ AES-256-GCM BYOK encryption
- ✅ Landing page + Dashboard + Create form + Library + Editor (basic)
- ✅ TypeScript strict mode, 4 workspaces typecheck clean
- ✅ Production build verified (23 routes, no warnings)

### Pending

- ⏭️ Electron Render Engine (currently: download manifest JSON for manual CLI render)
- ⏭️ 4 templates còn lại có composition (product-ad, report, news, tutorial)
- ⏭️ Editor with embedded Remotion Player + scene editing
- ⏭️ Stripe subscription flow
- ⏭️ Settings page (BYOK management, profile)

## Setup checklist

See [TODO.md](TODO.md) for the step-by-step list of what you need to do (Supabase, env vars, deploy).

## License

Proprietary © 2026 — Mr Kien / Phúc Gia. All rights reserved.

Built with Remotion (commercial license required for >3 employees: https://remotion.dev).
