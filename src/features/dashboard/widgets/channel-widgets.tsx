'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import TrendingUp from 'lucide-react/dist/esm/icons/trending-up';
import Users from 'lucide-react/dist/esm/icons/users';
import DollarSign from 'lucide-react/dist/esm/icons/dollar-sign';
import ArrowRight from 'lucide-react/dist/esm/icons/arrow-right';
import Loader2 from 'lucide-react/dist/esm/icons/loader';
import Wallet from 'lucide-react/dist/esm/icons/wallet';
import Link from 'next/link';
import useSWR from 'swr';
import { fetcher } from '@/shared/lib/fetcher';
import { createLogger } from '@/shared/lib/logger';

const logger = createLogger('ChannelWidgets');

function formatAmount(amount: number): string {
  if (amount >= 10000) {
    return `¥${(amount / 10000).toFixed(1)}万`;
  }
  return `¥${amount.toLocaleString()}`;
}

export function ChannelPerformanceWidget() {
  const { data: swrData, isLoading } = useSWR('/api/workbench/channel-stats', fetcher, {
    refreshInterval: 600000, // 10分钟刷新一次
    revalidateOnFocus: false,
    onError: (err) => {
      logger.error('Failed to load channel stats via SWR', {}, err);
    },
  });

  const data = swrData?.success ? swrData.data : null;
  const loading = isLoading;

  if (loading) {
    return (
      <Card className="glass-liquid h-full border-white/10">
        <CardContent className="flex h-full items-center justify-center">
          <Loader2 className="text-muted-foreground h-6 w-6 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  if (!data) {
    return (
      <Card className="glass-liquid h-full border-white/10">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-muted-foreground text-sm font-medium">渠道业绩</CardTitle>
          <TrendingUp className="text-primary h-4 w-4" />
        </CardHeader>
        <CardContent className="text-muted-foreground flex h-[calc(100%-3rem)] items-center justify-center text-xs">
          加载失败
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glass-liquid flex h-full flex-col border-white/10">
      <CardHeader className="flex shrink-0 flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-muted-foreground flex items-center gap-2 text-sm font-medium">
          渠道业绩
        </CardTitle>
        <Link
          href="/channels/analytics"
          className="text-muted-foreground hover:text-primary flex items-center text-xs transition-colors"
        >
          详情
          <ArrowRight className="ml-1 h-3 w-3" />
        </Link>
      </CardHeader>
      <CardContent className="flex min-h-0 flex-1 flex-col justify-between pt-0">
        <div className="mt-2 grid grid-cols-3 gap-2">
          <div className="bg-muted/20 rounded-lg p-2 text-center">
            <div className="text-muted-foreground mb-1 flex items-center justify-center gap-1">
              <Users className="h-3 w-3" />
            </div>
            <div className="text-lg font-bold">{data.activeChannelCount}</div>
            <div className="text-muted-foreground text-[10px]">活跃渠道</div>
          </div>
          <div className="bg-muted/20 rounded-lg p-2 text-center">
            <div className="text-muted-foreground mb-1 flex items-center justify-center gap-1">
              <DollarSign className="h-3 w-3" />
            </div>
            <div className="text-lg font-bold text-green-600">
              {formatAmount(data.totalDealAmount)}
            </div>
            <div className="text-muted-foreground text-[10px]">本月带单</div>
          </div>
          <div className="bg-muted/20 rounded-lg p-2 text-center">
            <div className="text-muted-foreground mb-1 flex items-center justify-center gap-1">
              <TrendingUp className="h-3 w-3" />
            </div>
            <div className="text-lg font-bold">{data.avgConversionRate.toFixed(0)}%</div>
            <div className="text-muted-foreground text-[10px]">转化率</div>
          </div>
        </div>

        <div className="border-border/50 mt-auto border-t pt-3">
          <div className="flex items-center justify-between text-xs">
            <div className="text-muted-foreground flex items-center gap-1">
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
