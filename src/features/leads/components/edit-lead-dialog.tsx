'use client';

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/shared/ui/dialog';
import { LeadForm } from './lead-form';
import { useState } from 'react';

interface EditLeadDialogProps {
    lead: any;
    trigger: React.ReactNode;
    channels: any[];
    userId: string;
}

export function EditLeadDialog({ lead, trigger, channels, userId }: EditLeadDialogProps) {
    const [open, setOpen] = useState(false);

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                    <DialogTitle>编辑线索</DialogTitle>
                </DialogHeader>
                <LeadForm
                    initialData={lead}
                    channels={channels}
                    userId={userId}
                    tenantId={lead.tenantId}
                    onSuccess={() => setOpen(false)}
                />
            </DialogContent>
        </Dialog>
    );
}
