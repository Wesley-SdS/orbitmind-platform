import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@orbitmind/engine", "@orbitmind/shared"],
  experimental: {
    optimizePackageImports: ["lucide-react", "drizzle-orm", "@orbitmind/shared"],
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**" },
    ],
  },
};

export default nextConfig;
