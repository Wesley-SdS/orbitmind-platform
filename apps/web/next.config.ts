import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@orbitmind/engine", "@orbitmind/shared"],
};

export default nextConfig;
