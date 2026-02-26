'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Menu, X } from 'lucide-react';
import { navLinks } from '@/constants/landing-data';
import { cn } from '@/shared/utils';

/**
 * 第 0 幕：顶部导航栏 (Navbar)
 * 固定置顶 + 毛玻璃效果，滚动时背景加深
 */
export function Navbar() {
    const [scrolled, setScrolled] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 50);
        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    return (
        <nav
            className={cn(
                'fixed top-0 left-0 right-0 z-50 transition-all duration-300',
                scrolled
                    ? 'bg-white/80 backdrop-blur-xl shadow-sm border-b border-gray-200/50'
                    : 'bg-transparent'
            )}
        >
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="flex h-16 items-center justify-between lg:h-20">
                    {/* Logo */}
                    <Link
                        href="/"
                        className="flex items-center gap-2 text-xl font-bold tracking-tight"
                    >
                        <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                            L2C
                        </span>
                    </Link>

                    {/* 桌面端导航 */}
                    <div className="hidden items-center gap-8 md:flex">
                        {navLinks.map((link) => (
                            <a
                                key={link.href}
                                href={link.href}
                                className="text-sm font-medium text-gray-600 transition-colors hover:text-gray-900"
                            >
                                {link.label}
                            </a>
                        ))}
                    </div>

                    {/* 桌面端 CTA */}
                    <div className="hidden items-center gap-3 md:flex">
                        <Link
                            href="/login"
                            className="rounded-lg px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100 hover:text-gray-900"
                        >
                            登录系统
                        </Link>
                        <Link
                            href="/register/tenant"
                            className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-medium text-white shadow-sm transition-all hover:bg-blue-700 hover:shadow-md"
                        >
                            免费注册
                        </Link>
                    </div>

                    {/* 移动端菜单按钮 */}
                    <button
                        onClick={() => setMobileOpen(!mobileOpen)}
                        className="inline-flex items-center justify-center rounded-lg p-2 text-gray-600 transition-colors hover:bg-gray-100 md:hidden"
                        aria-label="Toggle menu"
                    >
                        {mobileOpen ? <X size={24} /> : <Menu size={24} />}
                    </button>
                </div>
            </div>

            {/* 移动端菜单 */}
            {mobileOpen && (
                <div className="border-t border-gray-200/50 bg-white/95 backdrop-blur-xl md:hidden">
                    <div className="space-y-1 px-4 pb-4 pt-2">
                        {navLinks.map((link) => (
                            <a
                                key={link.href}
                                href={link.href}
                                onClick={() => setMobileOpen(false)}
                                className="block rounded-lg px-3 py-2 text-base font-medium text-gray-700 transition-colors hover:bg-gray-100"
                            >
                                {link.label}
                            </a>
                        ))}
                        <hr className="my-2 border-gray-200" />
                        <Link
                            href="/login"
                            className="block rounded-lg px-3 py-2 text-base font-medium text-gray-700 transition-colors hover:bg-gray-100"
                        >
                            登录系统
                        </Link>
                        <Link
                            href="/register/tenant"
                            className="mt-2 block rounded-lg bg-blue-600 px-3 py-2.5 text-center text-base font-medium text-white"
                        >
                            免费注册
                        </Link>
                    </div>
                </div>
            )}
        </nav>
    );
}
