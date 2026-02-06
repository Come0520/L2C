
import { getTenantInfo, canEditTenantInfo, getVerificationStatus } from '@/features/settings/actions/tenant-info';
import { TenantInfoForm } from '@/features/settings/components/tenant-info-form';

/**
 * 租户基本信息设置页面
 * 管理员可编辑企业信息和上传 Logo
 */
export default async function GeneralSettingsPage() {
    // 并行获取数据和权限
    const [tenantResult, verificationResult, canEdit] = await Promise.all([
        getTenantInfo(),
        getVerificationStatus(),
        canEditTenantInfo(),
    ]);

    // 处理获取失败的情况
    if (!tenantResult.success) {
        return (
            <div className="h-full flex flex-col p-4">
                <div className="flex-1 min-h-0 glass-liquid-ultra rounded-2xl border border-white/20 p-4 flex items-center justify-center">
                    <p className="text-muted-foreground">{tenantResult.error || '加载失败，请刷新页面重试'}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col p-4">
            <div className="flex-1 min-h-0 glass-liquid-ultra rounded-2xl border border-white/20 p-8 overflow-auto">
                <div className="max-w-2xl mx-auto space-y-8">
                    <div>
                        <h2 className="text-2xl font-bold tracking-tight mb-2">租户信息</h2>
                        <p className="text-muted-foreground">管理您的企业基本信息</p>
                    </div>

                    <TenantInfoForm
                        initialData={tenantResult.data}
                        verificationStatus={verificationResult.success ? verificationResult.data.status : undefined}
                        canEdit={canEdit}
                    />
                </div>
            </div>
        </div>
    );
}
