export const dynamic = 'force-dynamic';
import { Suspense } from 'react';
import { DashboardPageHeader } from '@/shared/ui/dashboard-page-header';
import { getTenantInfo, canEditTenantInfo } from '@/features/settings/actions/tenant-info';
import { VerificationForm } from '@/features/settings/components/verification-form';

/**
 * 企业认证设置页面
 * 租户管理员可以提交企业认证申请
 */
export default function VerificationSettingsPage() {
  return (
    <div className="space-y-6">
      <DashboardPageHeader title="企业认证" subtitle="完成企业认证，获取认证标识" />
      <Suspense fallback={<div className="h-32 animate-pulse rounded-xl bg-white/5"></div>}>
        <VerificationDataWrapper />
      </Suspense>
    </div>
  );
}

async function VerificationDataWrapper() {
  const [tenantResult, canEdit] = await Promise.all([getTenantInfo(), canEditTenantInfo()]);
  if (!tenantResult.success) {
    return (
      <div className="space-y-6">
        <DashboardPageHeader title="企业认证" subtitle="完成企业认证，获取认证标识" />
        <div className="text-muted-foreground py-12 text-center">
          <p>{tenantResult.error || '加载失败，请刷新页面重试'}</p>
        </div>
      </div>
    );
  }

  return (
    <VerificationForm
      tenantName={tenantResult.data.name}
      tenantCode={tenantResult.data.code}
      canEdit={canEdit}
    />
  );
}

