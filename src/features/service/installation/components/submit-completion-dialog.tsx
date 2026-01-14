'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/shared/ui/dialog';
import { Button } from '@/shared/ui/button';
import { toast } from 'sonner';

interface SubmitCompletionDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    taskId: string;
    onSuccess: () => void;
}

export function SubmitCompletionDialog({ open, onOpenChange, taskId, onSuccess }: SubmitCompletionDialogProps) {
    const [loading, setLoading] = useState(false);

    const handleSubmit = async () => {
        setLoading(true);
        setTimeout(() => {
            setLoading(false);
            toast.success('Installation completion submitted (mock)');
            onSuccess();
            onOpenChange(false);
        }, 1000);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Submit Installation Completion</DialogTitle>
                </DialogHeader>
                <div className="py-4 text-center text-muted-foreground">
                    Completion submission form not available in recovery mode.
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                    <Button onClick={handleSubmit} disabled={loading}>
                        {loading ? 'Submitting...' : 'Submit'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
