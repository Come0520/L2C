"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import Link from "next/link";

export type Tab = {
  title: string;
  value: string;
  href?: string;
  content?: string | React.ReactNode | any;
};

export const Tabs = ({
  tabs: propTabs,
  containerClassName,
  activeTabClassName,
  tabClassName,
  contentClassName,
  activeTab,
  layoutId,
}: {
  tabs: Tab[];
  containerClassName?: string;
  activeTabClassName?: string;
  tabClassName?: string;
  contentClassName?: string;
  activeTab?: string;
  layoutId?: string;
}) => {
  const [active, setActive] = useState<Tab>(propTabs[0]!);
  const [tabs, setTabs] = useState<Tab[]>(propTabs);
  const [hovering, setHovering] = useState(false);
  const uniqueLayoutId = layoutId || "clickedbutton";

  // Determine the effective active tab
  // Prioritize exact match, then prefix match (longest prefix first to avoid short prefix shadowing)
  const effectiveActive = activeTab
    ? propTabs.find((tab) => tab.value === activeTab) || 
      propTabs
        .filter((tab) => tab.href && activeTab?.startsWith(tab.href))
        .sort((a, b) => (b.href?.length || 0) - (a.href?.length || 0))[0] || 
      propTabs[0]
    : active;

  // Sync internal active state with prop if needed (optional, but good for consistency)
  useEffect(() => {
    if (activeTab && effectiveActive) {
      setActive(effectiveActive);
    }
  }, [activeTab, effectiveActive]);

  const moveSelectedTabToTop = (idx: number) => {
    // Deprecated for navigation tabs, but kept for simple content switching if needed
    if (propTabs[idx]) {
      setActive(propTabs[idx]);
    }
  };

  return (
    <div className={cn("flex flex-col w-full", containerClassName)}>
      <div className="flex flex-row items-center justify-start [perspective:1000px] relative overflow-auto sm:overflow-visible no-visible-scrollbar max-w-full w-full mb-8">
        {propTabs.map((tab, idx) => {
          const Component = tab.href ? Link : "button";
          
          return (
            <Component
              key={tab.title}
              href={tab.href || "#"}
              onClick={(e: any) => {
                if (!tab.href) {
                  e.preventDefault();
                  moveSelectedTabToTop(idx);
                }
                // If it is a link, let default behavior happen or Next.js Link handle it
              }}
              className={cn(
                "relative px-4 py-2 rounded-full text-sm font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-primary-500",
                tabClassName
              )}
              style={{
                transformStyle: "preserve-3d",
              }}
            >
              {effectiveActive?.value === tab.value && (
                <motion.div
                  layoutId={uniqueLayoutId}
                  transition={{ type: "spring", bounce: 0.3, duration: 1 }}
                  className={cn(
                    "absolute inset-0 rounded-full",
                    "bg-paper-500 shadow-sm",
                    activeTabClassName
                  )}
                />
              )}

              <span
                className={cn(
                  "relative block z-10",
                  effectiveActive?.value === tab.value
                    ? "text-ink-900 font-semibold"
                    : "text-ink-500 hover:text-ink-900"
                )}
              >
                {tab.title}
              </span>
            </Component>
          );
        })}
      </div>

      {/* Simplified content rendering without 3D stack */}
      <div className={cn("relative w-full", contentClassName)}>
         {effectiveActive?.content}
      </div>
    </div>
  );
};
