'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { createLogger } from '@/shared/lib/logger';

const logger = createLogger('ArAgingWidget');
import { toast } from 'sonner';
import Loader2 from 'lucide-react/dist/esm/icons/loader';
import AlertCircle from 'lucide-react/dist/esm/icons/alert-circle';
import { cn } from '@/shared/utils';
import useSWR from 'swr';
import { fetcher } from '@/shared/lib/fetcher';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Cell,
} from 'recharts';

interface ARAgingWidgetProps {
  className?: string;
}

const AGING_COLORS = {
  '0-30天': '#10b981', // Green
  '31-60天': '#f59e0b', // Amber
  '61-90天': '#f97316', // Orange
  '90天以上': '#ef4444', // Red
};

interface ARAgingData {
  agingBuckets: { range: string; count: number; amount: string }[];
  summary: {
    totalPendingAmount: string;
    totalCount: number;
  };
}

export function ARAgingWidget({ className }: ARAgingWidgetProps) {
  const { data: swrData, isLoading } = useSWR<{ success: boolean; data: ARAgingData }>(
    '/api/workbench/ar-aging',
    fetcher,
    {
      refreshInterval: 300000, // 5分钟刷新一次
      revalidateOnFocus: false,
      onError: (err) => {
        logger.error('Failed to load AR aging analysis via SWR', {}, err);
        toast.error('加载应收账款分析失败');
      },
    }
  );

  const data = swrData?.success ? swrData.data : null;
  const loading = isLoading;

  if (loading) {
    return (
      <Card className={cn('h-full', className)}>
        <CardContent className="flex h-full items-center justify-center p-6">
          <Loader2 className="text-muted-foreground h-8 w-8 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  if (!data) return null;

  return (
    <Card className={cn('flex flex-col', className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div>
          <CardTitle>应收账款账龄 (AR Aging)</CardTitle>
          <p className="text-muted-foreground mt-1 text-sm">
            总待收:{' '}
            <span className="text-foreground font-bold">¥{data.summary.totalPendingAmount}</span>
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-md bg-red-50 px-2 py-1 text-xs font-medium text-red-600">
          <AlertCircle className="h-3 w-3" />
          <span>逾期笔数 {data.summary.totalCount}</span>
        </div>
      </CardHeader>
      <CardContent className="min-h-[300px] flex-1 pt-4">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data.agingBuckets}
            layout="vertical"
            margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
            barSize={32}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              horizontal={true}
              vertical={false}
              stroke="#f0f0f0"
            />
            <XAxis type="number" hide />
            <YAxis
              dataKey="range"
              type="category"
              width={60}
              tick={{ fontSize: 12 }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              cursor={{ fill: 'transparent' }}
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const item = payload[0].payload as {
                    range: string;
                    amount: number;
                    count: number;
                  };
                  return (
                    <div className="bg-background rounded-lg border p-2 text-xs shadow-sm">
                      <div className="mb-1 font-bold">{item.range}</div>
                      <div className="flex justify-between gap-4">
                        <span className="text-muted-foreground">金额</span>
                        <span className="font-medium">¥{item.amount.toLocaleString()}</span>
                      </div>
                      <div className="mt-1 flex justify-between gap-4">
                        <span className="text-muted-foreground">笔数</span>
                        <span className="font-medium">{item.count}笔</span>
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Bar dataKey="amount" radius={[0, 4, 4, 0]}>
              {data.agingBuckets.map((entry: { range: string }, index: number) => (
                <Cell
                  key={`cell-${index}`}
                  fill={AGING_COLORS[entry.range as keyof typeof AGING_COLORS] || '#94a3b8'}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>

        {/* Legend/Summary */}
        <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
          {data.agingBuckets.map((bucket: { range: string; amount: string }) => (
            <div
              key={bucket.range}
              className="bg-muted/30 flex items-center justify-between rounded p-2"
            >
              <div className="flex items-center gap-2">
                <div
                  className="h-2 w-2 rounded-full"
                  style={{
                    backgroundColor:
                      AGING_COLORS[bucket.range as keyof typeof AGING_COLORS] || '#94a3b8',
                  }}
                />
                <span className="text-muted-foreground">{bucket.range}</span>
              </div>
              <span className="font-medium">¥{parseFloat(bucket.amount).toLocaleString()}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
