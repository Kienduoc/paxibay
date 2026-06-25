# Paxibay — Đồng bộ hệ thống (theo thứ tự)

> **TRẠNG THÁI (verified live — cập nhật mới nhất):**
> - ✅ Bước 1 — Migration: 8 bảng + 2 view + seed nhạc OK
> - ✅ Bước 2,3,4 — Google OAuth: HOÀN TẤT (authorize → Google đúng client_id, redirect_to Vercel được chấp nhận)
> - ✅ Bước 5 — 9router LLM: VERIFIED end-to-end (local `http://localhost:20128/v1`, model `cc/claude-opus-4-6`, OpenAI path /chat/completions). Sinh script review 6 scene OK.
> - ✅ Bước 7 — Vercel Deployment Protection: đã TẮT (site trả 200)
> - 🔴 **Bước 6/8 — VERCEL BUILD FAILED**: site hiện trả trang "Deployment has failed". Build lỗi → xem fix bên dưới.

---

## 🔴 FIX VERCEL BUILD FAILED (ưu tiên)

Local build PASS (17 routes) → lỗi là do **cấu hình monorepo trên Vercel**, không phải code.
Nguyên nhân thường gặp nhất: **Root Directory chưa trỏ vào `apps/web`** → Vercel chạy `next build` ở gốc repo (không có Next app) → fail.

**Sửa:**
1. Vercel → project `paxibay-sukx` → Settings → **Build and Deployment**
2. **Root Directory** = `apps/web`  (bấm Edit, chọn thư mục apps/web)
3. Framework Preset = **Next.js** (tự nhận)
4. Install/Build Command = để **mặc định** (Vercel tự chạy `npm install` ở gốc monorepo vì có workspaces, rồi `next build` trong apps/web)
5. Settings → Environment Variables: thêm đủ 9 biến (bảng Bước 6) cho **Production + Preview**
6. Deployments → **Redeploy** (hoặc push commit mới)

Nếu vẫn fail sau khi set Root Directory: mở build log (Vercel → Deployments → bản fail → View Logs), copy đoạn lỗi đỏ gửi tôi.

Làm tuần tự từ trên xuống. Mỗi bước có giá trị copy-paste sẵn.

Giá trị dùng chung:
- Supabase ref: `ezcvrvjzlkqybzuurfda`
- Supabase callback: `https://ezcvrvjzlkqybzuurfda.supabase.co/auth/v1/callback`
- Vercel URL: `https://paxibay-sukx-ppx6r8rou-kien-nguyens-projects-fe1778f2.vercel.app`
- Google Client ID: `354629358309-kcos9r63smknkb2n0bn0eckdfd0oj2v9.apps.googleusercontent.com`

---

## BƯỚC 1 — Chạy migration (tạo 8 bảng) ⏳ BẮT BUỘC

1. Mở https://supabase.com/dashboard/project/ezcvrvjzlkqybzuurfda/sql/new
2. Copy toàn bộ `infrastructure/supabase/APPLY.sql` → paste → **Run**
3. Xác nhận Table Editor có 8 bảng (profiles, subscriptions, api_keys, projects, scenes, renders, assets, usage_events)

✅ Storage buckets (6 cái) — Claude đã tạo sẵn, bỏ qua.

---

## BƯỚC 2 — Bật Google OAuth trong Supabase ⏳ BẮT BUỘC

1. Mở https://supabase.com/dashboard/project/ezcvrvjzlkqybzuurfda/auth/providers
2. Tìm **Google** → bật (Enable)
3. Điền:
   - **Client ID**: `354629358309-kcos9r63smknkb2n0bn0eckdfd0oj2v9.apps.googleusercontent.com`
   - **Client Secret**: `GOCSPX-…` (lấy từ chat / Google Console — KHÔNG ghi vào repo)
4. Save

---

## BƯỚC 3 — Cho phép callback trong Google Console ⏳ BẮT BUỘC

1. Mở https://console.cloud.google.com/apis/credentials
2. Mở OAuth Client ID `354629358309-...`
3. Mục **Authorized redirect URIs** → Add:
   ```
   https://ezcvrvjzlkqybzuurfda.supabase.co/auth/v1/callback
   ```
4. (Authorized JavaScript origins, thêm cho chắc:)
   ```
   https://ezcvrvjzlkqybzuurfda.supabase.co
   ```
5. Save (Google mất ~5 phút để apply)

---

## BƯỚC 4 — Supabase Auth URL config ⏳ BẮT BUỘC

1. Mở https://supabase.com/dashboard/project/ezcvrvjzlkqybzuurfda/auth/url-configuration
2. **Site URL**:
   ```
   https://paxibay-sukx-ppx6r8rou-kien-nguyens-projects-fe1778f2.vercel.app
   ```
3. **Redirect URLs** → Add cả 3:
   ```
   http://localhost:3000/**
   https://paxibay-sukx-ppx6r8rou-kien-nguyens-projects-fe1778f2.vercel.app/**
   https://paxibay.cloud/**
   ```
4. Save

---

## BƯỚC 5 — LLM 9router ✅ DONE (verified)

9router app chạy local (port 20128) + tunnel `r4ph3yx.abc-tunnel.us`.
Endpoint đúng: **OpenAI-compatible** `/v1/chat/completions` (KHÔNG phải Anthropic
`/v1/messages` — Anthropic SDK bị 401 với key này; OpenAI path 200 sạch).

**Đã verify:** sinh script review 6 scene tiếng Việt OK (~17s, model `cc/claude-opus-4-6`).

Cấu hình (provider "openrouter" trong form → gateway):
- LOCAL `.env.local`: `LLM_GATEWAY_BASE_URL=http://localhost:20128/v1` + `OPENROUTER_API_KEY=<key 9router>`
- VERCEL: đổi base URL sang tunnel `https://r4ph3yx.abc-tunnel.us/v1`
  ⚠️ Tunnel chỉ sống khi máy bạn + app 9router đang chạy. Nếu tắt máy → LLM trên
  Vercel sẽ fail. Để production ổn định cần endpoint LLM luôn-on (key thật hoặc
  9router tunnel cố định/always-on).

Code đã thêm `stream:false` (9router mặc định stream → ép trả JSON đơn).

---

## BƯỚC 6 — Set env trên Vercel ⏳ BẮT BUỘC

Mở Vercel → project `paxibay-sukx` → Settings → Environment Variables → thêm (Production + Preview):

| Key | Value |
|---|---|
| `NEXT_PUBLIC_APP_URL` | `https://paxibay-sukx-ppx6r8rou-kien-nguyens-projects-fe1778f2.vercel.app` |
| `NEXT_PUBLIC_SUPABASE_URL` | `https://ezcvrvjzlkqybzuurfda.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | (anon JWT — lấy từ apps/web/.env.local) |
| `SUPABASE_SERVICE_ROLE_KEY` | (service_role JWT — từ .env.local) |
| `PEXELS_API_KEY` | (từ .env.local) |
| `EDGE_TTS_ENABLED` | `1` |
| `BYOK_MASTER_KEY` | (từ .env.local — PHẢI giống local) |
| `LLM_GATEWAY_BASE_URL` | (9router base URL) |
| `OPENROUTER_API_KEY` | (9router key) |

⚠️ `NEXT_PUBLIC_*` được inline lúc **build** → sau khi thêm env phải **Redeploy**.

---

## BƯỚC 7 — Tắt Vercel Deployment Protection (nếu muốn public)

Site đang trả 302 (redirect về Vercel login) = đang bật protection.
1. Vercel → project → Settings → **Deployment Protection**
2. Tắt "Vercel Authentication" cho Production (hoặc set password tuỳ ý)

---

## BƯỚC 8 — Redeploy + test

1. Vercel → Deployments → Redeploy bản mới nhất (để env có hiệu lực)
2. Hoặc: `git commit --allow-empty -m "redeploy" && git push` (nếu Vercel auto-deploy theo GitHub)
3. Test:
   - Mở Vercel URL → landing
   - "Đăng nhập" → Google → phải về `/dashboard`
   - Tạo video Review "Đắc Nhân Tâm" → editor → "Chạy hết"
   - Script (9router) → voice (Edge-TTS) → footage (Pexels) → manifest → tải về

---

## 🔒 Sau khi xong — rotate secrets đã lộ trong chat

- Supabase **service_role key** (nguy hiểm nhất): Settings → API → Reset
- Google OAuth secret: Google Console → reset secret
- Pexels key: pexels.com/api
- (BYOK_MASTER_KEY chỉ ở env, chưa lộ ngoài chat — giữ nguyên, backup 1Password)
