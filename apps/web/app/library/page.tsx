import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Header } from "@/components/Header";
import { formatDuration, formatRelative } from "@/lib/utils";

const STATUS_LABEL: Record<string, { text: string; color: string }> = {
  draft: { text: "📝 Draft", color: "text-white/60" },
  ready: { text: "✓ Ready", color: "text-brand" },
  archived: { text: "🗄️ Archived", color: "text-white/30" },
};

export default async function LibraryPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/sign-in?redirect=/library");

  const { data: projects } = await supabase
    .from("project_overview")
    .select("*")
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false })
    .limit(50);

  return (
    <>
      <Header />
      <main className="max-w-6xl mx-auto px-6 py-10">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-black">Thư viện dự án</h1>
          <Link
            href="/dashboard"
            className="px-5 py-2.5 rounded-xl bg-brand text-black font-semibold hover:bg-brand-light"
          >
            + Tạo mới
          </Link>
        </div>

        {!projects || projects.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="space-y-3">
            {projects.map((p) => (
              <ProjectRow key={p.id} project={p} />
            ))}
          </div>
        )}
      </main>
    </>
  );
}

function ProjectRow({ project }: { project: Record<string, unknown> }) {
  const status: { text: string; color: string } =
    STATUS_LABEL[project.status as string] ?? { text: "📝 Draft", color: "text-white/60" };
  const duration = typeof project.total_duration_s === "number" ? project.total_duration_s : 0;
  return (
    <Link
      href={{ pathname: "/editor/[id]", query: { id: String(project.id) } }}
      className="flex items-center gap-4 p-4 rounded-2xl bg-white/[0.03] border border-white/10 hover:bg-white/[0.06] hover:border-brand/30 transition"
    >
      <div className="w-32 aspect-video rounded-lg bg-white/5 flex items-center justify-center text-3xl">
        {templateIcon(String(project.template))}
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-bold truncate">{String(project.title)}</div>
        <div className="text-sm text-white/50 mt-1">
          {String(project.template)} · {Number(project.scene_count ?? 0)} scene · {formatDuration(duration)}
        </div>
        <div className="text-xs text-white/40 mt-1">
          Cập nhật {formatRelative(String(project.updated_at))} ·{" "}
          <span className={status.color}>{status.text}</span>
        </div>
      </div>
      <div className="text-white/40 text-2xl">→</div>
    </Link>
  );
}

function templateIcon(template: string): string {
  return {
    "app-intro": "📱",
    review: "📚",
    "product-ad": "🛒",
    report: "📊",
    news: "📰",
    tutorial: "💡",
  }[template] ?? "🎬";
}

function EmptyState() {
  return (
    <div className="bg-white/[0.03] border border-white/10 rounded-3xl p-16 text-center">
      <div className="text-6xl mb-4">📭</div>
      <div className="text-xl font-bold mb-2">Chưa có dự án nào</div>
      <div className="text-white/60 mb-6">
        Tạo video đầu tiên — chỉ mất 5 phút
      </div>
      <Link
        href="/dashboard"
        className="inline-block px-6 py-3 rounded-xl bg-brand text-black font-semibold hover:bg-brand-light"
      >
        Bắt đầu →
      </Link>
    </div>
  );
}
