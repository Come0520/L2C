'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { DollarSign, Target, Award, ClipboardCheck, TrendingUp, Loader2 } from 'lucide-react';
import { cn } from '@/shared/lib/utils';

/**
 * 团队销售额 Widget
 */
export function TeamSalesWidget() {
  const [amount, setAmount] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setAmount(285600);
      setLoading(false);
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return (
      <Card className="glass-liquid h-full cursor-pointer border-white/10 shadow-lg transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
        <CardContent className="flex h-full items-center justify-center">
          <Loader2 className="text-muted-foreground h-6 w-6 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glass-liquid h-full border-white/10">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-muted-foreground text-sm font-medium">团队销售</CardTitle>
        <DollarSign className="h-4 w-4 text-emerald-500" />
      </CardHeader>
      <CardContent>
        <div className="text-foreground text-2xl font-bold">¥{(amount! / 10000).toFixed(1)}万</div>
        <p className="text-muted-foreground mt-1 text-xs">本月累计</p>
      </CardContent>
    </Card>
  );
}

/**
 * 团队目标完成率 Widget
 */
export function TeamTargetWidget() {
  const [data, setData] = useState<{
    target: number;
    achieved: number;
    percentage: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setData({
        target: 500000,
        achieved: 285600,
        percentage: 57.1,
      });
      setLoading(false);
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return (
      <Card className="glass-liquid h-full cursor-pointer border-white/10 shadow-lg transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
        <CardContent className="flex h-full items-center justify-center">
          <Loader2 className="text-muted-foreground h-6 w-6 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glass-liquid h-full border-white/10">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-muted-foreground text-sm font-medium">团队目标</CardTitle>
        <Target className="h-4 w-4 text-blue-500" />
      </CardHeader>
      <CardContent>
        <div className="text-foreground text-2xl font-bold">{data!.percentage.toFixed(1)}%</div>
        <div className="bg-muted mt-2 h-2 w-full overflow-hidden rounded-full">
          <div
            className={cn(
              'h-full transition-all',
              data!.percentage >= 80
                ? 'bg-emerald-500'
                : data!.percentage >= 50
                  ? 'bg-blue-500'
                  : 'bg-amber-500'
            )}
            style={{ width: `${Math.min(data!.percentage, 100)}%` }}
          />
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * 销售排行榜 Widget
 */
export function TeamLeaderboardWidget() {
  const [leaders, setLeaders] = useState<
    | {
        name: string;
        amount: number;
      }[]
    | null
  >(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setLeaders([
        { name: '张三', amount: 68500 },
        { name: '李四', amount: 52300 },
        { name: '王五', amount: 48200 },
        { name: '赵六', amount: 35600 },
        { name: '钱七', amount: 28000 },
      ]);
      setLoading(false);
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return (
      <Card className="glass-liquid h-full cursor-pointer border-white/10 shadow-lg transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
        <CardContent className="flex h-full items-center justify-center">
          <Loader2 className="text-muted-foreground h-6 w-6 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  const maxAmount = leaders![0]?.amount || 1;

  return (
    <Card className="glass-liquid h-full border-white/10">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-muted-foreground text-sm font-medium">销售排行榜</CardTitle>
        <Award className="h-4 w-4 text-amber-500" />
      </CardHeader>
      <CardContent className="space-y-3">
        {leaders!.map((leader, index) => (
          <div key={leader.name} className="flex items-center gap-3">
            <span
              className={cn(
                'flex h-5 w-5 items-center justify-center rounded-full text-xs font-bold',
                index === 0
                  ? 'bg-amber-500 text-white'
                  : index === 1
                    ? 'bg-slate-400 text-white'
                    : index === 2
                      ? 'bg-orange-600 text-white'
                      : 'bg-muted text-muted-foreground'
              )}
            >
              {index + 1}
            </span>
            <div className="flex-1">
              <div className="flex justify-between text-sm">
                <span>{leader.name}</span>
                <span className="font-medium">¥{(leader.amount / 10000).toFixed(1)}万</span>
              </div>
              <div className="bg-muted mt-1 h-1.5 w-full overflow-hidden rounded-full">
                <div
                  className="bg-primary h-full transition-all"
                  style={{ width: `${(leader.amount / maxAmount) * 100}%` }}
                />
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

/**
 * 待审批 Widget (通用)
 */
export function PendingApprovalWidget() {
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
      <Card className="glass-liquid h-full cursor-pointer border-white/10 shadow-lg transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
        <CardContent className="flex h-full items-center justify-center">
          <Loader2 className="text-muted-foreground h-6 w-6 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glass-liquid h-full cursor-pointer border-white/10 transition-colors hover:bg-amber-500/10">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-muted-foreground text-sm font-medium">待审批</CardTitle>
        <ClipboardCheck className="h-4 w-4 text-amber-500" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-amber-500">{count}</div>
        <p className="text-muted-foreground mt-1 text-xs">需要您处理</p>
      </CardContent>
    </Card>
  );
}

/**
 * 销售趋势 Widget
 */
export function SalesTrendWidget() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return (
      <Card className="glass-liquid h-full border-white/10">
        <CardContent className="flex h-full items-center justify-center">
          <Loader2 className="text-muted-foreground h-6 w-6 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glass-liquid h-full border-white/10">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-muted-foreground text-sm font-medium">销售趋势</CardTitle>
        <TrendingUp className="h-4 w-4 text-blue-500" />
      </CardHeader>
      <CardContent className="flex h-[calc(100%-3rem)] items-center justify-center">
        <div className="text-muted-foreground text-center">
          <TrendingUp className="mx-auto mb-2 h-12 w-12 opacity-50" />
          <p className="text-sm">图表开发中...</p>
        </div>
      </CardContent>
    </Card>
  );
}
