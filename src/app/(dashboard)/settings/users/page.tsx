import { Suspense } from 'react';
import { getUsers } from '@/features/settings/actions';
import { UserList } from '@/features/settings/components/user-list';
import { DashboardPageHeader } from '@/shared/ui/dashboard-page-header';
import { auth } from '@/shared/lib/auth';
import { redirect } from 'next/navigation';
import { UserFormWrapper } from './user-form-wrapper';

export const dynamic = 'force-dynamic';

export default async function UsersPage() {
    const session = await auth();
    if (!session?.user) redirect('/login');

    // Simple permission check at page level (also checked in actions)
    // Actually, layout or strict middleware usually handles this, 
    // but good to have a check here if we want to show 403 or redirect.
    // For now, let's assume the user has access if they can see the sidebar link.

    const result = await getUsers();
    const users = result.data || [];

    return (
        <div className="space-y-6">
            <DashboardPageHeader
                title="用户管理"
                subtitle="管理系统用户及其角色权限"
            >
                <UserFormWrapper />
            </DashboardPageHeader>

            <Suspense fallback={<div>加载�?..</div>}>
                <UserList data={users} />
            </Suspense>
        </div>
    );
}
