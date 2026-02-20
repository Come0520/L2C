'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { TrendingUp, Users, DollarSign, ArrowRight, Loader2, Wallet } from 'lucide-react';
import Link from 'next/link';
import useSWR from 'swr';
import { fetcher } from '@/shared/lib/fetcher';
import { createLogger } from "@/shared/lib/logger";

const logger = createLogger('ChannelWidgets');

function formatAmount(amount: number): string {
    if (amount >= 10000) {
        return `¥${(amount / 10000).toFixed(1)}万`;
    }
    return `¥${amount.toLocaleString()}`;
}

export function ChannelPerformanceWidget() {
    const { data: swrData, isLoading } = useSWR(
        '/api/workbench/channel-stats',
        fetcher,
        {
            refreshInterval: 600000, // 10分钟刷新一次
            revalidateOnFocus: false,
            onError: (err) => {
                logger.error('Failed to load channel stats via SWR', {}, err);
            }
        }
    );

    const data = swrData?.success ? swrData.data : null;
    const loading = isLoading;

    if (loading) {
        return (
            <Card className="glass-liquid border-white/10 h-full">
                <CardContent className="flex items-center justify-center h-full">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </CardContent>
            </Card>
        );
    }

    if (!data) {
        return (
            <Card className="glass-liquid border-white/10 h-full">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                        渠道业绩
                    </CardTitle>
                    <TrendingUp className="h-4 w-4 text-primary" />
                </CardHeader>
                <CardContent className="flex items-center justify-center h-[calc(100%-3rem)] text-muted-foreground text-xs">
                    加载失败
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="glass-liquid border-white/10 h-full flex flex-col">
            <CardHeader className="flex flex-row items-center justify-between pb-2 shrink-0 space-y-0">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    渠道业绩
                </CardTitle>
                <Link href="/channels/analytics" className="text-xs text-muted-foreground hover:text-primary flex items-center transition-colors">
                    详情
                    <ArrowRight className="h-3 w-3 ml-1" />
                </Link>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col justify-between min-h-0 pt-0">
                <div className="grid grid-cols-3 gap-2 mt-2">
                    <div className="text-center p-2 rounded-lg bg-muted/20">
                        <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
                            <Users className="h-3 w-3" />
                        </div>
                        <div className="text-lg font-bold">{data.activeChannelCount}</div>
                        <div className="text-[10px] text-muted-foreground">活跃渠道</div>
                    </div>
                    <div className="text-center p-2 rounded-lg bg-muted/20">
                        <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
                            <DollarSign className="h-3 w-3" />
                        </div>
                        <div className="text-lg font-bold text-green-600">
                            {formatAmount(data.totalDealAmount)}
                        </div>
                        <div className="text-[10px] text-muted-foreground">本月带单</div>
                    </div>
                    <div className="text-center p-2 rounded-lg bg-muted/20">
                        <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
                            <TrendingUp className="h-3 w-3" />
                        </div>
                        <div className="text-lg font-bold">
                            {data.avgConversionRate.toFixed(0)}%
                        </div>
                        <div className="text-[10px] text-muted-foreground">转化率</div>
                    </div>
                </div>

                <div className="pt-3 border-t border-border/50 mt-auto">
                    <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-1 text-muted-foreground">
                            <Wallet className="h-3 w-3" />
                            <span>待结算佣金</span>
                        </div>
                        <span className="font-medium text-orange-600">
                            {formatAmount(data.pendingCommission)}
                        </span>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
