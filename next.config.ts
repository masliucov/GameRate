import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "media.rawg.io",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "mdmlssosiwuczsepradl.supabase.co",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
