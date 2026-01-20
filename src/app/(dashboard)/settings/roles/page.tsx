import { DashboardPageHeader } from '@/shared/ui/dashboard-page-header';
import { RoleList } from '@/features/settings/components/role-list';
import { db } from '@/shared/api/db';
import { roles } from '@/shared/api/schema';
import { eq } from 'drizzle-orm';
import { auth } from '@/shared/lib/auth';
import { Button } from '@/shared/ui/button';
import { Plus } from 'lucide-react';

/**
 * 角色权限管理设置页面
 * 显示当前租户下的所有角色
 */
export default async function RolesSettingsPage() {
    const session = await auth();
    const tenantId = session?.user?.tenantId;

    // 获取角色列表
    let roleData: any[] = [];
    if (tenantId) {
        try {
            const dbRoles = await db.query.roles.findMany({
                where: eq(roles.tenantId, tenantId),
            });
            roleData = dbRoles.map(r => ({
                id: r.id,
                name: r.name,
                code: r.code,
                isSystem: r.isSystem,
            }));
        } catch (error) {
            console.error('获取角色列表失败:', error);
        }
    }

    return (
        <div className="space-y-6">
            <DashboardPageHeader
                title="角色权限"
                subtitle="管理系统角色和权限配置"
            >
                <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    添加角色
                </Button>
            </DashboardPageHeader>

            <RoleList data={roleData} />
        </div>
    );
}
