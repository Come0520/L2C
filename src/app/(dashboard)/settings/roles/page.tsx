import { Suspense } from 'react';
import { getRoles } from '@/features/settings/actions';
import { DashboardPageHeader } from '@/shared/ui/dashboard-page-header';
import { auth } from '@/shared/lib/auth';
import { redirect } from 'next/navigation';
import { RoleFormWrapper } from './role-form-wrapper';
import { RoleListWrapper } from './role-list-wrapper';

export const dynamic = 'force-dynamic';

export default async function RolesPage() {
    const session = await auth();
    if (!session?.user) redirect('/login');

    // Permission check assumed implicit via Layout or Middleware for basic access
    // Actions perform strict check.

    const result = await getRoles();
    const roles = result.data || [];

    return (
        <div className="space-y-6">
            <DashboardPageHeader
                title="角色权限"
                subtitle="配置系统角色及其功能权限"
            >
                <RoleFormWrapper />
            </DashboardPageHeader>

            <Suspense fallback={<div>加载�?..</div>}>
                <RoleListWrapper initialData={roles} />
            </Suspense>
        </div>
    );
}
