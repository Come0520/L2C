'use client';

import { Button } from "@/shared/ui/button";
import { Plus } from "lucide-react";
import { useState } from "react";
import { RoleForm } from "@/features/settings/components/role-form";

export function RoleFormWrapper() {
    const [open, setOpen] = useState(false);

    return (
        <>
            <Button onClick={() => setOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                新建角色
            </Button>
            <RoleForm open={open} onOpenChange={setOpen} onSuccess={() => setOpen(false)} />
        </>
    );
}
