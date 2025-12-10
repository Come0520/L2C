'use client';

import React, { useId } from 'react';
import { motion } from 'framer-motion';
import { Moon, Sun, Droplets } from 'lucide-react';
import { useTheme, ThemeName } from '@/contexts/theme-context';
import { cn } from '@/utils/lib-utils';

const THEME_OPTIONS: { name: ThemeName; icon: React.ReactNode }[] = [
  { name: 'linear', icon: <Moon size={18} strokeWidth={2.5} /> },
  { name: 'warmRicePaper', icon: <Sun size={18} strokeWidth={2.5} /> },
  { name: 'liquidGlass', icon: <Droplets size={18} strokeWidth={2.5} /> },
];

export function GooeyThemeToggle() {
  const { theme, setTheme } = useTheme();
  const uid = useId();
  const filterId = `gooey-filter-${uid}`;

  const activeIndex = THEME_OPTIONS.findIndex((t) => t.name === theme);
  const safeIndex = activeIndex === -1 ? 0 : activeIndex;

  const ITEM_WIDTH = 40;
  const ITEM_GAP = 8;
  const PADDING = 6;

  return (
    <div className="relative isolate inline-flex items-center">
      <svg className="absolute w-0 h-0 hidden">
        <defs>
          <filter id={filterId}>
            <feGaussianBlur in="SourceGraphic" stdDeviation="6" result="blur" />
            <feColorMatrix in="blur" mode="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 19 -9" result="goo" />
            <feComposite in="SourceGraphic" in2="goo" operator="atop" />
          </filter>
        </defs>
      </svg>

      <div className="absolute inset-0 z-0 bg-theme-bg-tertiary/50 rounded-full" style={{ filter: `url(#${filterId})`, margin: '-4px' }}>
        <div className="relative w-full h-full flex items-center" style={{ padding: `4px ${PADDING + 4}px` }}>
          <motion.div
            className="absolute h-10 w-10 rounded-full bg-primary-500 shadow-sm"
            initial={false}
            animate={{ x: safeIndex * (ITEM_WIDTH + ITEM_GAP) }}
            transition={{ type: 'spring', stiffness: 350, damping: 25 }}
          />
        </div>
      </div>

      <div className="relative z-10 flex items-center rounded-full border border-theme-border/60 bg-theme-bg-secondary/30 backdrop-blur-md shadow-sm" style={{ padding: PADDING, gap: ITEM_GAP }}>
        {THEME_OPTIONS.map((t) => {
          const isActive = theme === t.name;
          return (
            <button
              key={t.name}
              type="button"
              onClick={() => setTheme(t.name)}
              className={cn(
                'relative flex items-center justify-center rounded-full transition-colors duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/50',
                isActive ? 'text-white' : 'text-theme-text-secondary hover:text-theme-text-primary'
              )}
              style={{ width: ITEM_WIDTH, height: ITEM_WIDTH }}
              aria-label={`Switch to ${t.name} theme`}
              aria-pressed={isActive}
            >
              {t.icon}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export const GooeySwitch = GooeyThemeToggle;
