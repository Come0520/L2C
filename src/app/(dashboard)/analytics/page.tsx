import { Suspense } from 'react';
import AnalyticsClient, {
  type AnalyticsInitialData,
  type KeyMetrics,
  type FunnelResponse,
  type TrendData,
} from './analytics-client';
import { AnalyticsCardSkeleton } from '@/features/analytics/components/analytics-skeleton';

import { type LeaderboardItem } from '@/features/analytics/components/leaderboard-table';

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
import { startOfMonth, endOfMonth } from 'date-fns';

async function AnalyticsDataWrapper() {
  const now = new Date();
  const startDate = startOfMonth(now);
  const endDate = endOfMonth(now);
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

  const initialData: AnalyticsInitialData = {
    metrics: metricsRes?.success ? (metricsRes.data as unknown as KeyMetrics) : null,
    funnelData: funnelRes?.success ? (funnelRes.data as unknown as FunnelResponse) : null,
    trendData: trendRes?.success
      ? (trendRes.data as unknown as TrendData[]).map((item) => ({
          ...item,
          amount: Number(item.amount),
        }))
      : [],
    leaderboardData: leaderboardRes?.success
      ? (leaderboardRes.data as unknown as LeaderboardItem[])
      : [],
    targetOverview: overviewRes?.success ? overviewRes.data : null,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    targetTrend: completionTrendRes?.success ? (completionTrendRes.data as any[]) : [],
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    targetWarnings: warningsRes?.success ? (warningsRes.data as any[]) : [],
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    quarterlyData: quarterlyRes?.success ? (quarterlyRes.data as any[]) : [],
    annualProgressData: annualProgressRes?.success ? annualProgressRes.data : null,
  };

  return <AnalyticsClient initialData={initialData} />;
}

export default function AnalyticsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-col gap-4 p-6">
          <AnalyticsCardSkeleton />
        </div>
      }
    >
      <AnalyticsDataWrapper />
    </Suspense>
  );
}
