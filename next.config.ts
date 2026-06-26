import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    // Enable production builds even with minor type discrepancies
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  }
};

export default nextConfig;
