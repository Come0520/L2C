'use client';

import { useState, useId, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/shared/lib/utils';

type Tab = {
    title: string;
    value: string;
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
    // 这是一个合理的模式：同步受�?prop 到本�?state 用于乐观更新
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

        // Immediate Visual Update (Optimistic) - 立即更新本地状态触发动�?
        setLocalActiveTab(value);

        // 使用 requestAnimationFrame 确保动画开始后再触发数据获�?
        // 这保证了 Pill 动画可以在下一帧立即开始，不被主线程工作阻�?
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
                    'flex flex-row items-center justify-start relative overflow-auto sm:overflow-visible no-visible-scrollbar max-w-full w-full',
                    containerClassName
                )}
            >
                {propTabs.map((tab, idx) => {
                    const isActive = active.value === tab.value;
                    return (
                        <button
                            key={tab.value}
                            ref={(el) => { tabRefs.current[idx] = el; }}
                            role="tab"
                            aria-selected={isActive}
                            aria-controls={`${tabsId}-panel-${tab.value}`}
                            id={`${tabsId}-tab-${tab.value}`}
                            tabIndex={isActive ? 0 : -1}
                            onClick={() => handleTabClick(tab.value)}
                            onKeyDown={(e) => handleKeyDown(e, idx)}
                            onMouseEnter={() => setHovering(true)}
                            onMouseLeave={() => setHovering(false)}
                            className={cn('relative px-4 py-2 rounded-full outline-none transition-colors focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2', tabClassName)}
                        >
                            {isActive && (
                                <motion.div
                                    layout
                                    layoutId={layoutId}
                                    // 优化后的弹簧参数：更快响应，更少回弹
                                    transition={{
                                        type: 'spring',
                                        stiffness: 400,
                                        damping: 30,
                                        mass: 0.8,
                                    }}
                                    // 移除 backdrop-blur，使用纯色背景消�?GPU 压力
                                    className={cn(
                                        'absolute inset-0 bg-white dark:bg-zinc-800 rounded-full shadow-md z-0',
                                        activeTabClassName
                                    )}
                                    // 提示浏览器优�?transform
                                    style={{ willChange: 'transform' }}
                                />
                            )}

                            <span className={cn(
                                "relative block text-sm font-medium transition-colors duration-150 z-10",
                                isActive
                                    ? "text-primary dark:text-white"
                                    : "text-muted-foreground hover:text-foreground"
                            )}>
                                {tab.title}
                            </span>
                        </button>
                    );
                })}
            </div>

            {/* Content Section - only render if ANY tab has content */}
            {propTabs.some(t => t.content) && (
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
        <div className={cn('relative w-full h-full', className)}>
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
                            "absolute inset-0 w-full h-full transition-all duration-500",
                            isActive ? "opacity-100 scale-100 z-10" : "opacity-0 scale-95 z-0 pointer-events-none"
                        )}
                        style={hovering ? {
                            // Optional: Add hover 3D lift effect logic here if desired
                        } : {}}
                    >
                        {tab.content}
                    </div>
                );
            })}
        </div>
    );
};
