'use client';

import "@/app/globals.css";
import { MobileAuthProvider } from "@/shared/auth/mobile-auth-context";
import { Home, User } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

/**
 * 底部导航项
 */
const navItems = [
    { href: '/mobile/tasks', label: '任务', icon: Home },
    { href: '/mobile/profile', label: '我的', icon: User },
];

/**
 * 底部导航栏组件
 */
function BottomNav() {
    const pathname = usePathname();

    return (
        <nav className="fixed bottom-0 left-0 right-0 h-16 bg-white dark:bg-zinc-900 border-t border-gray-200 dark:border-zinc-800 flex items-center justify-around z-50 safe-area-inset-bottom">
            {navItems.map((item) => {
                const isActive = pathname.startsWith(item.href);
                const Icon = item.icon;
                return (
                    <Link
                        key={item.href}
                        href={item.href}
                        className={`flex flex-col items-center justify-center gap-1 w-20 py-2 ${isActive
                                ? 'text-blue-600 dark:text-blue-400'
                                : 'text-gray-500 dark:text-gray-400'
                            }`}
                    >
                        <Icon className="h-5 w-5" />
                        <span className="text-xs">{item.label}</span>
                    </Link>
                );
            })}
        </nav>
    );
}

export default function MobileLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();
    // 登录页不显示底部导航
    const showBottomNav = !pathname.includes('/login');

    return (
        <MobileAuthProvider>
            <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-zinc-950">
                <header className="fixed top-0 left-0 right-0 h-14 bg-white dark:bg-zinc-900 border-b border-gray-200 dark:border-zinc-800 z-50 flex items-center px-4 shadow-sm">
                    <h1 className="text-base font-semibold text-gray-900 dark:text-gray-100">L2C 移动端</h1>
                </header>
                <main className={`flex-1 pt-14 ${showBottomNav ? 'pb-20' : 'pb-4'} overflow-y-auto`}>
                    {children}
                </main>
                {showBottomNav && <BottomNav />}
            </div>
        </MobileAuthProvider>
    );
}
