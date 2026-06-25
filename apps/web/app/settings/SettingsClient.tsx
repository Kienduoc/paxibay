"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface Me {
  id: string;
  email: string;
  display_name: string | null;
  role: "admin" | "user";
  plan: string;
  is_active: boolean;
  phone: string | null;
  company: string | null;
  credits: { total: number; used: number; remaining: number };
  payment: { status: string; current_period_end: string | null };
}

const PLAN_LABEL: Record<string, string> = {
  free: "Free", pro: "Pro", business: "Business",
};

export function SettingsClient() {
  const [me, setMe] = useState<Me | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // editable fields
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [company, setCompany] = useState("");

  useEffect(() => {
    fetch("/api/me")
      .then((r) => (r.ok ? r.json() : Promise.reject(r)))
      .then((d: Me) => {
        setMe(d);
        setName(d.display_name ?? "");
        setPhone(d.phone ?? "");
        setCompany(d.company ?? "");
      })
      .catch(() => setErr("Không tải được thông tin. Thử đăng nhập lại."));
  }, []);

  async function save() {
    setSaving(true);
    setSaved(false);
    setErr(null);
    try {
      const res = await fetch("/api/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ display_name: name, phone, company }),
      });
      if (!res.ok) throw new Error((await res.json()).message);
      setSaved(true);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Lưu thất bại");
    } finally {
      setSaving(false);
    }
  }

  if (err && !me) return <div className="text-red-300">{err}</div>;
  if (!me) return <div className="text-white/50">Đang tải...</div>;

  const pct = me.credits.total > 0 ? Math.round((me.credits.used / me.credits.total) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Account header */}
      <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-6 flex items-center justify-between flex-wrap gap-4">
        <div>
          <div className="text-xl font-bold">{me.display_name || me.email}</div>
          <div className="text-sm text-white/50">{me.email}</div>
        </div>
        <div className="flex items-center gap-2">
          {me.role === "admin" && (
            <span className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-bold">
              ⚡ ADMIN
            </span>
          )}
          <span className={`px-3 py-1 rounded-full text-xs font-bold ${me.is_active ? "bg-brand/20 text-brand" : "bg-red-500/20 text-red-300"}`}>
            {me.is_active ? "Hoạt động" : "Tạm khoá"}
          </span>
        </div>
      </div>

      {/* Plan + payment + credits */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-6">
          <div className="text-xs uppercase tracking-wider text-white/40 mb-2">Gói sản phẩm</div>
          <div className="text-2xl font-black text-brand mb-1">{PLAN_LABEL[me.plan] ?? me.plan}</div>
          <div className="text-sm text-white/50">
            Thanh toán: {me.payment.status === "active" ? "Đang hoạt động" : me.payment.status === "free" ? "Miễn phí" : me.payment.status}
          </div>
          {me.payment.current_period_end && (
            <div className="text-xs text-white/40 mt-1">
              Đến: {new Date(me.payment.current_period_end).toLocaleDateString("vi-VN")}
            </div>
          )}
        </div>

        <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-6">
          <div className="text-xs uppercase tracking-wider text-white/40 mb-2">Credit</div>
          <div className="flex items-baseline gap-2 mb-3">
            <span className="text-3xl font-black text-brand">{me.credits.remaining.toLocaleString("vi-VN")}</span>
            <span className="text-sm text-white/50">/ {me.credits.total.toLocaleString("vi-VN")} còn lại</span>
          </div>
          <div className="h-2 rounded-full bg-white/10 overflow-hidden">
            <div className="h-full bg-brand" style={{ width: `${Math.min(100, pct)}%` }} />
          </div>
          <div className="flex justify-between text-xs text-white/40 mt-2">
            <span>Đã dùng: {me.credits.used.toLocaleString("vi-VN")}</span>
            <span>{pct}%</span>
          </div>
        </div>
      </div>

      {/* Editable info */}
      <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-6 space-y-4">
        <div className="text-xs uppercase tracking-wider text-white/40">Cập nhật thông tin</div>
        <Field label="Tên hiển thị" value={name} onChange={setName} />
        <Field label="Số điện thoại" value={phone} onChange={setPhone} placeholder="vd: 0901234567" />
        <Field label="Công ty / Tổ chức" value={company} onChange={setCompany} />
        <div className="flex items-center gap-3">
          <button onClick={save} disabled={saving}
            className="px-6 py-2.5 rounded-xl bg-brand text-black font-bold hover:bg-brand-light disabled:opacity-50">
            {saving ? "Đang lưu..." : "Lưu thay đổi"}
          </button>
          {saved && <span className="text-brand text-sm">✓ Đã lưu</span>}
          {err && <span className="text-red-300 text-sm">{err}</span>}
        </div>
      </div>

      {/* Admin shortcut */}
      {me.role === "admin" && (
        <Link href="/admin" className="block bg-amber-500/10 border border-amber-500/30 rounded-2xl p-5 hover:bg-amber-500/15 transition">
          <div className="font-bold text-amber-300">⚡ Trang quản trị</div>
          <div className="text-sm text-white/60">Quản lý người dùng, cấp quyền, cấp credit, đổi gói.</div>
        </Link>
      )}

      <p className="text-xs text-white/40">
        Cần thêm credit hoặc nâng gói? Liên hệ admin (phnguyenduckien@gmail.com) để được cấp quyền.
      </p>
    </div>
  );
}

function Field({ label, value, onChange, placeholder }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string;
}) {
  return (
    <div>
      <label className="block text-sm text-white/60 mb-1">{label}</label>
      <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
        className="w-full px-4 py-2.5 rounded-xl bg-black/30 border border-white/10 focus:outline-none focus:border-brand" />
    </div>
  );
}
