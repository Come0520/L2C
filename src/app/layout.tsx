import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { cn } from '@/shared/utils';
import { AuthProvider } from '@/shared/providers/auth-provider';
import { ThemeProvider } from '@/shared/providers/theme-provider';
import { ProgressBarProvider } from '@/shared/providers/progress-bar-provider';
import { Toaster } from '@/shared/ui/sonner';
import './globals.css';
import '@/lib/zod-i18n';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
    title: 'L2C - 销售管理系统',
    description: 'Lead to Cash 全流程管理',
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="zh-CN" suppressHydrationWarning>
            <body className={cn(inter.className, "min-h-screen font-sans antialiased")}>
                <div className="fixed inset-0 liquid-mesh-bg -z-20" />
                <div className="fixed inset-0 aurora-animate -z-10" />
                <AuthProvider>
                    <ThemeProvider
                        attribute="class"
                        defaultTheme="system"
                        enableSystem
                        disableTransitionOnChange
                    >
                        <ProgressBarProvider>
                            {children}
                        </ProgressBarProvider>
                        <Toaster />
                    </ThemeProvider>
                </AuthProvider>
            </body>
        </html>
    );
}
