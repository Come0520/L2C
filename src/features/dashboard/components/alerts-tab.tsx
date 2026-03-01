'use client';

import React, { useState } from 'react';
import useSWR from 'swr';
import { fetcher } from '@/shared/lib/fetcher';
import { Card, CardContent } from '@/shared/ui/card';
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import { cn } from '@/shared/lib/utils';
import AlertTriangle from 'lucide-react/dist/esm/icons/alert-triangle';
import Bell from 'lucide-react/dist/esm/icons/bell';
import CheckCircle2 from 'lucide-react/dist/esm/icons/check-circle';
import XCircle from 'lucide-react/dist/esm/icons/x-circle';
import Clock from 'lucide-react/dist/esm/icons/clock';
import ChevronDown from 'lucide-react/dist/esm/icons/chevron-down';
import RefreshCw from 'lucide-react/dist/esm/icons/refresh-cw';
import Loader2 from 'lucide-react/dist/esm/icons/loader';
import Truck from 'lucide-react/dist/esm/icons/truck';
import type {
  AlertsResponse,
  AlertCategory,
  AlertItem,
  AlertSeverity,
} from '@/services/workbench.service';

// ============ 图标和颜色映射 ============

const SEVERITY_CONFIG: Record<
  AlertSeverity,
  {
    icon: React.ComponentType<{ className?: string }>;
    colorClass: string;
    badgeVariant: 'error' | 'secondary';
  }
> = {
  error: {
    icon: XCircle,
    colorClass: 'text-red-500 bg-red-500/10',
    badgeVariant: 'error',
  },
  warning: {
    icon: AlertTriangle,
    colorClass: 'text-amber-500 bg-amber-500/10',
    badgeVariant: 'error',
  },
  info: {
    icon: Bell,
    colorClass: 'text-blue-500 bg-blue-500/10',
    badgeVariant: 'secondary',
  },
};

const CATEGORY_ICON: Record<AlertCategory, React.ComponentType<{ className?: string }>> = {
  LEAD_OVERDUE: Clock,
  SLA_OVERDUE: XCircle,
  DELIVERY_DELAY: Truck,
  PAYMENT_OVERDUE: AlertTriangle,
};

// ============ 主组件 ============

/**
 * 报警中心 Tab 内容组件
 * 从 API 获取真实报警数据，使用可折叠列表展示
 */
export function AlertsTab() {
  const { data, error, isLoading, mutate } = useSWR<AlertsResponse>(
    '/api/workbench/alerts',
    fetcher
  );
  const [expandedCategories, setExpandedCategories] = useState<Set<AlertCategory>>(new Set());

  /** 切换分类展开/收起 */
  const toggleCategory = (category: AlertCategory) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(category)) {
        next.delete(category);
      } else {
        next.add(category);
      }
      return next;
    });
  };

  // 加载状态
  if (isLoading && !data) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="text-muted-foreground h-8 w-8 animate-spin" />
        <span className="text-muted-foreground ml-2">加载报警信息...</span>
      </div>
    );
  }

  // 错误状态
  if (error) {
    return (
      <Card className="glass-liquid border-white/10">
        <CardContent className="py-12 text-center">
          <p className="text-destructive mb-4">{error.message || '获取报警信息失败'}</p>
          <Button variant="outline" onClick={() => mutate()}>
            <RefreshCw className="mr-2 h-4 w-4" />
            重试
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!data) return null;

  const totalCount = data.items.length;

  return (
    <div className="space-y-4">
      {/* 顶部概览 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-amber-500" />
          <span className="text-muted-foreground text-sm">
            共 <span className="text-foreground font-semibold">{totalCount}</span> 条报警
          </span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => mutate()}
          disabled={isLoading}
          className="text-xs"
        >
          <RefreshCw className={cn('mr-1 h-3 w-3', isLoading && 'animate-spin')} />
          刷新
        </Button>
      </div>

      {/* 分类折叠列表 */}
      {data.categories.map((cat) => {
        const isExpanded = expandedCategories.has(cat.category);
        const sevConfig = SEVERITY_CONFIG[cat.severity];
        const CatIcon = CATEGORY_ICON[cat.category] || AlertTriangle;
        const itemsInCategory = data.items.filter((i) => i.category === cat.category);

        return (
          <div key={cat.category} className="overflow-hidden rounded-xl border border-white/10">
            {/* 折叠触发器 */}
            <button
              onClick={() => toggleCategory(cat.category)}
              className={cn(
                'flex w-full items-center justify-between p-4 transition-all',
                'hover:bg-white/5 dark:hover:bg-white/3',
                isExpanded ? 'bg-white/5 dark:bg-white/3' : 'bg-transparent'
              )}
            >
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    'flex h-9 w-9 items-center justify-center rounded-lg',
                    sevConfig.colorClass
                  )}
                >
                  <CatIcon className="h-4 w-4" />
                </div>
                <span className="text-foreground font-medium">{cat.label}</span>
                <Badge variant={sevConfig.badgeVariant} className="text-xs">
                  {cat.count}
                </Badge>
              </div>
              <ChevronDown
                className={cn(
                  'text-muted-foreground h-4 w-4 transition-transform duration-200',
                  isExpanded && 'rotate-180'
                )}
              />
            </button>

            {/* 展开内容 — 报警列表 */}
            {isExpanded && (
              <div className="border-t border-white/10 bg-white/2 dark:bg-black/10">
                {itemsInCategory.length === 0 ? (
                  <div className="text-muted-foreground p-6 text-center text-sm">暂无此类报警</div>
                ) : (
                  <div className="divide-y divide-white/5">
                    {itemsInCategory.map((item) => (
                      <AlertRow key={item.id} item={item} />
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}

      {/* 空状态 */}
      {totalCount === 0 && (
        <Card className="glass-liquid border-white/10">
          <CardContent className="py-12 text-center">
            <div className="text-muted-foreground">
              <CheckCircle2 className="mx-auto mb-3 h-12 w-12 text-emerald-500 opacity-50" />
              <p>暂无报警</p>
              <p className="mt-1 text-sm">一切运行正常 ✅</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ============ 报警项组件 ============

const AlertRow = React.memo(function AlertRow({ item }: { item: AlertItem }) {
  const sevConfig = SEVERITY_CONFIG[item.severity];
  const Icon = sevConfig.icon;

  return (
    <div className="flex items-start gap-4 p-4 transition-colors hover:bg-white/5">
      <div
        className={cn(
          'mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg',
          sevConfig.colorClass
        )}
      >
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-foreground text-sm font-medium">{item.title}</p>
        <p className="text-muted-foreground mt-1 line-clamp-2 text-xs">{item.description}</p>
      </div>
      <span className="text-muted-foreground mt-1 shrink-0 text-xs">
        {item.createdAt ? formatRelativeTime(new Date(item.createdAt)) : '-'}
      </span>
    </div>
  );
});

// ============ 工具函数 ============

/** 格式化相对时间 */
function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHour = Math.floor(diffMs / 3600000);
  const diffDay = Math.floor(diffMs / 86400000);

  if (diffMin < 1) return '刚刚';
  if (diffMin < 60) return `${diffMin} 分钟前`;
  if (diffHour < 24) return `${diffHour} 小时前`;
  if (diffDay < 7) return `${diffDay} 天前`;
  return date.toLocaleDateString('zh-CN');
}
