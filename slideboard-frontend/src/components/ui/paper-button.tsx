'use client';

import { cva, type VariantProps } from 'class-variance-authority';
import { motion, HTMLMotionProps } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import React from 'react';

import { cn } from '@/lib/utils';

// 1. 使用 CVA 管理样式
const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        primary: 'bg-primary-500 text-white hover:bg-primary-600 shadow-sm dark:bg-blue-600 dark:hover:bg-blue-500',
        secondary: 'bg-paper-100 text-primary-600 hover:bg-primary-100 dark:bg-neutral-800 dark:text-neutral-200',
        outline: 'border border-paper-600 text-ink-800 hover:bg-paper-50 dark:border-neutral-700 dark:text-neutral-300',
        ghost: 'hover:bg-paper-50 text-ink-800 dark:text-neutral-400 dark:hover:bg-neutral-800',
        success: 'bg-success-500 text-white hover:bg-success-600',
        warning: 'bg-warning-500 text-white hover:bg-warning-600',
        error: 'bg-error-500 text-white hover:bg-error-600',
        info: 'bg-info-500 text-white hover:bg-info-600',
      },
      size: {
        sm: 'px-3 py-1.5 text-sm',
        md: 'px-4 py-2 text-base',
        lg: 'px-6 py-3 text-lg',
        // 兼容旧的字符串
        small: 'px-3 py-1.5 text-sm',
        medium: 'px-4 py-2 text-base',
        large: 'px-6 py-3 text-lg',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  }
);

interface ButtonProps
  extends Omit<HTMLMotionProps<'button'>, 'size'>,
  VariantProps<typeof buttonVariants> {
  icon?: React.ReactNode;      // 保持兼容
  rightIcon?: React.ReactNode; // ✨ 新增右侧图标
  loading?: boolean;
  as?: React.ElementType;
}

export const PaperButton = React.forwardRef<HTMLButtonElement, ButtonProps>(({
  children,
  variant,
  size,
  className,
  icon,
  rightIcon,
  loading = false,
  disabled,
  as,
  ...props
}, ref) => {
  const Component = React.useMemo(() => {
    if (as) return motion(as);
    return motion.button;
  }, [as]);

  return (
    <Component
      ref={ref as any}
      layout // ✨ 自动平滑宽高度变化
      className={cn(buttonVariants({ variant, size, className }))}
      disabled={disabled || loading}
      aria-busy={loading} // ✨ A11y 增强
      whileHover={!disabled && !loading ? { scale: 1.02 } : undefined}
      whileTap={!disabled && !loading ? { scale: 0.98 } : undefined}
      {...props}
    >
      {/* Loading 优先级最高，居中显示 */}
      {loading ? (
        <Loader2 className="animate-spin h-4 w-4" aria-hidden="true" />
      ) : (
        <>
          {icon && <span className="flex items-center">{icon}</span>}
          {children}
          {rightIcon && <span className="flex items-center">{rightIcon}</span>}
        </>
      )}
    </Component>
  );
});

PaperButton.displayName = 'PaperButton';
