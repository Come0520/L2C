'use client';

import { useState, useRef, useMemo } from 'react';
import { X } from 'lucide-react';
import { danmakuItems, type DanmakuItem } from '@/constants/landing-data';
import { cn } from '@/shared/utils';

/**
 * 第 2 幕：痛点弹幕 (Pain Danmaku)
 * 核心交互创意：弹幕从右向左飘动，点击展示解决方案卡片
 */
export function PainDanmaku() {
  const [selectedPain, setSelectedPain] = useState<DanmakuItem | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // 将弹幕分布到多轨道上
  const tracks = useMemo(() => {
    const trackCount = 5;
    const result: DanmakuItem[][] = Array.from({ length: trackCount }, () => []);
    danmakuItems.forEach((item, i) => {
      result[i % trackCount].push(item);
    });
    return result;
  }, []);

  return (
    <section id="pain-points" className="relative overflow-hidden bg-gray-950 py-24 sm:py-32">
      {/* 章节标题 */}
      <div className="mb-16 px-4 text-center">
        <h2 className="text-3xl font-bold text-white sm:text-4xl lg:text-5xl">
          家具行业的每一天......
        </h2>
        <p className="mt-4 text-lg text-gray-400">
          你是否正在经历？<span className="ml-2 text-sm text-gray-500">点击弹幕查看解决方案</span>
        </p>
      </div>

      {/* 弹幕区域 */}
      <div ref={containerRef} className="relative space-y-3 sm:space-y-4">
        {tracks.map((trackItems, trackIdx) => (
          <div key={trackIdx} className="relative flex overflow-hidden">
            <div
              className="animate-marquee flex shrink-0 gap-4"
              style={{
                animationDuration: `${30 + trackIdx * 8}s`,
                animationDelay: `${trackIdx * -2}s`,
              }}
            >
              {/* 双倍内容实现无缝循环 */}
              {[...trackItems, ...trackItems].map((item, i) => (
                <button
                  key={`${item.id}-${i}`}
                  onClick={() => setSelectedPain(item)}
                  className={cn(
                    'rounded-full border px-5 py-2.5 text-sm font-medium whitespace-nowrap transition-all duration-200',
                    'cursor-pointer select-none',
                    'border-gray-700/50 bg-gray-800/60 text-gray-300 backdrop-blur-sm',
                    'hover:scale-105 hover:border-blue-500/50 hover:bg-blue-900/40 hover:text-white hover:shadow-lg hover:shadow-blue-500/10'
                  )}
                >
                  &ldquo;{item.pain}&rdquo;
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* 解决方案浮层卡片 */}
      {selectedPain && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
          onClick={() => setSelectedPain(null)}
        >
          <div
            className="animate-scale-in relative w-full max-w-lg rounded-2xl border border-gray-200 bg-white p-8 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setSelectedPain(null)}
              className="absolute top-4 right-4 rounded-full p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
              aria-label="关闭"
            >
              <X size={20} />
            </button>

            <span className="inline-flex rounded-full bg-red-50 px-3 py-1 text-xs font-medium text-red-600">
              {selectedPain.category}
            </span>

            <h3 className="mt-4 text-lg font-bold text-gray-900">痛点</h3>
            <p className="mt-1 text-gray-600">&ldquo;{selectedPain.pain}&rdquo;</p>

            <h3 className="mt-6 text-lg font-bold text-blue-600">L2C 解决方案</h3>
            <p className="mt-1 leading-relaxed text-gray-600">{selectedPain.solution}</p>
          </div>
        </div>
      )}
    </section>
  );
}
