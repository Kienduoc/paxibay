# Supabase Setup — Paxibay

Step-by-step để bring up backend từ scratch.

## 0. Prerequisites

```bash
npm install -g supabase                          # CLI
supabase --version                                # ≥ 1.200
```

## 1. Create cloud project

1. Go to https://supabase.com/dashboard → New project
2. Name: `paxibay-prod` (or `-staging`)
3. Region: **Singapore** (gần VN nhất)
4. Database password: **lưu vào 1Password ngay**
5. Save the Project Ref (`xxxxxxxxxxxxxxxx`) — bạn cần cho `.env`

## 2. Link CLI to cloud project

```bash
cd infrastructure/supabase
supabase login                                    # browser auth
supabase link --project-ref xxxxxxxxxxxxxxxx
```

## 3. Run migrations

```bash
supabase db push                                  # pushes ./migrations/*.sql in order
```

Verify in dashboard → Table Editor that 8 tables exist:
profiles, subscriptions, api_keys, projects, scenes, renders, assets, usage_events.

## 4. Create Storage buckets

In dashboard → Storage → New bucket:

| Bucket | Public | Purpose |
|---|---|---|
| `voice` | ❌ private | Generated voice MP3s |
| `footage` | ❌ private | Downloaded Pexels videos |
| `music` | ✅ public | Curated music tracks (or use external URLs) |
| `renders` | ❌ private | Final MP4 outputs |
| `assets` | ❌ private | User-uploaded logos, custom files |
| `thumbnails` | ✅ public | Project preview thumbnails |

For private buckets, write RLS policies:
```sql
create policy "Users read own files"
  on storage.objects for select
  using (auth.uid()::text = (storage.foldername(name))[1]);

create policy "Users upload to own folder"
  on storage.objects for insert
  with check (auth.uid()::text = (storage.foldername(name))[1]);
```

(Paths follow `<user_id>/<project_id>/<filename>`.)

## 5. Configure Auth providers

Dashboard → Authentication → Providers:

### Google OAuth
1. Go to https://console.cloud.google.com → APIs & Services → Credentials
2. Create OAuth 2.0 Client (Web)
3. Authorized redirect URI: `https://<your-supabase-ref>.supabase.co/auth/v1/callback`
4. Copy Client ID + Secret → Supabase Auth → Google → enable + paste

### Magic link (email)
- Enabled by default — uses Supabase's email service (rate-limited).
- For production, configure SMTP via Resend or AWS SES.

### Site URL & redirect URLs (Dashboard → Auth → URL Configuration)
- Site URL: `https://paxibay.cloud` (or `paxibay.vercel.app` for staging)
- Redirect URLs:
  - `http://localhost:3000/**`
  - `https://paxibay.vercel.app/**`
  - `https://paxibay.cloud/**`

## 6. Get env vars

Dashboard → Project Settings → API:
- `URL` → `NEXT_PUBLIC_SUPABASE_URL`
- `anon public` → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `service_role` → `SUPABASE_SERVICE_ROLE_KEY` (server-only!)

Paste into `apps/web/.env.local`.

## 7. Local Postgres (optional, for dev)

Not strictly needed since we link to cloud, but useful for offline work:

```bash
cd infrastructure/supabase
supabase start                                    # boots local Postgres + auth + storage
supabase db reset                                 # re-applies migrations
supabase stop
```

Local URLs: http://localhost:54321 (API), :54323 (Studio).

## 8. Seed dev data (optional)

```bash
supabase db reset                                 # runs migrations + seed
```

The seed file `00002_seed_library.sql` inserts curated music tracks.

## 9. Smoke test from web app

After `cp .env.example .env.local` and filling Supabase vars:

```bash
npm run dev
# Visit http://localhost:3000/auth/sign-in
# Click "Tiếp tục với Google" → should land on /dashboard
```

If you get `Failed to fetch`: check `NEXT_PUBLIC_SUPABASE_URL` matches your project.
If you get OAuth error: re-check Google redirect URI matches Supabase callback URL.

## 10. Backup strategy (production)

Supabase Pro automatically backs up daily. For extra safety:

```bash
# Cron job — dump weekly to S3
pg_dump "postgresql://postgres:[pwd]@db.[ref].supabase.co:5432/postgres" \
  | gzip > paxibay-backup-$(date +%Y%m%d).sql.gz
aws s3 cp paxibay-backup-*.sql.gz s3://paxibay-backups/
```
