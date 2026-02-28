'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { ResponsiveContainer, RadialBarChart, RadialBar, PolarAngleAxis } from 'recharts';
import { Target } from 'lucide-react';

interface AnnualProgressData {
  year: number;
  totalTarget: number;
  totalAchieved: number;
  completionRate: number;
}

interface AnnualProgressRingProps {
  data?: AnnualProgressData;
  className?: string;
}

export function AnnualProgressRing({ data, className }: AnnualProgressRingProps) {
  if (!data) {
    return (
      <Card className={className}>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <Target className="h-4 w-4" />
            年度目标进度
          </CardTitle>
        </CardHeader>
        <CardContent className="text-muted-foreground flex h-[300px] items-center justify-center text-sm">
          暂无进度数据
        </CardContent>
      </Card>
    );
  }

  const { completionRate, totalTarget, totalAchieved, year } = data;

  // 根据完成率计算显示的色带
  // 使用 Recharts 时，我们构造一个数组，包含一个底色环和一个实际进度环
  const chartData = [
    {
      name: '目标',
      value: 100, // 底环占满 100%
      fill: 'hsl(var(--muted))',
    },
    {
      name: '已完成',
      value: Math.min(completionRate, 100), // 实际进度不能超过 100% 画圈，超过的由颜色或文字体现
      fill: completionRate >= 100 ? 'hsl(var(--emerald-500))' : 'hsl(var(--primary))',
    },
  ];

  return (
    <Card className={className}>
      <CardHeader className="pb-0 text-center">
        <CardTitle className="flex items-center justify-center gap-2 text-base">
          <Target className="h-4 w-4" />
          {year} 年度目标进度
        </CardTitle>
      </CardHeader>
      <CardContent className="relative flex flex-col items-center justify-center p-0">
        <div className="h-[260px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <RadialBarChart
              cx="50%"
              cy="50%"
              innerRadius="60%"
              outerRadius="90%"
              barSize={18}
              data={chartData}
              startAngle={90}
              endAngle={-270}
            >
              <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
              <RadialBar
                background={false}
                dataKey="value"
                cornerRadius={10}
                // Recharts 的动画配置
                isAnimationActive={true}
                animationDuration={1500}
                animationEasing="ease-out"
              />
              {/* 不需要自带的 Tooltip 和 Legend，中间使用自定义信息 */}
            </RadialBarChart>
          </ResponsiveContainer>
        </div>

        {/* 中心信息展示 */}
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span
            className="text-4xl font-bold tracking-tighter"
            style={{
              color: completionRate >= 100 ? 'hsl(var(--emerald-500))' : 'hsl(var(--foreground))',
            }}
          >
            {completionRate}%
          </span>
          <span className="text-muted-foreground mt-1 text-xs">达成率</span>
        </div>

        {/* 底部详情指标 */}
        <div className="flex w-full justify-between px-8 pb-6 text-sm">
          <div className="flex flex-col items-center gap-1">
            <span className="text-muted-foreground">已完成</span>
            <span className="text-primary font-semibold">
              ¥{(totalAchieved / 10000).toFixed(1)}万
            </span>
          </div>
          <div className="flex flex-col items-center gap-1">
            <span className="text-muted-foreground">年度目标</span>
            <span className="font-medium">¥{(totalTarget / 10000).toFixed(1)}万</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
