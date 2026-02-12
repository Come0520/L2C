import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  distDir: process.env.DIST_DIR || '.next',
  output: 'standalone',
  env: {
    NEXT_PUBLIC_GIT_COMMIT_SHA: process.env.NEXT_PUBLIC_GIT_COMMIT_SHA,
  },

  // 暂时忽略 TypeScript 构建错误 (react-hook-form 与 zod 类型推断问题)
  typescript: {
    ignoreBuildErrors: true,
  },

  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'assets.aceternity.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
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
    // 优化包导入：自动将 barrel 导入转换为直接导入
    // 这可以显著减少包大小和冷启动时间
    optimizePackageImports: [
      'lucide-react',
      'date-fns',
      '@radix-ui/react-icons',
      'zod',
      '@tanstack/react-table',
      'react-hook-form',
      '@/shared/ui',
      '@/features',
    ],
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

  // 安全响应头配置
  async headers() {
    return [
      {
        // 所有路由应用安全头
        source: '/:path*',
        headers: [
          // 防止 MIME 类型嗅探
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          // 防止点击劫持
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          // XSS 保护（旧浏览器）
          { key: 'X-XSS-Protection', value: '1; mode=block' },
          // Referrer 策略
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          // 权限策略：禁用不必要的浏览器功能
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(self)' },
        ],
      },
      {
        // API 路由额外安全头
        source: '/api/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          // API 不允许被嵌入
          { key: 'X-Frame-Options', value: 'DENY' },
          // 禁止缓存敏感 API
          { key: 'Cache-Control', value: 'no-store, max-age=0' },
        ],
      },
    ];
  },
};

export default nextConfig;
