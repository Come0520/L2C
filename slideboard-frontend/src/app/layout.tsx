import React from 'react';
// import { getMessages } from 'next-intl/server'; // Removed
// import { notFound } from 'next/navigation'; // Removed

import './globals.css';
import type { Metadata, Viewport } from 'next';
import { Noto_Sans_SC } from 'next/font/google';

import PerformanceProvider from '@/components/providers/performance-provider';
import QueryProvider from '@/components/providers/query-provider';
import SwRegister from '@/components/pwa/sw-register';
import { ToastProvider } from '@/components/ui/toast';
import { env } from '@/config/env';
import { AuthProvider } from '@/contexts/auth-context';
import { ThemeProvider } from '@/contexts/theme-context';

// Load messages directly for single-language support
// TODO: Monitor file size. If zh-CN.json grows too large (>100KB), 
// consider splitting namespaces or using server-side translation to avoid 
// bloating the HTML hydration payload.
// import zhCNMessages from '@/locales/zh-CN.json';

import { WebVitals } from './web-vitals';

// 配置中文字体
const notoSansSC = Noto_Sans_SC({
  subsets: ['latin'], // Google Fonts 的中文通常需要 preload: false 或者指定 subsets
  weight: ['400', '500', '700'],
  variable: '--font-noto', // 定义 CSS 变量
  preload: false, // 如果是 Google Fonts 的中文字体，建议设为 false (因为包太大)
});

export const viewport: Viewport = {
  themeColor: '#0ea5e9',
  width: 'device-width',
  initialScale: 1,
};

export const metadata: Metadata = {
  title: 'Slideboard - L2C销售管理系统',
  description: '基于暖宣纸主题的现代化销售管理系统，提供从线索到现金的完整业务流程管理',
};

import DashboardLayout from '@/components/layout/dashboard-layout';

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const locale = 'zh-CN';
  // const messages = zhCNMessages;

  return (
    <html lang={locale} suppressHydrationWarning>
      <head>
        <link rel="manifest" href="/manifest.json" />
      </head>
      <body className={`bg-paper-200 text-ink-600 ${notoSansSC.variable} font-sans`}>
          <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:bg-paper-100 focus:text-ink-800 focus:px-3 focus:py-2 focus:rounded">
            跳到主要内容
          </a>
          {/* PWA Service Worker Registration */}
          <SwRegister />
          <WebVitals />
          <ThemeProvider>
            <PerformanceProvider>
              <QueryProvider>
                <AuthProvider>
                  <DashboardLayout>
                    {children}
                  </DashboardLayout>
                </AuthProvider>
                <ToastProvider />
              </QueryProvider>
            </PerformanceProvider>
          </ThemeProvider>
      </body>
    </html>
  );
}
