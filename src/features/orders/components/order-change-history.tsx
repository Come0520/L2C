'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { cn } from '@/shared/lib/utils';
import { History, Plus, Minus, Edit, RotateCcw, Truck, CheckCircle } from 'lucide-react';

/**
 * 订单变更记录类型
 */
export interface OrderChangeRecord {
    id: string;
    type: 'ADD_ITEM' | 'REMOVE_ITEM' | 'MODIFY_ITEM' | 'STATUS_CHANGE' | 'DELIVERY' | 'OTHER';
    reason: string;
    diffAmount?: number;
    originalData?: Record<string, unknown>;
    newData?: Record<string, unknown>;
    requestedBy?: {
        id: string;
        name: string;
    };
    createdAt: Date;
}

export interface OrderChangeHistoryProps {
    changes: OrderChangeRecord[];
    className?: string;
}

/**
 * 变更类型图标和颜色映射
 */
const changeTypeConfig: Record<string, { icon: React.ComponentType<{ className?: string }>; color: string; label: string }> = {
    ADD_ITEM: { icon: Plus, color: 'text-green-500 bg-green-500/10', label: '新增商品' },
    REMOVE_ITEM: { icon: Minus, color: 'text-red-500 bg-red-500/10', label: '删除商品' },
    MODIFY_ITEM: { icon: Edit, color: 'text-blue-500 bg-blue-500/10', label: '修改商品' },
    STATUS_CHANGE: { icon: RotateCcw, color: 'text-amber-500 bg-amber-500/10', label: '状态变更' },
    DELIVERY: { icon: Truck, color: 'text-purple-500 bg-purple-500/10', label: '发货更新' },
    OTHER: { icon: CheckCircle, color: 'text-gray-500 bg-gray-500/10', label: '其他变更' },
};

/**
 * 订单变更历史时间线组件
 */
export function OrderChangeHistory({ changes, className }: OrderChangeHistoryProps) {
    if (!changes || changes.length === 0) {
        return (
            <Card className={cn('glass-liquid border-white/10', className)}>
                <CardHeader>
                    <CardTitle className="text-base font-medium flex items-center gap-2">
                        <History className="h-5 w-5" />
                        变更历史
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground text-center py-4">
                        暂无变更记录
                    </p>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className={cn('glass-liquid border-white/10', className)}>
            <CardHeader>
                <CardTitle className="text-base font-medium flex items-center gap-2">
                    <History className="h-5 w-5" />
                    变更历史
                    <span className="text-xs text-muted-foreground font-normal">
                        ({changes.length} 条记录)
                    </span>
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="relative pl-6">
                    {/* 时间线竖线 */}
                    <div className="absolute left-2 top-2 bottom-2 w-0.5 bg-border" />

                    {/* 变更记录列表 */}
                    <div className="space-y-6">
                        {changes.map((change) => {
                            const config = changeTypeConfig[change.type] || changeTypeConfig.OTHER;
                            const Icon = config.icon;

                            return (
                                <div key={change.id} className="relative">
                                    {/* 时间线节点 */}
                                    <div className={cn(
                                        'absolute -left-4 w-4 h-4 rounded-full flex items-center justify-center',
                                        config.color
                                    )}>
                                        <Icon className="h-2.5 w-2.5" />
                                    </div>

                                    {/* 变更内容 */}
                                    <div className="pl-4">
                                        <div className="flex items-center gap-2 text-sm">
                                            <span className="font-medium">{config.label}</span>
                                            {change.diffAmount !== undefined && change.diffAmount !== 0 && (
                                                <span className={cn(
                                                    'text-xs font-medium',
                                                    change.diffAmount > 0 ? 'text-green-500' : 'text-red-500'
                                                )}>
                                                    {change.diffAmount > 0 ? '+' : ''}¥{Math.abs(change.diffAmount).toFixed(2)}
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-sm text-muted-foreground mt-0.5">
                                            {change.reason}
                                        </p>
                                        <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                                            <span>{formatDateTime(change.createdAt)}</span>
                                            {change.requestedBy && (
                                                <>
                                                    <span>•</span>
                                                    <span>{change.requestedBy.name}</span>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

/**
 * 格式化日期时间
 */
function formatDateTime(date: Date): string {
    if (!(date instanceof Date)) {
        date = new Date(date);
    }
    return date.toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
    });
}

export default OrderChangeHistory;
