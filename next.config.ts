import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  webpack(config, { isServer }) {
    if (!isServer) {
      const Chrome90WebpackPlugin = require('./config/chrome90-webpack.cjs');
      config.plugins.push(new Chrome90WebpackPlugin());
    }
    return config;
  },
  serverExternalPackages: ["ffmpeg-static"],
  outputFileTracingIncludes: { "/api/admin/upload": ["./node_modules/ffmpeg-static/ffmpeg*"] },
};

export default nextConfig;
