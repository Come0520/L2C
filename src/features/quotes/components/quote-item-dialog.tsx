'use client';

import React from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/shared/components/ui/dialog';

interface QuoteItemDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function QuoteItemDialog({ open, onOpenChange }: QuoteItemDialogProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>报价项详情 (Quote Item Details)</DialogTitle>
                </DialogHeader>
                <div className="py-4">
                    <p className="text-muted-foreground">报价项功能在恢复模式下暂不可用。</p>
                </div>
            </DialogContent>
        </Dialog>
    );
}
