'use client';

import Link from 'next/link';
import { navLinks } from '@/constants/landing-data';

/**
 * 第 8 幕：CTA 收尾 + Footer
 * 最后的行动号召 + 页脚版权信息
 */
export function CtaFooter() {
    return (
        <>
            {/* CTA 区域 */}
            <section className="relative overflow-hidden bg-gray-900 py-24 sm:py-32">
                {/* 背景渐变流动 */}
                <div className="pointer-events-none absolute inset-0 -z-10">
                    <div className="absolute -top-32 -left-32 h-96 w-96 rounded-full bg-blue-600/20 blur-3xl" />
                    <div className="absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-indigo-600/20 blur-3xl" />
                </div>

                <div className="mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8">
                    <h2 className="text-3xl font-bold text-white sm:text-4xl lg:text-5xl">
                        让改变从今天开始
                    </h2>
                    <p className="mt-4 text-lg text-gray-300">
                        加入数百家窗帘门店的数字化升级之旅，基础版永久免费。
                    </p>

                    <div className="mt-10 flex flex-wrap justify-center gap-4">
                        <Link
                            href="/register/tenant"
                            className="group relative inline-flex items-center rounded-xl bg-blue-600 px-8 py-4 text-base font-semibold text-white shadow-lg shadow-blue-600/25 transition-all hover:-translate-y-0.5 hover:bg-blue-500 hover:shadow-xl hover:shadow-blue-500/30"
                        >
                            {/* 呼吸光效 */}
                            <span className="absolute inset-0 rounded-xl bg-blue-400/20 animate-pulse" />
                            <span className="relative">免费注册</span>
                        </Link>

                        <a
                            href="#contact"
                            className="inline-flex items-center rounded-xl border border-gray-600 px-8 py-4 text-base font-semibold text-gray-300 transition-all hover:border-gray-500 hover:bg-gray-800 hover:text-white"
                        >
                            联系我们
                        </a>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer id="contact" className="border-t border-gray-200 bg-white">
                <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
                    <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
                        {/* 品牌 */}
                        <div className="sm:col-span-2 lg:col-span-1">
                            <Link
                                href="/"
                                className="text-xl font-bold tracking-tight"
                            >
                                <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                                    L2C
                                </span>
                            </Link>
                            <p className="mt-3 text-sm leading-relaxed text-gray-500">
                                从线索到收款，一站式管理。
                                <br />
                                窗帘/家具行业的数字化管理利器。
                            </p>
                        </div>

                        {/* 快速导航 */}
                        <div>
                            <h4 className="text-sm font-semibold text-gray-900">快速导航</h4>
                            <ul className="mt-4 space-y-2">
                                {navLinks.map((link) => (
                                    <li key={link.href}>
                                        <a
                                            href={link.href}
                                            className="text-sm text-gray-500 transition-colors hover:text-gray-700"
                                        >
                                            {link.label}
                                        </a>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* 产品 */}
                        <div>
                            <h4 className="text-sm font-semibold text-gray-900">产品</h4>
                            <ul className="mt-4 space-y-2">
                                <li>
                                    <Link
                                        href="/login"
                                        className="text-sm text-gray-500 transition-colors hover:text-gray-700"
                                    >
                                        登录系统
                                    </Link>
                                </li>
                                <li>
                                    <Link
                                        href="/register/tenant"
                                        className="text-sm text-gray-500 transition-colors hover:text-gray-700"
                                    >
                                        免费注册
                                    </Link>
                                </li>
                            </ul>
                        </div>

                        {/* 联系方式 */}
                        <div>
                            <h4 className="text-sm font-semibold text-gray-900">联系我们</h4>
                            <ul className="mt-4 space-y-2">
                                <li className="text-sm text-gray-500">
                                    邮箱：contact@l2c.com
                                </li>
                                <li className="text-sm text-gray-500">
                                    微信：L2C-Service
                                </li>
                            </ul>
                        </div>
                    </div>

                    {/* 版权信息 */}
                    <div className="mt-12 border-t border-gray-200 pt-8 text-center">
                        <p className="text-sm text-gray-400">
                            © {new Date().getFullYear()} L2C. All rights reserved. |{' '}
                            <a href="#" className="hover:text-gray-600">
                                隐私政策
                            </a>{' '}
                            |{' '}
                            <a href="#" className="hover:text-gray-600">
                                服务条款
                            </a>
                        </p>
                    </div>
                </div>
            </footer>
        </>
    );
}
