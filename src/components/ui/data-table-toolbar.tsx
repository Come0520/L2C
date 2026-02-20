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
    className
}: DataTableToolbarProps) {
    return (
        <div className={cn(
            "flex flex-wrap items-center justify-between gap-4 glass-layout-card p-2 rounded-xl border border-white/10 shadow-sm",
            className
        )}>
            {/* 左侧：搜索于筛选 */}
            <div className="flex flex-1 items-center gap-2 min-w-[200px]">
                {searchProps && (
                    <div className="relative flex-1 max-w-sm">
                        {searchProps.isPending ? (
                            <Loader2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground animate-spin" />
                        ) : (
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        )}
                        <Input
                            placeholder={searchProps.placeholder ?? "搜索..."}
                            value={searchProps.value}
                            onChange={(e) => searchProps.onChange(e.target.value)}
                            className="pl-9 h-9 bg-muted/20 border-none focus-visible:ring-1 focus-visible:ring-primary/20 transition-all hover:bg-muted/30"
                        />
                    </div>
                )}

                {/* 筛选器插槽 */}
                {children}

                {/* 默认提供一个占位筛选按钮，如果外界没有传入 children 且也没有特定需求，可以移除 */}
                {!children && (
                    <Button variant="ghost" size="sm" className="h-9 px-3 text-muted-foreground hover:text-foreground">
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
                        className={cn("h-9 w-9", loading && "opacity-70")}
                    >
                        <RotateCcw className={cn("h-4 w-4", loading && "animate-spin")} />
                    </Button>
                )}
            </div>
        </div>
    );
}
