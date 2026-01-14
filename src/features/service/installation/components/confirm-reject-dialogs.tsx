'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/shared/ui/dialog';
import { Button } from '@/shared/ui/button';
import { toast } from 'sonner';

interface ConfirmRejectDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    taskId: string;
    onSuccess: () => void;
}

export function ConfirmDialog({ open, onOpenChange, taskId, onSuccess }: ConfirmRejectDialogProps) {
    const [loading, setLoading] = useState(false);

    const handleConfirm = async () => {
        setLoading(true);
        setTimeout(() => {
            setLoading(false);
            toast.success('Installation confirmed (mock)');
            onSuccess();
            onOpenChange(false);
        }, 1000);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Confirm Installation Result</DialogTitle>
                </DialogHeader>
                <div className="py-4 text-center text-muted-foreground">
                    Confirm form not available in recovery mode.
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                    <Button onClick={handleConfirm} disabled={loading}>
                        {loading ? 'Confirming...' : 'Confirm'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

export function RejectDialog({ open, onOpenChange, taskId, onSuccess }: ConfirmRejectDialogProps) {
    const [loading, setLoading] = useState(false);

    const handleReject = async () => {
        setLoading(true);
        setTimeout(() => {
            setLoading(false);
            toast.success('Installation rejected (mock)');
            onSuccess();
            onOpenChange(false);
        }, 1000);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Reject Installation Result</DialogTitle>
                </DialogHeader>
                <div className="py-4 text-center text-muted-foreground">
                    Reject form not available in recovery mode.
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                    <Button variant="destructive" onClick={handleReject} disabled={loading}>
                        {loading ? 'Rejecting...' : 'Reject'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
