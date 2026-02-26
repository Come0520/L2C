'use client';

import { motion } from 'framer-motion';
import { User, ShieldCheck, Lightbulb } from 'lucide-react';
import React from 'react';

// 共建者数据类型
interface Contributor {
    id: string;
    name: string;
    role: string;
    contribution: string;
    icon: React.ReactNode;
    color: string;
}

// 共建者数据 (后续可抽出为常量或从 API 获取)
const contributors: Contributor[] = [
    {
        id: '1',
        name: '聂老师',
        role: '业务架构师',
        contribution: '提出完整财务模块核心业务逻辑，为 L2C 业财一体化奠定基石。',
        icon: <Lightbulb className="w-5 h-5" />,
        color: 'from-amber-400 to-orange-500',
    },
    {
        id: '2',
        name: '一枝花',
        role: '安全卫士',
        contribution: '火眼金睛揪出“忘记密码”隐患，守护系统账户安全。',
        icon: <ShieldCheck className="w-5 h-5" />,
        color: 'from-emerald-400 to-teal-500',
    },
];

export function ContributorsWall() {
    return (
        <section className="relative py-24 sm:py-32 overflow-hidden bg-slate-50 dark:bg-[#050510] transition-colors duration-300">
            {/* 背景装饰图案 */}
            <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top_right,var(--tw-gradient-stops))] from-blue-100/50 via-transparent to-transparent dark:from-blue-900/20 dark:via-transparent"></div>

            <div className="mx-auto max-w-7xl px-6 lg:px-8">
                <div className="mx-auto max-w-2xl lg:text-center">
                    <motion.h2
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5 }}
                        className="text-base font-semibold leading-7 text-blue-600 dark:text-赛博青"
                    >
                        Special Thanks
                    </motion.h2>
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5, delay: 0.1 }}
                        className="mt-2 text-3xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-4xl"
                    >
                        共建者之墙
                    </motion.p>
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                        className="mt-6 text-lg leading-8 text-slate-600 dark:text-slate-400"
                    >
                        L2C 的每一次进化，都离不开早期支持者与社区的智慧碰撞。感谢以下共建者为系统完善做出的杰出贡献。
                    </motion.p>
                </div>

                <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-none">
                    <dl className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-16 lg:max-w-none lg:grid-cols-2">
                        {contributors.map((contributor, index) => (
                            <motion.div
                                key={contributor.id}
                                initial={{ opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.5, delay: 0.1 * index }}
                                className="flex flex-col bg-white/60 dark:bg-slate-900/40 backdrop-blur-md rounded-2xl p-8 ring-1 ring-slate-200 dark:ring-white/10 shadow-sm hover:shadow-md transition-shadow duration-300 relative overflow-hidden group"
                            >
                                {/* 顶部高光修饰 */}
                                <div className={`absolute top-0 left-0 w-full h-1 bg-linear-to-r ${contributor.color}`}></div>

                                <dt className="flex items-center gap-x-3 text-base font-semibold leading-7 text-slate-900 dark:text-white">
                                    <div className={`flex h-12 w-12 flex-none items-center justify-center rounded-lg bg-linear-to-br ${contributor.color} text-white shadow-sm`}>
                                        <User className="w-6 h-6" />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-xl font-bold">{contributor.name}</span>
                                        <div className="flex items-center gap-1 mt-1 text-sm font-medium text-slate-500 dark:text-slate-400">
                                            {contributor.icon}
                                            <span>专属勋章：{contributor.role}</span>
                                        </div>
                                    </div>
                                </dt>
                                <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-slate-600 dark:text-slate-300">
                                    <p className="flex-auto">
                                        <span className="font-semibold text-slate-900 dark:text-white">✨ 贡献事迹：</span>
                                        {contributor.contribution}
                                    </p>
                                </dd>

                                {/* 装饰性渐变背景 Hover */}
                                <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-linear-to-br from-blue-500/10 to-purple-500/10 dark:from-blue-500/5 dark:to-purple-500/5 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700 pointer-events-none"></div>
                            </motion.div>
                        ))}
                    </dl>
                </div>
            </div>
        </section>
    );
}
