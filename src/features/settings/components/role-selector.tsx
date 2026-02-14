'use client';

import { Checkbox } from '@/shared/ui/checkbox';
import { Label } from '@/shared/ui/label';
import { cn } from '@/shared/lib/utils';

interface RoleOption {
    label: string;
    value: string;
}

interface RoleSelectorProps {
    options: RoleOption[];
    selected: string[];
    onSelect: (values: string[]) => void;
    className?: string;
    gridCols?: number;
}

/**
 * 通用角色选择器组件
 * 采用复选框网格形式，提供比下拉框更直观的交互体验
 */
export function RoleSelector({
    options,
    selected,
    onSelect,
    className,
    gridCols = 2
}: RoleSelectorProps) {
    const toggleRole = (roleValue: string) => {
        const isSelected = selected.includes(roleValue);
        if (isSelected) {
            onSelect(selected.filter((v) => v !== roleValue));
        } else {
            onSelect([...selected, roleValue]);
        }
    };

    return (
        <div
            className={cn(
                "grid gap-4 p-4 border rounded-md bg-muted/30",
                gridCols === 2 ? "grid-cols-2" : "grid-cols-1",
                className
            )}
        >
            {options.map((role) => (
                <div key={role.value} className="flex items-center space-x-2">
                    <Checkbox
                        id={`role-${role.value}`}
                        checked={selected.includes(role.value)}
                        onCheckedChange={() => toggleRole(role.value)}
                    />
                    <Label
                        htmlFor={`role-${role.value}`}
                        className="text-sm font-medium leading-none cursor-pointer peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                        {role.label}
                    </Label>
                </div>
            ))}
        </div>
    );
}
