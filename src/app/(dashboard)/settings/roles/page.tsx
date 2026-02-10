import { DashboardPageHeader } from '@/shared/ui/dashboard-page-header';
import { auth } from '@/shared/lib/auth';
import { getPermissionMatrix } from '@/features/settings/actions/role-override-actions';
import { PermissionMatrix } from '@/features/settings/components/permission-matrix';
import { AlertCircle } from 'lucide-react';
import { RolesSettingsActions } from '@/features/settings/components/roles-settings-actions';

/**
 * 角色权限管理设置页面
 *
 * 展示权限矩阵，允许租户对系统预设角色进行权限微调
 * - 横轴：7个标准角色
 * - 纵轴：权限模块（可折叠）
 * - 三态：可查看/可编辑/不可见
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

  // 获取权限矩阵数据
  let matrixData = null;
  let error = null;

  if (tenantId) {
    try {
      matrixData = await getPermissionMatrix();
    } catch (e) {
      console.error('获取权限矩阵失败:', e);
      error = '加载权限数据失败';
    }
  }

  return (
    <div className="space-y-6">
      <DashboardPageHeader
        title="角色权限"
        subtitle="配置各角色的功能权限，调整后的配置仅影响当前租户"
      >
        <RolesSettingsActions />
      </DashboardPageHeader>

      {/* 说明信息 */}
      <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-blue-800">
        <p className="mb-1 font-medium">权限矩阵说明</p>
        <ul className="list-inside list-disc space-y-1 text-blue-700">
          <li>点击单元格可切换权限状态：可编辑 → 可查看 → 不可见</li>
          <li>带边框高亮的单元格表示已修改（与系统默认不同）</li>
          <li>管理员角色拥有全部权限，无法修改</li>
          <li>修改后请点击「保存更改」按钮</li>
        </ul>
      </div>

      {error ? (
        <div className="text-muted-foreground flex flex-col items-center justify-center py-12">
          <AlertCircle className="mb-4 h-12 w-12 text-red-500" />
          <p className="text-lg font-medium">{error}</p>
        </div>
      ) : matrixData ? (
        <PermissionMatrix data={matrixData} />
      ) : (
        <div className="flex items-center justify-center py-12">
          <span className="text-muted-foreground">加载中...</span>
        </div>
      )}
    </div>
  );
}
