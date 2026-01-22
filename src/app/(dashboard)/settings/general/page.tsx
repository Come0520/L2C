import { DashboardPageHeader } from '@/shared/ui/dashboard-page-header';
import { getTenantInfo, canEditTenantInfo } from '@/features/settings/actions/tenant-info';
import { TenantInfoForm } from '@/features/settings/components/tenant-info-form';

/**
 * 租户基本信息设置页面
 * 管理员可编辑企业信息和上传 Logo
 */
export default async function GeneralSettingsPage() {
    // 并行获取数据和权限
    const [tenantResult, canEdit] = await Promise.all([
        getTenantInfo(),
        canEditTenantInfo(),
    ]);

    // 处理获取失败的情况
    if (!tenantResult.success) {
        return (
            <div className="space-y-6">
                <DashboardPageHeader
                    title="租户信息"
                    subtitle="管理您的企业基本信息"
                />
                <div className="text-center py-12 text-muted-foreground">
                    <p>{tenantResult.error || '加载失败，请刷新页面重试'}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <DashboardPageHeader
                title="租户信息"
                subtitle="管理您的企业基本信息"
            />
            <TenantInfoForm
                initialData={tenantResult.data}
                canEdit={canEdit}
            />
        </div>
    );
}
