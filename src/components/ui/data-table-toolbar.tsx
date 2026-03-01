'use client';

import React from 'react';
import { Input } from '@/shared/ui/input';
import { Button } from '@/shared/ui/button';
import { cn } from '@/shared/lib/utils';
import Search from 'lucide-react/dist/esm/icons/search';
import RotateCcw from 'lucide-react/dist/esm/icons/rotate-ccw';
import SlidersHorizontal from 'lucide-react/dist/esm/icons/sliders-horizontal';

import Loader2 from 'lucide-react/dist/esm/icons/loader-2';

interface DataTableToolbarProps {
  searchProps?: {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    isPending?: boolean;
  };
  children?: React.ReactNode; // 插槽：用于放置 FilterSelector, ViewOptions 等
  actions?: React.ReactNode; // 插槽：用于放置右侧操作按钮
  onRefresh?: () => void;
  loading?: boolean;
  className?: string;
}

export function DataTableToolbar({
  searchProps,
  children,
  actions,
  onRefresh,
  loading,
  className,
}: DataTableToolbarProps) {
  return (
    <div
      className={cn(
        'glass-layout-card flex flex-wrap items-center justify-between gap-4 rounded-xl border border-white/10 p-2 shadow-sm',
        className
      )}
    >
      {/* 左侧：搜索于筛选 */}
      <div className="flex min-w-[200px] flex-1 items-center gap-2">
        {searchProps && (
          <div className="relative max-w-sm flex-1">
            {searchProps.isPending ? (
              <Loader2 className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 animate-spin" />
            ) : (
              <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
            )}
            <Input
              placeholder={searchProps.placeholder ?? '搜索...'}
              value={searchProps.value}
              onChange={(e) => searchProps.onChange(e.target.value)}
              className="bg-muted/20 focus-visible:ring-primary/20 hover:bg-muted/30 h-9 border-none pl-9 transition-all focus-visible:ring-1"
            />
          </div>
        )}

        {/* 筛选器插槽 */}
        {children}

        {/* 默认提供一个占位筛选按钮，如果外界没有传入 children 且也没有特定需求，可以移除 */}
        {!children && (
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground hover:text-foreground h-9 px-3"
          >
            <SlidersHorizontal className="mr-2 h-4 w-4" />
            筛选
          </Button>
        )}
      </div>

      {/* 右侧：刷新与其他操作 */}
      <div className="flex items-center gap-2">
        {/* 操作按钮插槽 */}
        {actions}

        {onRefresh && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onRefresh}
            disabled={loading}
            className={cn('h-9 w-9', loading && 'opacity-70')}
          >
            <RotateCcw className={cn('h-4 w-4', loading && 'animate-spin')} />
          </Button>
        )}
      </div>
    </div>
  );
}
