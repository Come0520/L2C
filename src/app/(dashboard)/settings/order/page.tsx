import { DashboardPageHeader } from '@/shared/ui/dashboard-page-header';
import { SystemParamsConfig } from '@/features/settings/components/system-params-config';

/**
 * 订单设置页面
 * 管理订单流程和系统参数配置
 */
export default function OrderSettingsPage() {
    return (
        <div className="space-y-6">
            <DashboardPageHeader
                title="订单设置"
                subtitle="管理订单流程和系统参数配置"
            />

            <SystemParamsConfig />
        </div>
    );
}
