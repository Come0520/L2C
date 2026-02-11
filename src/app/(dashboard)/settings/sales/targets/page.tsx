import { Metadata } from 'next';
import { TargetsClientPage } from './client'; // Separate client component for interactivity
export const dynamic = 'force-dynamic';
import { getSalesTargets } from '@/features/sales/actions/targets';

export const metadata: Metadata = {
  title: '销售目标配置 | 系统设置',
};

export default async function SalesTargetsPage({
  searchParams,
}: {
  searchParams: { year?: string; month?: string };
}) {
  const now = new Date();
  const year = parseInt(searchParams.year || String(now.getFullYear()));
  const month = parseInt(searchParams.month || String(now.getMonth() + 1));

  const res = await getSalesTargets(year, month);
  const targets = res.success ? res.data || [] : [];

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">销售目标配置</h3>
        <p className="text-muted-foreground text-sm">设置销售团队每月的业绩目标。</p>
      </div>

      <TargetsClientPage initialTargets={targets} initialYear={year} initialMonth={month} />
    </div>
  );
}
