import { Suspense } from 'react';
import { SplitRuleManager } from '@/features/supply-chain/components/split-rule-manager';
import { getSplitRules, getAllSuppliers } from '@/features/supply-chain/actions/rules';
import { SplitRuleWithRelations } from '@/features/supply-chain/types';
import { TableSkeleton } from '@/shared/ui/skeleton-variants';

export default function RulesPage() {
  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">自动拆单规则</h2>
      </div>
      <div className="hidden h-full flex-1 flex-col space-y-8 md:flex">
        <Suspense fallback={<TableSkeleton />}>
          <RulesDataWrapper />
        </Suspense>
      </div>
    </div>
  );
}

async function RulesDataWrapper() {
  const rules = (await getSplitRules()) as unknown as SplitRuleWithRelations[];
  const suppliers = await getAllSuppliers();

  return <SplitRuleManager rules={rules} suppliers={suppliers} />;
}
