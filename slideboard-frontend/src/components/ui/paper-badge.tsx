'use client';

import React from 'react';

import { cn } from '@/utils/lib-utils';

interface PaperBadgeProps {
  children: React.ReactNode;
  variant?: 'success' | 'warning' | 'error' | 'info' | 'default' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const PaperBadge: React.FC<PaperBadgeProps> = ({
  children,
  variant = 'default',
  size = 'md',
  className
}) => {
  const baseClasses = 'inline-flex items-center rounded-full font-medium border';

  const variantClasses = {
    success: 'bg-success-100 text-success-600 border-success-200 dark:bg-emerald-500/10 dark:text-emerald-500 dark:border-emerald-500/20',
    warning: 'bg-warning-100 text-warning-600 border-warning-200 dark:bg-amber-500/10 dark:text-amber-500 dark:border-amber-500/20',
    error: 'bg-error-100 text-error-600 border-error-200 dark:bg-rose-500/10 dark:text-rose-500 dark:border-rose-500/20',
    info: 'bg-info-100 text-info-600 border-info-200 dark:bg-sky-500/10 dark:text-sky-500 dark:border-sky-500/20',
    default: 'bg-theme-bg-tertiary text-theme-text-primary border-theme-border dark:bg-neutral-800 dark:text-neutral-300 dark:border-neutral-700',
    outline: 'bg-transparent text-theme-text-secondary border-theme-border-light dark:border-neutral-700 dark:text-neutral-400',
  };

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-0.5 text-sm',
    lg: 'px-3 py-1 text-base',
  };

  const classes = cn(
    baseClasses,
    variantClasses[variant],
    sizeClasses[size],
    className
  );

  return <span className={classes}>{children}</span>;
};

interface PaperStatusProps {
  status: 'active' | 'inactive' | 'pending' | 'success' | 'warning' | 'error' | 'info';
  text?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const PaperStatus: React.FC<PaperStatusProps> = ({
  status,
  text,
  size = 'md',
  className
}) => {
  const statusConfig = {
    active: { color: 'bg-success-500', text: '活跃' },
    inactive: { color: 'bg-ink-400', text: '非活跃' },
    pending: { color: 'bg-warning-500', text: '待处理' },
    success: { color: 'bg-success-500', text: '成功' },
    warning: { color: 'bg-warning-500', text: '警告' },
    error: { color: 'bg-error-500', text: '错误' },
    info: { color: 'bg-info-500', text: '信息' },
  };

  const config = statusConfig[status];
  const displayText = text || config.text;

  const sizeClasses = {
    sm: 'w-2 h-2',
    md: 'w-3 h-3',
    lg: 'w-4 h-4',
  };

  const textSizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
  };

  return (
    <div className={cn('inline-flex items-center space-x-2', className)}>
      <div className={cn('rounded-full', config.color, sizeClasses[size])} />
      <span className={cn('text-ink-600', textSizeClasses[size])}>
        {displayText}
      </span>
    </div>
  );
};

interface PaperProgressProps {
  value: number;
  max?: number;
  size?: 'sm' | 'md' | 'lg';
  color?: 'success' | 'warning' | 'error' | 'info';
  showLabel?: boolean;
  className?: string;
}

export const PaperProgress: React.FC<PaperProgressProps> = ({
  value,
  max = 100,
  size = 'md',
  color = 'success',
  showLabel = false,
  className
}) => {
  const percentage = Math.min((value / max) * 100, 100);

  const sizeClasses = {
    sm: 'h-1',
    md: 'h-2',
    lg: 'h-3',
  };

  const colorClasses = {
    success: 'bg-success-500',
    warning: 'bg-warning-500',
    error: 'bg-error-500',
    info: 'bg-info-500',
  };

  return (
    <div className={cn('flex items-center space-x-3', className)}>
      <div className={cn('paper-progress w-full', sizeClasses[size])}>
        <div
          className={cn('paper-progress-bar', colorClasses[color])}
          style={{ width: `${percentage}%` }}
        />
      </div>
      {showLabel && (
        <span className="text-sm text-ink-600 font-medium">
          {Math.round(percentage)}%
        </span>
      )}
    </div>
  );
};

interface PaperTagProps {
  children: React.ReactNode;
  variant?: 'default' | 'outline' | 'ghost';
  color?: 'success' | 'warning' | 'error' | 'info' | 'default';
  size?: 'sm' | 'md' | 'lg';
  closable?: boolean;
  onClose?: () => void;
  className?: string;
}

export const PaperTag: React.FC<PaperTagProps> = ({
  children,
  variant = 'default',
  color = 'default',
  size = 'md',
  closable = false,
  onClose,
  className
}) => {
  const baseClasses = 'inline-flex items-center rounded-md font-medium transition-all duration-200';

  const colorVariants = {
    success: {
      default: 'bg-success-100 text-success-700 border border-success-200',
      outline: 'bg-transparent text-success-700 border border-success-300',
      ghost: 'bg-transparent text-success-700 hover:bg-success-50',
    },
    warning: {
      default: 'bg-warning-100 text-warning-700 border border-warning-200',
      outline: 'bg-transparent text-warning-700 border border-warning-300',
      ghost: 'bg-transparent text-warning-700 hover:bg-warning-50',
    },
    error: {
      default: 'bg-error-100 text-error-700 border border-error-200',
      outline: 'bg-transparent text-error-700 border border-error-300',
      ghost: 'bg-transparent text-error-700 hover:bg-error-50',
    },
    info: {
      default: 'bg-info-100 text-info-700 border border-info-200',
      outline: 'bg-transparent text-info-700 border border-info-300',
      ghost: 'bg-transparent text-info-700 hover:bg-info-50',
    },
    default: {
      default: 'bg-paper-300 text-ink-700 border border-paper-600',
      outline: 'bg-transparent text-ink-700 border border-paper-600',
      ghost: 'bg-transparent text-ink-700 hover:bg-paper-200',
    },
  };

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs space-x-1',
    md: 'px-2.5 py-1 text-sm space-x-1.5',
    lg: 'px-3 py-1.5 text-base space-x-2',
  };

  const classes = cn(
    baseClasses,
    colorVariants[color][variant],
    sizeClasses[size],
    className
  );

  return (
    <span className={classes}>
      <span>{children}</span>
      {closable && (
        <button
          onClick={onClose}
          className="ml-1 inline-flex items-center justify-center rounded-full hover:bg-black hover:bg-opacity-10"
          aria-label="关闭标签"
        >
          <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </span>
  );
};