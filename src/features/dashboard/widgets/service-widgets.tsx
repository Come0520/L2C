'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import {
    ClipboardCheck,
    Wrench,
    Calendar,
    CreditCard,
    Truck,
    TrendingUp,
    Loader2
} from 'lucide-react';

/**
 * 待派测量 Widget
 */
export function PendingMeasureWidget() {
    const [count, setCount] = useState<number | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const timer = setTimeout(() => {
            setCount(5);
            setLoading(false);
        }, 500);
        return () => clearTimeout(timer);
    }, []);

    if (loading) {
        return (
            <Card className="glass-liquid border-white/10 h-full">
                <CardContent className="flex items-center justify-center h-full">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="glass-liquid border-white/10 h-full">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                    待派测量
                </CardTitle>
                <ClipboardCheck className="h-4 w-4 text-amber-500" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold text-foreground">{count}</div>
                <p className="text-xs text-muted-foreground mt-1">
                    待派发任务
                </p>
            </CardContent>
        </Card>
    );
}

/**
 * 待派安装 Widget
 */
export function PendingInstallWidget() {
    const [count, setCount] = useState<number | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const timer = setTimeout(() => {
            setCount(3);
            setLoading(false);
        }, 500);
        return () => clearTimeout(timer);
    }, []);

    if (loading) {
        return (
            <Card className="glass-liquid border-white/10 h-full">
                <CardContent className="flex items-center justify-center h-full">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="glass-liquid border-white/10 h-full">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                    待派安装
                </CardTitle>
                <Wrench className="h-4 w-4 text-cyan-500" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold text-foreground">{count}</div>
                <p className="text-xs text-muted-foreground mt-1">
                    待派发任务
                </p>
            </CardContent>
        </Card>
    );
}

/**
 * 今日排班 Widget
 */
export function TodayScheduleWidget() {
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const timer = setTimeout(() => {
            setLoading(false);
        }, 500);
        return () => clearTimeout(timer);
    }, []);

    if (loading) {
        return (
            <Card className="glass-liquid border-white/10 h-full">
                <CardContent className="flex items-center justify-center h-full">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="glass-liquid border-white/10 h-full">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                    今日排班
                </CardTitle>
                <Calendar className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent className="flex items-center justify-center h-[calc(100%-3rem)]">
                <div className="text-center text-muted-foreground">
                    <Calendar className="h-10 w-10 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">排班功能开发中...</p>
                </div>
            </CardContent>
        </Card>
    );
}

/**
 * 待收款 (AR) Widget
 */
export function ARSummaryWidget() {
    const [data, setData] = useState<{ amount: number; count: number } | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const timer = setTimeout(() => {
            setData({ amount: 32500, count: 8 });
            setLoading(false);
        }, 500);
        return () => clearTimeout(timer);
    }, []);

    if (loading) {
        return (
            <Card className="glass-liquid border-white/10 h-full">
                <CardContent className="flex items-center justify-center h-full">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="glass-liquid border-white/10 h-full">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                    待收款
                </CardTitle>
                <CreditCard className="h-4 w-4 text-rose-500" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold text-foreground">
                    ¥{data!.amount.toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                    共 {data!.count} 笔
                </p>
            </CardContent>
        </Card>
    );
}

/**
 * 待付款 (AP) Widget
 */
export function APSummaryWidget() {
    const [data, setData] = useState<{ amount: number; count: number } | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const timer = setTimeout(() => {
            setData({ amount: 18200, count: 5 });
            setLoading(false);
        }, 500);
        return () => clearTimeout(timer);
    }, []);

    if (loading) {
        return (
            <Card className="glass-liquid border-white/10 h-full">
                <CardContent className="flex items-center justify-center h-full">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="glass-liquid border-white/10 h-full">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                    待付款
                </CardTitle>
                <Truck className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold text-foreground">
                    ¥{data!.amount.toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                    共 {data!.count} 笔
                </p>
            </CardContent>
        </Card>
    );
}

/**
 * 现金流 Widget
 */
export function CashFlowWidget() {
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const timer = setTimeout(() => {
            setLoading(false);
        }, 500);
        return () => clearTimeout(timer);
    }, []);

    if (loading) {
        return (
            <Card className="glass-liquid border-white/10 h-full">
                <CardContent className="flex items-center justify-center h-full">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="glass-liquid border-white/10 h-full">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                    现金流
                </CardTitle>
                <TrendingUp className="h-4 w-4 text-emerald-500" />
            </CardHeader>
            <CardContent className="flex items-center justify-center h-[calc(100%-3rem)]">
                <div className="text-center text-muted-foreground">
                    <TrendingUp className="h-10 w-10 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">现金流图表开发中...</p>
                </div>
            </CardContent>
        </Card>
    );
}

/**
 * 销售漏斗 Widget
 */
export function ConversionFunnelWidget() {
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const timer = setTimeout(() => {
            setLoading(false);
        }, 500);
        return () => clearTimeout(timer);
    }, []);

    if (loading) {
        return (
            <Card className="glass-liquid border-white/10 h-full">
                <CardContent className="flex items-center justify-center h-full">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </CardContent>
            </Card>
        );
    }

    // 模拟漏斗数据
    const funnelData = [
        { stage: '线索', count: 100, color: 'bg-blue-500' },
        { stage: '意向', count: 65, color: 'bg-cyan-500' },
        { stage: '报价', count: 40, color: 'bg-amber-500' },
        { stage: '成交', count: 25, color: 'bg-emerald-500' },
    ];

    return (
        <Card className="glass-liquid border-white/10 h-full">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                    销售漏斗
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
                {funnelData.map((item, index) => (
                    <div key={item.stage} className="flex items-center gap-3">
                        <span className="w-12 text-xs text-muted-foreground">{item.stage}</span>
                        <div className="flex-1 h-6 bg-muted rounded overflow-hidden">
                            <div
                                className={`h-full ${item.color} transition-all flex items-center justify-end pr-2`}
                                style={{ width: `${item.count}%` }}
                            >
                                <span className="text-xs text-white font-medium">{item.count}</span>
                            </div>
                        </div>
                        {index < funnelData.length - 1 && (
                            <span className="text-xs text-muted-foreground w-10">
                                {Math.round((funnelData[index + 1].count / item.count) * 100)}%
                            </span>
                        )}
                    </div>
                ))}
            </CardContent>
        </Card>
    );
}
