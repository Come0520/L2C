/** @type {import('next').NextConfig} */

// 暂时注释掉 bundle-analyzer - 依赖缺失
// const withBundleAnalyzer = require('@next/bundle-analyzer')({
//   enabled: process.env.ANALYZE === 'true',
// })

const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    // Warning: This allows production builds to successfully complete even if
    // your project has ESLint errors.
    ignoreDuringBuilds: true,
  },
  // 修复：指向当前项目根目录，而不是父目录
  outputFileTracingRoot: __dirname,
  output: 'standalone',

  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**.supabase.co' },
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'example.com' },
      { protocol: 'http', hostname: 'localhost' },
    ],
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 60,
  },
  // CDN 配置：如果有 CDN_URL 环境变量，则使用它作为静态资源前缀
  assetPrefix: process.env.CDN_URL || undefined,
  // 启用严格模式
  reactStrictMode: true,
  // 服务器组件外部包配置
  serverExternalPackages: [
    '@supabase/supabase-js',
    // 'import-in-the-middle', // 暂时注释掉，导致启动报错
    // '@opentelemetry/instrumentation',
    // '@sentry/profiling-node',
  ],
  // Turbopack 配置 - Next.js 16 顶层配置（必须与 outputFileTracingRoot 一致）
  turbopack: {
    root: __dirname,
  },
  async headers() {
    const isDev = process.env.NODE_ENV === 'development'
    const cspHeader = isDev
      ? `
      default-src 'self';
      script-src 'self' 'unsafe-eval' 'unsafe-inline';
      style-src 'self' 'unsafe-inline';
      img-src 'self' blob: data: https://images.unsplash.com;
      font-src 'self' data:;
      object-src 'none';
      base-uri 'self';
      form-action 'self';
      frame-ancestors 'none';
      connect-src 'self' ws://localhost:* http://localhost:* https://*.supabase.co https://*.supabase.in https://*.sentry.io;
    `
      : `
      default-src 'self';
      script-src 'self' https://*.supabase.co 'unsafe-eval' 'unsafe-inline';
      style-src 'self' 'unsafe-inline';
      img-src 'self' blob: data: https://*.supabase.co https://images.unsplash.com;
      font-src 'self' data:;
      object-src 'none';
      base-uri 'self';
      form-action 'self';
      frame-ancestors 'none';
      connect-src 'self' https://*.supabase.co https://*.supabase.in https://*.sentry.io;
      upgrade-insecure-requests;
    `

    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: cspHeader.replace(/\n/g, ''),
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(), payment=(), fullscreen=(), autoplay=()',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
        ],
      },
    ]
  },
}

const { withSentryConfig } = require('@sentry/nextjs');
const withNextIntl = require('next-intl/plugin')();

// 暂时不使用 bundle-analyzer
const sentryWebpackPluginOptions = {
  // For all available options, see:
  // https://github.com/getsentry/sentry-webpack-plugin#options

  // Suppresses all logs
  silent: true,
  org: "slideboard",
  project: "frontend",
  authToken: process.env.SENTRY_AUTH_TOKEN,
};

const sentryOptions = {
  // For all available options, see:
  // https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/

  // Upload a larger set of source maps for prettier stack traces (increases build time)
  widenClientFileUpload: true,

  // Transpiles SDK to be compatible with IE11 (increases bundle size)
  transpileClientSDK: true,

  // Routes browser requests to Sentry through a Next.js rewrite to circumvent ad-blockers (increases server load)
  tunnelRoute: "/monitoring",

  // Hides source maps from generated client bundles
  hideSourceMaps: true,

  // Automatically tree-shake Sentry logger statements to reduce bundle size
  disableLogger: true,
};

module.exports = withSentryConfig(
  withNextIntl(nextConfig),
  sentryWebpackPluginOptions,
  sentryOptions
);
