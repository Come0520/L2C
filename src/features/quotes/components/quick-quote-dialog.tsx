'use client';

import React from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/shared/ui/dialog';

interface QuickQuoteDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function QuickQuoteDialog({ open, onOpenChange }: QuickQuoteDialogProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl">
                <DialogHeader>
                    <DialogTitle>快速报价 (Quick Quote)</DialogTitle>
                </DialogHeader>
                <div className="py-4">
                    <p className="text-muted-foreground">快速报价功能在恢复模式下暂不可用。</p>
                    <p className="text-sm text-muted-foreground">(Quick Quote is not available in recovery mode.)</p>
                </div>
            </DialogContent>
        </Dialog>
    );
}
