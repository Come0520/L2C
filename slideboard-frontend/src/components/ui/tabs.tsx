"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useState, useEffect } from "react";

import { cn } from "@/lib/utils";

export type Tab = {
  title: string;
  value: string;
  content?: React.ReactNode;
};

interface TabsProps {
  tabs: Tab[];
  containerClassName?: string;
  activeTabClassName?: string;
  tabClassName?: string;
  contentClassName?: string;
  defaultValue?: string;
  onTabChange?: (value: string) => void;
}

/**
 * Animated Tabs 组件
 * 基于 Aceternity UI 设计，实现页面内内容切换和滑动动画效果
 */
export const Tabs = ({
  tabs: propTabs,
  containerClassName,
  activeTabClassName,
  tabClassName,
  contentClassName,
  defaultValue,
  onTabChange,
}: TabsProps) => {
  const getInitialTab = (): Tab => {
    if (defaultValue) {
      const found = propTabs.find(t => t.value === defaultValue);
      if (found) return found;
    }
    return propTabs[0] || { title: '', value: '', content: null };
  };

  const [active, setActive] = useState<Tab>(getInitialTab);
  const [tabs, setTabs] = useState<Tab[]>(propTabs);

  // Sync tabs when propTabs change
  useEffect(() => {
    setTabs(propTabs);
    // If current active tab is not in new tabs, select first one
    const stillExists = propTabs.find(t => t.value === active.value);
    if (!stillExists && propTabs.length > 0) {
      const firstTab = propTabs[0];
      if (firstTab) {
        setActive(firstTab);
      }
    }
  }, [propTabs]);

  // Sync with defaultValue
  useEffect(() => {
    if (defaultValue) {
      const tab = propTabs.find(t => t.value === defaultValue);
      if (tab && tab.value !== active.value) {
        setActive(tab);
      }
    }
  }, [defaultValue, propTabs]);

  const moveSelectedTabToTop = (idx: number) => {
    const selectedTab = propTabs[idx];
    if (!selectedTab) return;

    const newTabs = [...propTabs];
    newTabs.splice(idx, 1);
    newTabs.unshift(selectedTab);
    setTabs(newTabs);
    setActive(selectedTab);
    onTabChange?.(selectedTab.value);
  };

  return (
    <div className={cn("flex flex-col w-full", containerClassName)}>
      {/* Tab buttons with animated indicator */}
      <div
        className="flex flex-row items-center justify-start relative overflow-auto sm:overflow-visible no-visible-scrollbar max-w-full w-full"
        style={{ perspective: "1000px" }}
      >
        {propTabs.map((tab, idx) => (
          <button
            key={tab.value}
            onClick={() => moveSelectedTabToTop(idx)}
            className={cn(
              "relative px-4 py-2 rounded-full text-sm font-medium transition-colors duration-200",
              "outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2",
              tabClassName
            )}
            style={{ transformStyle: "preserve-3d" }}
          >
            {/* Animated active indicator - this is the key to the sliding animation */}
            {active.value === tab.value && (
              <motion.div
                layoutId="active-tab-indicator"
                transition={{
                  type: "spring",
                  bounce: 0.25,
                  duration: 0.5,
                }}
                className={cn(
                  "absolute inset-0 rounded-full",
                  "bg-theme-bg-secondary shadow-md",
                  activeTabClassName
                )}
                style={{ zIndex: 0 }}
              />
            )}
            {/* Tab text */}
            <span
              className={cn(
                "relative z-10 block transition-colors duration-200",
                active.value === tab.value
                  ? "text-theme-text-primary font-semibold"
                  : "text-theme-text-secondary hover:text-theme-text-primary"
              )}
            >
              {tab.title}
            </span>
          </button>
        ))}
      </div>

      {/* Content with fade animation */}
      <FadeInDiv
        tabs={tabs}
        active={active}
        className={cn("mt-8", contentClassName)}
      />
    </div>
  );
};

/**
 * FadeInDiv - 内容切换动画组件
 * 实现淡入淡出和轻微位移的过渡效果
 */
interface FadeInDivProps {
  className?: string;
  tabs: Tab[];
  active: Tab;
  hovering?: boolean;
}

export const FadeInDiv = ({
  className,
  tabs,
  active,
}: FadeInDivProps) => {
  const isActive = (tab: Tab) => tab.value === active.value;

  return (
    <div className={cn("relative w-full h-full", className)}>
      <AnimatePresence mode="wait">
        {tabs.map((tab) => {
          if (!isActive(tab)) return null;
          return (
            <motion.div
              key={tab.value}
              initial={{ opacity: 0, y: 10, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.98 }}
              transition={{
                duration: 0.3,
                ease: "easeInOut",
              }}
              className="w-full"
            >
              {tab.content}
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
};

export default Tabs;
