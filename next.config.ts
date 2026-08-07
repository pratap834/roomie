import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  typedRoutes: false,
  logging: {
    fetches: {
      fullUrl: true,
    },
  },
};

export default nextConfig;
