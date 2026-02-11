import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { cn } from '@/shared/utils';
import { AuthProvider } from '@/shared/providers/auth-provider';
import { ThemeProvider } from '@/shared/providers/theme-provider';
import StyleProvider from '@/shared/providers/style-provider';
import { ProgressBarProvider } from '@/shared/providers/progress-bar-provider';
import { QueryProvider } from '@/shared/providers/query-provider';
import { TenantProvider } from '@/shared/providers/tenant-provider';
import { Toaster } from '@/shared/ui/sonner';
import './globals.css';
import '@/lib/zod-i18n';
import { VersionLogger } from '@/shared/components/version-logger';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'L2C - 销售管理系统',
  description: 'Lead to Cash 全流程管理',
  icons: {
    icon: '/l2c-logo.svg',
  },
};

import { auth } from '@/shared/lib/auth';

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <body
        className={cn(
          inter.className,
          'selection:bg-primary/20 min-h-screen font-sans antialiased'
        )}
        suppressHydrationWarning
      >
        <div className="liquid-mesh-bg fixed inset-0 -z-20" />
        <div className="aurora-animate fixed inset-0 -z-10" />
        <AuthProvider session={session}>
          <StyleProvider>
            <ThemeProvider
              attribute="class"
              defaultTheme="system"
              enableSystem
              disableTransitionOnChange
            >
              <ProgressBarProvider>
                <QueryProvider>
                  <TenantProvider>{children}</TenantProvider>
                </QueryProvider>
              </ProgressBarProvider>
              <Toaster />
            </ThemeProvider>
          </StyleProvider>
        </AuthProvider>
        <VersionLogger />
      </body>
    </html>
  );
}
