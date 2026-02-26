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
import { type InferSelectModel } from 'drizzle-orm';
import { leads } from '@/shared/api/schema/leads';

interface EditLeadDialogProps {
    lead: InferSelectModel<typeof leads>;
    trigger: React.ReactNode;
    channels: Array<{ id: string; name: string }>;
    tenantId: string;
}

export function EditLeadDialog({ lead, trigger, channels, tenantId }: EditLeadDialogProps) {
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
                    onSuccess={() => setOpen(false)}
                    tenantId={tenantId}
                />
            </DialogContent>
        </Dialog>
    );
}
