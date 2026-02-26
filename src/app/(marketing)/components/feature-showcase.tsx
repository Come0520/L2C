'use client';

import { useRef } from 'react';
import { useInView } from 'framer-motion';
import { Users, FileText, Package, Ruler, BarChart3 } from 'lucide-react';
import { featureItems } from '@/constants/landing-data';
import { cn } from '@/shared/utils';

/** Lucide 图标名称到组件的映射 */
const iconMap: Record<string, React.ElementType> = {
  Users,
  FileText,
  Package,
  Ruler,
  BarChart3,
};

/**
 * 单个功能亮点卡片
 */
function FeatureCard({ feature, index }: { feature: (typeof featureItems)[0]; index: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-80px' });
  const Icon = iconMap[feature.icon] || Users;
  const isEven = index % 2 === 0;

  return (
    <div
      ref={ref}
      className={cn(
        'grid items-center gap-8 py-12 lg:grid-cols-2 lg:gap-16 lg:py-20',
        isEven ? '' : 'lg:direction-rtl'
      )}
    >
      {/* 文字区 */}
      <div
        className={cn(
          'transition-all duration-700',
          isInView
            ? 'translate-x-0 opacity-100'
            : isEven
              ? '-translate-x-12 opacity-0'
              : 'translate-x-12 opacity-0',
          !isEven && 'lg:direction-ltr lg:order-2'
        )}
      >
        <div className="inline-flex rounded-xl bg-blue-50 p-3 text-blue-600">
          <Icon size={28} />
        </div>
        <h3 className="mt-4 text-2xl font-bold text-gray-900 sm:text-3xl">{feature.title}</h3>
        <p className="mt-2 text-lg font-medium text-blue-600">{feature.tagline}</p>
        <p className="mt-3 leading-relaxed text-gray-600">{feature.description}</p>
      </div>

      {/* 视觉区（V1 使用占位图） */}
      <div
        className={cn(
          'transition-all delay-200 duration-700',
          isInView
            ? 'translate-x-0 opacity-100'
            : isEven
              ? 'translate-x-12 opacity-0'
              : '-translate-x-12 opacity-0',
          !isEven && 'lg:direction-ltr lg:order-1'
        )}
      >
        <div className="flex aspect-[4/3] items-center justify-center rounded-2xl border border-gray-200/60 bg-gradient-to-br from-gray-50 to-gray-100 shadow-sm">
          <div className="text-center">
            <Icon size={48} className="mx-auto text-gray-300" />
            <p className="mt-2 text-sm text-gray-400">功能截图待补充</p>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * 第 4 幕：功能亮点展示 (Feature Showcase)
 */
export function FeatureShowcase() {
  return (
    <section id="features" className="bg-white py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-16 text-center">
          <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl">一套系统，搞定全流程</h2>
          <p className="mt-4 text-lg text-gray-500">以结果为导向设计的功能模块</p>
        </div>

        <div className="divide-y divide-gray-100">
          {featureItems.map((feature, i) => (
            <FeatureCard key={feature.id} feature={feature} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
