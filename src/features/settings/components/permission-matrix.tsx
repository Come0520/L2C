'use client';
import { logger } from '@/shared/lib/logger';

import * as React from 'react';
import { useState, useMemo, useCallback } from 'react';
import { ChevronDown, ChevronRight, RotateCcw, Save } from 'lucide-react';
import { cn } from '@/shared/lib/utils';
import { Button } from '@/shared/ui/button';
import { TriStateCheckbox, TriState, TriStateLabel } from '@/shared/ui/tri-state-checkbox';
import {
    saveAllRoleOverrides,
    type PermissionMatrixData,
    type RoleOverrideData
} from '@/features/settings/actions/role-override-actions';
import { toast } from 'sonner';

/**
 * 权限矩阵组件
 * 
 * 横轴：角色（7个）
 * 纵轴：权限（按模块分组，可折叠）
 * 单元格：三态复选框
 */

interface PermissionMatrixProps {
    data: PermissionMatrixData;
}

// 内部状态类型：roleCode -> permission -> TriState
type PermissionStateMap = Record<string, Record<string, TriState>>;

export function PermissionMatrix({ data }: PermissionMatrixProps) {
    // 折叠状态：groupKey -> boolean
    const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>(() => {
        // 默认展开前3个分组
        const initial: Record<string, boolean> = {};
        data.permissionGroups.forEach((group, index) => {
            initial[group.key] = index < 3;
        });
        return initial;
    });

    // 权限状态
    const [permissionStates, setPermissionStates] = useState<PermissionStateMap>(() => {
        return buildInitialStates(data.roles);
    });

    // 原始状态（用于比较是否修改）
    const originalStates = useMemo(() => buildInitialStates(data.roles), [data.roles]);

    // 是否有未保存的修改
    const hasChanges = useMemo(() => {
        return JSON.stringify(permissionStates) !== JSON.stringify(originalStates);
    }, [permissionStates, originalStates]);

    // 正在保存
    const [isSaving, setIsSaving] = useState(false);

    // 切换分组展开/折叠
    const toggleGroup = (groupKey: string) => {
        setExpandedGroups(prev => ({
            ...prev,
            [groupKey]: !prev[groupKey],
        }));
    };

    // 更新权限状态
    const handlePermissionChange = useCallback((
        roleCode: string,
        permission: string,
        value: TriState
    ) => {
        setPermissionStates(prev => ({
            ...prev,
            [roleCode]: {
                ...prev[roleCode],
                [permission]: value,
            },
        }));
    }, []);

    // 检查是否被修改
    const isModified = (roleCode: string, permission: string): boolean => {
        return permissionStates[roleCode]?.[permission] !== originalStates[roleCode]?.[permission];
    };

    // 保存所有更改
    const handleSave = async () => {
        setIsSaving(true);

        try {
            // 构建覆盖数据
            const overrides = data.roles.map(role => {
                const basePermissions = new Set(role.basePermissions);
                const added: string[] = [];
                const removed: string[] = [];

                // 遍历所有权限
                for (const [permission, state] of Object.entries(permissionStates[role.roleCode] || {})) {
                    const wasInBase = basePermissions.has(permission) ||
                        basePermissions.has(permission.replace('.view', '.edit'));

                    if (state === 'EDIT') {
                        // 可编辑状态：如果原来没有edit权限，添加
                        const editPerm = permission.includes('.view')
                            ? permission.replace('.view', '.edit')
                            : permission;
                        if (!basePermissions.has(editPerm)) {
                            added.push(editPerm);
                        }
                        // 确保view权限也有
                        const viewPerm = permission.includes('.edit')
                            ? permission.replace('.edit', '.view')
                            : permission;
                        if (!basePermissions.has(viewPerm)) {
                            added.push(viewPerm);
                        }
                    } else if (state === 'VIEW') {
                        // 可查看状态：移除edit权限（如果有）
                        const editPerm = permission.includes('.view')
                            ? permission.replace('.view', '.edit')
                            : permission + '.edit';
                        if (basePermissions.has(editPerm)) {
                            removed.push(editPerm);
                        }
                        // 确保有view权限
                        const viewPerm = permission.includes('.edit')
                            ? permission.replace('.edit', '.view')
                            : permission;
                        if (!basePermissions.has(viewPerm)) {
                            added.push(viewPerm);
                        }
                    } else if (state === 'NONE') {
                        // 不可见：移除相关权限
                        if (wasInBase) {
                            removed.push(permission);
                            // 也移除相关的view/edit权限
                            if (permission.includes('.view')) {
                                const editPerm = permission.replace('.view', '.edit');
                                if (basePermissions.has(editPerm)) {
                                    removed.push(editPerm);
                                }
                            }
                        }
                    }
                }

                return {
                    roleCode: role.roleCode,
                    addedPermissions: [...new Set(added)],
                    removedPermissions: [...new Set(removed)],
                };
            });

            const result = await saveAllRoleOverrides(overrides);

            if (result.success) {
                toast.success(result.message);
            } else {
                toast.error(result.message);
            }
        } catch (error) {
            logger.error('保存权限配置失败:', error);
            toast.error('保存失败，请稍后重试');
        } finally {
            setIsSaving(false);
        }
    };

    // 重置所有更改
    const handleReset = () => {
        setPermissionStates(buildInitialStates(data.roles));
        toast.info('已重置为当前保存的状态');
    };

    return (
        <div className="space-y-4">
            {/* 工具栏 */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <span className="text-sm text-muted-foreground">图例：</span>
                    <TriStateLabel state="EDIT" />
                    <TriStateLabel state="VIEW" />
                    <TriStateLabel state="NONE" />
                </div>

                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleReset}
                        disabled={!hasChanges || isSaving}
                    >
                        <RotateCcw className="w-4 h-4 mr-1" />
                        重置
                    </Button>
                    <Button
                        size="sm"
                        onClick={handleSave}
                        disabled={!hasChanges || isSaving}
                    >
                        <Save className="w-4 h-4 mr-1" />
                        {isSaving ? '保存中...' : '保存更改'}
                    </Button>
                </div>
            </div>

            {/* 矩阵表格 */}
            <div className="border rounded-lg overflow-auto">
                <table className="w-full min-w-[800px]">
                    <thead className="bg-muted/50">
                        <tr>
                            <th className="text-left p-3 sticky left-0 bg-muted/50 min-w-[200px] font-medium">
                                权限模块
                            </th>
                            {data.roles.map(role => (
                                <th
                                    key={role.roleCode}
                                    className="p-3 text-center min-w-[80px] font-medium"
                                >
                                    <div className="flex flex-col items-center gap-1">
                                        <span>{role.roleName}</span>
                                        <span className="text-xs text-muted-foreground font-normal">
                                            {role.roleCode}
                                        </span>
                                    </div>
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {data.permissionGroups.map(group => (
                            <React.Fragment key={group.key}>
                                {/* 分组标题行 */}
                                <tr
                                    className="bg-muted/30 cursor-pointer hover:bg-muted/50"
                                    onClick={() => toggleGroup(group.key)}
                                >
                                    <td
                                        colSpan={data.roles.length + 1}
                                        className="p-2 sticky left-0"
                                    >
                                        <div className="flex items-center gap-2">
                                            {expandedGroups[group.key] ? (
                                                <ChevronDown className="w-4 h-4" />
                                            ) : (
                                                <ChevronRight className="w-4 h-4" />
                                            )}
                                            <span className="font-medium">{group.label}</span>
                                            {group.description && (
                                                <span className="text-xs text-muted-foreground">
                                                    - {group.description}
                                                </span>
                                            )}
                                        </div>
                                    </td>
                                </tr>

                                {/* 权限行 */}
                                {expandedGroups[group.key] && group.permissions.map(perm => (
                                    <tr key={perm.code} className="border-t hover:bg-muted/20">
                                        <td className="p-2 pl-8 sticky left-0 bg-background">
                                            <span className="text-sm">{perm.label}</span>
                                        </td>
                                        {data.roles.map(role => (
                                            <td key={role.roleCode} className="p-2 text-center">
                                                <div className="flex justify-center">
                                                    <TriStateCheckbox
                                                        value={permissionStates[role.roleCode]?.[perm.code] || 'NONE'}
                                                        onChange={(value) => handlePermissionChange(
                                                            role.roleCode,
                                                            perm.code,
                                                            value
                                                        )}
                                                        isModified={isModified(role.roleCode, perm.code)}
                                                        disabled={role.roleCode === 'ADMIN'}
                                                    />
                                                </div>
                                            </td>
                                        ))}
                                    </tr>
                                ))}
                            </React.Fragment>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* 修改提示 */}
            {hasChanges && (
                <div className="fixed bottom-4 right-4 bg-amber-100 border border-amber-300 text-amber-800 px-4 py-2 rounded-lg shadow-lg flex items-center gap-2">
                    <span className="text-sm">有未保存的更改</span>
                    <Button size="sm" onClick={handleSave} disabled={isSaving}>
                        保存
                    </Button>
                </div>
            )}
        </div>
    );
}

/**
 * 构建初始权限状态
 */
function buildInitialStates(roles: RoleOverrideData[]): PermissionStateMap {
    const states: PermissionStateMap = {};

    for (const role of roles) {
        states[role.roleCode] = {};

        // 基于有效权限构建状态
        const effectivePerms = new Set(role.effectivePermissions);

        // 遍历所有已知权限
        // 判断每个权限的状态
        for (const perm of effectivePerms) {
            if (perm === '**' || perm === '*') {
                // 超级权限，所有都是 EDIT
                continue;
            }

            // 检查是否有 edit 权限
            if (perm.includes('.edit')) {
                const viewPerm = perm.replace('.edit', '.view');
                states[role.roleCode][perm] = 'EDIT';
                states[role.roleCode][viewPerm] = 'EDIT';
            } else if (perm.includes('.view')) {
                const editPerm = perm.replace('.view', '.edit');
                // 只有 view 没有 edit
                if (!effectivePerms.has(editPerm)) {
                    states[role.roleCode][perm] = 'VIEW';
                }
            } else {
                // 特殊权限（如 approve, dispatch 等）
                states[role.roleCode][perm] = 'EDIT';
            }
        }
    }

    return states;
}
