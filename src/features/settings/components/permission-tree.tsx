'use client';

import { Checkbox } from "@/shared/ui/checkbox";
import { PERMISSION_GROUPS, PERMISSION_LABELS } from '@/shared/config/permissions';
import ChevronDown from 'lucide-react/dist/esm/icons/chevron-down';
import ChevronRight from 'lucide-react/dist/esm/icons/chevron-right';
import { useState } from 'react';
import { cn } from '@/shared/lib/utils';

interface PermissionTreeProps {
    value: string[];
    onChange: (value: string[]) => void;
    disabled?: boolean;
}

/**
 * 权限树组件（简化版）
 * 
 * 用于单个角色的权限选择，展示为分组的复选框列表
 */
export function PermissionTree({ value, onChange, disabled = false }: PermissionTreeProps) {
    const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>(() => {
        const initial: Record<string, boolean> = {};
        PERMISSION_GROUPS.forEach((group, index) => {
            initial[group.key] = index < 3;
        });
        return initial;
    });

    const toggleGroup = (key: string) => {
        setExpandedGroups(prev => ({ ...prev, [key]: !prev[key] }));
    };

    const handlePermissionChange = (permission: string, checked: boolean) => {
        if (checked) {
            onChange([...value, permission]);
        } else {
            onChange(value.filter(p => p !== permission));
        }
    };

    const isChecked = (permission: string) => value.includes(permission);

    return (
        <div className="border rounded-md divide-y">
            {PERMISSION_GROUPS.map(group => (
                <div key={group.key}>
                    {/* 分组标题 */}
                    <div
                        className={cn(
                            "flex items-center gap-2 p-3 cursor-pointer hover:bg-muted/50",
                            disabled && "opacity-50 cursor-not-allowed"
                        )}
                        onClick={() => !disabled && toggleGroup(group.key)}
                    >
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

                    {/* 权限列表 */}
                    {expandedGroups[group.key] && (
                        <div className="p-3 pl-8 bg-muted/20 grid grid-cols-2 gap-2">
                            {Object.entries(group.permissions).map(([, code]) => {
                                const permCode = code as string;
                                const label = PERMISSION_LABELS[permCode] || permCode;

                                return (
                                    <label
                                        key={permCode}
                                        className={cn(
                                            "flex items-center gap-2 text-sm cursor-pointer",
                                            disabled && "opacity-50 cursor-not-allowed"
                                        )}
                                    >
                                        <Checkbox
                                            checked={isChecked(permCode)}
                                            onCheckedChange={(checked) =>
                                                handlePermissionChange(permCode, !!checked)
                                            }
                                            disabled={disabled}
                                        />
                                        <span>{label}</span>
                                    </label>
                                );
                            })}
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
}
