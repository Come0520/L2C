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
import { Button } from '@/shared/ui/button'; // Assuming Button is needed or used in triggering, but simpler logic here

interface CreateCustomerDialogProps {
    trigger: React.ReactNode;
    userId: string;
    tenantId: string;
}

export function CreateCustomerDialog({ trigger, userId, tenantId }: CreateCustomerDialogProps) {
    const [open, setOpen] = useState(false);

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                    <DialogTitle>新建客户</DialogTitle>
                </DialogHeader>
                <CustomerForm
                    userId={userId}
                    tenantId={tenantId}
                    onSuccess={() => setOpen(false)}
                />
            </DialogContent>
        </Dialog>
    );
}
