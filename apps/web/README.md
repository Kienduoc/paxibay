# @paxibay/web

Next.js 15 web app for Paxibay.

## Dev

```bash
cp .env.example .env.local      # fill values
npm install                      # from monorepo root
npm run dev                      # → http://localhost:3000
```

## Routes (MVP)

- `/` — Landing
- `/auth/sign-in` — Google OAuth + Magic link
- `/auth/callback` — OAuth/Magic link callback
- `/auth/sign-out` — POST → clears session
- `/dashboard` — Authenticated home
- `/create/[template]` — Template form (todo)
- `/editor/[projectId]` — Split editor (todo)
- `/library` — Project list (todo)
- `/api/health` — Health check
