import { getFinanceConfig, getFinanceAccounts } from '@/features/finance/actions';
import { FinanceSettingsForm } from '@/features/finance/components/FinanceSettingsForm';
import { AccountList } from '@/features/finance/components/AccountList';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/ui/tabs';
import { DashboardPageHeader } from '@/shared/ui/dashboard-page-header';

export default async function FinanceSettingsPage() {
    const config = await getFinanceConfig();
    const accounts = await getFinanceAccounts();

    return (
        <div className="space-y-6">
            <DashboardPageHeader
                title="财务设置"
                subtitle="管理财务基础规则、抹零方式及结算账户"
            />

            <Tabs defaultValue="base" className="w-full">
                <TabsList>
                    <TabsTrigger value="base">基础配置</TabsTrigger>
                    <TabsTrigger value="accounts">财务账户</TabsTrigger>
                </TabsList>
                <TabsContent value="base" className="mt-6">
                    <FinanceSettingsForm initialData={config} />
                </TabsContent>
                <TabsContent value="accounts" className="mt-6">
                    <AccountList accounts={accounts} />
                </TabsContent>
            </Tabs>
        </div>
    );
}
