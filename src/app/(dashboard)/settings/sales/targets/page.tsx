import { Metadata } from 'next';
import { TargetsClientPage } from './client';
export const dynamic = 'force-dynamic';
import { getSalesTargets } from '@/features/sales/actions/targets';
import { getAnnualTargets } from '@/features/sales/actions/annual-targets';
import { getWeeklyTargets, getCurrentWeekInfo } from '@/features/sales/actions/weekly-targets';

export const metadata: Metadata = {
  title: '销售目标配置 | 系统设置',
};

export default async function SalesTargetsPage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string; month?: string; week?: string }>;
}) {
  const params = await searchParams;
  const now = new Date();
  const currentWeekInfo = await getCurrentWeekInfo();

  const year = parseInt(params.year || String(now.getFullYear()));
  const month = parseInt(params.month || String(now.getMonth() + 1));
  const week = parseInt(params.week || String(currentWeekInfo.week));

  const [monthlyRes, annualRes, weeklyRes] = await Promise.all([
    getSalesTargets(year, month),
    getAnnualTargets(year),
    getWeeklyTargets(year, week),
  ]);

  const targets = monthlyRes.success ? monthlyRes.data || [] : [];
  const annualTargets = annualRes.success ? annualRes.data || [] : [];
  const weeklyTargets = weeklyRes.success ? weeklyRes.data || [] : [];

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">销售目标配置</h3>
        <p className="text-muted-foreground text-sm">设置销售团队的周度、月度和年度绩效目标。</p>
      </div>

      <TargetsClientPage
        initialTargets={targets}
        initialAnnualTargets={annualTargets}
        initialWeeklyTargets={weeklyTargets}
        initialYear={year}
        initialMonth={month}
        initialWeek={week}
      />
    </div>
  );
}
