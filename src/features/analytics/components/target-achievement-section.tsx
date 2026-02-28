'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { cn } from '@/shared/lib/utils';
import { Target, TrendingUp, AlertTriangle, Trophy } from 'lucide-react';

import { QuarterlyComparisonChart } from './quarterly-comparison-chart';
import { AnnualProgressRing } from './annual-progress-ring';

// ==================== 类型定义 ====================

interface AchievementDetail {
  userId: string;
  userName: string;
  targetAmount: number;
  achievedAmount: number;
  completionRate: number;
}

interface AchievementOverview {
  totalTarget: number;
  totalAchieved: number;
  totalRate: number;
  details: AchievementDetail[];
}

interface TrendItem {
  label: string;
  year: number;
  month: number;
  target: number;
  achieved: number;
  completionRate: number;
}

interface RiskWarning {
  userId: string;
  userName: string;
  targetAmount: number;
  achievedAmount: number;
  currentRate: number;
  predictedRate: number;
  riskLevel: 'high' | 'medium' | 'low';
}

interface TargetAchievementSectionProps {
  overview: AchievementOverview | null;
  trend: TrendItem[];
  warnings: RiskWarning[];
  quarterly?: any[]; // eslint-disable-line @typescript-eslint/no-explicit-any
  annualProgress?: any; // eslint-disable-line @typescript-eslint/no-explicit-any
  className?: string;
}

// ==================== 工具函数 ====================

/** 根据完成率返回颜色类 */
function getRateColor(rate: number): string {
  if (rate >= 100) return 'text-emerald-500';
  if (rate >= 80) return 'text-blue-500';
  if (rate >= 50) return 'text-amber-500';
  return 'text-red-500';
}

/** 根据完成率返回背景色 */
function getRateBg(rate: number): string {
  if (rate >= 100) return 'bg-emerald-500';
  if (rate >= 80) return 'bg-blue-500';
  if (rate >= 50) return 'bg-amber-500';
  return 'bg-red-500';
}

/** 格式化金额 */
function formatAmount(amount: number): string {
  if (amount >= 10000) return `${(amount / 10000).toFixed(1)}万`;
  return `¥${amount.toLocaleString()}`;
}

// ==================== 子组件 ====================

/** 目标达成总览卡片 */
function OverviewCards({ overview }: { overview: AchievementOverview }) {
  return (
    <div className="grid grid-cols-3 gap-4">
      <Card className="border-l-primary border-l-4">
        <CardContent className="p-4">
          <div className="text-muted-foreground mb-1 flex items-center gap-2 text-sm">
            <Target className="h-4 w-4" />
            <span>团队月目标</span>
          </div>
          <div className="text-2xl font-bold">{formatAmount(overview.totalTarget)}</div>
        </CardContent>
      </Card>
      <Card className="border-l-4 border-l-emerald-500">
        <CardContent className="p-4">
          <div className="text-muted-foreground mb-1 flex items-center gap-2 text-sm">
            <TrendingUp className="h-4 w-4" />
            <span>已完成</span>
          </div>
          <div className="text-2xl font-bold text-emerald-600">
            {formatAmount(overview.totalAchieved)}
          </div>
        </CardContent>
      </Card>
      <Card className="border-l-4 border-l-blue-500">
        <CardContent className="p-4">
          <div className="text-muted-foreground mb-1 flex items-center gap-2 text-sm">
            <Trophy className="h-4 w-4" />
            <span>达成率</span>
          </div>
          <div className={cn('text-2xl font-bold', getRateColor(overview.totalRate))}>
            {overview.totalRate}%
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/** 月度完成率趋势图（简易柱状图） */
function CompletionTrendChart({ data }: { data: TrendItem[] }) {
  const maxRate = Math.max(...data.map((d) => d.completionRate), 100);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <TrendingUp className="h-4 w-4" />
          月度目标达成趋势（近12个月）
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex h-40 items-end gap-1">
          {data.map((item, i) => {
            const height = maxRate > 0 ? (item.completionRate / maxRate) * 100 : 0;
            return (
              <div key={i} className="flex flex-1 flex-col items-center gap-1">
                <span className="text-muted-foreground text-[10px]">
                  {item.completionRate > 0 ? `${item.completionRate}%` : ''}
                </span>
                <div
                  className={cn(
                    'w-full rounded-t transition-all',
                    getRateBg(item.completionRate),
                    'opacity-80 hover:opacity-100'
                  )}
                  style={{ height: `${Math.max(height, 2)}%` }}
                  title={`${item.year}年${item.month}月: 目标 ${formatAmount(item.target)}, 完成 ${formatAmount(item.achieved)}, 达成率 ${item.completionRate}%`}
                />
                <span className="text-muted-foreground text-[10px]">{item.label}</span>
              </div>
            );
          })}
        </div>
        {/* 100% 参考线 */}
        <div className="border-muted-foreground/30 relative -mt-[calc(100%*100/var(--max))] border-t border-dashed" />
      </CardContent>
    </Card>
  );
}

/** 个人达成排名 */
function AchievementRanking({ details }: { details: AchievementDetail[] }) {
  const top5 = details.slice(0, 5);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <Trophy className="h-4 w-4" />
          个人达成排名
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {top5.length === 0 && (
          <div className="text-muted-foreground py-4 text-center text-sm">暂无数据</div>
        )}
        {top5.map((item, index) => (
          <div key={item.userId} className="flex items-center gap-3">
            <div
              className={cn(
                'flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold text-white',
                index === 0
                  ? 'bg-amber-500'
                  : index === 1
                    ? 'bg-gray-400'
                    : index === 2
                      ? 'bg-amber-700'
                      : 'bg-gray-300'
              )}
            >
              {index + 1}
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-medium">{item.userName}</div>
              <div className="mt-1 flex items-center gap-2">
                <div className="bg-muted h-2 flex-1 overflow-hidden rounded-full">
                  <div
                    className={cn(
                      'h-full rounded-full transition-all',
                      getRateBg(item.completionRate)
                    )}
                    style={{ width: `${Math.min(item.completionRate, 100)}%` }}
                  />
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className={cn('text-sm font-bold', getRateColor(item.completionRate))}>
                {item.completionRate}%
              </div>
              <div className="text-muted-foreground text-[10px]">
                {formatAmount(item.achievedAmount)}
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

/** 风险预警列表 */
function RiskWarningList({ warnings }: { warnings: RiskWarning[] }) {
  if (warnings.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <AlertTriangle className="h-4 w-4" />
            风险预警
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 py-2 text-sm text-emerald-600">
            <span className="text-lg">✅</span>
            <span>当前无风险预警，团队表现良好</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <AlertTriangle className="h-4 w-4 text-amber-500" />
          风险预警
          <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs text-red-600">
            {warnings.length}人
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {warnings.map((w) => (
          <div
            key={w.userId}
            className={cn(
              'flex items-center justify-between rounded-lg border p-2',
              w.riskLevel === 'high' ? 'border-red-200 bg-red-50' : 'border-amber-200 bg-amber-50'
            )}
          >
            <div>
              <span className="text-sm font-medium">{w.userName}</span>
              <span
                className={cn(
                  'ml-2 rounded px-1.5 py-0.5 text-xs',
                  w.riskLevel === 'high' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                )}
              >
                {w.riskLevel === 'high' ? '高风险' : '中风险'}
              </span>
            </div>
            <div className="text-right text-sm">
              <span className="text-muted-foreground">当前 </span>
              <span className={cn('font-medium', getRateColor(w.currentRate))}>
                {w.currentRate}%
              </span>
              <span className="text-muted-foreground mx-1">→ 预测</span>
              <span className={cn('font-bold', getRateColor(w.predictedRate))}>
                {w.predictedRate}%
              </span>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

// ==================== 主组件 ====================

export function TargetAchievementSection({
  overview,
  trend,
  warnings,
  quarterly,
  annualProgress,
  className,
}: TargetAchievementSectionProps) {
  if (!overview) {
    return (
      <div className={cn('text-muted-foreground py-8 text-center', className)}>
        暂无目标数据，请先在
        <span className="text-primary font-medium">设置 → 业务规则 → 销售目标</span>中设置目标
      </div>
    );
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* 第一排：概览卡片 */}
      <OverviewCards overview={overview} />

      {/* 第二排：趋势图 + 排名 */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <div className="col-span-4">
          <CompletionTrendChart data={trend} />
        </div>
        <div className="col-span-3">
          <AchievementRanking details={overview.details} />
        </div>
      </div>

      {/* 第三排：季度对比 + 年度进度 + 风险预警 */}
      <div className="grid flex-col gap-4 lg:grid-cols-10 lg:flex-row">
        <div className="lg:col-span-4">
          <QuarterlyComparisonChart data={quarterly || []} />
        </div>
        <div className="lg:col-span-3">
          <AnnualProgressRing data={annualProgress} />
        </div>
        <div className="lg:col-span-3">
          <RiskWarningList warnings={warnings} />
        </div>
      </div>
    </div>
  );
}
