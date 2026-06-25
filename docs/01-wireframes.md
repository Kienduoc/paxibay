# Paxal Wireframes — 5 màn hình chính

Mỗi màn hình: URL, mục đích, layout ASCII, components, user actions, data.

---

## Screen 1 — Landing (`/`)

**Mục đích**: Thu hút visitor không đăng nhập, convert thành signup.

```
┌──────────────────────────────────────────────────────────────────────────┐
│  [Paxal logo]                              Tính năng  Giá  Blog  [Đăng nhập]│
├──────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│              Video chuyên nghiệp trong 5 phút                            │
│              ── chỉ cần gõ ý tưởng                                       │
│                                                                          │
│              [Bắt đầu miễn phí]  [Xem demo 60s]                          │
│                                                                          │
│              ┌──────────────────────────────────────┐                    │
│              │  ▶ Demo video tự động phát           │                    │
│              │     (loop 30s, không tiếng)          │                    │
│              └──────────────────────────────────────┘                    │
│                                                                          │
├──────────────────────────────────────────────────────────────────────────┤
│  6 TEMPLATE CHO MỌI MỤC ĐÍCH                                             │
│  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐      │
│  │📱 App  │ │📚 Review│ │🛒 QC   │ │📊 Báo  │ │📰 Tin  │ │💡 Học │      │
│  │ Intro  │ │  Sách   │ │ Sản phẩm│ │  cáo   │ │  tức   │ │ tutorial│   │
│  └────────┘ └────────┘ └────────┘ └────────┘ └────────┘ └────────┘      │
├──────────────────────────────────────────────────────────────────────────┤
│  PIPELINE TỰ ĐỘNG                                                        │
│  [Gõ prompt] → [AI viết script] → [Tìm footage] → [Voice + nhạc] → [MP4] │
├──────────────────────────────────────────────────────────────────────────┤
│  PRICING                                                                 │
│  ┌───────────┐  ┌───────────┐  ┌───────────┐                             │
│  │   Free    │  │    Pro    │  │ Business  │                             │
│  │   0đ      │  │  199k/mo  │  │  599k/mo  │                             │
│  │ 3 video/mo│  │30 video/mo│  │ Unlimited │                             │
│  │ 720p+wmrk │  │1080p clean│  │ 4K + team │                             │
│  │ [Bắt đầu] │  │[Đăng ký]  │  │[Liên hệ]  │                             │
│  └───────────┘  └───────────┘  └───────────┘                             │
├──────────────────────────────────────────────────────────────────────────┤
│  Made in Vietnam · paxal@email.com · Privacy · Terms                     │
└──────────────────────────────────────────────────────────────────────────┘
```

**Components**:
- `<Hero>` — headline + 2 CTA + autoplay demo video
- `<TemplateGrid>` — 6 cards với icon + name + "Xem demo"
- `<PipelineDiagram>` — animated flow (Framer Motion)
- `<PricingTable>` — 3 tier cards
- `<Footer>`

**Actions**:
- Click "Bắt đầu miễn phí" → `/auth/sign-in?redirect=/dashboard`
- Click 1 template → `/auth/sign-in?redirect=/create/[template]`
- Click "Xem demo" → modal mở demo MP4 (60s)

**Data**: Static / CMS từ markdown.

---

## Screen 2 — Dashboard (`/dashboard`)

**Mục đích**: Trang đầu sau khi đăng nhập. CTA tạo video mới + danh sách dự án gần đây + usage gauge.

```
┌──────────────────────────────────────────────────────────────────────────┐
│ [Paxal]  Dashboard  Library  Templates              [Avatar Kien▾]      │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│   Xin chào, Kien 👋                                                      │
│                                                                          │
│   ┌────────────────────────────────────────────────────────────────┐    │
│   │  ┌──────────────────────────────────────────────────────────┐  │    │
│   │  │  💬 Bạn muốn tạo video gì hôm nay?                       │  │    │
│   │  │                                                           │  │    │
│   │  │  [____ Gõ ý tưởng ở đây _____________________] [Tạo →]  │  │    │
│   │  │                                                           │  │    │
│   │  │  Ví dụ: "Review sách Đắc Nhân Tâm", "Giới thiệu app XYZ" │  │    │
│   │  └──────────────────────────────────────────────────────────┘  │    │
│   │                                                                 │    │
│   │  HOẶC CHỌN TEMPLATE                                             │    │
│   │  ┌──────┐┌──────┐┌──────┐┌──────┐┌──────┐┌──────┐              │    │
│   │  │📱App ││📚Rev ││🛒QC  ││📊Báo ││📰Tin ││💡Học│              │    │
│   │  └──────┘└──────┘└──────┘└──────┘└──────┘└──────┘              │    │
│   └────────────────────────────────────────────────────────────────┘    │
│                                                                          │
│   USAGE THÁNG NÀY                            [Nâng cấp Pro]              │
│   ▰▰▱▱▱▱▱▱▱▱  2 / 3 video tháng này                                      │
│   ▰▰▰▰▰▰▰▱▱▱  127 / 200 phút render                                      │
│                                                                          │
│   DỰ ÁN GẦN ĐÂY                                          [Xem tất cả]    │
│   ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐                   │
│   │ [thumb]  │ │ [thumb]  │ │ [thumb]  │ │ [thumb]  │                   │
│   │ Review   │ │ Intro app│ │ Báo cáo  │ │ Tutorial │                   │
│   │ Bố Già   │ │ MyApp    │ │ T6/2026  │ │ React Q&A│                   │
│   │ 8 phút   │ │ 65s      │ │ 90s      │ │ 2 phút   │                   │
│   │ ✓ Done   │ │ ⏳ Render│ │ ✓ Done   │ │ 📝 Draft │                   │
│   └──────────┘ └──────────┘ └──────────┘ └──────────┘                   │
└──────────────────────────────────────────────────────────────────────────┘
```

**Components**:
- `<PromptBox>` — large input với placeholder suggestions cycling, "Tạo →" button
- `<TemplateGrid>` — same as landing nhưng compact
- `<UsageMeter>` — 2 progress bars (videos, render minutes)
- `<RecentProjects>` — grid 4 latest, thumbnail + status badge
- `<UpgradeCTA>` — nếu free user dùng >80% quota

**Actions**:
- Type prompt + Enter → `/create/auto?prompt=...` (AI tự pick template)
- Click template → `/create/[template]?prompt=`
- Click project card → `/editor/[projectId]`
- Click "Xem tất cả" → `/library`
- Click "Nâng cấp Pro" → `/billing/upgrade`

**Data**:
- `GET /api/user/usage` → `{videos_this_month, render_minutes, quota}`
- `GET /api/projects?limit=4&sort=updated_desc`

---

## Screen 3 — Template / Create form (`/create/[template]`)

**Mục đích**: Thu thập input để LLM sinh script. User có thể chỉnh trước khi build.

```
┌──────────────────────────────────────────────────────────────────────────┐
│ [Paxal] [← Dashboard]                                          [Avatar]  │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│   📱 Tạo video: GIỚI THIỆU APP / WEBSITE                                 │
│                                                                          │
│   ┌─────────────────────────────────────────────────────────────────┐    │
│   │  CHỦ ĐỀ *                                                       │    │
│   │  ┌─────────────────────────────────────────────────────────┐    │    │
│   │  │ StockChat VN — chart cổ phiếu real-time + chat cộng đồng│    │    │
│   │  └─────────────────────────────────────────────────────────┘    │    │
│   │                                                                  │    │
│   │  TARGET AUDIENCE                                                 │    │
│   │  (•) SMB / Doanh nghiệp  ( ) Creator  ( ) Educator  ( ) Khác    │    │
│   │                                                                  │    │
│   │  TONE                                                            │    │
│   │  ( ) Chuyên nghiệp  (•) Năng động  ( ) Drama  ( ) Hài hước     │    │
│   │                                                                  │    │
│   │  THỜI LƯỢNG                                                      │    │
│   │  ( ) 30s  ( ) 60s  (•) 90s  ( ) 2 phút  ( ) 5 phút              │    │
│   │                                                                  │    │
│   │  ────────── ⚙ NÂNG CAO ─────────                                 │    │
│   │                                                                  │    │
│   │  AI MODEL                                                        │    │
│   │  [▾ Claude Sonnet 4.6 (mặc định)]                                │    │
│   │     • Claude Sonnet 4.6 — chất lượng cao (199k/mo)               │    │
│   │     • GPT-5 — fallback ngon                                      │    │
│   │     • OpenRouter — chọn model bất kỳ                             │    │
│   │     • Local LLM — qua Ollama (free, cần config)                  │    │
│   │                                                                  │    │
│   │  VOICE                                                           │    │
│   │  [▾ Edge-TTS · HoaiMy (nữ HN, miễn phí)]                         │    │
│   │     • Edge-TTS · HoaiMy / NamMinh (free)                         │    │
│   │     • Vbee · Minh Quân / Ngọc Huyền (BYOK)                       │    │
│   │     • Piper · Vi local (cần cài render engine)                   │    │
│   │  ☐ Dùng API key Vbee của tôi  [Quản lý keys]                     │    │
│   │                                                                  │    │
│   │  MUSIC VIBE                                                      │    │
│   │  ( ) Năng động  (•) Cinematic  ( ) Calm  ( ) Drama  ( ) None    │    │
│   │                                                                  │    │
│   │  ────────────────────────────────────────                        │    │
│   │                                                                  │    │
│   │                                       [Hủy]  [Tạo script →]      │    │
│   └─────────────────────────────────────────────────────────────────┘    │
└──────────────────────────────────────────────────────────────────────────┘
```

**Components**:
- `<TemplateHeader>` — icon + name + description
- `<TopicTextarea>` — main input, 1-3 dòng
- `<AudienceRadio>`, `<ToneRadio>`, `<DurationRadio>` — quick picks
- `<AdvancedAccordion>` — fold mặc định, mở ra cho LLM/Voice/Music
- `<KeyManagerLink>` → modal nhập Vbee/OpenRouter keys (encrypted server-side)

**Actions**:
- "Tạo script →" → POST `/api/generate/script` → redirect `/editor/[newProjectId]`
- "Quản lý keys" → modal `/settings/integrations`

**Data sent**:
```json
{
  "template": "app-intro",
  "topic": "StockChat VN...",
  "audience": "smb",
  "tone": "energetic",
  "duration_seconds": 90,
  "llm_provider": "claude-sonnet-4-6",
  "voice_provider": "edge-tts",
  "voice_code": "vi-VN-HoaiMyNeural",
  "music_vibe": "cinematic"
}
```

---

## Screen 4 — Editor (`/editor/[projectId]`)

**Mục đích**: Trang chính nơi user chỉnh sửa script + preview real-time + đổi footage.

```
┌──────────────────────────────────────────────────────────────────────────┐
│ [Paxal][←] Project: "StockChat Intro"          [Lưu] [Tải xuống MP4]    │
├────────────────────────────┬─────────────────────────────────────────────┤
│ SCRIPT EDITOR              │  PREVIEW PLAYER                             │
│                            │                                             │
│ Scene 1 / 13               │  ┌───────────────────────────────────────┐ │
│ ┌────────────────────────┐ │  │                                       │ │
│ │ "Tin nóng đến tay bạn  │ │  │     [Remotion Player canvas]          │ │
│ │  chậm hơn người khác   │ │  │                                       │ │
│ │  bao lâu? 5 phút? 30   │ │  │                                       │ │
│ │  phút? 1 tiếng? Đủ để  │ │  │                                       │ │
│ │  bạn lỡ kèo."          │ │  │                                       │ │
│ └────────────────────────┘ │  │                                       │ │
│ Voice: 6.6s · Edge HoaiMy │  │                                       │ │
│ Footage: [thumb] [Đổi▾]   │  └───────────────────────────────────────┘ │
│                            │   ⏵ ━━━━━●━━━━━━━━━━━━━━━━━━  0:08 / 1:05  │
│ [+ Thêm scene]            │   Speed [1x▾]  Quality [720p▾]              │
│                            │                                             │
│ ────────────────────────   │  ────────────────────────────────────────  │
│ Scene 2 / 13               │  TIMELINE                                   │
│ ┌────────────────────────┐ │  ┌───────────────────────────────────────┐ │
│ │ "Đây là StockChat..."  │ │  │█──█──███──████─████─████─████─███─███│ │
│ └────────────────────────┘ │  │ 1  2   3    4    5   6    7   8   9 │ │
│ Voice: 3.2s               │  └───────────────────────────────────────┘ │
│ Footage: [thumb] [Đổi▾]   │                                             │
│                            │  GLOBAL SETTINGS                            │
│ ────────────────────────   │  Music:  [Mindfront-Dark Triad ▾] Vol 22%  │
│ Scene 3 / 13               │  Quality: ( ) 720p  (•) 1080p  ( ) 4K     │
│ ┌────────────────────────┐ │  Format: (•) 16:9  ( ) 9:16  ( ) 1:1     │
│ │ "Ba trụ cột chính..."  │ │                                             │
│ └────────────────────────┘ │  ─────────────────────                      │
│ ...                        │                                             │
│                            │  [Render lại preview]  [Render local MP4]   │
└────────────────────────────┴─────────────────────────────────────────────┘
```

**Layout**: Split view 40 / 60 (script left, player right). Bottom timeline strip across player.

**Components**:
- `<ScriptEditor>` — scrollable list of `<SceneCard>`, each editable
- `<SceneCard>` — textarea + voice duration display + footage thumbnail with swap dropdown
- `<RemotionPlayer>` — embedded preview (Remotion `<Player>` component)
- `<Timeline>` — visual blocks per scene, draggable boundaries
- `<GlobalSettings>` — music picker, quality, aspect ratio
- `<RenderButtons>` — local render trigger + cloud preview re-render

**Actions**:
- Edit text in scene → debounced auto-save → re-fetch voice MP3 (silent if same text)
- Click "Đổi" footage → modal Pexels search with current scene's query pre-filled
- "Render local MP4" → trigger deep link `paxal://render?project=xxx&token=yyy`
- "Lưu" → manual save (auto save anyway)
- Drag timeline scene boundary → adjust scene duration (advance/extend gap)

**Data**:
- `GET /api/projects/[id]` → full project with scenes
- `PATCH /api/scenes/[id]` — debounced (1s) when text changes
- `POST /api/generate/voice` — when scene text changes (returns new MP3 URL)
- `POST /api/pexels/swap` — search & swap footage

---

## Screen 5 — Library (`/library`)

**Mục đích**: Xem tất cả dự án, filter, search, manage, share.

```
┌──────────────────────────────────────────────────────────────────────────┐
│ [Paxal]  Dashboard  Library  Templates              [Avatar]            │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│   Thư viện dự án                                       [+ Tạo mới]       │
│                                                                          │
│   🔍 [____ Tìm dự án ___]   Lọc: [Template ▾] [Status ▾] [Sort: Mới ▾]  │
│                                                                          │
│   ┌─────────────────────────────────────────────────────────────────┐    │
│   │ ┌────────────┐ Review: Bố Già — 7 bài học ẩn sâu                │    │
│   │ │   [thumb]  │ Template: Review · Length 8:02 · 1080p             │    │
│   │ │            │ Updated 2 giờ trước · ✓ Rendered                  │    │
│   │ │     ▶      │ [Mở] [Render lại] [Tải xuống] [Sao chép] [Xóa]  │    │
│   │ └────────────┘                                                    │    │
│   ├─────────────────────────────────────────────────────────────────┤    │
│   │ ┌────────────┐ StockChat VN intro                                │    │
│   │ │   [thumb]  │ Template: App Intro · Length 65s · 1080p          │    │
│   │ │     ▶      │ Updated hôm qua · ✓ Rendered (3 versions)         │    │
│   │ └────────────┘ [Mở] [Render lại] [Tải xuống] [Sao chép] [Xóa]  │    │
│   ├─────────────────────────────────────────────────────────────────┤    │
│   │ ┌────────────┐ Báo cáo tháng 6 — Phúc Gia                       │    │
│   │ │   [thumb]  │ Template: Báo cáo · Length 90s · 720p             │    │
│   │ │     ▶      │ Updated tuần trước · 📝 Draft (chưa render)       │    │
│   │ └────────────┘ [Mở] [Xóa]                                        │    │
│   ├─────────────────────────────────────────────────────────────────┤    │
│   │   ... 12 projects total                                          │    │
│   │   [1] 2 3                                                        │    │
│   └─────────────────────────────────────────────────────────────────┘    │
└──────────────────────────────────────────────────────────────────────────┘
```

**Components**:
- `<SearchBar>` — debounced search text
- `<FilterDropdowns>` — template, status, sort
- `<ProjectRow>` — thumbnail + meta + action buttons
- `<Pagination>` — 10 per page

**Actions**:
- Click "Mở" → `/editor/[id]`
- "Render lại" → trigger new render with current state
- "Tải xuống" → download latest render MP4
- "Sao chép" → clone project as new draft
- "Xóa" → confirm modal → soft delete

**Data**:
- `GET /api/projects?q=&template=&status=&sort=&page=`
- Pagination: cursor-based

---

## Mobile (responsive notes)

| Screen | Mobile behavior |
|---|---|
| Landing | Stack vertical, CTAs full-width |
| Dashboard | Single column, prompt box ở top, templates 2x3 grid |
| Create form | Single column form |
| Editor | **Desktop only ban đầu** — mobile redirect to "Mở trên desktop để chỉnh sửa" + có nút "Tải xuống" |
| Library | Single column list |

Editor không hỗ trợ mobile MVP — quá phức tạp với split view + Remotion Player + timeline. Có thể làm "view only" mobile (preview MP4 + buttons) sau MVP.

---

## Design system

| Aspect | Value |
|---|---|
| Primary color | `#10b981` (emerald — match brand demo videos) |
| Accent | `#f59e0b` (amber for highlights) |
| Background | `#0f172a` (slate-900 — dark mode mặc định) |
| Font sans | Inter (web) / Be Vietnam Pro (Vietnamese đẹp hơn) |
| Font mono | JetBrains Mono (code blocks, URL display) |
| Border radius | 12px (cards), 8px (buttons) |
| Shadow | `0 10px 40px rgba(0,0,0,0.3)` cho modal |
| Spacing scale | Tailwind defaults (4px increments) |

Components dùng **shadcn/ui** (Radix + Tailwind), customize qua CSS variables.
