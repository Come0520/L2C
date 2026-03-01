'use client';

import { useState, useMemo, useCallback } from 'react';
import { X } from 'lucide-react';
import { danmakuItems, type DanmakuItem } from '@/constants/landing-data';
import { cn } from '@/shared/utils';

/**
 * 第 2 幕：痛点弹幕 (Pain Danmaku)
 * 核心交互创意：弹幕从右向左飘动，点击打开解决方案卡片
 * 改进：
 *  - 使用足量内容副本确保弹幕永不断流
 *  - 每条弹幕支持🔥小火苗点赞计数（独立、持久于本次会话）
 */
export function PainDanmaku() {
  const [selectedPain, setSelectedPain] = useState<DanmakuItem | null>(null);
  // 小火苗计数 Map：{ danmakuId => count }
  const [fireCounts, setFireCounts] = useState<Record<string, number>>({});

  // 处理点赞：每次点击弹幕，对应 id 的火苗 +1
  const handleClick = useCallback((item: DanmakuItem) => {
    setFireCounts((prev) => ({
      ...prev,
      [item.id]: (prev[item.id] ?? 0) + 1,
    }));
    setSelectedPain(item);
  }, []);

  // 将弹幕分布到多轨道（5条轨道），并复制足够多份确保无缝循环
  const tracks = useMemo(() => {
    const trackCount = 5;
    const result: DanmakuItem[][] = Array.from({ length: trackCount }, () => []);
    danmakuItems.forEach((item, i) => {
      result[i % trackCount].push(item);
    });
    return result;
  }, []);

  // 每条轨道的滚动速度（不同轨道速度微差，营造层次感）
  const trackDurations = [38, 46, 42, 50, 44]; // 单位：秒
  // 奇数轨道方向相反（可选，增加动感；此处保持同向）
  const trackDelays = [0, -12, -6, -20, -8]; // 负值 delay 让动画错开起点

  return (
    <section id="pain-points" className="relative overflow-hidden bg-gray-950 py-24 sm:py-32">
      {/* 章节标题 */}
      <div className="mb-16 px-4 text-center">
        <h2 className="text-3xl font-bold text-white sm:text-4xl lg:text-5xl">
          家具行业的每一天......
        </h2>
        <p className="mt-4 text-lg text-gray-400">
          你是否正在经历？
          <span className="ml-2 text-sm text-gray-500">点击弹幕查看解决方案，还能点燃 🔥</span>
        </p>
      </div>

      {/* 弹幕区域 */}
      <div className="relative space-y-3 sm:space-y-4">
        {tracks.map((trackItems, trackIdx) => {
          // 每条轨道复制 4 份数据，保证内容足够长，视觉上永不出现空白
          const repeatedItems = [...trackItems, ...trackItems, ...trackItems, ...trackItems];

          return (
            <div key={trackIdx} className="relative flex overflow-hidden">
              {/* mask-image 两侧渐隐，提升视觉质感 */}
              <div
                className="pointer-events-none absolute inset-y-0 left-0 z-10 w-20"
                style={{
                  background: 'linear-gradient(to right, rgb(3,7,18) 0%, transparent 100%)',
                }}
              />
              <div
                className="pointer-events-none absolute inset-y-0 right-0 z-10 w-20"
                style={{
                  background: 'linear-gradient(to left, rgb(3,7,18) 0%, transparent 100%)',
                }}
              />

              {/*
               * 无缝滚动核心：translate 从 0 → -50%
               * 因为内容是 4 份，每次实际移动 50% 正好是 2 份（可感知循环点）
               * 但由于有 4 份总内容，-50% 终点接续 -50% 起点视觉完全一致
               */}
              <div
                className="animate-marquee flex shrink-0 gap-3"
                style={{
                  animationDuration: `${trackDurations[trackIdx]}s`,
                  animationDelay: `${trackDelays[trackIdx]}s`,
                  // will-change 优化 GPU 合成
                  willChange: 'transform',
                }}
              >
                {repeatedItems.map((item, i) => {
                  const fireCount = fireCounts[item.id] ?? 0;
                  return (
                    <button
                      key={`${item.id}-${i}`}
                      onClick={() => handleClick(item)}
                      className={cn(
                        'group relative rounded-full border px-5 py-2.5 text-sm font-medium whitespace-nowrap transition-all duration-200',
                        'cursor-pointer select-none',
                        'border-gray-700/50 bg-gray-800/60 text-gray-300 backdrop-blur-sm',
                        'hover:scale-105 hover:border-orange-500/50 hover:bg-orange-900/30 hover:text-white hover:shadow-lg hover:shadow-orange-500/10',
                        // 已被点赞的弹幕微微发光
                        fireCount > 0 && 'border-orange-600/40 bg-orange-950/40 text-orange-100'
                      )}
                    >
                      &ldquo;{item.pain}&rdquo;
                      {/* 小火苗角标：有点击记录才显示 */}
                      {fireCount > 0 && (
                        <span
                          className={cn(
                            'absolute -top-1.5 -right-1.5 flex items-center gap-0.5',
                            'rounded-full bg-orange-500 px-1.5 py-0.5 text-[10px] font-bold text-white',
                            'shadow-lg shadow-orange-500/40',
                            'animate-bounce-once'
                          )}
                        >
                          🔥 {fireCount}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
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

            {/* 顶部：分类标签 + 火苗计数 */}
            <div className="flex items-center justify-between">
              <span className="inline-flex rounded-full bg-red-50 px-3 py-1 text-xs font-medium text-red-600">
                {selectedPain.category}
              </span>
              {(fireCounts[selectedPain.id] ?? 0) > 0 && (
                <span className="flex items-center gap-1 text-sm font-semibold text-orange-500">
                  🔥 {fireCounts[selectedPain.id]} 人觉得痛
                </span>
              )}
            </div>

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
