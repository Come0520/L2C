'use client';

import { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/ui/table';
import { Button } from '@/shared/ui/button';
import { Badge } from '@/shared/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/shared/ui/dropdown-menu';
import MoreHorizontal from 'lucide-react/dist/esm/icons/more-horizontal';
import Pencil from 'lucide-react/dist/esm/icons/pencil';
import Trash2 from 'lucide-react/dist/esm/icons/trash';
import Shield from 'lucide-react/dist/esm/icons/shield';
import Plus from 'lucide-react/dist/esm/icons/plus';
import { RoleDialog } from './role-dialog';
import { getRolesAction, deleteRole } from '@/features/settings/actions/roles-management';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/shared/ui/alert-dialog';

type Role = Awaited<ReturnType<typeof getRolesAction>>[number];

interface RoleListProps {
  roles: Role[];
  /** 点击查看权限时的回调，用于切换到权限矩阵 Tab */
  onViewPermissions?: () => void;
}

export function RoleList({ roles, onViewPermissions }: RoleListProps) {
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [deletingRole, setDeletingRole] = useState<Role | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // When editingRole changes, open dialog?
  // Better to control explicitly.

  const handleEdit = (role: Role) => {
    setEditingRole(role);
    setIsDialogOpen(true);
  };

  const handleCreate = () => {
    setEditingRole(null);
    setIsDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!deletingRole) return;
    try {
      const result = await deleteRole(deletingRole.id);
      if (result.success) {
        toast.success(result.message);
      } else {
        toast.error(result.message);
      }
    } catch {
      toast.error('删除失败');
    } finally {
      setDeletingRole(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">角色列表</h3>
        <Button onClick={handleCreate}>
          <Plus className="mr-2 h-4 w-4" />
          创建角色
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>角色名称</TableHead>
              <TableHead>代码</TableHead>
              <TableHead>类型</TableHead>
              <TableHead>描述</TableHead>
              <TableHead className="w-[100px]">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {roles.map((role) => (
              <TableRow key={role.id}>
                <TableCell className="font-medium">{role.name}</TableCell>
                <TableCell>{role.code}</TableCell>
                <TableCell>
                  {role.isSystem ? (
                    <Badge variant="secondary">系统预设</Badge>
                  ) : (
                    <Badge variant="outline">自定义</Badge>
                  )}
                </TableCell>
                <TableCell className="text-muted-foreground max-w-xs truncate whitespace-pre-wrap">
                  {role.description || '-'}
                </TableCell>
                <TableCell>
                  {role.isSystem ? (
                    // 系统预设角色：直接显示查看权限按钒，无需三个点下拉
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-muted-foreground hover:text-foreground"
                      onClick={onViewPermissions}
                      title="点击查看权限矩阵"
                    >
                      <Shield className="mr-1.5 h-3.5 w-3.5" />
                      查看权限
                    </Button>
                  ) : (
                    // 自定义角色：保留三个点下拉菜单
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <span className="sr-only">打开菜单</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>操作</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => handleEdit(role)}>
                          <Pencil className="mr-2 h-4 w-4" />
                          编辑
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-red-600 focus:text-red-600"
                          onClick={() => setDeletingRole(role)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          删除
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </TableCell>
              </TableRow>
            ))}
            {roles.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center">
                  暂无角色数据
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <RoleDialog
        open={isDialogOpen}
        onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) setEditingRole(null);
        }}
        role={editingRole || undefined}
      />

      <AlertDialog open={!!deletingRole} onOpenChange={(open) => !open && setDeletingRole(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除角色?</AlertDialogTitle>
            <AlertDialogDescription>
              此操作将永久删除角色 <strong>{deletingRole?.name}</strong>。
              已分配该角色的用户将失去对应权限，请确认后再操作。
              <br />
              此操作不可撤销。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
              删除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
