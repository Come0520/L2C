'use client';

import React from 'react';
import { TableRow, TableCell } from './table';
import { PackageOpen } from 'lucide-react';
import { cn } from '@/shared/lib/utils';

interface EmptyTableRowProps {
    colSpan: number;
    message?: string;
    className?: string;
}

/**
 * 模块级别提升的静态 JSX 片段，用于图标
 */
const EMPTY_ICON = <PackageOpen className="w-10 h-10 mb-2 opacity-20" />;

/**
 * 统一的表格空状态行组件 (Phase 5: Static JSX Hoisting)
 */
export const EmptyTableRow = React.memo(function EmptyTableRow({
    colSpan,
    message = '暂无数据',
    className
}: EmptyTableRowProps) {
    return (
        <TableRow>
            <TableCell
                colSpan={colSpan}
                className={cn("h-32 text-center text-muted-foreground", className)}
            >
                <div className="flex flex-col items-center justify-center py-8">
                    {EMPTY_ICON}
                    <p>{message}</p>
                </div>
            </TableCell>
        </TableRow>
    );
});
