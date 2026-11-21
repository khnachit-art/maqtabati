import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: { ignoreBuildErrors: true },
  reactStrictMode: true,
  // تمكين الإخراج المستقل (Standalone) لـ Docker
  output: "standalone",
  // تحسين الصور للإنتاج
  images: {
    unoptimized: false,
  },
  // تجاهل تحذيرات ESLint أثناء البناء (اختياري)
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;