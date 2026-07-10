import type { NextConfig } from "next";
import path from "path"

const nextConfig: NextConfig = {
  outputFileTracingRoot: process.cwd(),
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.supabase.co",
      },
      {
        protocol: "https",
        hostname: "s3.tradingview.com",
      },
    ],
  },
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      "@supabase/phoenix": path.resolve("node_modules/@supabase/phoenix/priv/static/phoenix.cjs.js"),
    }
    return config
  },
};

export default nextConfig;
