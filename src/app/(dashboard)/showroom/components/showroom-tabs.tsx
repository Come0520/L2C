'use client';

import { motion } from 'framer-motion';
import { cn } from '@/shared/lib/utils';

interface ShowroomTabsProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export function ShowroomTabs({ activeTab, onTabChange }: ShowroomTabsProps) {
  const tabs = [
    { id: 'all', label: '精选', icon: '✨' },
    { id: 'product', label: '商品', icon: '🛍️' },
    { id: 'case', label: '案例', icon: '🏠' },
    { id: 'knowledge', label: '知识', icon: '📖' },
  ];

  return (
    <div className="scrollbar-hide flex items-center space-x-1 overflow-x-auto pb-2">
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={cn(
              'relative flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium whitespace-nowrap transition-all duration-300',
              isActive
                ? 'shadow-primary/25 scale-105 text-white shadow-lg'
                : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
            )}
          >
            {isActive && (
              <motion.div
                layoutId="activeTab"
                className="bg-primary absolute inset-0 z-0 rounded-full"
                transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
              />
            )}
            <span className="relative z-10">{tab.icon}</span>
            <span className="relative z-10">{tab.label}</span>
          </button>
        );
      })}
    </div>
  );
}
