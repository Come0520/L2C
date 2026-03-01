'use client';

/**
 * 目标进度卡片组件
 * 展示个人或团队的当月销售目标和完成情况
 */

import { cn } from '@/shared/lib/utils';

// ========== 类型定义 ==========

export interface TargetProgressCardProps {
  /** 目标金额（元） */
  targetAmount: number;
  /** 已完成金额（元） */
  achievedAmount: number;
  /** 完成率百分比（0~100） */
  percentage: number;
  /** 卡片标题，默认"本月目标" */
  title?: string;
  /** 用户名（个人视图时展示） */
  userName?: string;
  /** 是否加载中 */
  isLoading?: boolean;
  /** 额外样式 */
  className?: string;
}

// ========== 内部辅助函数 ==========

/** 格式化金额：超过10000以"万"为单位 */
function formatAmount(amount: number): string {
  if (amount >= 10000) {
    return `${(amount / 10000).toFixed(1)}万`;
  }
  return amount.toLocaleString('zh-CN');
}

/** 根据完成率返回颜色类名 */
function getProgressColor(percentage: number): string {
  if (percentage >= 100) return 'bg-emerald-500';
  if (percentage >= 80) return 'bg-blue-500';
  if (percentage >= 50) return 'bg-yellow-500';
  return 'bg-red-500';
}

/** 根据完成率返回文字颜色 */
function getTextColor(percentage: number): string {
  if (percentage >= 100) return 'text-emerald-600';
  if (percentage >= 80) return 'text-blue-600';
  if (percentage >= 50) return 'text-yellow-600';
  return 'text-red-600';
}

// ========== 组件 ==========

/**
 * 目标进度卡片
 *
 * 用法示例：
 * ```tsx
 * <TargetProgressCard
 *   targetAmount={100000}
 *   achievedAmount={65000}
 *   percentage={65}
 *   userName="张小明"
 * />
 * ```
 */
export function TargetProgressCard({
  targetAmount,
  achievedAmount,
  percentage,
  title = '本月目标',
  userName,
  isLoading = false,
  className,
}: TargetProgressCardProps) {
  const progressColor = getProgressColor(percentage);
  const textColor = getTextColor(percentage);

  if (isLoading) {
    return (
      <div className={cn('rounded-xl border bg-white p-6 shadow-sm', className)}>
        <div className="animate-pulse space-y-3">
          <div className="h-4 w-1/3 rounded bg-gray-200" />
          <div className="h-8 w-1/2 rounded bg-gray-200" />
          <div className="h-3 w-full rounded bg-gray-200" />
          <div className="h-3 w-2/3 rounded bg-gray-200" />
        </div>
      </div>
    );
  }

  return (
    <div className={cn('rounded-xl border bg-white p-6 shadow-sm', className)}>
      {/* 标题区域 */}
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-gray-500">{title}</span>
        {userName && (
          <span className="rounded-full bg-gray-100 px-2 py-1 text-xs text-gray-400">
            {userName}
          </span>
        )}
      </div>

      {/* 金额展示 */}
      <div className="mt-3 flex items-baseline gap-2">
        <span className="text-3xl font-bold text-gray-900">¥{formatAmount(achievedAmount)}</span>
        <span className="text-sm text-gray-400">/ ¥{formatAmount(targetAmount)}</span>
      </div>

      {/* 进度条 */}
      <div className="mt-4">
        <div className="mb-1 flex items-center justify-between">
          <span className="text-xs text-gray-500">完成进度</span>
          <span className={cn('text-sm font-semibold', textColor)}>{percentage}%</span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100">
          <div
            className={cn('h-full rounded-full transition-all duration-500', progressColor)}
            style={{ width: `${Math.min(percentage, 100)}%` }}
            role="progressbar"
            aria-valuenow={percentage}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`目标完成率 ${percentage}%`}
          />
        </div>
      </div>

      {/* 底部差距提示 */}
      <div className="mt-3 text-xs text-gray-400">
        {percentage >= 100 ? (
          <span className="font-medium text-emerald-600">🎉 已超额完成目标！</span>
        ) : (
          <span>
            还差{' '}
            <span className="font-medium text-gray-600">
              ¥{formatAmount(Math.max(targetAmount - achievedAmount, 0))}
            </span>{' '}
            完成目标
          </span>
        )}
      </div>
    </div>
  );
}
