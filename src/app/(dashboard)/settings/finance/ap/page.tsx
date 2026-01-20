import { DashboardPageHeader } from '@/shared/ui/dashboard-page-header';
import { getTenantBusinessConfig } from '@/features/settings/actions/tenant-config';
import { APConfigForm } from './ap-config-form';

/**
 * 付款策略配置页面
 * 配置采购付款、劳务结算、物流费用的结算方式
 */
export default async function APConfigPage() {
    const config = await getTenantBusinessConfig();

    return (
        <div className="space-y-6">
            <DashboardPageHeader
                title="付款策略配置"
                subtitle="管理供应商付款规则及劳务结算标准"
            />

            <APConfigForm initialConfig={config.apPayment} />
        </div>
    );
}
