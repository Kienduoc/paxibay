import { Suspense } from "react";
import Link from "next/link";
import { SignInForm } from "./SignInForm";

export const dynamic = "force-dynamic";

export default function SignInPage() {
  return (
    <main className="min-h-screen flex items-center justify-center px-6">
      <div className="w-full max-w-md">
        <Link href="/" className="block text-center mb-8 text-2xl font-black">
          <span className="text-brand">Paxi</span>bay
        </Link>

        <div className="bg-white/[0.03] border border-white/10 rounded-3xl p-8">
          <h1 className="text-2xl font-black mb-2 text-center">Đăng nhập</h1>
          <p className="text-white/50 text-sm text-center mb-8">Miễn phí, không cần thẻ</p>
          <Suspense fallback={<div className="h-48" />}>
            <SignInForm />
          </Suspense>
        </div>

        <p className="text-center text-xs text-white/40 mt-6">
          Bằng việc đăng nhập bạn đồng ý với <a href="/terms" className="underline">điều khoản</a> và{" "}
          <a href="/privacy" className="underline">chính sách bảo mật</a>.
        </p>
      </div>
    </main>
  );
}
