'use client';

import { Home, User } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

/**
 * 底部导航项
 */
const navItems = [
    { href: '/mobile/tasks', label: '任务', icon: Home },
    { href: '/mobile/profile', label: '我的', icon: User },
];

/**
 * 移动端底部导航栏 (Client Component)
 */
export function MobileBottomNav() {
    const pathname = usePathname();
    // 登录页不显示底部导航
    const isLoginPage = pathname.includes('/login');

    if (isLoginPage) return null;

    return (
        <nav className="safe-area-inset-bottom fixed right-0 bottom-0 left-0 z-50 flex h-16 items-center justify-around border-t border-gray-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
            {navItems.map((item) => {
                const isActive = pathname.startsWith(item.href);
                const Icon = item.icon;
                return (
                    <Link
                        key={item.href}
                        href={item.href}
                        className={`flex w-20 flex-col items-center justify-center gap-1 py-2 ${isActive ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400'
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
