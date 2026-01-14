'use client';

import { useForm } from 'react-hook-form';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/shared/ui/dialog';
import { Button } from '@/shared/ui/button';
import { Form } from '@/shared/ui/form';

interface ReminderRuleFormProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    initialData?: any;
    onSuccess: () => void;
}

export function ReminderRuleForm({ open, onOpenChange, initialData, onSuccess }: ReminderRuleFormProps) {
    const form = useForm();
     return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{initialData ? 'Edit Rule' : 'Create Rule'}</DialogTitle>
                </DialogHeader>
                <div className="py-4">
                    <p className="text-muted-foreground">Reminder rule form not available in recovery mode.</p>
                </div>
            </DialogContent>
        </Dialog>
    );
}
