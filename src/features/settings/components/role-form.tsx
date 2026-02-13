'use client';

import { useForm } from 'react-hook-form';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/shared/ui/dialog';
import { Button } from '@/shared/ui/button';
import { Form } from '@/shared/ui/form';

interface RoleFormProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    initialData?: any;
    onSuccess: () => void;
}

export function RoleForm({ open, onOpenChange, initialData, onSuccess }: RoleFormProps) {
    const form = useForm();
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
