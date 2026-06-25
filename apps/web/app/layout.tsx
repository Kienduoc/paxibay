import type { Metadata } from "next";
import { Be_Vietnam_Pro, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const beVietnamPro = Be_Vietnam_Pro({
  variable: "--font-be-vietnam-pro",
  subsets: ["latin", "vietnamese"],
  weight: ["400", "500", "600", "700", "800", "900"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Paxibay — Video AI cho người Việt",
  description:
    "Tạo video chuyên nghiệp trong 5 phút. Chỉ cần gõ ý tưởng — AI sinh script, tìm footage, đọc voice tiếng Việt.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "https://paxibay.cloud"),
  openGraph: {
    title: "Paxibay — Video AI cho người Việt",
    description: "Gõ ý tưởng → Video chuyên nghiệp trong 5 phút",
    siteName: "Paxibay",
    locale: "vi_VN",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi" className="dark">
      <body className={`${beVietnamPro.variable} ${jetbrainsMono.variable} font-sans antialiased`}>
        {children}
      </body>
    </html>
  );
}
