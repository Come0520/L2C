'use client';

import { Checkbox } from "@/shared/ui/checkbox";

interface PermissionTreeProps {
    value: string[];
    onChange: (value: string[]) => void;
}

export function PermissionTree({ value, onChange }: PermissionTreeProps) {
    return (
        <div className="border rounded-md p-4">
            <h3 className="font-medium mb-4">Permissions</h3>
            <p className="text-muted-foreground text-sm">
                Permission tree is simplified in recovery mode.
            </p>
        </div>
    );
}
