import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Header } from "@/components/Header";
import { AdminClient } from "./AdminClient";

export default async function AdminPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/sign-in?redirect=/admin");

  // Server-side admin gate
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (profile?.role !== "admin") redirect("/dashboard");

  return (
    <>
      <Header />
      <main className="max-w-6xl mx-auto px-6 py-10">
        <h1 className="text-3xl font-black mb-2">⚡ Quản trị người dùng</h1>
        <p className="text-white/50 mb-8 text-sm">Cấp quyền, đổi gói, cấp credit, khoá/mở tài khoản.</p>
        <AdminClient />
      </main>
    </>
  );
}
