'use client';

import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { PaperButton } from './paper-button';

interface BatchAction {
  id: string;
  label: string;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'success' | 'warning' | 'error' | 'info';
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
}

interface BatchActionBarProps {
  selectedCount: number;
  actions: BatchAction[];
  onClearSelection?: () => void;
  className?: string;
}

export const BatchActionBar: React.FC<BatchActionBarProps> = ({
  selectedCount,
  actions,
  onClearSelection,
  className
}) => {
  return (
    <AnimatePresence>
      {selectedCount > 0 && (
        <motion.div
          initial={{ y: 100, opacity: 0, scale: 0.95 }} // ✨ 加上 scale 让入场更有张力
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: 100, opacity: 0, scale: 0.95 }}
          transition={{ type: 'spring', stiffness: 350, damping: 25 }}
          // ✨ 增加 mb-[env(safe-area-inset-bottom)] 适配 iPhone 底部黑条
          className="fixed bottom-6 left-0 right-0 z-50 flex justify-center pointer-events-none mb-[env(safe-area-inset-bottom)]"
        >
          <div
            role="toolbar" // ✨ A11y
            aria-label="批量操作栏"
            className={cn(
              // 布局
              'pointer-events-auto flex items-center justify-between gap-4 p-2 pl-4 pr-2 min-w-[320px] max-w-[calc(100vw-2rem)]',
              // 视觉
              'rounded-full shadow-2xl shadow-black/10 border border-theme-border/50', // ✨ 改为 rounded-full (胶囊) 更现代
              // 材质
              'bg-theme-bg-secondary/80 backdrop-blur-xl supports-[backdrop-filter]:bg-theme-bg-secondary/60',
              className
            )}
          >
            {/* 左侧：计数 */}
            <div className="flex items-center gap-3 pr-4 mr-2 border-r border-theme-border/50 shrink-0">
              <span className="flex items-center justify-center bg-primary-500 text-white text-xs font-bold rounded-full h-6 w-6 shadow-sm">
                {selectedCount}
              </span>
              <span className="text-sm font-medium text-theme-text-primary hidden sm:inline whitespace-nowrap">
                已选择
              </span>
              
              {onClearSelection && (
                <button
                  onClick={onClearSelection}
                  className="text-theme-text-secondary hover:text-theme-text-primary transition-colors p-1.5 rounded-full hover:bg-theme-bg-tertiary ml-1"
                  title="取消选择"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* 右侧：按钮组 (支持横向滚动) */}
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar scroll-smooth pr-1">
              {actions.map((action) => (
                <PaperButton
                  key={action.id}
                  variant={action.variant || 'ghost'} // ✨ 默认 ghost 或 secondary，避免喧宾夺主
                  size="sm" // 强制小尺寸，胶囊栏不宜过高
                  icon={action.icon}
                  onClick={action.onClick}
                  disabled={action.disabled}
                  className="whitespace-nowrap rounded-full px-4" // 按钮也圆角化
                >
                  {action.label}
                </PaperButton>
              ))}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
