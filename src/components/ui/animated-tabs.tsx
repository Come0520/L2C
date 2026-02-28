'use client';

import { motion } from 'motion/react';
import { cn } from '@/shared/lib/utils';

export interface TabItem {
  value: string;
  label: string;
  icon?: React.ReactNode;
}

interface AnimatedTabsProps {
  tabs: TabItem[];
  activeTab: string;
  onChange: (value: string) => void;
  layoutId?: string;
  containerClassName?: string;
  tabClassName?: string;
  activeTabClassName?: string;
  defaultTab?: string; // Compatibility
  contentClassName?: string; // Compatibility
  children?: React.ReactNode; // Compatibility
}

export const AnimatedTabs = ({
  tabs,
  activeTab,
  onChange,
  layoutId = 'animated-tabs',
  containerClassName,
  tabClassName,
  activeTabClassName,
  children, // Accept children but ignore for now if not handling content switching here
}: AnimatedTabsProps) => {
  return (
    <div className={cn('flex w-full flex-col', containerClassName)}>
      <div
        className={cn(
          'no-visible-scrollbar relative flex w-full max-w-full flex-row items-center justify-start overflow-auto [perspective:1000px] sm:overflow-visible'
          //  containerClassName - moved to wrapper
        )}
      >
        {tabs.map((tab) => (
          <button
            key={tab.value}
            onClick={() => onChange(tab.value)}
            className={cn(
              'relative rounded-full px-4 py-2 transition-colors outline-none',
              tabClassName,
              activeTab === tab.value
                ? 'text-black dark:text-white'
                : 'text-muted-foreground hover:text-foreground'
            )}
            style={{
              transformStyle: 'preserve-3d',
            }}
          >
            {activeTab === tab.value && (
              <motion.div
                layoutId={layoutId}
                transition={{ type: 'spring', bounce: 0.3, duration: 0.6 }}
                className={cn(
                  'absolute inset-0 rounded-full bg-white shadow-sm dark:bg-zinc-800',
                  activeTabClassName
                )}
              />
            )}

            <span className="relative z-10 block flex items-center gap-2 text-sm font-medium">
              {tab.icon}
              {tab.label}
            </span>
          </button>
        ))}
      </div>
      {children && <div className="mt-4">{children}</div>}
    </div>
  );
};
