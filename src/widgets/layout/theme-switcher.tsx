'use client';

import * as React from 'react';
import Image from 'next/image';
import { useTheme } from 'next-themes';
import { motion, AnimatePresence } from 'framer-motion';
import { Sun, Moon } from 'lucide-react';
import { cn } from '@/shared/lib/utils';

const themes = [
  { id: 'light', label: '明亮', icon: Sun },
  { id: 'dark', label: '暗黑', icon: Moon },
];

export function ThemeSwitcher({ open = true }: { open?: boolean; animate?: boolean }) {
  const { theme, setTheme } = useTheme();
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);

  // 点击外部关闭
  React.useEffect(() => {
    if (!isMenuOpen) return;
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isMenuOpen]);

  return (
    <div className="group relative flex items-center" ref={containerRef}>
      {/* Logo 区域 - 用 Logo 作为触发器 */}
      <button
        onClick={() => setIsMenuOpen(!isMenuOpen)}
        className={cn(
          'relative z-101 flex h-10 w-10 items-center justify-center rounded-xl transition-all duration-300',
          'hover:bg-black/5 active:scale-95 dark:hover:bg-white/10',
          isMenuOpen && 'bg-black/5 shadow-inner dark:bg-white/10'
        )}
        title="切换主题"
        aria-label="切换主题"
      >
        <div className="relative h-7 w-7 shrink-0">
          <Image src="/l2c-logo.svg" alt="L2C Logo" fill className="object-contain" priority />
        </div>
      </button>

      {/* 系统标题 - 不触发切换 */}
      <AnimatePresence mode="wait">
        {open && (
          <motion.span
            initial={{ opacity: 0, x: -5 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -5 }}
            className="ml-2 cursor-default text-lg font-bold whitespace-nowrap text-neutral-700 dark:text-neutral-200"
          >
            L2C System
          </motion.span>
        )}
      </AnimatePresence>

      {/* Pill Nav 主题选择器 - 悬浮在 Logo 右侧上方层级 */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, x: -10, scale: 0.8 }}
            animate={{ opacity: 1, x: 20, scale: 1 }}
            exit={{ opacity: 0, x: -10, scale: 0.8 }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            className={cn(
              'fixed top-1/2 left-10 z-1000 flex -translate-y-1/2 items-center gap-1 p-1 md:absolute',
              'border border-neutral-800 bg-neutral-900 dark:border-white/10 dark:bg-black',
              'rounded-full shadow-2xl'
            )}
          >
            {themes.map((t) => {
              const Icon = t.icon;
              const isActive = theme === t.id;

              return (
                <motion.button
                  key={t.id}
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    setTheme(t.id);
                    setTimeout(() => setIsMenuOpen(false), 300);
                  }}
                  className={cn(
                    'relative rounded-full px-4 py-2 text-xs transition-colors duration-200',
                    isActive ? 'font-bold text-neutral-900' : 'text-neutral-400 hover:text-white'
                  )}
                >
                  {isActive && (
                    <motion.div
                      layoutId="activePill"
                      className="absolute inset-0 rounded-full bg-white shadow-sm"
                      initial={false}
                      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                    />
                  )}
                  <span className="relative z-10 flex items-center gap-2 whitespace-nowrap">
                    <Icon className={cn('h-3.5 w-3.5', isActive ? 'text-neutral-900' : '')} />
                    <span>{t.label}</span>
                  </span>
                </motion.button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
