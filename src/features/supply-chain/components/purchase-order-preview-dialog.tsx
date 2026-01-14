'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/shared/ui/dialog';

interface PurchaseOrderPreviewDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    data: any;
}

export function PurchaseOrderPreviewDialog({ open, onOpenChange, data }: PurchaseOrderPreviewDialogProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Purchase Order Preview</DialogTitle>
                </DialogHeader>
                <div className="space-y-6">
                    <p className="text-muted-foreground">Preview not available in recovery mode.</p>
                </div>
            </DialogContent>
        </Dialog>
    );
}
