import Link from "next/link";

export function Header({ children }: { children?: React.ReactNode }) {
  return (
    <header className="border-b border-white/5 bg-black/30 backdrop-blur sticky top-0 z-40">
      <div className="max-w-7xl mx-auto h-16 px-6 flex items-center justify-between">
        <Link href="/dashboard" className="text-xl font-black">
          <span className="text-brand">Paxi</span>bay
        </Link>
        <nav className="flex items-center gap-6 text-sm">
          <Link href="/dashboard" className="text-white/70 hover:text-white">Dashboard</Link>
          <Link href="/library" className="text-white/70 hover:text-white">Thư viện</Link>
          <Link href="/settings" className="text-white/70 hover:text-white">Cá nhân</Link>
          {children}
          <form action="/auth/sign-out" method="post">
            <button className="text-white/60 hover:text-white">Đăng xuất</button>
          </form>
        </nav>
      </div>
    </header>
  );
}
