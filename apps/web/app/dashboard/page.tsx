import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { TEMPLATES } from "@paxibay/core";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/sign-in");

  const displayName = user.user_metadata?.full_name ?? user.email?.split("@")[0] ?? "bạn";

  return (
    <main className="min-h-screen px-6 py-12">
      <div className="max-w-6xl mx-auto">
        <header className="flex items-center justify-between mb-12">
          <Link href="/" className="text-2xl font-black">
            <span className="text-brand">Paxi</span>bay
          </Link>
          <form action="/auth/sign-out" method="post">
            <button className="text-sm text-white/60 hover:text-white">Đăng xuất</button>
          </form>
        </header>

        <h1 className="text-4xl font-black mb-2">
          Xin chào, <span className="text-brand">{displayName}</span> 👋
        </h1>
        <p className="text-white/60 mb-10">Bạn muốn tạo video gì hôm nay?</p>

        <div className="bg-white/[0.03] border border-white/10 rounded-3xl p-8 mb-12">
          <form action="/create/auto" method="get">
            <textarea
              name="prompt"
              placeholder='vd: "Review sách Đắc Nhân Tâm trong 5 phút, focus vào 3 nguyên tắc thay đổi cuộc sống"'
              rows={3}
              className="w-full px-5 py-4 rounded-xl bg-black/30 border border-white/10 text-white placeholder:text-white/30 focus:outline-none focus:border-brand resize-none text-lg"
            />
            <div className="flex justify-end mt-4">
              <button className="px-6 py-3 rounded-xl bg-brand text-black font-bold hover:bg-brand-light transition">
                Tạo video →
              </button>
            </div>
          </form>

          <div className="mt-8 pt-8 border-t border-white/10">
            <div className="text-xs uppercase tracking-wider text-white/40 mb-4">
              Hoặc chọn template
            </div>
            <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
              {TEMPLATES.map((t) => (
                <Link
                  key={t.id}
                  href={{ pathname: "/create/[template]", query: { template: t.id } }}
                  className="aspect-square rounded-xl bg-white/[0.03] border border-white/10 flex flex-col items-center justify-center p-3 hover:bg-white/[0.08] hover:border-brand/40 transition text-center"
                >
                  <div className="text-3xl mb-2">{t.icon}</div>
                  <div className="text-xs font-semibold leading-tight">{t.label}</div>
                </Link>
              ))}
            </div>
          </div>
        </div>

        <div className="text-white/40 text-sm">
          Dự án của bạn sẽ hiển thị ở đây sau khi tạo. Xem tất cả tại{" "}
          <Link href="/library" className="text-brand underline">Thư viện</Link>.
        </div>
      </div>
    </main>
  );
}
