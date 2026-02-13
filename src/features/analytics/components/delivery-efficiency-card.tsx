'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/shared/ui/card";
import { cn } from '@/shared/lib/utils';
import { Clock, Truck, CheckCircle2, AlertTriangle } from 'lucide-react';
import { Progress } from '@/shared/ui/progress';

interface DeliveryEfficiencyCardProps {
    // 测量相关
    measureAvgDays?: number;      // 平均测量周期（天）
    measureOnTimeRate?: number;   // 测量按时完成率 (%)

    // 安装相关
    installAvgDays?: number;      // 平均安装周期（天）
    installOnTimeRate?: number;   // 安装按时完成率 (%)

    // 整体
    totalPendingTasks?: number;   // 待处理任务数
    overdueTaskCount?: number;    // 逾期任务数

    className?: string;
}

/**
 * 交付效率卡片
 * 展示测量和安装的效率指标
 */
export function DeliveryEfficiencyCard({
    measureAvgDays = 0,
    measureOnTimeRate = 0,
    installAvgDays = 0,
    installOnTimeRate = 0,
    totalPendingTasks = 0,
    overdueTaskCount = 0,
    className
}: DeliveryEfficiencyCardProps) {
    const hasOverdue = overdueTaskCount > 0;

    return (
        <Card className={cn("overflow-hidden", className)}>
            <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Truck className="h-4 w-4 text-muted-foreground" />
                    交付效率
                </CardTitle>
                <CardDescription>测量与安装服务效率指标</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* 测量效率 */}
                <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">测量平均周期</span>
                        <span className="font-medium">{measureAvgDays.toFixed(1)} 天</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">测量按时率</span>
                        <span className={cn(
                            "font-medium",
                            measureOnTimeRate >= 90 ? "text-green-600" : measureOnTimeRate >= 70 ? "text-yellow-600" : "text-red-600"
                        )}>
                            {measureOnTimeRate.toFixed(0)}%
                        </span>
                    </div>
                    <Progress value={measureOnTimeRate} className="h-2" />
                </div>

                {/* 安装效率 */}
                <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">安装平均周期</span>
                        <span className="font-medium">{installAvgDays.toFixed(1)} 天</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">安装按时率</span>
                        <span className={cn(
                            "font-medium",
                            installOnTimeRate >= 90 ? "text-green-600" : installOnTimeRate >= 70 ? "text-yellow-600" : "text-red-600"
                        )}>
                            {installOnTimeRate.toFixed(0)}%
                        </span>
                    </div>
                    <Progress value={installOnTimeRate} className="h-2" />
                </div>

                {/* 任务状态摘要 */}
                <div className="pt-2 border-t flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">待处理任务</span>
                    </div>
                    <span className="text-sm font-medium">{totalPendingTasks}</span>
                </div>

                {hasOverdue && (
                    <div className="flex items-center justify-between text-red-600 bg-red-50 dark:bg-red-900/20 rounded-md px-3 py-2">
                        <div className="flex items-center gap-2">
                            <AlertTriangle className="h-4 w-4" />
                            <span className="text-sm font-medium">逾期任务</span>
                        </div>
                        <span className="text-sm font-bold">{overdueTaskCount}</span>
                    </div>
                )}

                {!hasOverdue && (
                    <div className="flex items-center justify-between text-green-600 bg-green-50 dark:bg-green-900/20 rounded-md px-3 py-2">
                        <div className="flex items-center gap-2">
                            <CheckCircle2 className="h-4 w-4" />
                            <span className="text-sm font-medium">无逾期任务</span>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
