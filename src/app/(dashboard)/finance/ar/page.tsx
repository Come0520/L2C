export const dynamic = 'force-dynamic';
import { getARStatements } from '@/features/finance/actions/ar';
import { ARStatementTable } from '@/features/finance/components/ARStatementTable';
import { DashboardPageHeader } from '@/shared/ui/dashboard-page-header';

export default async function ARPage() {
  let data = [];
  try {
    data = await getARStatements();
  } catch (e: any) {
    // Type explicitly as any or Error
    return (
      <div className="bg-red-50 p-4 text-red-500">
        <h1 className="text-xl font-bold">Data Load Error</h1>
        <pre>{e?.message || JSON.stringify(e)}</pre>
        <pre>{e?.stack}</pre>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <DashboardPageHeader
        title="收款管理 (AR)"
        subtitle="管理客户应收对账单、登记收款、查看回款进度"
      />

      <div className="bg-card rounded-lg border p-6 shadow-sm">
        <ARStatementTable data={data} />
      </div>
    </div>
  );
}
