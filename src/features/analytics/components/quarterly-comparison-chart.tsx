'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { BarChart as BarChartIcon } from 'lucide-react';

interface QuarterlyData {
  name: string;
  target: number;
  achieved: number;
  rate: number;
}

interface QuarterlyComparisonChartProps {
  data: QuarterlyData[];
  className?: string;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const rate = payload[0].payload.rate;
    return (
      <div className="bg-background/95 rounded-md border p-3 text-sm shadow-sm">
        <p className="mb-2 font-semibold">{label}</p>
        {payload.map((entry: any, index: number) => (
          <div key={index} className="mb-1 flex justify-between gap-4">
            <span style={{ color: entry.color }}>{entry.name}:</span>
            <span className="font-medium">¥{entry.value.toLocaleString()}</span>
          </div>
        ))}
        <div className="mt-2 flex justify-between gap-4 border-t pt-2">
          <span className="text-muted-foreground">达成率:</span>
          <span
            className={`font-bold ${rate >= 100 ? 'text-emerald-500' : rate >= 80 ? 'text-blue-500' : 'text-red-500'}`}
          >
            {rate}%
          </span>
        </div>
      </div>
    );
  }
  return null;
};

export function QuarterlyComparisonChart({ data, className }: QuarterlyComparisonChartProps) {
  if (!data || data.length === 0) {
    return (
      <Card className={className}>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <BarChartIcon className="h-4 w-4" />
            季度业绩对比
          </CardTitle>
        </CardHeader>
        <CardContent className="text-muted-foreground flex h-[300px] items-center justify-center text-sm">
          暂无季度数据
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <BarChartIcon className="h-4 w-4" />
          季度业绩对比
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="mt-4 h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }} barGap={8}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
              <XAxis
                dataKey="name"
                axisLine={false}
                tickLine={false}
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                dy={10}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                tickFormatter={(value) => {
                  if (value >= 10000) return `${(value / 10000).toFixed(0)}万`;
                  return value;
                }}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'hsl(var(--muted)/0.4)' }} />
              <Legend
                verticalAlign="top"
                height={36}
                iconType="circle"
                wrapperStyle={{ fontSize: '12px', color: 'hsl(var(--muted-foreground))' }}
              />
              <Bar
                dataKey="target"
                name="指标定额"
                fill="hsl(var(--muted))"
                radius={[4, 4, 0, 0]}
                maxBarSize={40}
              />
              <Bar
                dataKey="achieved"
                name="实际完成"
                fill="hsl(var(--primary))"
                radius={[4, 4, 0, 0]}
                maxBarSize={40}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
