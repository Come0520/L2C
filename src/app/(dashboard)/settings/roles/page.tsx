import { DashboardPageHeader } from '@/shared/ui/dashboard-page-header';
import { auth } from '@/shared/lib/auth';
import { getPermissionMatrix } from '@/features/settings/actions/role-override-actions';
import { getRolesAction } from '@/features/settings/actions/roles-management';
import { PermissionMatrix } from '@/features/settings/components/permission-matrix';
import { AlertCircle } from 'lucide-react';
import { RolesSettingsActions } from '@/features/settings/components/roles-settings-actions';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/ui/tabs';
import { RoleList } from '@/features/settings/components/roles/role-list';

/**
 * 角色权限管理设置页面
 */
export default async function RolesSettingsPage() {
  const session = await auth();
  const tenantId = session?.user?.tenantId;
  const userRole = session?.user?.role;

  // 检查权限：只有管理员和经理可以访问
  const canAccess = userRole === 'ADMIN' || userRole === 'MANAGER';

  if (!canAccess) {
    return (
      <div className="space-y-6">
        <DashboardPageHeader title="角色权限" subtitle="管理系统角色和权限配置" />
        <div className="text-muted-foreground flex flex-col items-center justify-center py-12">
          <AlertCircle className="mb-4 h-12 w-12 text-amber-500" />
          <p className="text-lg font-medium">无权限访问</p>
          <p className="text-sm">只有管理员和经理可以管理角色权限</p>
        </div>
      </div>
    );
  }

  // 获取数据
  // 并行获取角色列表和权限矩阵
  let matrixData = null;
  let rolesData: Awaited<ReturnType<typeof getRolesAction>> = [];
  let error = null;

  if (tenantId) {
    try {
      const [matrix, roles] = await Promise.all([
        getPermissionMatrix(),
        getRolesAction()
      ]);
      matrixData = matrix;
      rolesData = roles;
    } catch (e) {
      console.error('获取角色数据失败:', e);
      error = '加载数据失败';
    }
  }

  return (
    <div className="space-y-6">
      <DashboardPageHeader
        title="角色权限"
        subtitle="管理自定义角色及权限配置"
      >
        <RolesSettingsActions />
      </DashboardPageHeader>

      {error ? (
        <div className="text-muted-foreground flex flex-col items-center justify-center py-12">
          <AlertCircle className="mb-4 h-12 w-12 text-red-500" />
          <p className="text-lg font-medium">{error}</p>
        </div>
      ) : (
        <Tabs defaultValue="list" className="space-y-4">
          <TabsList>
            <TabsTrigger value="list">角色列表</TabsTrigger>
            <TabsTrigger value="matrix">权限矩阵</TabsTrigger>
          </TabsList>

          <TabsContent value="list" className="space-y-4">
            <RoleList roles={rolesData} />
          </TabsContent>

          <TabsContent value="matrix" className="space-y-4">
            {/* 说明信息 */}
            <div className="rounded-lg border bg-muted/50 p-4 text-sm text-muted-foreground">
              <p className="mb-1 font-medium text-foreground">权限矩阵说明</p>
              <ul className="list-inside list-disc space-y-1">
                <li>点击单元格可切换权限状态：可编辑 → 可查看 → 不可见</li>
                <li>带边框高亮的单元格表示已修改（与系统默认不同）</li>
                <li>管理员角色拥有全部权限，无法修改</li>
                <li>修改后请点击「保存更改」按钮</li>
              </ul>
            </div>
            {matrixData ? (
              <PermissionMatrix data={matrixData} />
            ) : (
              <div className="flex items-center justify-center py-12">
                <span className="text-muted-foreground">加载中...</span>
              </div>
            )}
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
