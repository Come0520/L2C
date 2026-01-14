'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/shared/ui/dialog';
import { Button } from '@/shared/ui/button';
import { toast } from 'sonner';

interface SubmitDataDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    taskId: string;
    onSuccess: () => void;
}

export function SubmitDataDialog({ open, onOpenChange, taskId, onSuccess }: SubmitDataDialogProps) {
    const [loading, setLoading] = useState(false);

    const handleSubmit = async () => {
        setLoading(true);
        // Mock submission
        setTimeout(() => {
            setLoading(false);
            toast.success('Measurement data submitted (mock)');
            onSuccess();
            onOpenChange(false);
        }, 1000);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Submit Measurement Data</DialogTitle>
                </DialogHeader>
                <div className="py-4 text-center text-muted-foreground">
                    Measurement data submission form not available in recovery mode.
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
