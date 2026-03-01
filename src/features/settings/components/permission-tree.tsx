'use client';

import { Checkbox } from '@/shared/ui/checkbox';
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
    setExpandedGroups((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handlePermissionChange = (permission: string, checked: boolean) => {
    if (checked) {
      onChange([...value, permission]);
    } else {
      onChange(value.filter((p) => p !== permission));
    }
  };

  const isChecked = (permission: string) => value.includes(permission);

  return (
    <div className="divide-y rounded-md border">
      {PERMISSION_GROUPS.map((group) => (
        <div key={group.key}>
          {/* 分组标题 */}
          <div
            className={cn(
              'hover:bg-muted/50 flex cursor-pointer items-center gap-2 p-3',
              disabled && 'cursor-not-allowed opacity-50'
            )}
            onClick={() => !disabled && toggleGroup(group.key)}
          >
            {expandedGroups[group.key] ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
            <span className="font-medium">{group.label}</span>
            {group.description && (
              <span className="text-muted-foreground text-xs">- {group.description}</span>
            )}
          </div>

          {/* 权限列表 */}
          {expandedGroups[group.key] && (
            <div className="bg-muted/20 grid grid-cols-2 gap-2 p-3 pl-8">
              {Object.entries(group.permissions).map(([, code]) => {
                const permCode = code as string;
                const label = PERMISSION_LABELS[permCode] || permCode;

                return (
                  <label
                    key={permCode}
                    className={cn(
                      'flex cursor-pointer items-center gap-2 text-sm',
                      disabled && 'cursor-not-allowed opacity-50'
                    )}
                  >
                    <Checkbox
                      checked={isChecked(permCode)}
                      onCheckedChange={(checked) => handlePermissionChange(permCode, !!checked)}
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
