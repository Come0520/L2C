import { DashboardPageHeader } from '@/shared/ui/dashboard-page-header';
import { UsersSettingsClient } from '@/features/settings/components/users-settings-client';
import { db } from '@/shared/api/db';
import { users } from '@/shared/api/schema';
import { eq, sql } from 'drizzle-orm';
import { auth } from '@/shared/lib/auth';
import { InviteUserDialog } from '@/features/settings/components/invite-user-dialog';
import { getAvailableRoles } from '@/features/settings/actions/roles';
import type { UserInfo } from '@/features/settings/actions/user-actions';

/**
 * 用户管理设置页面
 * 显示当前租户下的所有用户
 */
export default async function UsersSettingsPage(props: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const searchParams = await props.searchParams;
  const session = await auth();
  const tenantId = session?.user?.tenantId;

  const page = Number(searchParams?.page) || 1;
  const limit = 10;
  const offset = (page - 1) * limit;

  // 获取用户列表
  let userData: UserInfo[] = [];
  let totalPages = 0;

  if (tenantId) {
    try {
      const dbUsers = await db.query.users.findMany({
        where: eq(users.tenantId, tenantId),
        limit,
        offset,
      });
      userData = dbUsers.map((u) => ({
        id: u.id,
        name: u.name || '未命名用户',
        phone: u.phone || '-',
        email: u.email || null,
        role: u.role || '未分配角色',
        roles: (u.roles as string[]) || [],
        isActive: u.isActive ?? true,
      }));

      const [{ count }] = await db
        .select({ count: sql<number>`count(*)` })
        .from(users)
        .where(eq(users.tenantId, tenantId));
      totalPages = Math.ceil(Number(count) / limit);
    } catch (error) {
      console.error('获取用户列表失败:', error);
    }
  }

  // 获取可用角色
  let roles: { label: string; value: string }[] = [];
  try {
    roles = await getAvailableRoles();
  } catch (error) {
    console.error('获取角色列表失败:', error);
  }

  return (
    <div className="space-y-6">
      <DashboardPageHeader title="用户管理" subtitle="管理系统用户和权限">
        <div className="flex gap-2">
          <InviteUserDialog availableRoles={roles} />
        </div>
      </DashboardPageHeader>

      <UsersSettingsClient userData={userData} availableRoles={roles} totalPages={totalPages} />
    </div>
  );
}
