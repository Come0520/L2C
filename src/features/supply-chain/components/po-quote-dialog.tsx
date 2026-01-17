'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/shared/ui/dialog';
import { Button } from '@/shared/ui/button';
import ClipboardCheck from 'lucide-react/dist/esm/icons/clipboard-check';

interface POQuoteDialogProps {
    poId?: string;
    systemTotalCost?: number;
    trigger?: React.ReactNode;
}

export function POQuoteDialog({ poId, systemTotalCost, trigger }: POQuoteDialogProps) {
    const [open, setOpen] = useState(false);

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger || (
                    <Button variant="outline" size="sm">
                        <ClipboardCheck className="mr-2 h-4 w-4" />
                        Quote Review
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Supplier Quote Review</DialogTitle>
                </DialogHeader>
                <div className="py-4">
                    <p className="text-muted-foreground">Quote review not available in recovery mode.</p>
                    <div className="text-xs text-gray-500 mt-2">
                        PO: {poId}, Cost: {systemTotalCost}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
