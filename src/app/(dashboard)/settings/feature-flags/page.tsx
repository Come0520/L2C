import dynamic from 'next/dynamic';
import { DashboardPageHeader } from '@/shared/ui/dashboard-page-header';
import { Skeleton } from '@/shared/ui/skeleton';

/** 懒加载：租户功能开关组件 */
const TenantFeatureControl = dynamic(
    () => import('@/features/settings/components/tenant-feature-control').then(m => m.TenantFeatureControl),
    { loading: () => <Skeleton className="h-[350px] w-full rounded-lg" /> }
);

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
