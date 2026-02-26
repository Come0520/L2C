import { getFinanceMode } from '@/features/finance/actions/simple-mode-actions';
import { FinanceModeSwitcher } from '@/features/finance/components/mode-switcher';
import {
  getSimpleSummary,
  getSimpleTransactions,
} from '@/features/finance/actions/simple-mode-actions';
import { SimpleSummaryCards } from '@/features/finance/components/simple-summary';
import { SimpleLedgerClient } from '@/features/finance/components/simple-ledger';

import { redirect } from 'next/navigation';
import { format } from 'date-fns';

export default async function SimpleFinancePage() {
  const modeRes = await getFinanceMode();

  // 防御：如果是专业模式进来了这个页面，强制转跳回原本正规的期账面板。只有全局设定为简单模式才允许停留在该页。
  if (modeRes.mode === 'professional') {
    console.log('检测到专业模式，发生跳转至 ledger...');
    redirect('/finance/ledger');
  }

  // 计算本月 YYYY-MM
  const currentYearMonth = format(new Date(), 'yyyy-MM');

  // 并行获取本月流水数据及汇总概况
  const [summaryRes, transactionsRes] = await Promise.all([
    getSimpleSummary(currentYearMonth),
    getSimpleTransactions(currentYearMonth),
  ]);

  if (!summaryRes.success || !transactionsRes.success) {
    return <div>未能正确加载简单模式流水页面数据。</div>;
  }

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">小微入账 (简单模式)</h2>
        <div className="flex items-center space-x-2">
          <FinanceModeSwitcher initialMode="simple" />
        </div>
      </div>

      <div className="text-muted-foreground mb-4 text-sm">
        基于简化的“收入/支出”模式进行快速记账，您的记录将会直接影响当月结余情况。
      </div>

      {/* 报表汇总 */}
      <SimpleSummaryCards summary={summaryRes.data as any} />

      {/* 录单明细 */}
      <SimpleLedgerClient initialData={transactionsRes.data as any} />
    </div>
  );
}
