'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/shared/ui/dialog';
import { Button } from '@/shared/ui/button';
import { ClipboardCheck } from 'lucide-react';

export function POQuoteDialog() {
    const [open, setOpen] = useState(false);

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                    <ClipboardCheck className="mr-2 h-4 w-4" />
                    Quote Review
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Supplier Quote Review</DialogTitle>
                </DialogHeader>
                <div className="py-4">
                     <p className="text-muted-foreground">Quote review not available in recovery mode.</p>
                </div>
            </DialogContent>
        </Dialog>
    );
}
