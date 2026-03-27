import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@orbitmind/engine", "@orbitmind/shared"],
  experimental: {
    optimizePackageImports: ["lucide-react", "drizzle-orm", "@orbitmind/shared"],
  },
};

export default nextConfig;
