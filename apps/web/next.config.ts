import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  transpilePackages: ["@paxibay/core", "@paxibay/prompts"],
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.pexels.com" },
      { protocol: "https", hostname: "videos.pexels.com" },
      { protocol: "https", hostname: "*.supabase.co" },
    ],
  },
  experimental: {
    typedRoutes: true,
  },
};

export default nextConfig;
