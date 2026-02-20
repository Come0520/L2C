'use client';

import React from 'react';
import { PackageOpen } from 'lucide-react';
import { cn } from '@/shared/lib/utils';

interface EmptyUIProps {
    message?: string;
    icon?: React.ReactNode;
    className?: string;
}

/**
 * 统一的空状态 UI 组件 (通用场景)
 */
export const EmptyUI = React.memo(function EmptyUI({
    message = '暂无数据',
    icon,
    className
}: EmptyUIProps) {
    return (
        <div className={cn("flex flex-col items-center justify-center py-12 text-muted-foreground", className)}>
            <div className="flex flex-col items-center justify-center">
                {icon || <PackageOpen className="w-12 h-12 mb-4 opacity-20" />}
                <p className="text-sm font-medium">{message}</p>
            </div>
        </div>
    );
});
