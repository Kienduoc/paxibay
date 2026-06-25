# Paxibay — Product Spec

AI-driven Vietnamese video generation SaaS.

## Documents

| File | Mô tả |
|---|---|
| [01-wireframes.md](01-wireframes.md) | 5 màn hình chính: Landing, Dashboard, Create, Editor, Library |
| [02-database.sql](02-database.sql) | Postgres schema (Supabase) — 8 bảng |
| [03-api.md](03-api.md) | REST API + WebSocket protocol + render engine handshake |

## Stack

- **Frontend**: Next.js 15 (App Router) + React 19 + Tailwind + shadcn/ui
- **Backend**: Supabase (Postgres + Auth + Storage + Edge Functions)
- **Render**: Remotion (Web Player preview) + Electron app (local MP4 render)
- **Hosting**: Vercel (web) + Supabase Cloud (data)
- **Auth**: Google OAuth + Magic link
- **Payment**: Stripe (subscriptions)
- **AI**: Multi-provider — Claude, GPT, OpenRouter, Local LLM
- **TTS**: Edge-TTS (free default), Vbee (BYOK), Piper (local)
- **Stock**: Pexels Videos API
- **Music**: Internet Archive CC0/CC-BY pool

## MVP scope (6 weeks)

6 templates: App Intro · Review · Quảng cáo · Báo cáo · Tin tức · Explainer
