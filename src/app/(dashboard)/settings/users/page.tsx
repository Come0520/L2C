import { DashboardPageHeader } from '@/shared/ui/dashboard-page-header';
import { UserList } from '@/features/settings/components/user-list';
import { db } from '@/shared/api/db';
import { users } from '@/shared/api/schema';
import { eq } from 'drizzle-orm';
import { auth } from '@/shared/lib/auth';
import { Button } from '@/shared/ui/button';
import { Plus } from 'lucide-react';

/**
 * 用户管理设置页面
 * 显示当前租户下的所有用户
 */
export default async function UsersSettingsPage() {
    const session = await auth();
    const tenantId = session?.user?.tenantId;

    // 获取用户列表
    let userData: any[] = [];
    if (tenantId) {
        try {
            const dbUsers = await db.query.users.findMany({
                where: eq(users.tenantId, tenantId),
            });
            userData = dbUsers.map(u => ({
                name: u.name || '未命名用户',
                phone: u.phone || '-',
                role: u.role || '未分配角色',
                isActive: u.isActive,
            }));
        } catch (error) {
            console.error('获取用户列表失败:', error);
        }
    }

    return (
        <div className="space-y-6">
            <DashboardPageHeader
                title="用户管理"
                subtitle="管理系统用户和权限"
            >
                <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    添加用户
                </Button>
            </DashboardPageHeader>

            <UserList data={userData} />
        </div>
    );
}
