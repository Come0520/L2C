'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/shared/ui/dialog';
import { Button } from '@/shared/ui/button';
import { Archive } from 'lucide-react';

export function StockAdjustmentDialog() {
    const [open, setOpen] = useState(false);

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                    <Archive className="mr-2 h-4 w-4" />
                    Adjust Stock
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Stock Adjustment</DialogTitle>
                </DialogHeader>
                <div className="py-4">
                     <p className="text-muted-foreground">Stock adjustment not available in recovery mode.</p>
                </div>
            </DialogContent>
        </Dialog>
    );
}
