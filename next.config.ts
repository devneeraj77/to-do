import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      allowedOrigins: ['https://obscure-guacamole-wrgr9x56pv6qh5jj6-3000.app.github.dev', '*.app.github.dev']
    }
  }
  /* config options here */
};

export default nextConfig;
