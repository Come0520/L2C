'use client';

import { useRef, useState, useEffect } from 'react';
import { useInView } from 'framer-motion';
import { cn } from '@/shared/utils';
import type { LandingStats, GrowthDataPoint } from '../actions/landing-stats';
import { GrowthChart } from './growth-chart';

/**
 * CountUp 动画：数字从 0 滚动到目标值
 */
function CountUp({ target, suffix }: { target: number; suffix: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true });

  useEffect(() => {
    if (!isInView) return;
    const duration = 2000;
    const steps = 60;
    const increment = target / steps;
    let current = 0;
    const timer = setInterval(() => {
      current += increment;
      if (current >= target) {
        setCount(target);
        clearInterval(timer);
      } else {
        setCount(Math.floor(current));
      }
    }, duration / steps);
    return () => clearInterval(timer);
  }, [isInView, target]);

  return (
    <span ref={ref}>
      {count.toLocaleString()}
      {suffix}
    </span>
  );
}

/** macOS 风格三点装饰 */
function MacDots() {
  return (
    <div className="flex gap-1.5">
      <span className="h-2.5 w-2.5 rounded-full bg-red-400/70" />
      <span className="h-2.5 w-2.5 rounded-full bg-amber-400/70" />
      <span className="h-2.5 w-2.5 rounded-full bg-emerald-400/70" />
    </div>
  );
}

interface TrustTestimonialsProps {
  /** 来自服务端的真实统计数据 */
  stats: LandingStats;
  /** 企业增长趋势图表数据 */
  growthTrend: GrowthDataPoint[];
}

/**
 * 第 5 幕：客户认可 (Trust & Metrics)
 * 展示数字指标与企业增长趋势图，增强社会证明
 * 用户真实评价将在荣誉墙模块中展示
 */
export function TrustTestimonials({ stats, growthTrend }: TrustTestimonialsProps) {
  const sectionRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(sectionRef, { once: true, margin: '-100px' });

  const statCards = [
    {
      label: '账套数量',
      sublabel: '活跃服务账套数',
      value: stats.tenantCount,
      suffix: '',
    },
    {
      label: '管理用户',
      sublabel: '系统活跃用户数',
      value: stats.userCount,
      suffix: '',
    },
    {
      label: '订单履约',
      sublabel: '处理历史订单总数',
      value: stats.orderCount,
      suffix: '',
    },
  ];

  return (
    <section id="testimonials" ref={sectionRef} className="bg-gray-50 py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-16 text-center">
          <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl">他们都在用 L2C</h2>
          <p className="mt-4 text-lg text-gray-500">数字说话，真实增长</p>
        </div>

        {/* 统一风格卡片：上层3个数字指标 + 下方1个增长趋势图 */}
        <div
          className={cn(
            'grid gap-6 transition-all duration-700 sm:grid-cols-2 lg:grid-cols-3',
            isInView ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
          )}
        >
          {/* 数字统计卡片（统一 macOS 风格） */}
          {statCards.map((stat) => (
            <div
              key={stat.label}
              className="overflow-hidden rounded-2xl border border-gray-200/60 bg-white shadow-sm"
            >
              {/* 卡片头部：标签 + macOS 三点 */}
              <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  {stat.label}
                </p>
                <MacDots />
              </div>
              {/* 数字主体 */}
              <div className="px-6 py-8 text-center">
                <div className="text-4xl font-bold text-blue-600 sm:text-5xl">
                  {stat.value > 0 ? (
                    <CountUp target={stat.value} suffix={stat.suffix} />
                  ) : (
                    <span>—</span>
                  )}
                </div>
                <div className="mt-2 text-xs text-slate-400">{stat.sublabel}</div>
              </div>
            </div>
          ))}

          {/* 增长趋势图（GrowthChart 已内置相同风格的头部） */}
          <div className="sm:col-span-2 lg:col-span-3">
            <GrowthChart data={growthTrend} total={stats.tenantCount} />
          </div>
        </div>
      </div>
    </section>
  );
}
