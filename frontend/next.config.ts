import type { NextConfig } from "next";

const nextConfig: NextConfig = {

  reactCompiler: true,
  output: 'standalone',
  async rewrites() {
    return [
      {
        source: '/api/dev/objects',
        destination: 'https://sololevelingzdravmaps.ru/api/objects',
      },
    ];
  },
};

export default nextConfig;
