'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/shared/ui/dialog';
import { Button } from '@/shared/ui/button';

interface MeasurementAdvancedFilterProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function MeasurementAdvancedFilter({ open, onOpenChange }: MeasurementAdvancedFilterProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Advanced Filters</DialogTitle>
                </DialogHeader>
                <div className="py-4 text-center text-muted-foreground">
                    Advanced filters not available in recovery mode.
                </div>
            </DialogContent>
        </Dialog>
    );
}
