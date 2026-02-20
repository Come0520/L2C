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

import { CustomerDetail } from '@/features/customers/types';

interface EditCustomerDialogProps {
    customer: CustomerDetail;
    trigger: React.ReactNode;
}

export function EditCustomerDialog({ customer, trigger }: EditCustomerDialogProps) {
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
                    tenantId={customer.tenantId}
                    onSuccess={() => setOpen(false)}
                />
            </DialogContent>
        </Dialog>
    );
}
