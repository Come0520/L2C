'use client';

import { useRef } from 'react';
import { useInView } from 'framer-motion';
import { cn } from '@/shared/utils';

/**
 * 第 3 幕：爽点宣言 (Value Proposition)
 * 全屏大字排印，滚动到视口时从模糊到清晰
 */
export function ValueProposition() {
    const ref = useRef<HTMLDivElement>(null);
    const isInView = useInView(ref, { once: true, margin: '-100px' });

    return (
        <section
            ref={ref}
            className="relative flex min-h-[80vh] items-center justify-center overflow-hidden bg-white px-4 py-24"
        >
            {/* 背景装饰：混乱 -> 整洁过渡 */}
            <div className="pointer-events-none absolute inset-0 -z-10">
                <div
                    className={cn(
                        'absolute inset-0 transition-all duration-1000',
                        isInView ? 'opacity-0' : 'opacity-30'
                    )}
                    style={{
                        backgroundImage:
                            'repeating-linear-gradient(45deg, transparent, transparent 35px, rgba(0,0,0,0.02) 35px, rgba(0,0,0,0.02) 36px)',
                    }}
                />
                <div
                    className={cn(
                        'absolute inset-0 transition-all delay-500 duration-1000',
                        isInView ? 'opacity-10' : 'opacity-0'
                    )}
                    style={{
                        backgroundImage:
                            'linear-gradient(rgba(37,99,235,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(37,99,235,0.03) 1px, transparent 1px)',
                        backgroundSize: '40px 40px',
                    }}
                />
            </div>

            <div className="text-center">
                <h2
                    className={cn(
                        'text-4xl font-bold leading-tight tracking-tight text-gray-900 transition-all duration-1000 sm:text-5xl lg:text-7xl',
                        isInView
                            ? 'translate-y-0 opacity-100 blur-0'
                            : 'translate-y-8 opacity-0 blur-lg'
                    )}
                >
                    让窗帘生意变得
                    <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                        简单
                    </span>
                </h2>

                <p
                    className={cn(
                        'mx-auto mt-6 max-w-xl text-xl text-gray-500 transition-all delay-300 duration-1000 sm:text-2xl',
                        isInView
                            ? 'translate-y-0 opacity-100 blur-0'
                            : 'translate-y-8 opacity-0 blur-md'
                    )}
                >
                    从线索到收款，一气呵成
                </p>

                {/* 数字指标 */}
                <div
                    className={cn(
                        'mx-auto mt-12 flex max-w-2xl flex-wrap justify-center gap-8 transition-all delay-500 duration-1000 sm:gap-16',
                        isInView
                            ? 'translate-y-0 opacity-100'
                            : 'translate-y-8 opacity-0'
                    )}
                >
                    {[
                        { value: '300%', label: '效率提升' },
                        { value: '0', label: '纸质单据' },
                        { value: '24/7', label: '数据可查' },
                    ].map((item) => (
                        <div key={item.label} className="text-center">
                            <div className="text-3xl font-bold text-blue-600 sm:text-4xl">
                                {item.value}
                            </div>
                            <div className="mt-1 text-sm text-gray-500">{item.label}</div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
