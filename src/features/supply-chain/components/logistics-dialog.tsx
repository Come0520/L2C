'use client';

import { useState } from 'react';
import { Button } from '@/shared/ui/button';
import Truck from 'lucide-react/dist/esm/icons/truck';
import { Dialog, DialogContent, DialogTrigger, DialogHeader, DialogTitle } from '@/shared/ui/dialog';

interface LogisticsDialogProps {
    poId?: string;
    trigger?: React.ReactNode;
}

export function LogisticsDialog({ poId, trigger }: LogisticsDialogProps) {
    const [open, setOpen] = useState(false);
    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger || (
                    <Button variant="outline" size="sm">
                        <Truck className="mr-2 h-4 w-4" />
                        Logistics
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Logistics Details</DialogTitle>
                </DialogHeader>
                <div className="py-4 text-center">
                    Logistics update not available in recovery mode.
                    <div className="text-xs text-gray-400 mt-2">PO: {poId}</div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
