'use client';

import { motion } from 'framer-motion';
import React from 'react';

import { cn } from '@/lib/utils';

interface MovingBorderCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  containerClassName?: string; // 新增：允许单独控制内部容器样式
  duration?: number;
  /**
   * 自定义流光颜色，默认为当前主题的 primary 色
   * 传入格式如: "#10b981" 或 "var(--color-error-500)"
   */
  borderColor?: string;
}

/**
 * Moving Border Card (Theme Aware)
 * 适配多主题系统的流光边框卡片
 */
export const MovingBorderCard: React.FC<MovingBorderCardProps> = ({
  children,
  className,
  containerClassName,
  duration = 4000,
  borderColor,
  ...props
}) => {
  return (
    <div
      className={cn(
        // 1. 基础布局
        'relative overflow-hidden rounded-xl p-[1px]',
        // 2. 轨道底色：改为透明或极淡的主题边框色，避免在亮色主题下出现黑框
        'bg-theme-border/30',
        className
      )}
      {...props}
    >
      {/* 3. 旋转流光层 */}
      <motion.div
        animate={{ rotate: 360 }}
        transition={{
          duration: duration / 1000,
          repeat: Infinity,
          ease: 'linear',
        }}
        // 优化：inset 改为 -50% 通常足够覆盖
        className="absolute -inset-[50%] opacity-80"
        style={{
          // ✨ 核心魔法：使用 CSS 变量或传入的颜色
          // 默认使用 var(--color-primary-500) 适配你的 Tailwind v4 主题配置
          background: `conic-gradient(from 90deg at 50% 50%, transparent 50%, ${borderColor || 'var(--color-primary-500)'} 100%)`,
        }}
      />

      {/* 4. 内容遮罩层 (Inner Content) */}
      <div
        className={cn(
          // 确保背景色不透明，以遮挡中间的流光，只露出边缘
          'relative h-full w-full rounded-xl bg-theme-bg-secondary backdrop-blur-xl',
          // 适配玻璃拟态：在 Glass 主题下增加一点透明度
          'supports-[backdrop-filter]:bg-theme-bg-secondary/90',
          containerClassName
        )}
      >
        {children}
      </div>
    </div>
  );
};
