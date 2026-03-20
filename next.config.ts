import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow external binary execution in API routes
  experimental: {
    serverActions: {
      bodySizeLimit: "10mb",
    },
  },
  // Disable image optimization for downloaded thumbnails  
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**" },
    ],
  },
};

export default nextConfig;
