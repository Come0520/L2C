'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { heroCarouselItems } from '@/constants/landing-data';
import { cn } from '@/shared/utils';

/**
 * 第 1 幕：品牌故事与运营广告 (Hero Section)
 * 全屏首视野，文字逐行入场 + 自动轮播广告位
 */
export function HeroSection() {
    const [currentSlide, setCurrentSlide] = useState(0);

    // 自动轮播
    const nextSlide = useCallback(() => {
        setCurrentSlide((prev) => (prev + 1) % heroCarouselItems.length);
    }, []);

    useEffect(() => {
        const timer = setInterval(nextSlide, 5000);
        return () => clearInterval(timer);
    }, [nextSlide]);

    // 客户端组件默认可见，CSS transitions 提供入场效果
    const isVisible = true;

    const slide = heroCarouselItems[currentSlide];

    return (
        <section
            id="hero"
            className="relative flex min-h-screen items-center overflow-hidden pt-20"
        >
            {/* 背景装饰 */}
            <div className="pointer-events-none absolute inset-0 -z-10">
                <div className="absolute -top-40 -right-40 h-[600px] w-[600px] rounded-full bg-blue-100/50 blur-3xl" />
                <div className="absolute -bottom-40 -left-40 h-[500px] w-[500px] rounded-full bg-indigo-100/40 blur-3xl" />
            </div>

            <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
                    {/* 左侧品牌叙事 */}
                    <div className="max-w-2xl">
                        <h1
                            className={cn(
                                'text-4xl font-bold leading-tight tracking-tight text-gray-900 transition-all duration-700 sm:text-5xl lg:text-6xl',
                                isVisible
                                    ? 'translate-y-0 opacity-100'
                                    : 'translate-y-8 opacity-0'
                            )}
                        >
                            让窗帘生意
                            <br />
                            <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                                回归简单
                            </span>
                        </h1>

                        <p
                            className={cn(
                                'mt-6 text-lg leading-relaxed text-gray-600 transition-all delay-200 duration-700 sm:text-xl',
                                isVisible
                                    ? 'translate-y-0 opacity-100'
                                    : 'translate-y-8 opacity-0'
                            )}
                        >
                            我们是一群来自家居行业的从业者。
                            <br className="hidden sm:block" />
                            见过太多门店老板被 Excel、微信群和手写单据困住。
                            <br className="hidden sm:block" />
                            所以我们做了 L2C —— 从线索到收款，一站式管理。
                        </p>

                        <div
                            className={cn(
                                'mt-8 flex flex-wrap gap-4 transition-all delay-400 duration-700',
                                isVisible
                                    ? 'translate-y-0 opacity-100'
                                    : 'translate-y-8 opacity-0'
                            )}
                        >
                            <Link
                                href="/register/tenant"
                                className="inline-flex items-center rounded-xl bg-blue-600 px-7 py-3.5 text-base font-semibold text-white shadow-lg shadow-blue-600/25 transition-all hover:-translate-y-0.5 hover:bg-blue-700 hover:shadow-xl hover:shadow-blue-600/30"
                            >
                                免费开始
                            </Link>
                            <a
                                href="#features"
                                className="inline-flex items-center rounded-xl border border-gray-300 bg-white px-7 py-3.5 text-base font-semibold text-gray-700 transition-all hover:-translate-y-0.5 hover:border-gray-400 hover:shadow-md"
                            >
                                了解更多
                            </a>
                        </div>
                    </div>

                    {/* 右侧轮播广告 */}
                    <div
                        className={cn(
                            'relative transition-all delay-300 duration-700',
                            isVisible
                                ? 'translate-y-0 opacity-100'
                                : 'translate-y-12 opacity-0'
                        )}
                    >
                        <div className="relative overflow-hidden rounded-2xl border border-gray-200/60 bg-gradient-to-br from-gray-50 to-white p-8 shadow-xl sm:p-10">
                            {/* 轮播内容 */}
                            <div key={slide.id} className="animate-fade-in space-y-4">
                                <h3 className="text-2xl font-bold text-gray-900">
                                    {slide.title}
                                </h3>
                                <p className="leading-relaxed text-gray-600">
                                    {slide.subtitle}
                                </p>
                                {slide.cta && (
                                    <Link
                                        href={slide.cta.href}
                                        className="inline-flex items-center text-sm font-semibold text-blue-600 transition-colors hover:text-blue-700"
                                    >
                                        {slide.cta.text}
                                        <ChevronRight size={16} className="ml-1" />
                                    </Link>
                                )}
                            </div>

                            {/* 轮播控制 */}
                            <div className="mt-8 flex items-center justify-between">
                                <div className="flex gap-2">
                                    {heroCarouselItems.map((_, i) => (
                                        <button
                                            key={i}
                                            onClick={() => setCurrentSlide(i)}
                                            className={cn(
                                                'h-1.5 rounded-full transition-all duration-300',
                                                i === currentSlide
                                                    ? 'w-8 bg-blue-600'
                                                    : 'w-4 bg-gray-300 hover:bg-gray-400'
                                            )}
                                            aria-label={`Slide ${i + 1}`}
                                        />
                                    ))}
                                </div>

                                <div className="flex gap-2">
                                    <button
                                        onClick={() =>
                                            setCurrentSlide(
                                                (prev) =>
                                                    (prev - 1 + heroCarouselItems.length) %
                                                    heroCarouselItems.length
                                            )
                                        }
                                        className="rounded-full border border-gray-200 p-2 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700"
                                        aria-label="Previous slide"
                                    >
                                        <ChevronLeft size={16} />
                                    </button>
                                    <button
                                        onClick={nextSlide}
                                        className="rounded-full border border-gray-200 p-2 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700"
                                        aria-label="Next slide"
                                    >
                                        <ChevronRight size={16} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
