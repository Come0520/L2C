'use client';

import React from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/shared/ui/dialog';

interface ConvertToOrderDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    quoteId?: string;
}

export function ConvertToOrderDialog({ open, onOpenChange }: ConvertToOrderDialogProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>转为订单 (Convert to Order)</DialogTitle>
                </DialogHeader>
                <div className="py-4">
                    <p className="text-muted-foreground">转为订单功能在恢复模式下暂不可用。</p>
                    <p className="text-sm text-muted-foreground">(Convert to order is not available in recovery mode.)</p>
                </div>
            </DialogContent>
        </Dialog>
    );
}
