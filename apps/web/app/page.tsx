import Link from "next/link";
import { TEMPLATES } from "@paxibay/core";

export default function LandingPage() {
  return (
    <main className="min-h-screen">
      <Nav />
      <Hero />
      <TemplateGrid />
      <Pipeline />
      <Pricing />
      <Footer />
    </main>
  );
}

function Nav() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md bg-black/30 border-b border-white/10">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link href="/" className="text-2xl font-black tracking-tight">
          <span className="text-brand">Paxi</span>bay
        </Link>
        <div className="hidden md:flex items-center gap-8 text-sm text-white/70">
          <a href="#templates" className="hover:text-white transition">Tính năng</a>
          <a href="#pricing" className="hover:text-white transition">Giá</a>
          <Link href="/auth/sign-in" className="px-4 py-2 rounded-lg bg-brand text-black font-semibold hover:bg-brand-light transition">
            Đăng nhập
          </Link>
        </div>
      </div>
    </nav>
  );
}

function Hero() {
  return (
    <section className="pt-40 pb-24 px-6">
      <div className="max-w-5xl mx-auto text-center animate-fade-in">
        <div className="inline-block px-4 py-2 rounded-full bg-brand/15 border border-brand/30 text-brand text-sm font-semibold mb-8">
          🇻🇳 Made for Vietnamese creators
        </div>
        <h1 className="text-6xl md:text-7xl font-black tracking-tight leading-[1.05] mb-6 text-balance">
          Video chuyên nghiệp <br />
          trong <span className="text-brand">5 phút</span>.
        </h1>
        <p className="text-xl md:text-2xl text-white/70 mb-12 max-w-2xl mx-auto text-balance">
          Gõ ý tưởng → AI sinh script, tìm footage, đọc voice tiếng Việt → Render MP4 1080p.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Link
            href="/auth/sign-in?redirect=/dashboard"
            className="px-8 py-4 rounded-xl bg-brand text-black font-bold text-lg hover:bg-brand-light transition shadow-2xl shadow-brand/30"
          >
            🚀 Bắt đầu miễn phí
          </Link>
          <a
            href="#demo"
            className="px-8 py-4 rounded-xl bg-white/10 text-white font-semibold text-lg hover:bg-white/15 transition border border-white/10"
          >
            ▶ Xem demo 60s
          </a>
        </div>
      </div>
    </section>
  );
}

function TemplateGrid() {
  return (
    <section id="templates" className="py-24 px-6 border-t border-white/5">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-4xl font-black text-center mb-4">6 template cho mọi mục đích</h2>
        <p className="text-center text-white/60 mb-16">Chọn template hoặc gõ prompt tự do</p>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {TEMPLATES.map((t) => (
            <div
              key={t.id}
              className="aspect-square rounded-2xl bg-white/[0.03] border border-white/10 p-6 flex flex-col items-center justify-center text-center hover:bg-white/[0.06] hover:border-brand/30 transition cursor-pointer group"
            >
              <div className="text-5xl mb-3 group-hover:scale-110 transition">{t.icon}</div>
              <div className="font-bold text-sm mb-1">{t.label}</div>
              <div className="text-xs text-white/50 leading-tight">{t.tagline}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Pipeline() {
  const steps = [
    { icon: "💬", title: "Gõ ý tưởng", desc: 'vd: "Review sách Đắc Nhân Tâm"' },
    { icon: "🤖", title: "AI viết script", desc: "Claude / GPT / OpenRouter" },
    { icon: "🎬", title: "Tìm footage", desc: "Pexels HD tự động" },
    { icon: "🎙️", title: "Voice + nhạc", desc: "Edge-TTS / Vbee / Local" },
    { icon: "📹", title: "Render MP4", desc: "1080p · 16:9 / 9:16 / 1:1" },
  ];
  return (
    <section className="py-24 px-6 border-t border-white/5 bg-white/[0.02]">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-4xl font-black text-center mb-4">Pipeline tự động</h2>
        <p className="text-center text-white/60 mb-16">5 bước, không cần kỹ năng dựng video</p>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {steps.map((s, i) => (
            <div key={i} className="text-center">
              <div className="aspect-square rounded-2xl bg-white/[0.03] border border-white/10 flex items-center justify-center text-6xl mb-4">
                {s.icon}
              </div>
              <div className="font-bold mb-1">
                <span className="text-brand">{i + 1}.</span> {s.title}
              </div>
              <div className="text-sm text-white/50">{s.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Pricing() {
  const tiers = [
    {
      name: "Free",
      price: "0đ",
      period: "Mãi mãi",
      features: ["3 video/tháng", "Render 720p", "Có watermark", "Voice Edge-TTS", "3 template cơ bản"],
      cta: "Bắt đầu miễn phí",
      highlight: false,
    },
    {
      name: "Pro",
      price: "199.000đ",
      period: "/tháng",
      features: ["30 video/tháng", "Render 1080p", "Không watermark", "Voice Vbee BYOK", "6 template đầy đủ", "LLM Claude Sonnet"],
      cta: "Đăng ký Pro",
      highlight: true,
    },
    {
      name: "Business",
      price: "599.000đ",
      period: "/tháng",
      features: ["Unlimited video", "Render 4K", "Custom branding", "Team 5 ghế", "Priority support", "LLM Claude Opus"],
      cta: "Liên hệ",
      highlight: false,
    },
  ];
  return (
    <section id="pricing" className="py-24 px-6 border-t border-white/5">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-4xl font-black text-center mb-4">Pricing đơn giản</h2>
        <p className="text-center text-white/60 mb-16">Không phí ẩn. Huỷ bất kỳ lúc nào.</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {tiers.map((t) => (
            <div
              key={t.name}
              className={`rounded-3xl p-8 ${
                t.highlight
                  ? "bg-brand/10 border-2 border-brand shadow-2xl shadow-brand/20 scale-105"
                  : "bg-white/[0.03] border border-white/10"
              }`}
            >
              {t.highlight && (
                <div className="text-xs font-bold text-brand mb-3 tracking-wider">PHỔ BIẾN NHẤT</div>
              )}
              <div className="text-2xl font-black mb-2">{t.name}</div>
              <div className="mb-6">
                <span className="text-4xl font-black">{t.price}</span>
                <span className="text-white/50 ml-1">{t.period}</span>
              </div>
              <ul className="space-y-3 mb-8 text-sm">
                {t.features.map((f) => (
                  <li key={f} className="flex items-center gap-2">
                    <span className="text-brand">✓</span>
                    <span className="text-white/80">{f}</span>
                  </li>
                ))}
              </ul>
              <button
                className={`w-full py-3 rounded-xl font-bold transition ${
                  t.highlight
                    ? "bg-brand text-black hover:bg-brand-light"
                    : "bg-white/10 text-white hover:bg-white/15"
                }`}
              >
                {t.cta}
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="py-12 px-6 border-t border-white/5 text-center text-white/40 text-sm">
      <div className="font-bold text-white mb-2">
        <span className="text-brand">Paxi</span>bay
      </div>
      <div>Made in Vietnam · paxibay.cloud · contact@paxibay.cloud</div>
      <div className="mt-4 text-xs">© 2026 Paxibay · Privacy · Terms</div>
    </footer>
  );
}
