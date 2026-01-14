import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  distDir: process.env.DIST_DIR || '.next',
  output: 'standalone',

  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'assets.aceternity.com',
        pathname: '/**',
      },
    ],
  },

  // 实验性特性
  experimental: {
    // 启用服务端操作 (React 19)
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },

  // Turbopack 配置 (Next.js 16 默认)
  turbopack: {},

  // Webpack 配置
  webpack: (config, { isServer }) => {
    // 忽略日志文件变化,防止触发 Fast Refresh
    if (!isServer && config.watchOptions) {
      config.watchOptions = {
        ...config.watchOptions,
        ignored: [
          '**/node_modules/**',
          '**/.next/**',
          '**/*.log',
          '**/test-results/**',
          '**/coverage/**',
          '**/*.txt', // Ignore text files (logs) to prevent infinite loops
        ],
      };
    }
    return config;
  },
};

export default nextConfig;

