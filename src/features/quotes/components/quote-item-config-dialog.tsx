'use client';

import React from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/shared/components/ui/dialog';

interface QuoteItemConfigDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function QuoteItemConfigDialog({ open, onOpenChange }: QuoteItemConfigDialogProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>配置项 (Item Config)</DialogTitle>
                </DialogHeader>
                <div className="py-4">
                    <p className="text-muted-foreground">功能在恢复模式下暂不可用。</p>
                </div>
            </DialogContent>
        </Dialog>
    );
}
