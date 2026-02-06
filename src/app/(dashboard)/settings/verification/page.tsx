import { DashboardPageHeader } from '@/shared/ui/dashboard-page-header';
import { getTenantInfo, canEditTenantInfo } from '@/features/settings/actions/tenant-info';
import { VerificationForm } from '@/features/settings/components/verification-form';

/**
 * 企业认证设置页面
 * 租户管理员可以提交企业认证申请
 */
export default async function VerificationSettingsPage() {
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
                    title="企业认证"
                    subtitle="完成企业认证，获取认证标识"
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
                title="企业认证"
                subtitle="完成企业认证，获取认证标识"
            />
            <VerificationForm
                tenantName={tenantResult.data.name}
                tenantCode={tenantResult.data.code}
                canEdit={canEdit}
            />
        </div>
    );
}
