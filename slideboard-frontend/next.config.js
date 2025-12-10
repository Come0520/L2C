/** @type {import('next').NextConfig} */
const path = require('path')

const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
})

const nextConfig = {
  outputFileTracingRoot: path.join(__dirname, '..'),
  output: 'standalone',
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**.supabase.co' },
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
  // 服务器组件外部包配置（Next.js 15中移到顶层）
  serverExternalPackages: ['@supabase/supabase-js'],
  // 启用React Compiler实验性功能
  experimental: {
    reactCompiler: false,
  },
  async headers() {
    const isDev = process.env.NODE_ENV === 'development'
    const cspHeader = isDev
      ? `
      default-src 'self';
      script-src 'self' 'unsafe-eval' 'unsafe-inline';
      style-src 'self' 'unsafe-inline';
      img-src 'self' blob: data:;
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
      img-src 'self' blob: data: https://*.supabase.co;
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

const withNextIntl = require('next-intl/plugin')();

module.exports = withNextIntl(withBundleAnalyzer(nextConfig));
