import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { TEMPLATES, type TemplateId } from "@paxibay/core";
import { createClient } from "@/lib/supabase/server";
import { Header } from "@/components/Header";
import { CreateForm } from "./CreateForm";

export default async function CreateTemplatePage({
  params,
  searchParams,
}: {
  params: Promise<{ template: string }>;
  searchParams: Promise<{ prompt?: string }>;
}) {
  const { template } = await params;
  const { prompt } = await searchParams;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/auth/sign-in?redirect=/create/${template}`);

  const templateMeta = TEMPLATES.find((t) => t.id === template);
  if (!templateMeta) notFound();

  return (
    <>
      <Header />
      <main className="max-w-3xl mx-auto px-6 py-12">
        <Link href="/dashboard" className="text-sm text-white/60 hover:text-white mb-6 inline-block">
          ← Dashboard
        </Link>

        <div className="flex items-start gap-4 mb-8">
          <div className="text-6xl">{templateMeta.icon}</div>
          <div>
            <div className="text-xs uppercase tracking-wider text-brand mb-1">
              Tạo video — Template
            </div>
            <h1 className="text-4xl font-black mb-2">{templateMeta.label}</h1>
            <p className="text-white/60 text-sm">{templateMeta.description}</p>
          </div>
        </div>

        <CreateForm
          template={template as TemplateId}
          recommendedDuration={templateMeta.recommendedDuration}
          initialTopic={prompt ?? ""}
        />
      </main>
    </>
  );
}
