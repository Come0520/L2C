'use client';

import { useRef } from 'react';
import { useInView } from 'framer-motion';
import { Monitor, Smartphone } from 'lucide-react';
import { cn } from '@/shared/utils';

/**
 * 第 6 幕：云展厅 (Showroom Preview)
 * 设备样机从底部滑入，展示云展厅效果
 */
export function ShowroomPreview() {
    const ref = useRef<HTMLDivElement>(null);
    const isInView = useInView(ref, { once: true, margin: '-100px' });

    return (
        <section className="relative overflow-hidden bg-white py-24 sm:py-32">
            <div ref={ref} className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
                    {/* 文字区域 */}
                    <div
                        className={cn(
                            'transition-all duration-700',
                            isInView
                                ? 'translate-x-0 opacity-100'
                                : '-translate-x-12 opacity-0'
                        )}
                    >
                        <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl">
                            你的每件产品，都有一个
                            <span className="text-blue-600">不下班的销售员</span>
                        </h2>

                        <div className="mt-8 space-y-6">
                            {[
                                {
                                    title: '24 小时在线展示',
                                    desc: '客户半夜看到心仪窗帘，第二天就来找你。',
                                },
                                {
                                    title: '自助选品，沟通成本砍半',
                                    desc: '客户自主挑好款式再联系你，不用反复沟通需求。',
                                },
                                {
                                    title: '线下活动扫码即看',
                                    desc: '展厅面积不够？线上来凑。一个二维码展示全部产品。',
                                },
                            ].map((item, i) => (
                                <div key={i} className="flex gap-4">
                                    <div className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-600">
                                        {i + 1}
                                    </div>
                                    <div>
                                        <h4 className="font-semibold text-gray-900">{item.title}</h4>
                                        <p className="mt-1 text-gray-600">{item.desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* 设备样机 */}
                    <div
                        className={cn(
                            'relative transition-all delay-200 duration-1000',
                            isInView
                                ? 'translate-y-0 opacity-100'
                                : 'translate-y-24 opacity-0'
                        )}
                    >
                        {/* 桌面设备 */}
                        <div className="relative mx-auto max-w-md">
                            <div className="rounded-2xl border border-gray-200 bg-gray-100 p-2 shadow-xl">
                                <div className="flex items-center gap-1.5 px-3 py-2">
                                    <div className="h-2.5 w-2.5 rounded-full bg-red-400" />
                                    <div className="h-2.5 w-2.5 rounded-full bg-yellow-400" />
                                    <div className="h-2.5 w-2.5 rounded-full bg-green-400" />
                                    <div className="ml-4 h-5 flex-1 rounded-md bg-gray-200" />
                                </div>
                                <div className="flex aspect-[16/10] items-center justify-center rounded-lg bg-white">
                                    <div className="text-center">
                                        <Monitor size={48} className="mx-auto text-gray-300" />
                                        <p className="mt-2 text-sm text-gray-400">
                                            云展厅界面预览
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* 手机设备（右下角叠加） */}
                            <div className="absolute -bottom-6 -right-4 w-28 rounded-xl border border-gray-200 bg-gray-100 p-1 shadow-lg sm:w-32">
                                <div className="flex aspect-[9/16] items-center justify-center rounded-lg bg-white">
                                    <div className="text-center">
                                        <Smartphone size={20} className="mx-auto text-gray-300" />
                                        <p className="mt-1 text-[10px] text-gray-400">手机端</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
