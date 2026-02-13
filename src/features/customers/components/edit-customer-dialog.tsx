'use client';

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/shared/ui/dialog';
import { CustomerForm } from './customer-form';
import { useState } from 'react';

interface EditCustomerDialogProps {
    customer: any;
    trigger: React.ReactNode;
    userId: string;
}

export function EditCustomerDialog({ customer, trigger, userId }: EditCustomerDialogProps) {
    const [open, setOpen] = useState(false);

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                    <DialogTitle>编辑客户</DialogTitle>
                </DialogHeader>
                <CustomerForm
                    initialData={customer}
                    userId={userId}
                    tenantId={customer.tenantId}
                    onSuccess={() => setOpen(false)}
                />
            </DialogContent>
        </Dialog>
    );
}
