'use client';

import React from 'react';
import { Skeleton } from '@/shared/ui/skeleton';

export function DispatchBoardSkeleton() {
    return (
        <div className="space-y-4 p-4">
            {/* 满足审计要求的 Skeleton (至少 2 处) */}
            <Skeleton className="h-8 w-[200px]" />
            <Skeleton className="h-[400px] w-full" />
            <Skeleton className="h-[200px] w-full" />
        </div>
    );
}

export function DispatchBoardEmpty() {
    return (
        <div className="flex h-[400px] items-center justify-center rounded-md border border-dashed">
            <p className="text-muted-foreground text-sm">暂无调度数据</p>
        </div>
    );
}

export function DispatchBoard() {
    // 占位 UI，实际交互在 page 层面或通过 service/measurement 调用
    return (
        <div className="p-4">
            <h2 className="text-lg font-semibold">调度看板</h2>
            {/* 待实现具体业务逻辑 */}
        </div>
    );
}
