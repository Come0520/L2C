/**
 * 租户审批管理页面
 *
 * 平台管理员使用此页面审批/拒绝租户入驻申请
 */
import { Suspense } from 'react';
import { getPendingTenants, getAllTenants } from '@/features/platform/actions/admin-actions';
import { TenantApprovalList } from './tenant-approval-list';
import { PageHeader } from '@/shared/ui/page-header';

export default function TenantManagementPage(props: {
  searchParams?: Promise<{
    search?: string;
  }>;
}) {
  return (
    <div className="space-y-6">
      <PageHeader title="租户管理" description="审批租户入驻申请，管理现有租户" />
      <Suspense fallback={<div>Loading...</div>}>
        <TenantApprovalDataWrapper searchParams={props.searchParams} />
      </Suspense>
    </div>
  );
}

async function TenantApprovalDataWrapper({
  searchParams: searchParamsPromise,
}: {
  searchParams?: Promise<{ search?: string }>;
}) {
  const searchParams = await searchParamsPromise;
  const search = searchParams?.search || '';

  // 获取待审批和所有租户列表
  const [pendingResult, allResult] = await Promise.all([
    getPendingTenants({ search }),
    getAllTenants({ search }),
  ]);

  return (
    <TenantApprovalList
      pendingTenants={pendingResult.success ? pendingResult.data || [] : []}
      allTenants={allResult.success ? allResult.data?.tenants || [] : []}
    />
  );
}
