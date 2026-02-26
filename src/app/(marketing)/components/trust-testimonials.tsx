'use client';

import { useRef, useState, useEffect } from 'react';
import { useInView } from 'framer-motion';
import { Quote } from 'lucide-react';
import { trustStats, testimonialItems } from '@/constants/landing-data';
import { cn } from '@/shared/utils';

/**
 * CountUp 动画：数字从 0 滚动到目标值
 */
function CountUp({ target, suffix }: { target: number; suffix: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true });

  useEffect(() => {
    if (!isInView) return;
    const duration = 2000; // 2 秒
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

/**
 * 第 5 幕：客户认可 (Trust & Testimonials)
 * 合并数字指标与用户评价，增强社会证明
 */
export function TrustTestimonials() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(sectionRef, { once: true, margin: '-100px' });

  return (
    <section id="testimonials" ref={sectionRef} className="bg-gray-50 py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-16 text-center">
          <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl">他们都在用 L2C</h2>
          <p className="mt-4 text-lg text-gray-500">数字说话，口碑说话</p>
        </div>

        {/* 上半部分：数字指标 */}
        <div
          className={cn(
            'mb-16 grid gap-8 transition-all duration-700 sm:grid-cols-3',
            isInView ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
          )}
        >
          {trustStats.map((stat) => (
            <div
              key={stat.label}
              className="rounded-2xl border border-gray-200/60 bg-white p-8 text-center shadow-sm"
            >
              <div className="text-4xl font-bold text-blue-600 sm:text-5xl">
                <CountUp target={stat.value} suffix={stat.suffix} />
              </div>
              <div className="mt-2 text-sm font-medium text-gray-500">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* 下半部分：用户评价卡片 */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {testimonialItems.map((item, i) => (
            <div
              key={item.id}
              className={cn(
                'rounded-2xl border border-gray-200/60 bg-white p-8 shadow-sm transition-all duration-700',
                isInView ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
              )}
              style={{ transitionDelay: `${300 + i * 150}ms` }}
            >
              <Quote size={28} className="text-blue-200" />
              <p className="mt-4 leading-relaxed text-gray-700">{item.content}</p>
              <div className="mt-6 border-t border-gray-100 pt-4">
                <p className="font-semibold text-gray-900">{item.author}</p>
                <p className="text-sm text-gray-500">
                  {item.company} / {item.role}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
