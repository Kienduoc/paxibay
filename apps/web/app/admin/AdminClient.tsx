"use client";

import { useEffect, useState } from "react";

interface AdminUser {
  id: string;
  email: string | null;
  display_name: string | null;
  role: "admin" | "user";
  plan: string;
  credits_total: number;
  credits_used: number;
  is_active: boolean;
  company: string | null;
  created_at: string;
}

export function AdminClient() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [q, setQ] = useState("");

  async function load() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/users");
      if (!res.ok) throw new Error((await res.json()).message);
      const d = await res.json();
      setUsers(d.users);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Lỗi tải");
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => { void load(); }, []);

  async function patch(id: string, changes: Partial<AdminUser>) {
    setBusy(id);
    setErr(null);
    try {
      const res = await fetch(`/api/admin/users/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(changes),
      });
      if (!res.ok) throw new Error((await res.json()).message);
      const updated = await res.json();
      setUsers((us) => us.map((u) => (u.id === id ? { ...u, ...updated } : u)));
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Lỗi cập nhật");
    } finally {
      setBusy(null);
    }
  }

  function grant(u: AdminUser, amount: number) {
    patch(u.id, { credits_total: u.credits_total + amount });
  }

  const filtered = users.filter(
    (u) =>
      !q ||
      (u.email ?? "").toLowerCase().includes(q.toLowerCase()) ||
      (u.display_name ?? "").toLowerCase().includes(q.toLowerCase()),
  );

  if (loading) return <div className="text-white/50">Đang tải danh sách...</div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="🔍 Tìm theo email / tên..."
          className="px-4 py-2 rounded-xl bg-black/30 border border-white/10 focus:outline-none focus:border-brand w-72"
        />
        <div className="text-sm text-white/50">{filtered.length} người dùng</div>
      </div>

      {err && <div className="text-sm text-red-300 p-2 rounded bg-red-500/10 border border-red-500/30">{err}</div>}

      <div className="space-y-2">
        {filtered.map((u) => {
          const remaining = Math.max(0, u.credits_total - u.credits_used);
          return (
            <div key={u.id} className="bg-white/[0.03] border border-white/10 rounded-2xl p-4">
              <div className="flex items-start gap-4 flex-wrap">
                {/* identity */}
                <div className="min-w-[220px] flex-1">
                  <div className="font-bold flex items-center gap-2">
                    {u.display_name || u.email}
                    {u.role === "admin" && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold">ADMIN</span>
                    )}
                    {!u.is_active && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-500/20 text-red-300 font-bold">KHOÁ</span>
                    )}
                  </div>
                  <div className="text-xs text-white/50">{u.email}</div>
                  {u.company && <div className="text-xs text-white/40">{u.company}</div>}
                  <div className="text-xs text-white/40 mt-1">
                    Credit: <span className="text-brand">{remaining.toLocaleString("vi-VN")}</span> còn /
                    {u.credits_total.toLocaleString("vi-VN")} (dùng {u.credits_used.toLocaleString("vi-VN")})
                  </div>
                </div>

                {/* controls */}
                <div className="flex items-center gap-2 flex-wrap">
                  {/* plan */}
                  <select
                    value={u.plan}
                    disabled={busy === u.id}
                    onChange={(e) => patch(u.id, { plan: e.target.value })}
                    className="px-2 py-1.5 rounded-lg bg-black/40 border border-white/10 text-xs"
                    title="Gói"
                  >
                    <option value="free">Free</option>
                    <option value="pro">Pro</option>
                    <option value="business">Business</option>
                  </select>

                  {/* role */}
                  <select
                    value={u.role}
                    disabled={busy === u.id}
                    onChange={(e) => patch(u.id, { role: e.target.value as "admin" | "user" })}
                    className="px-2 py-1.5 rounded-lg bg-black/40 border border-white/10 text-xs"
                    title="Quyền"
                  >
                    <option value="user">User</option>
                    <option value="admin">Admin</option>
                  </select>

                  {/* grant credits */}
                  <div className="flex items-center gap-1">
                    <button onClick={() => grant(u, 100)} disabled={busy === u.id}
                      className="text-xs px-2 py-1.5 rounded-lg bg-brand/15 text-brand hover:bg-brand/25">+100</button>
                    <button onClick={() => grant(u, 1000)} disabled={busy === u.id}
                      className="text-xs px-2 py-1.5 rounded-lg bg-brand/15 text-brand hover:bg-brand/25">+1k</button>
                    <button onClick={() => grant(u, 10000)} disabled={busy === u.id}
                      className="text-xs px-2 py-1.5 rounded-lg bg-brand/15 text-brand hover:bg-brand/25">+10k</button>
                  </div>

                  {/* active toggle */}
                  <button
                    onClick={() => patch(u.id, { is_active: !u.is_active })}
                    disabled={busy === u.id}
                    className={`text-xs px-3 py-1.5 rounded-lg ${u.is_active ? "bg-red-500/15 text-red-300 hover:bg-red-500/25" : "bg-brand/15 text-brand hover:bg-brand/25"}`}
                  >
                    {u.is_active ? "Khoá" : "Mở khoá"}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
