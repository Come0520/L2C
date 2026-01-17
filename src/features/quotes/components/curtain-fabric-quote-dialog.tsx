'use client';

import React from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/shared/ui/dialog';

interface CurtainFabricQuoteDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function CurtainFabricQuoteDialog({ open, onOpenChange }: CurtainFabricQuoteDialogProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>面料报价详情 (Fabric Quote Details)</DialogTitle>
                </DialogHeader>
                <div className="py-4">
                    <p className="text-muted-foreground">功能在恢复模式下暂不可用。</p>
                </div>
            </DialogContent>
        </Dialog>
    );
}
