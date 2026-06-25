# Paxibay — Việc cần Mr Kien làm khi về

Thứ tự ưu tiên. Đánh dấu xong khi làm.

---

## 1️⃣ Setup Supabase (15 phút)

- [ ] Tạo Supabase project tại https://supabase.com/dashboard
  - Tên: `paxibay-prod` (hoặc `-staging`)
  - Region: **Singapore**
  - Password: lưu vào 1Password
- [ ] Copy 3 giá trị từ Project Settings → API:
  - `URL` → `NEXT_PUBLIC_SUPABASE_URL`
  - `anon public` → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `service_role` → `SUPABASE_SERVICE_ROLE_KEY` (giữ kín)

- [ ] Cài Supabase CLI: `npm install -g supabase`
- [ ] Link project:
  ```bash
  cd paxibay/infrastructure/supabase
  supabase login
  supabase link --project-ref <YOUR_REF>
  supabase db push
  ```
- [ ] Vào dashboard → Storage → tạo 6 buckets:
  | Bucket | Public |
  |---|---|
  | voice | ❌ private |
  | footage | ❌ private |
  | music | ✅ public |
  | renders | ❌ private |
  | assets | ❌ private |
  | thumbnails | ✅ public |

- [ ] Auth → Providers → Google: bật + paste Client ID/Secret từ Google Cloud Console (xem [infrastructure/supabase/SETUP.md](infrastructure/supabase/SETUP.md))
- [ ] Auth → URL Configuration:
  - Site URL: `http://localhost:3000` (hoặc paxibay.vercel.app)
  - Redirect: `http://localhost:3000/**`, `https://*.vercel.app/**`, `https://paxibay.cloud/**`

---

## 2️⃣ Get API keys (10 phút)

- [ ] **Anthropic** (LLM): https://console.anthropic.com → API Keys → tạo key → `ANTHROPIC_API_KEY`
- [ ] **Pexels** (footage): https://www.pexels.com/api → Generate API Key → `PEXELS_API_KEY`
- [ ] Edge-TTS: không cần key (free, qua Microsoft Edge WebSocket)
- [ ] Vbee BYOK (optional, sau khi launch): user tự nhập trong UI

---

## 3️⃣ Tạo BYOK master key

- [ ] Generate AES master key cho mã hoá BYOK secrets:
  ```bash
  openssl rand -base64 32
  ```
- [ ] Lưu vào env: `BYOK_MASTER_KEY=<base64-output>`
- [ ] **Lưu vào 1Password — nếu mất, mất hết BYOK của user.**

---

## 4️⃣ Tạo `.env.local`

```bash
cd paxibay/apps/web
cp .env.example .env.local
```

Điền vào `.env.local`:

```
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_SUPABASE_URL=<từ step 1>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<từ step 1>
SUPABASE_SERVICE_ROLE_KEY=<từ step 1>
ANTHROPIC_API_KEY=<từ step 2>
PEXELS_API_KEY=<từ step 2>
BYOK_MASTER_KEY=<từ step 3>
EDGE_TTS_ENABLED=1
```

Stripe + OpenRouter / OpenAI để trống cũng được — chỉ cần khi mở subscription.

---

## 5️⃣ Run local

```bash
cd paxibay
npm install        # (đã chạy rồi nhưng cứ chạy lại cho chắc)
npm run dev        # → http://localhost:3000
```

Test:
1. Mở http://localhost:3000 → landing page
2. Click "Bắt đầu miễn phí" → Google sign-in
3. Đăng nhập → /dashboard
4. Click template "Review" → form
5. Nhập "Đắc Nhân Tâm" + submit
6. Trang editor mở → "Generate script" auto chạy
7. Click "Chạy hết" → đợi 1-2 phút (script → voice → footage → manifest → render)
8. Tải manifest.json về

---

## 6️⃣ Smoke test render từ manifest

Manifest JSON tải về sẽ có URLs đến voice + footage trong Supabase Storage. Để render thật:

```bash
cd paxibay
# Copy manifest vừa tải vào packages/templates/
# Mở packages/templates/src/Root.tsx → tạm thay sampleReviewManifest = (paste manifest content)
npm run studio    # http://localhost:3001 → preview (web app dùng 3000)
npm run render review out/test.mp4   # render to MP4
```

(Phase 2 sẽ build Electron Render Engine để tự động hoá bước này.)

---

## 7️⃣ Deploy lên Vercel (sau khi local hoạt động)

- [ ] Push repo lên GitHub (xem `git remote add origin ...` ở phần dưới)
- [ ] Vercel → New Project → Import từ GitHub
- [ ] Root Directory: `apps/web` (vì là monorepo)
- [ ] Framework Preset: Next.js
- [ ] Build command: `cd ../.. && npm run build --workspace=@paxibay/web`
- [ ] Install command: `cd ../.. && npm install`
- [ ] Environment Variables: paste hết từ `.env.local`
- [ ] Deploy
- [ ] Update Supabase Auth → URL Configuration thêm domain Vercel

---

## 8️⃣ Mua domain paxibay.cloud (optional, $20-50/năm)

- [ ] Mua ở Namecheap / GoDaddy / Cloudflare Registrar
- [ ] Vercel → Project → Settings → Domains → Add `paxibay.cloud`
- [ ] DNS cấu hình theo hướng dẫn Vercel (A / CNAME records)
- [ ] Update Supabase Auth Site URL → `https://paxibay.cloud`

---

## 9️⃣ Validate trademark (an toàn pháp lý)

- [ ] Check trademark VN: https://ipvietnam.gov.vn → search "Paxibay"
- [ ] Check USPTO (Mỹ): https://tmsearch.uspto.gov
- [ ] Check EUIPO (EU): https://www.tmdn.org
- [ ] Nếu trùng — đổi tên trước khi launch marketing

---

## 🔟 Next features (sau khi MVP demo OK)

Theo roadmap docs/README.md:
- Week 5: Editor + Remotion Player embedded
- Week 6: Electron Render Engine
- Add 4 templates còn lại: product-ad, report, news, tutorial (composition Remotion)
- Stripe subscription wiring
- Subtitle export (.srt)
- 9:16 (TikTok/Reels) variant
- Custom branding (Business tier)
- Internationalization (English)

---

## 🚨 Security checklist trước khi public

- [ ] Rotate 2 token đã expose trong chat: Vbee + Pexels
- [ ] `BYOK_MASTER_KEY` chỉ ở server env, không bao giờ commit
- [ ] Stripe webhook signature verify
- [ ] Rate limit từng endpoint (chưa có — dùng Vercel KV hoặc Upstash)
- [ ] Sentry cho error tracking (`npm install @sentry/nextjs`)
- [ ] Privacy policy + Terms (luật VN yêu cầu)
- [ ] Cookie consent banner (GDPR-style)
