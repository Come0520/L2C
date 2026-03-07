import type { Metadata } from 'next';
import { cn } from '@/shared/utils';
import { AuthProvider } from '@/shared/providers/auth-provider';
import { ThemeProvider } from '@/shared/providers/theme-provider';
import StyleProvider from '@/shared/providers/style-provider';
import { ProgressBarProvider } from '@/shared/providers/progress-bar-provider';
import { QueryProvider } from '@/shared/providers/query-provider';
import { TenantProvider } from '@/shared/providers/tenant-provider';
import { NuqsAdapter } from 'nuqs/adapters/next/app';
import dynamic from 'next/dynamic';
import './globals.css';
import '@/lib/zod-i18n';

const Toaster = dynamic(() => import('@/shared/ui/sonner').then((m) => m.Toaster));
const GlobalConfirmProvider = dynamic(() =>
  import('@/shared/components/global-confirm-provider').then((m) => m.GlobalConfirmProvider)
);
const VersionLogger = dynamic(() =>
  import('@/shared/components/version-logger').then((m) => m.VersionLogger)
);
const WebVitals = dynamic(() => import('@/shared/components/web-vitals').then((m) => m.WebVitals));

export const metadata: Metadata = {
  title: 'L2C - 销售管理系统',
  description: 'Lead to Cash 全流程管理',
  icons: {
    icon: '/l2c-logo.svg',
  },
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <body
        className={cn('selection:bg-primary/20 min-h-screen font-sans antialiased')}
        suppressHydrationWarning
      >
        <div className="liquid-mesh-bg fixed inset-0 -z-20" />
        <div className="aurora-animate fixed inset-0 -z-10" />
        <AuthProvider>
          <StyleProvider>
            <ThemeProvider
              attribute="class"
              defaultTheme="system"
              enableSystem
              disableTransitionOnChange
            >
              <ProgressBarProvider>
                <QueryProvider>
                  <NuqsAdapter>
                    <TenantProvider>{children}</TenantProvider>
                  </NuqsAdapter>
                </QueryProvider>
              </ProgressBarProvider>
              <Toaster />
              <GlobalConfirmProvider />
            </ThemeProvider>
          </StyleProvider>
        </AuthProvider>
        <VersionLogger />
        <WebVitals />
      </body>
    </html>
  );
}
