import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  trailingSlash: true,
  serverExternalPackages: ["group-planner", "highs"],
};

export default nextConfig;
