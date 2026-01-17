'use client';

import { Button } from "@/shared/ui/button";
import { Plus } from "lucide-react";
import { useState } from "react";
import { UserForm } from "@/features/settings/components/user-form";

export function UserFormWrapper() {
    const [open, setOpen] = useState(false);

    return (
        <>
            <Button onClick={() => setOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                新建用户
            </Button>
            <UserForm open={open} onOpenChange={setOpen} onSuccess={() => setOpen(false)} />
        </>
    );
}
