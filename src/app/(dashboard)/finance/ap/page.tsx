import { getAPSupplierStatements, getAPLaborStatements } from '@/features/finance/actions/ap';
import { APStatementTable } from '@/features/finance/components/APStatementTable';
import { DashboardPageHeader } from '@/shared/ui/dashboard-page-header';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/ui/tabs';

export default async function APPage() {
    const supplierStatements = await getAPSupplierStatements();
    const laborStatements = await getAPLaborStatements();

    return (
        <div className="space-y-6">
            <DashboardPageHeader
                title="付款管理 (AP)"
                subtitle="管理供应商应付对账单及劳务结算单，登记付款流水"
            />

            <Tabs defaultValue="supplier" className="w-full">
                <TabsList>
                    <TabsTrigger value="supplier">供应商应付</TabsTrigger>
                    <TabsTrigger value="labor">劳务结算</TabsTrigger>
                </TabsList>
                <TabsContent value="supplier" className="mt-6">
                    <div className="bg-card p-6 rounded-lg border shadow-sm">
                        <APStatementTable data={supplierStatements} type="SUPPLIER" />
                    </div>
                </TabsContent>
                <TabsContent value="labor" className="mt-6">
                    <div className="bg-card p-6 rounded-lg border shadow-sm">
                        <APStatementTable data={laborStatements} type="LABOR" />
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}
