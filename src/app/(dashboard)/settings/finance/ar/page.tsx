import { DashboardPageHeader } from '@/shared/ui/dashboard-page-header';
import { getTenantBusinessConfig } from '@/features/settings/actions/tenant-config';
import { ARConfigForm } from './ar-config-form';

/**
 * 收款规则配置页面
 * 配置分期付款规则和安装前收款检查
 */
export default async function ARConfigPage() {
    const config = await getTenantBusinessConfig();

    return (
        <div className="space-y-6">
            <DashboardPageHeader
                title="收款规则配置"
                subtitle="配置分期付款规则和安装前收款检查"
            />

            <ARConfigForm initialConfig={config.arPayment} />
        </div>
    );
}
