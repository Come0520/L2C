'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/shared/ui/dialog';

/** 角色表单初始数据类型 */
interface RoleFormData {
    id?: string;
    code: string;
    name: string;
    description?: string | null;
}

interface RoleFormProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    initialData?: RoleFormData;
    onSuccess: () => void;
}

export function RoleForm({ open, onOpenChange, initialData }: RoleFormProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{initialData ? 'Edit Role' : 'Create Role'}</DialogTitle>
                </DialogHeader>
                <div className="py-4 text-center text-muted-foreground">
                    Role form not available in recovery mode.
                </div>
            </DialogContent>
        </Dialog>
    );
}
