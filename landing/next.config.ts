import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  images: {
    remotePatterns: [
      { protocol: "http", hostname: "localhost", pathname: "/**" },
      { protocol: "http", hostname: "127.0.0.1", pathname: "/**" },
      { protocol: "http", hostname: "backend", pathname: "/**" },
      { protocol: "https", hostname: "tiktrendy.juliettebella.com", pathname: "/**" },
      { protocol: "https", hostname: "coreva-normal.trae.ai", pathname: "/**" },
    ],
  },
};

export default nextConfig;
