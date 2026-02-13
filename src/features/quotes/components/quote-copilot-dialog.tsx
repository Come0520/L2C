'use client';

import React from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/shared/ui/dialog';

interface QuoteCopilotDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    quoteId?: string;
}

export function QuoteCopilotDialog({ open, onOpenChange }: QuoteCopilotDialogProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>报价助手 (Quote Copilot)</DialogTitle>
                </DialogHeader>
                <div className="py-4">
                    <p className="text-muted-foreground">报价助手功能在恢复模式下暂不可用。</p>
                    <p className="text-sm text-muted-foreground">(Quote Copilot is not available in recovery mode.)</p>
                </div>
            </DialogContent>
        </Dialog>
    );
}
