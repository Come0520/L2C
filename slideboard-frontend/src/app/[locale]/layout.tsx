import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { notFound } from 'next/navigation';

import '../globals.css';
import type { Metadata } from 'next';

import { env } from '@/config/env';
import PerformanceProvider from '@/components/providers/performance-provider';
import QueryProvider from '@/components/providers/query-provider';
import SwRegister from '@/components/pwa/sw-register';
import { ToastProvider } from '@/components/ui/toast';
import { AuthProvider } from '@/contexts/auth-context';
import { ThemeProvider } from '@/contexts/theme-context';

import { WebVitals } from '../web-vitals';

export const metadata: Metadata = {
  title: 'Slideboard - L2C销售管理系统',
  description: '基于暖宣纸主题的现代化销售管理系统，提供从线索到现金的完整业务流程管理',
};

type WebVitalsMetric = {
  id: string;
  name: string;
  delta: number;
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  entries: unknown[];
  navigationType: string;
};

export function reportWebVitals(metric: WebVitalsMetric) {
  if (env.NODE_ENV === 'production') {
    fetch('/api/web-vitals', {
      method: 'POST',
      body: JSON.stringify(metric),
      headers: { 'content-type': 'application/json' },
    }).catch(() => { });
  }
}

export default async function RootLayout({
  children,
  params: { locale }
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  // Ensure that the incoming `locale` is valid
  if (!['zh-CN'].includes(locale)) {
    notFound();
  }

  // Providing all messages to the client
  // side is the easiest way to get started
  const messages = await getMessages();

  return (
    <html lang={locale}>
      <head>
        <meta name="theme-color" content="#0ea5e9" />
        <link rel="manifest" href="/manifest.json" />
      </head>
      <body className={`bg-paper-200 text-ink-600`}>
        <NextIntlClientProvider messages={messages}>
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
                  {children}
                </AuthProvider>
                <ToastProvider />
              </QueryProvider>
            </PerformanceProvider>
          </ThemeProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
