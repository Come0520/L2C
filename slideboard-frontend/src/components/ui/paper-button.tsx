'use client';

import { cva, type VariantProps } from 'class-variance-authority';
import { motion, HTMLMotionProps } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import React from 'react';

import { cn } from '@/lib/utils';

// 使用 CVA 管理样式 - 完全主题化版本
const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        // Primary - 品牌主色
        primary: 'bg-primary-500 text-white hover:bg-primary-600 shadow-sm hover:shadow-md',

        // Secondary - 次要按钮
        secondary: 'bg-theme-bg-secondary text-theme-text-primary hover:bg-theme-bg-tertiary border border-theme-border',

        // Outline - 轮廓按钮
        outline: 'border border-theme-border text-theme-text-primary hover:bg-theme-bg-secondary',

        // Ghost - 幽灵按钮
        ghost: 'hover:bg-theme-bg-secondary text-theme-text-primary',

        // 状态按钮
        success: 'bg-success-500 text-white hover:bg-success-600 shadow-sm hover:shadow-md',
        warning: 'bg-warning-500 text-white hover:bg-warning-600 shadow-sm hover:shadow-md',
        error: 'bg-error-500 text-white hover:bg-error-600 shadow-sm hover:shadow-md',
        info: 'bg-info-500 text-white hover:bg-info-600 shadow-sm hover:shadow-md',

        // 危险按钮
        destructive: 'bg-error-500 text-white hover:bg-error-600 shadow-sm hover:shadow-md',

        // Link 按钮
        link: 'text-primary-600 hover:text-primary-700 underline-offset-4 hover:underline',
      },
      size: {
        sm: 'px-3 py-1.5 text-sm h-8',
        md: 'px-4 py-2 text-base h-10',
        lg: 'px-6 py-3 text-lg h-12',
        icon: 'h-10 w-10',
        // 兼容旧的字符串
        small: 'px-3 py-1.5 text-sm h-8',
        medium: 'px-4 py-2 text-base h-10',
        large: 'px-6 py-3 text-lg h-12',
      },
      rounded: {
        none: 'rounded-none',
        sm: 'rounded-sm',
        md: 'rounded-md',
        lg: 'rounded-lg',
        full: 'rounded-full',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
      rounded: 'md',
    },
  }
);

interface ButtonProps
  extends Omit<HTMLMotionProps<'button'>, 'size'>,
  VariantProps<typeof buttonVariants> {
  icon?: React.ReactNode;
  leftIcon?: React.ReactNode;  // 新增：左侧图标（与 icon 同义）
  rightIcon?: React.ReactNode;
  loading?: boolean;
  as?: React.ElementType;
}

export const PaperButton = React.forwardRef<HTMLButtonElement, ButtonProps>(({
  children,
  variant,
  size,
  rounded,
  className,
  icon,
  leftIcon,
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

  // icon 和 leftIcon 是同义词，优先使用 leftIcon
  const effectiveLeftIcon = leftIcon || icon;

  return (
    <Component
      ref={ref as any}
      layout
      className={cn(buttonVariants({ variant, size, rounded, className }))}
      disabled={disabled || loading}
      aria-busy={loading}
      // 更丝滑的 hover 和 tap 动画
      whileHover={!disabled && !loading ? {
        scale: 1.02,
        transition: { type: "spring", stiffness: 400, damping: 10 }
      } : undefined}
      whileTap={!disabled && !loading ? {
        scale: 0.98,
        transition: { type: "spring", stiffness: 400, damping: 10 }
      } : undefined}
      {...props}
    >
      {/* Loading 状态 */}
      {loading ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          transition={{ duration: 0.2 }}
          className="flex items-center justify-center"
        >
          <Loader2 className="animate-spin h-4 w-4" aria-hidden="true" />
        </motion.div>
      ) : (
        <>
          {effectiveLeftIcon && (
            <motion.span
              className="flex items-center"
              initial={{ opacity: 0, x: -5 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.2 }}
            >
              {effectiveLeftIcon}
            </motion.span>
          )}
          {children}
          {rightIcon && (
            <motion.span
              className="flex items-center"
              initial={{ opacity: 0, x: 5 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.2 }}
            >
              {rightIcon}
            </motion.span>
          )}
        </>
      )}
    </Component>
  );
});

PaperButton.displayName = 'PaperButton';
