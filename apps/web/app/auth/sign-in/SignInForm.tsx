"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function SignInForm() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState<"google" | "magic" | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const params = useSearchParams();
  const redirect = params.get("redirect") ?? "/dashboard";

  async function signInWithGoogle() {
    setLoading("google");
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${location.origin}/auth/callback?redirect=${encodeURIComponent(redirect)}`,
      },
    });
    if (error) {
      setMsg(`❌ ${error.message}`);
      setLoading(null);
    }
  }

  async function signInWithMagicLink(e: React.FormEvent) {
    e.preventDefault();
    setLoading("magic");
    setMsg(null);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${location.origin}/auth/callback?redirect=${encodeURIComponent(redirect)}`,
      },
    });
    if (error) setMsg(`❌ ${error.message}`);
    else setMsg(`✓ Đã gửi link đăng nhập đến ${email}. Mở email để vào.`);
    setLoading(null);
  }

  return (
    <>
      <button
        onClick={signInWithGoogle}
        disabled={loading !== null}
        className="w-full py-3 rounded-xl bg-white text-black font-semibold flex items-center justify-center gap-3 hover:bg-white/90 transition disabled:opacity-50 mb-4"
      >
        <GoogleIcon />
        {loading === "google" ? "Đang chuyển..." : "Tiếp tục với Google"}
      </button>

      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-white/10" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-[#0a0a0c] px-3 text-white/40">hoặc</span>
        </div>
      </div>

      <form onSubmit={signInWithMagicLink} className="space-y-3">
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="email@example.com"
          className="w-full px-4 py-3 rounded-xl bg-white/[0.05] border border-white/10 text-white placeholder:text-white/30 focus:outline-none focus:border-brand"
        />
        <button
          type="submit"
          disabled={loading !== null}
          className="w-full py-3 rounded-xl bg-brand text-black font-semibold hover:bg-brand-light transition disabled:opacity-50"
        >
          {loading === "magic" ? "Đang gửi..." : "Gửi link đăng nhập"}
        </button>
      </form>

      {msg && <div className="mt-4 text-sm text-center text-white/70">{msg}</div>}
    </>
  );
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  );
}
