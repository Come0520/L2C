import { SplitRuleManager } from '@/features/supply-chain/components/split-rule-manager';
import { getSplitRules, getAllSuppliers } from '@/features/supply-chain/actions/rules';
import { SplitRuleWithRelations } from '@/features/supply-chain/types';

export default async function RulesPage() {
    const rules = await getSplitRules() as unknown as SplitRuleWithRelations[];
    const suppliers = await getAllSuppliers();

    return (
        <div className="flex-1 space-y-4 p-8 pt-6">
            <div className="flex items-center justify-between space-y-2">
                <h2 className="text-3xl font-bold tracking-tight">自动拆单规则</h2>
            </div>
            <div className="hidden h-full flex-1 flex-col space-y-8 md:flex">
                <SplitRuleManager rules={rules} suppliers={suppliers} />
            </div>
        </div>
    );
}
