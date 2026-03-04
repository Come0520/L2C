'use client';

import { useState, useId, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { cn } from '@/shared/lib/utils';

/** Aceternity Tabs 的标签页配置类型 */
export type Tab = {
  /** 显示标题 */
  title: string;
  /** 唯一标识值 */
  value: string;
  /** 可选图标（兼容旧 AnimatedTabs 用法） */
  icon?: React.ReactNode;
  /** 标签页内容 */
  content?: string | React.ReactNode;
};

export const AceternityTabs = ({
  tabs: propTabs,
  containerClassName,
  activeTabClassName,
  tabClassName,
  contentClassName,
  activeTab,
  onTabChange,
}: {
  tabs: Tab[];
  containerClassName?: string;
  activeTabClassName?: string;
  tabClassName?: string;
  contentClassName?: string;
  activeTab?: string;
  onTabChange?: (value: string) => void;
}) => {
  // Optimistic UI State
  const defaultActiveValue = propTabs[0]?.value;
  const [localActiveTab, setLocalActiveTab] = useState(activeTab ?? defaultActiveValue);

  // Sync local state when prop changes from external source
  // 这是一个合理的模式：同步受控 prop 到本地 state 用于乐观更新
  useEffect(() => {
    if (activeTab !== undefined && activeTab !== localActiveTab) {
      setLocalActiveTab(activeTab);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  // Use derived state for finding active tab object
  // Ensure we always have a fallback
  const active = propTabs.find((tab) => tab.value === localActiveTab) || propTabs[0];

  // Unique layout ID for the pill animation
  const layoutId = useId();
  // Unique ID prefix for ARIA attributes
  const tabsId = useId();

  const [hovering, setHovering] = useState(false);

  // Refs for keyboard navigation
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const handleTabClick = (value: string) => {
    if (value === localActiveTab) return;

    // Immediate Visual Update (Optimistic) - 立即更新本地状态触发动画
    setLocalActiveTab(value);

    // 使用 requestAnimationFrame 确保动画开始后再触发数据获取
    // 这保证了 Pill 动画可以在下一帧立即开始，不被主线程工作阻塞
    requestAnimationFrame(() => {
      onTabChange?.(value);
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>, index: number) => {
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      const prevIndex = (index - 1 + propTabs.length) % propTabs.length;
      const prevTab = propTabs[prevIndex];
      handleTabClick(prevTab.value);
      tabRefs.current[prevIndex]?.focus();
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      const nextIndex = (index + 1) % propTabs.length;
      const nextTab = propTabs[nextIndex];
      handleTabClick(nextTab.value);
      tabRefs.current[nextIndex]?.focus();
    }
  };

  return (
    <div className="w-full">
      <div
        role="tablist"
        aria-orientation="horizontal"
        className={cn(
          'no-visible-scrollbar relative flex w-full max-w-full flex-row items-center justify-start overflow-auto sm:overflow-visible',
          containerClassName
        )}
      >
        {propTabs.map((tab, idx) => {
          const isActive = active.value === tab.value;
          return (
            <button
              key={tab.value}
              ref={(el) => {
                tabRefs.current[idx] = el;
              }}
              role="tab"
              aria-selected={isActive}
              aria-controls={`${tabsId}-panel-${tab.value}`}
              id={`${tabsId}-tab-${tab.value}`}
              tabIndex={isActive ? 0 : -1}
              onClick={() => handleTabClick(tab.value)}
              onKeyDown={(e) => handleKeyDown(e, idx)}
              onMouseEnter={() => setHovering(true)}
              onMouseLeave={() => setHovering(false)}
              className={cn(
                'focus-visible:ring-primary relative rounded-full px-4 py-2 transition-colors outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
                tabClassName
              )}
            >
              {isActive && (
                <motion.div
                  layout
                  layoutId={layoutId}
                  // 优化后的弹簧参数：更快响应、更少回弹
                  transition={{
                    type: 'spring',
                    stiffness: 400,
                    damping: 30,
                    mass: 0.8,
                  }}
                  // 移除 backdrop-blur，使用纯色背景消除 GPU 压力
                  className={cn(
                    'absolute inset-0 z-0 rounded-full bg-white shadow-md dark:bg-zinc-800',
                    activeTabClassName
                  )}
                  // 提示浏览器优化 transform
                  style={{ willChange: 'transform' }}
                />
              )}

              <span
                className={cn(
                  'relative z-10 flex items-center gap-2 text-sm font-medium transition-colors duration-150',
                  isActive
                    ? 'text-primary dark:text-white'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                {tab.icon}
                {tab.title}
              </span>
            </button>
          );
        })}
      </div>

      {/* Content Section - only render if ANY tab has content */}
      {propTabs.some((t) => t.content) && (
        <FadeInDiv
          tabs={propTabs}
          active={active}
          key={active.value}
          hovering={hovering}
          className={cn('mt-8', contentClassName)}
          tabsId={tabsId}
        />
      )}
    </div>
  );
};

export const FadeInDiv = ({
  className,
  tabs,
  active,
  hovering,
  tabsId,
}: {
  className?: string;
  key?: string;
  tabs: Tab[];
  active: Tab;
  hovering?: boolean;
  tabsId: string;
}) => {
  return (
    <div className={cn('relative h-full w-full', className)}>
      {tabs.map((tab) => {
        const isActive = tab.value === active.value;
        return (
          <div
            key={tab.value}
            role="tabpanel"
            id={`${tabsId}-panel-${tab.value}`}
            aria-labelledby={`${tabsId}-tab-${tab.value}`}
            hidden={!isActive}
            className={cn(
              'absolute inset-0 h-full w-full transition-all duration-500',
              isActive ? 'z-10 scale-100 opacity-100' : 'pointer-events-none z-0 scale-95 opacity-0'
            )}
            style={
              hovering
                ? {
                    // Optional: Add hover 3D lift effect logic here if desired
                  }
                : {}
            }
          >
            {tab.content}
          </div>
        );
      })}
    </div>
  );
};
