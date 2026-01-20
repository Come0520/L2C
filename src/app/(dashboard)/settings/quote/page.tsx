import { SystemParamsConfig } from '@/features/settings/components/system-params-config';
import { DashboardPageHeader } from '@/shared/ui/dashboard-page-header';

/**
 * 报价设置页面
 * [Settings-02] 系统参数配置
 */
export default function QuoteSettingsPage() {
    return (
        <div className="space-y-6">
            <DashboardPageHeader
                title="系统参数配置"
                subtitle="配置报价有效期、提醒规则和服务排期参数"
            />
            <SystemParamsConfig />
        </div>
    );
}
