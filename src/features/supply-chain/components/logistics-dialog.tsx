'use client';

import { useState } from 'react';
import { Button } from '@/shared/ui/button';
import { Truck } from 'lucide-react';
import { Dialog, DialogContent, DialogTrigger, DialogHeader, DialogTitle } from '@/shared/ui/dialog';

export function LogisticsDialog() {
    const [open, setOpen] = useState(false);
    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                    <Truck className="mr-2 h-4 w-4" />
                    Logistics
                </Button>
            </DialogTrigger>
            <DialogContent>
                 <DialogHeader>
                    <DialogTitle>Logistics Details</DialogTitle>
                </DialogHeader>
                <div className="py-4 text-center">
                    Logistics update not available in recovery mode.
                </div>
            </DialogContent>
        </Dialog>
    );
}
