'use client';

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useDebounce } from 'use-debounce';
import {
  getDashboardStats,
  getSalesFunnel,
  getOrderTrend,
  getLeaderboard,
  getTargetAchievementOverview,
  getTargetCompletionTrend,
  getTargetRiskWarnings,
  getQuarterlyComparison,
  getAnnualTargetProgress,
} from '@/features/analytics/actions';
import { StatCard } from '@/features/analytics/components/stat-card';
import { SalesFunnelChart } from '@/features/analytics/components/sales-funnel-chart';
import { OrderTrendChart } from '@/features/analytics/components/order-trend-chart';
import {
  LeaderboardTable,
  LeaderboardItem,
} from '@/features/analytics/components/leaderboard-table';
import { TargetAchievementSection } from '@/features/analytics/components/target-achievement-section';
import { ARAgingWidget } from '@/features/dashboard/widgets/ar-aging-widget';
import {
  AnalyticsDraggableLayout,
  resetAnalyticsLayout,
} from '@/features/analytics/components/analytics-draggable-layout';
import {
  startOfMonth,
  endOfMonth,
  startOfQuarter,
  endOfQuarter,
  startOfYear,
  endOfYear,
  subDays,
  format,
} from 'date-fns';
import { DateRange } from 'react-day-picker';
import {
  Loader2,
  DollarSign,
  Users,
  ShoppingCart,
  Percent,
  Wallet,
  CalendarDays,
  RefreshCw,
  LayoutGrid,
  RotateCcw,
  Check,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/shared/ui/button';
import { Calendar } from '@/shared/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/shared/ui/popover';
import { cn } from '@/shared/lib/utils';
import { Badge } from '@/shared/ui/badge';

// ==================== 类型定义 ====================

interface KeyMetrics {
  totalSales: string;
  newLeads: number;
  orderCount: number;
  conversionRate: string;
  pendingReceivables: string;
  pendingPayables: string;
}

interface FunnelStage {
  stage: string;
  count: number;
  conversionRate: string | null;
  avgDaysInStage: string | null;
  previousPeriodCount: number;
  trend: string | null;
}

interface FunnelResponse {
  stages: FunnelStage[];
  summary: {
    overallConversion: string;
    avgCycleTime: string;
  };
}

interface TrendData {
  date: string;
  amount: number;
  count: number;
}

// ==================== 快捷预设 ====================

type PresetKey = 'last30' | 'thisMonth' | 'thisQuarter' | 'thisYear' | '';

interface DatePreset {
  label: string;
  key: Exclude<PresetKey, ''>;
  getRange: () => DateRange;
}

const DATE_PRESETS: DatePreset[] = [
  {
    label: '近30天',
    key: 'last30',
    getRange: () => ({ from: subDays(new Date(), 29), to: new Date() }),
  },
  {
    label: '本月',
    key: 'thisMonth',
    getRange: () => ({ from: startOfMonth(new Date()), to: endOfMonth(new Date()) }),
  },
  {
    label: '本季度',
    key: 'thisQuarter',
    getRange: () => ({ from: startOfQuarter(new Date()), to: endOfQuarter(new Date()) }),
  },
  {
    label: '今年',
    key: 'thisYear',
    getRange: () => ({ from: startOfYear(new Date()), to: endOfYear(new Date()) }),
  },
];

// ==================== 客户端缓存工具（1小时 TTL）====================

/** 客户端缓存有效期：60 分钟（毫秒） */
const CLIENT_CACHE_TTL_MS = 60 * 60 * 1000;

/**
 * 生成天级别缓存 Key
 * 使用 toDateString() 而非 getTime()，确保同一天的同一预设始终命中相同缓存
 */
const getCacheKey = (range: DateRange | undefined): string =>
  `${range?.from?.toDateString() ?? 'none'}-${range?.to?.toDateString() ?? 'none'}`;

// ==================== 主页面组件 ====================

export default function AnalyticsPage() {
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState<KeyMetrics | null>(null);
  const [funnelData, setFunnelData] = useState<FunnelResponse | null>(null);
  const [trendData, setTrendData] = useState<TrendData[]>([]);
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardItem[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [targetOverview, setTargetOverview] = useState<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [targetTrend, setTargetTrend] = useState<any[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [targetWarnings, setTargetWarnings] = useState<any[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [quarterlyData, setQuarterlyData] = useState<any[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [annualProgressData, setAnnualProgressData] = useState<any>(null);

  /** 快捷预设激活状态 */
  const [activePreset, setActivePreset] = useState<PresetKey>('thisMonth');

  /** 默认本月 */
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: startOfMonth(new Date()),
    to: endOfMonth(new Date()),
  });

  /** 日历弹窗状态 */
  const [calendarOpen, setCalendarOpen] = useState(false);

  /** 布局编辑模式 */
  const [isEditMode, setIsEditMode] = useState(false);

  /**
   * 防抖后的日期范围（500ms 延迟）
   * 只有防抖值变化时才触发真正的数据加载，避免快速连点产生多次请求
   */
  const [debouncedDateRange] = useDebounce(dateRange, 500);

  /**
   * 客户端内存缓存：以「开始日-结束日」为 Key。
   * 命中缓存时直接返回，不发起任何网络请求。
   */
  const clientCache = useRef<Map<string, { data: Record<string, unknown>; expiresAt: number }>>(new Map());

  // ==================== 数据加载 ====================
  const loadData = useCallback(async () => {
    // 使用防抖后的值，防止快速切换时本函数被频繁创建
    const cacheKey = getCacheKey(debouncedDateRange);
    const cached = clientCache.current.get(cacheKey);

    // 命中客户端缓存：直接还原数据，不发起网络请求
    if (cached && Date.now() < cached.expiresAt) {
      const d = cached.data;
      if (d.metrics) setMetrics(d.metrics as KeyMetrics);
      if (d.funnelData) setFunnelData(d.funnelData as FunnelResponse);
      if (d.trendData) setTrendData(d.trendData as TrendData[]);
      if (d.leaderboardData) setLeaderboardData(d.leaderboardData as LeaderboardItem[]);
      if (d.targetOverview) setTargetOverview(d.targetOverview);
      if (d.targetTrend) setTargetTrend(d.targetTrend as unknown[]);
      if (d.targetWarnings) setTargetWarnings(d.targetWarnings as unknown[]);
      if (d.quarterlyData) setQuarterlyData(d.quarterlyData as unknown[]);
      if (d.annualProgressData) setAnnualProgressData(d.annualProgressData);
      return; // 不进行任何网络请求
    }
    try {
      setLoading(true);
      // 使用防抖版日期范围，避免快速切换时重复请求
      const startDate = debouncedDateRange?.from || startOfMonth(new Date());
      const endDate = debouncedDateRange?.to || endOfMonth(new Date());

      const now = new Date();
      const currentYear = now.getFullYear();
      const currentMonth = now.getMonth() + 1;

      const [
        metricsRes,
        funnelRes,
        trendRes,
        leaderboardRes,
        overviewRes,
        completionTrendRes,
        warningsRes,
        quarterlyRes,
        annualProgressRes,
      ] = await Promise.all([
        getDashboardStats({ startDate: startDate.toISOString(), endDate: endDate.toISOString() }),
        getSalesFunnel({ startDate: startDate.toISOString(), endDate: endDate.toISOString() }),
        getOrderTrend({
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
          granularity: 'day',
        }),
        getLeaderboard({
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
          limit: 5,
          sortBy: 'amount',
        }),
        getTargetAchievementOverview({ year: currentYear, month: currentMonth }),
        getTargetCompletionTrend({ year: currentYear, month: currentMonth }),
        getTargetRiskWarnings({ year: currentYear, month: currentMonth }),
        getQuarterlyComparison({ year: currentYear }),
        getAnnualTargetProgress({ year: currentYear }),
      ]);

      if (metricsRes?.success && metricsRes.data) setMetrics(metricsRes.data as KeyMetrics);
      if (funnelRes?.success && funnelRes.data) setFunnelData(funnelRes.data as FunnelResponse);
      const parsedTrend = (trendRes?.success && trendRes.data)
        ? (trendRes.data as unknown as TrendData[]).map((item: TrendData) => ({
          ...item,
          amount: Number(item.amount),
        }))
        : null;
      if (parsedTrend) setTrendData(parsedTrend);
      if (leaderboardRes?.success && leaderboardRes.data)
        setLeaderboardData(leaderboardRes.data as LeaderboardItem[]);
      if (overviewRes?.success && overviewRes.data) setTargetOverview(overviewRes.data);
      if (completionTrendRes?.success && completionTrendRes.data)
        setTargetTrend(completionTrendRes.data);
      if (warningsRes?.success && warningsRes.data) setTargetWarnings(warningsRes.data);
      if (quarterlyRes?.success && quarterlyRes.data) setQuarterlyData(quarterlyRes.data);
      if (annualProgressRes?.success && annualProgressRes.data)
        setAnnualProgressData(annualProgressRes.data);

      // 将查询结果写入客户端内存缓存，有效期 1 小时
      clientCache.current.set(cacheKey, {
        data: {
          metrics: metricsRes?.success ? metricsRes.data : null,
          funnelData: funnelRes?.success ? funnelRes.data : null,
          trendData: parsedTrend,
          leaderboardData: leaderboardRes?.success ? leaderboardRes.data : null,
          targetOverview: overviewRes?.success ? overviewRes.data : null,
          targetTrend: completionTrendRes?.success ? completionTrendRes.data : null,
          targetWarnings: warningsRes?.success ? warningsRes.data : null,
          quarterlyData: quarterlyRes?.success ? quarterlyRes.data : null,
          annualProgressData: annualProgressRes?.success ? annualProgressRes.data : null,
        },
        expiresAt: Date.now() + CLIENT_CACHE_TTL_MS,
      });
    } catch (error) {
      console.error(error);
      toast.error('加载分析数据失败，请刷新重试');
    } finally {
      setLoading(false);
    }
  }, [debouncedDateRange]);

  /** 监听防抖后的日期范围，只在防抖稳定后才发起查询 */
  useEffect(() => {
    loadData();
  }, [loadData]);

  // ==================== 事件处理 ====================

  const handlePresetClick = (preset: DatePreset) => {
    setActivePreset(preset.key);
    setDateRange(preset.getRange());
  };

  const handleCalendarSelect = (range: DateRange | undefined) => {
    setDateRange(range);
    if (range?.from && range?.to) {
      setActivePreset('');
      setCalendarOpen(false);
    }
  };

  /** 退出编辑模式并提示保存成功 */
  const handleFinishEdit = () => {
    setIsEditMode(false);
    toast.success('布局已保存');
  };

  /** 重置布局并刷新页面区域 */
  const handleResetLayout = () => {
    resetAnalyticsLayout();
    // 通过短暂卸载再挂载触发布局重新加载
    setIsEditMode(false);
    window.location.reload();
  };

  // ==================== 日期显示文字 ====================

  const dateRangeLabel =
    dateRange?.from && dateRange?.to
      ? `${format(dateRange.from, 'MM/dd')} — ${format(dateRange.to, 'MM/dd')}`
      : '选择日期';

  // ==================== 加载状态 ====================

  if (loading && !metrics) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="text-primary h-8 w-8 animate-spin" />
      </div>
    );
  }

  // ==================== 各模块内容定义 ====================

  const gridItems = {
    'stat-sales': (
      <StatCard
        title="总销售额"
        value={`¥${Number(metrics?.totalSales || 0).toLocaleString()}`}
        icon={DollarSign}
        description="时间段内成交金额"
        className="h-full"
      />
    ),
    'stat-leads': (
      <StatCard
        title="活跃线索"
        value={metrics?.newLeads || 0}
        icon={Users}
        description="新增线索数量"
        className="h-full"
      />
    ),
    'stat-orders': (
      <StatCard
        title="成交订单"
        value={metrics?.orderCount || 0}
        icon={ShoppingCart}
        description="已确认订单数"
        className="h-full"
      />
    ),
    'stat-rate': (
      <StatCard
        title="线索转化率"
        value={`${metrics?.conversionRate || 0}%`}
        icon={Percent}
        description="线索到订单"
        className="h-full"
      />
    ),
    'trend': (
      <OrderTrendChart data={trendData} className="h-full" />
    ),
    'funnel': (
      <SalesFunnelChart
        data={funnelData?.stages || []}
        summary={funnelData?.summary}
        className="h-full"
      />
    ),
    'ar-aging': (
      <ARAgingWidget className="h-full" />
    ),
    'payables': (
      <StatCard
        title="待付账款"
        value={`¥${Number(metrics?.pendingPayables || 0).toLocaleString()}`}
        icon={Wallet}
        description="未支付采购订单总额"
        className="h-full"
      />
    ),
    'leaderboard': (
      <LeaderboardTable data={leaderboardData} className="h-full" />
    ),
    'targets': (
      <div className="h-full space-y-2 overflow-auto p-1">
        <h2 className="flex items-center gap-2 text-xl font-semibold">🎯 目标达成分析</h2>
        <TargetAchievementSection
          overview={targetOverview}
          trend={targetTrend}
          warnings={targetWarnings}
          quarterly={quarterlyData}
          annualProgress={annualProgressData}
        />
      </div>
    ),
  };

  return (
    <div className="flex flex-col gap-4 p-6">
      {/* ===== 页面头部：标题 + 时间筛选器 + 布局控制 ===== */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-bold tracking-tight">经营分析</h1>
          {isEditMode && (
            <Badge variant="outline" className="border-amber-400 bg-amber-50 text-amber-700">
              编辑布局中
            </Badge>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* ---- 快捷预设按钮组 ---- */}
          {DATE_PRESETS.map((preset) => (
            <Button
              key={preset.key}
              variant={activePreset === preset.key ? 'default' : 'outline'}
              size="sm"
              onClick={() => handlePresetClick(preset)}
            >
              {preset.label}
            </Button>
          ))}

          {/* ---- 自定义日期区间 ---- */}
          <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
            <PopoverTrigger asChild>
              <Button
                variant={activePreset === '' ? 'default' : 'outline'}
                size="sm"
                className={cn('min-w-[140px] justify-start gap-2')}
              >
                <CalendarDays className="h-4 w-4" />
                {activePreset === '' ? dateRangeLabel : '自定义'}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <Calendar
                mode="range"
                selected={dateRange}
                onSelect={handleCalendarSelect}
                numberOfMonths={2}
              />
            </PopoverContent>
          </Popover>

          {/* ---- 刷新按钮 ---- */}
          <Button variant="ghost" size="sm" onClick={loadData} disabled={loading}>
            <RefreshCw className={cn('h-4 w-4', loading && 'animate-spin')} />
          </Button>

          {/* ---- 布局控制按钮 ---- */}
          {isEditMode ? (
            <>
              <Button variant="ghost" size="sm" onClick={handleResetLayout} className="text-amber-600 hover:text-amber-700 gap-1.5">
                <RotateCcw className="h-4 w-4" />
                重置布局
              </Button>
              <Button variant="default" size="sm" onClick={handleFinishEdit} className="gap-1.5">
                <Check className="h-4 w-4" />
                完成编辑
              </Button>
            </>
          ) : (
            <Button variant="outline" size="sm" onClick={() => setIsEditMode(true)} className="gap-1.5">
              <LayoutGrid className="h-4 w-4" />
              编辑布局
            </Button>
          )}
        </div>
      </div>

      {/* ===== 可拖拽网格布局 ===== */}
      <AnalyticsDraggableLayout isEditing={isEditMode} items={gridItems} />
    </div>
  );
}
