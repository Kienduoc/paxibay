import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Header } from "@/components/Header";
import { EditorClient } from "./EditorClient";

export default async function EditorPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ action?: string }>;
}) {
  const { id } = await params;
  const { action } = await searchParams;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/auth/sign-in?redirect=/editor/${id}`);

  const { data: project } = await supabase
    .from("projects")
    .select("*")
    .eq("id", id)
    .single();
  if (!project) notFound();

  const { data: scenes } = await supabase
    .from("scenes")
    .select("*")
    .eq("project_id", id)
    .order("position", { ascending: true });

  return (
    <>
      <Header />
      <main className="max-w-6xl mx-auto px-6 py-8">
        <Link href="/library" className="text-sm text-white/60 hover:text-white mb-4 inline-block">
          ← Thư viện
        </Link>
        <EditorClient
          project={project}
          initialScenes={scenes ?? []}
          autoAction={action}
        />
      </main>
    </>
  );
}
