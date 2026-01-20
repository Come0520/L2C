'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/shared/ui/card";
import { cn } from '@/shared/lib/utils';
import { AlertTriangle, TrendingUp, Clock, CheckCircle } from 'lucide-react';
import { Badge } from '@/shared/ui/badge';
import { Progress } from '@/shared/ui/progress';

/**
 * AR 统计数据接口
 */
interface ArStatsData {
    /** 总应收金额 */
    totalReceivable: number;
    /** 已收金额 */
    receivedAmount: number;
    /** 逾期金额 */
    overdueAmount: number;
    /** 逾期笔数 */
    overdueCount: number;
    /** 总笔数 */
    totalCount: number;
    /** 账龄分布 */
    agingBuckets?: {
        label: string;
        amount: number;
        count: number;
        /** 是否预警 */
        isWarning?: boolean;
    }[];
}

interface ArCollectionReportCardProps {
    data: ArStatsData;
    className?: string;
}

/**
 * AR 回款数据报表卡片
 * 
 * 功能：
 * 1. 回款率统计
 * 2. 逾期账款预警
 * 3. 账龄分布展示
 */
export function ArCollectionReportCard({ data, className }: ArCollectionReportCardProps) {
    // 计算回款率
    const collectionRate = data.totalReceivable > 0
        ? ((data.receivedAmount / data.totalReceivable) * 100)
        : 100;

    // 计算逾期率
    const overdueRate = data.totalReceivable > 0
        ? ((data.overdueAmount / data.totalReceivable) * 100)
        : 0;

    // 健康状态判断
    const getHealthStatus = () => {
        if (overdueRate > 20) return { label: '风险', color: 'destructive' as const, icon: AlertTriangle };
        if (overdueRate > 10) return { label: '预警', color: 'default' as const, icon: Clock };
        return { label: '健康', color: 'secondary' as const, icon: CheckCircle };
    };

    const healthStatus = getHealthStatus();

    return (
        <Card className={cn("overflow-hidden", className)}>
            <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                            <TrendingUp className="h-4 w-4 text-muted-foreground" />
                            回款数据报表
                        </CardTitle>
                        <CardDescription>AR 回款率与逾期预警</CardDescription>
                    </div>
                    <Badge variant={healthStatus.color} className="flex items-center gap-1">
                        <healthStatus.icon className="h-3 w-3" />
                        {healthStatus.label}
                    </Badge>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* 回款率进度 */}
                <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">回款率</span>
                        <span className="font-bold text-primary">{collectionRate.toFixed(1)}%</span>
                    </div>
                    <Progress value={collectionRate} className="h-2" />
                    <div className="flex justify-between text-xs text-muted-foreground">
                        <span>已收: ¥{data.receivedAmount.toLocaleString()}</span>
                        <span>应收: ¥{data.totalReceivable.toLocaleString()}</span>
                    </div>
                </div>

                {/* 逾期预警 */}
                {data.overdueAmount > 0 && (
                    <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                        <div className="flex items-center gap-2 text-destructive">
                            <AlertTriangle className="h-4 w-4" />
                            <span className="font-medium text-sm">逾期预警</span>
                        </div>
                        <div className="mt-2 grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-xs text-muted-foreground">逾期金额</p>
                                <p className="text-lg font-bold text-destructive">
                                    ¥{data.overdueAmount.toLocaleString()}
                                </p>
                            </div>
                            <div>
                                <p className="text-xs text-muted-foreground">逾期笔数</p>
                                <p className="text-lg font-bold text-destructive">
                                    {data.overdueCount} 笔
                                </p>
                            </div>
                        </div>
                        <p className="text-xs text-muted-foreground mt-2">
                            逾期率: {overdueRate.toFixed(1)}%
                        </p>
                    </div>
                )}

                {/* 账龄分布 */}
                {data.agingBuckets && data.agingBuckets.length > 0 && (
                    <div className="space-y-2 pt-2 border-t">
                        <p className="text-sm font-medium">账龄分布</p>
                        <div className="space-y-2">
                            {data.agingBuckets.map((bucket, index) => (
                                <div
                                    key={index}
                                    className={cn(
                                        "flex items-center justify-between text-sm p-2 rounded",
                                        bucket.isWarning && "bg-orange-50 dark:bg-orange-900/20"
                                    )}
                                >
                                    <span className={cn(
                                        "text-muted-foreground",
                                        bucket.isWarning && "text-orange-600 font-medium"
                                    )}>
                                        {bucket.label}
                                    </span>
                                    <div className="text-right">
                                        <span className={cn(
                                            "font-medium",
                                            bucket.isWarning && "text-orange-600"
                                        )}>
                                            ¥{bucket.amount.toLocaleString()}
                                        </span>
                                        <span className="text-xs text-muted-foreground ml-2">
                                            ({bucket.count}笔)
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* 快速统计 */}
                <div className="grid grid-cols-2 gap-4 pt-2 border-t">
                    <div className="text-center">
                        <p className="text-2xl font-bold text-primary">{data.totalCount}</p>
                        <p className="text-xs text-muted-foreground">总笔数</p>
                    </div>
                    <div className="text-center">
                        <p className="text-2xl font-bold text-green-600">
                            {data.totalCount - data.overdueCount}
                        </p>
                        <p className="text-xs text-muted-foreground">正常笔数</p>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
