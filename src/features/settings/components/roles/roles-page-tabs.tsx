'use client';

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/ui/tabs';
import { RoleList } from './role-list';
import { PermissionMatrix } from '@/features/settings/components/permission-matrix';
import { getRolesAction } from '@/features/settings/actions/roles-management';
import { getPermissionMatrix } from '@/features/settings/actions/role-override-actions';

type Role = Awaited<ReturnType<typeof getRolesAction>>[number];
type MatrixData = Awaited<ReturnType<typeof getPermissionMatrix>>;

interface RolesPageTabsProps {
  rolesData: Role[];
  matrixData: MatrixData | null;
}

/**
 * 角色权限页面的受控 Tabs 组件
 *
 * 之所以需要单独提取为客户端组件，是因为：
 * - page.tsx 是 Server Component，无法直接管理 useState
 * - RoleList 中的「查看权限」按钮需要切换到"权限矩阵" Tab
 * - 通过 onViewPermissions 回调实现跨组件 Tab 切换
 */
export function RolesPageTabs({ rolesData, matrixData }: RolesPageTabsProps) {
  const [activeTab, setActiveTab] = useState<'list' | 'matrix'>('list');

  /** 切换到权限矩阵并滚动到顶部 */
  const handleViewPermissions = () => {
    setActiveTab('matrix');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <Tabs
      value={activeTab}
      onValueChange={(v) => setActiveTab(v as 'list' | 'matrix')}
      className="space-y-4"
    >
      <TabsList>
        <TabsTrigger value="list">角色列表</TabsTrigger>
        <TabsTrigger value="matrix">权限矩阵</TabsTrigger>
      </TabsList>

      <TabsContent value="list" className="space-y-4">
        <RoleList roles={rolesData} onViewPermissions={handleViewPermissions} />
      </TabsContent>

      <TabsContent value="matrix" className="space-y-4">
        {/* 说明信息 */}
        <div className="bg-muted/50 text-muted-foreground rounded-lg border p-4 text-sm">
          <p className="text-foreground mb-1 font-medium">权限矩阵说明</p>
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
  );
}
