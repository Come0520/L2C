'use client';

import { RoleList } from "@/features/settings/components/role-list";
import { RoleForm } from "@/features/settings/components/role-form";
import { useState } from "react";
import { roles } from "@/shared/api/schema";

type Role = typeof roles.$inferSelect;

export function RoleListWrapper({ initialData }: { initialData: Role[] }) {
    const [editingRole, setEditingRole] = useState<Role | undefined>(undefined);

    return (
        <>
            <RoleList
                data={initialData}
                onEdit={(role) => setEditingRole(role)}
            />

            <RoleForm
                open={!!editingRole}
                onOpenChange={(open) => {
                    if (!open) {
                        setEditingRole(undefined);
                    }
                }}
                initialData={editingRole}
            />
        </>
    );
}
