'use client';

import { logger } from "@/shared/lib/logger";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/shared/ui/dialog';
import { Button } from '@/shared/ui/button';
import { Plus } from 'lucide-react';
import { LeadForm } from './lead-form';
import { useState } from 'react';

interface CreateLeadDialogProps {
    channels: Array<{ id: string; name: string }>;
    tenantId: string;
}

export function CreateLeadDialog({ channels, tenantId }: CreateLeadDialogProps) {
    const [open, setOpen] = useState(false);

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button data-testid="create-lead-btn">
                    <Plus className="mr-2 h-4 w-4" />
                    新建线索
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                    <DialogTitle>新建线索</DialogTitle>
                </DialogHeader>
                <LeadForm
                    channels={channels}
                    onSuccess={() => setOpen(false)}
                    tenantId={tenantId}
                />
            </DialogContent>
        </Dialog>
    );
}
