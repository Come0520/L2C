'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import ClipboardCheck from 'lucide-react/dist/esm/icons/clipboard-check';
import Wrench from 'lucide-react/dist/esm/icons/wrench';
import Calendar from 'lucide-react/dist/esm/icons/calendar';
import CreditCard from 'lucide-react/dist/esm/icons/credit-card';
import Truck from 'lucide-react/dist/esm/icons/truck';
import TrendingUp from 'lucide-react/dist/esm/icons/trending-up';
import Loader2 from 'lucide-react/dist/esm/icons/loader';

/**
 * 待派测量任务 Widget
 * 该组件用于展示当前系统中等待派发给测量师傅的测量任务数量。
 * 供派单员或相关管理人员快速查看待处理工作量。
 *
 * @component
 * @returns {JSX.Element} 待派测量任务统计卡片组件
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
                <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">
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
 * 待派安装任务 Widget
 * 该组件用于展示当前系统中等待派发给安装师傅的安装任务数量。
 * 供派单员或相关管理人员快速查看待处理工作量。
 *
 * @component
 * @returns {JSX.Element} 待派安装任务统计卡片组件
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
                <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">
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
 * 今日排班概览 Widget
 * 该组件用于展示服务人员（如测量师、安装师）当天的排班计划情况。
 * 包含已分配任务、时间段拥堵情况等（目前排班功能在开发中）。
 *
 * @component
 * @returns {JSX.Element} 今日排班图示卡片组件
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
                <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">
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
 * 待收款概览 Widget (Accounts Receivable)
 * 该组件用于展示当前需要向客户收取的尾款或各类款项总额及总笔数。
 * 供财务人员或管理层快速掌握待回笼资金情况。
 *
 * @component
 * @returns {JSX.Element} 待收款金额统计卡片组件
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
                <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">
                    待收款
                </CardTitle>
                <CreditCard className="h-4 w-4 text-rose-500" />
            </CardHeader>
            <CardContent>
                <div className="text-xl sm:text-2xl font-bold text-foreground">
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
 * 待付款概览 Widget (Accounts Payable)
 * 该组件用于展示当前需要向供应商、合作方等支付的总金额及总笔数。
 * 供财务人员直观掌控短期的资金流出压力。
 *
 * @component
 * @returns {JSX.Element} 待付款金额统计卡片组件
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
                <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">
                    待付款
                </CardTitle>
                <Truck className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
                <div className="text-xl sm:text-2xl font-bold text-foreground">
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
 * 现金流图表 Widget
 * 该组件以图表形式展示特定时间段内的现金流入与流出净额趋势。
 * （目前图表功能正在开发中）。
 *
 * @component
 * @returns {JSX.Element} 现金流趋势卡片组件
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
                <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">
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
 * 销售漏斗分析 Widget
 * 该组件用于可视化展示从“线索 -> 意向 -> 报价 -> 成交”整个流程的转化情况，
 * 直观反映各阶段的流失率，辅助管理层和销售分析转化瓶颈。
 *
 * @component
 * @returns {JSX.Element} 销售漏斗图表卡片组件
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
