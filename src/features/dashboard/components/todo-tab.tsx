'use client';
import React, { useState } from 'react';
import useSWR from 'swr';
import { fetcher } from '@/shared/lib/fetcher';
import { Card, CardContent } from '@/shared/ui/card';
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import { cn } from '@/shared/lib/utils';
import Users from 'lucide-react/dist/esm/icons/users';
import ShoppingCart from 'lucide-react/dist/esm/icons/shopping-cart';
import Clipboard from 'lucide-react/dist/esm/icons/clipboard';
import Factory from 'lucide-react/dist/esm/icons/factory';
import Wrench from 'lucide-react/dist/esm/icons/wrench';
import Clock from 'lucide-react/dist/esm/icons/clock';
import ChevronDown from 'lucide-react/dist/esm/icons/chevron-down';
import RefreshCw from 'lucide-react/dist/esm/icons/refresh-cw';
import Loader2 from 'lucide-react/dist/esm/icons/loader';
import type { TodosResponse, TodoCategory } from '@/services/workbench.service';
import { toast } from 'sonner';
import { TodoCategoryTable } from './todo-tables';

// ============ 图标映射 ============

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Users,
  ShoppingCart,
  Clipboard,
  Factory,
  Wrench,
};

const COLOR_MAP: Record<string, string> = {
  blue: 'text-blue-500 bg-blue-500/10',
  amber: 'text-amber-500 bg-amber-500/10',
  purple: 'text-purple-500 bg-purple-500/10',
  cyan: 'text-cyan-500 bg-cyan-500/10',
  emerald: 'text-emerald-500 bg-emerald-500/10',
};

// ============ 主组件 ============

/**
 * 待办事项 Tab 内容组件
 * 使用 SWR 获取实时数据，支持乐观更新
 */
export function TodoTab() {
  const { data, error, isLoading, mutate } = useSWR<TodosResponse>('/api/workbench/todos', fetcher);
  const [expandedCategories, setExpandedCategories] = useState<Set<TodoCategory>>(new Set());
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  /** 切换分类展开/收起 */
  const toggleCategory = (category: TodoCategory) => {
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

  /** 执行操作后刷新列表（支持乐观更新） */
  const handleAction = async (
    actionFn: () => Promise<unknown>,
    itemId: string,
    category: TodoCategory | null = null
  ) => {
    // 如果提供了 category，则进行乐观更新
    if (category && data) {
      const optimisticData: TodosResponse = {
        ...data,
        categories: data.categories.map((c) => {
          if (c.category === category) {
            return { ...c, count: Math.max(0, c.count - 1) };
          }
          return c;
        }),
      };

      // 针对具体列表进行局部移除（乐观更新）
      if (category === 'LEAD') {
        optimisticData.leads = data.leads.filter((item) => item.id !== itemId);
      } else if (category === 'ORDER') {
        optimisticData.orders = data.orders.filter((item) => item.id !== itemId);
      }

      mutate(optimisticData, false); // 发送乐观更新，不立即重新拉取
    } else {
      setActionLoading(itemId);
    }

    try {
      const res = await actionFn();
      if (res && typeof res === 'object' && 'success' in res && res.success === false) {
        const errorMsg = 'error' in res && typeof res.error === 'string' ? res.error : '操作失败';
        throw new Error(errorMsg);
      }
      toast.success('操作成功');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : '操作失败');
    } finally {
      setActionLoading(null);
      mutate(); // 无论成功失败，最终进行一次真实数据校验同步
    }
  };

  // 加载状态
  if (isLoading && !data) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="text-muted-foreground h-8 w-8 animate-spin" />
        <span className="text-muted-foreground ml-2">加载待办事项...</span>
      </div>
    );
  }

  // 错误状态
  if (error) {
    return (
      <Card className="glass-liquid border-white/10">
        <CardContent className="py-12 text-center">
          <p className="text-destructive mb-4">{error.message || '获取待办事项失败'}</p>
          <Button variant="outline" onClick={() => mutate()}>
            <RefreshCw className="mr-2 h-4 w-4" />
            重试
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!data) return null;

  const totalCount = data.categories.reduce((sum, c) => sum + c.count, 0);

  return (
    <div className="space-y-4">
      {/* 顶部概览 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Clock className="text-muted-foreground h-4 w-4" />
          <span className="text-muted-foreground text-sm">
            共 <span className="text-foreground font-semibold">{totalCount}</span> 项待办
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
        const IconComp = ICON_MAP[cat.icon] || Clock;
        const colorClass = COLOR_MAP[cat.color] || COLOR_MAP.blue;

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
                  className={cn('flex h-9 w-9 items-center justify-center rounded-lg', colorClass)}
                >
                  <IconComp className="h-4 w-4" />
                </div>
                <span className="text-foreground font-medium">{cat.label}</span>
                <Badge variant={cat.count > 0 ? 'error' : 'secondary'} className="text-xs">
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

            {/* 展开内容 — 表格 */}
            {isExpanded && (
              <div className="border-t border-white/10 bg-white/2 dark:bg-black/10">
                {cat.count === 0 ? (
                  <div className="text-muted-foreground p-6 text-center text-sm">暂无待办</div>
                ) : (
                  <TodoCategoryTable
                    category={cat.category}
                    data={data}
                    actionLoading={actionLoading}
                    onAction={handleAction}
                  />
                )}
              </div>
            )}
          </div>
        );
      })}

      {/* 全部为空状态 */}
      {totalCount === 0 && (
        <Card className="glass-liquid border-white/10">
          <CardContent className="py-12 text-center">
            <div className="text-muted-foreground">
              <Clock className="mx-auto mb-3 h-12 w-12 opacity-50" />
              <p>暂无待办事项</p>
              <p className="mt-1 text-sm">所有任务已处理完毕 🎉</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
