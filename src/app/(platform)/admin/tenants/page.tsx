/**
 * 租户审批管理页面
 * 
 * 平台管理员使用此页面审批/拒绝租户入驻申请
 */
import { getPendingTenants, getAllTenants } from '@/features/platform/actions/admin-actions';
import { TenantApprovalList } from './tenant-approval-list';
import { PageHeader } from '@/components/ui/page-header';

export default async function TenantManagementPage() {
    // 获取待审批和所有租户列表
    const [pendingResult, allResult] = await Promise.all([
        getPendingTenants(),
        getAllTenants(),
    ]);

    return (
        <div className="space-y-6">
            <PageHeader
                title="租户管理"
                description="审批租户入驻申请，管理现有租户"
            />

            {/* 待审批列表 */}
            <TenantApprovalList
                pendingTenants={pendingResult.success ? pendingResult.data || [] : []}
                allTenants={allResult.success ? allResult.data?.tenants || [] : []}
            />
        </div>
    );
}

