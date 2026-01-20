import { DashboardPageHeader } from '@/shared/ui/dashboard-page-header';
import { TenantFeatureControl } from '@/features/settings/components/tenant-feature-control';

/**
 * 功能开关设置页面
 * 管理租户可用的功能模块
 */
export default function FeatureFlagsPage() {
    return (
        <div className="space-y-6">
            <DashboardPageHeader
                title="功能开关"
                subtitle="管理租户可用的功能模块"
            />

            <TenantFeatureControl />
        </div>
    );
}
