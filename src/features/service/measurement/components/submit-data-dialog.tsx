'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/shared/ui/dialog';
import { Button } from '@/shared/ui/button';
import { toast } from 'sonner';

interface SubmitDataDialogProps {
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
    taskId: string;
    onSuccess?: () => void;
    trigger?: React.ReactNode;
}

export function SubmitDataDialog({ open: controlledOpen, onOpenChange: setControlledOpen, taskId, onSuccess, trigger }: SubmitDataDialogProps) {
    const [internalOpen, setInternalOpen] = useState(false);
    const isControlled = controlledOpen !== undefined;
    const open = isControlled ? controlledOpen : internalOpen;
    const onOpenChange = isControlled ? setControlledOpen : setInternalOpen;

    const [loading, setLoading] = useState(false);

    const handleSubmit = async () => {
        setLoading(true);
        // Mock submission
        setTimeout(() => {
            setLoading(false);
            toast.success('Measurement data submitted (mock)');
            if (onSuccess) onSuccess();
            if (onOpenChange) onOpenChange(false);
        }, 1000);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Submit Measurement Data</DialogTitle>
                </DialogHeader>
                <div className="py-4 text-center text-muted-foreground">
                    Measurement data submission form not available in recovery mode.
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange?.(false)}>Cancel</Button>
                    <Button onClick={handleSubmit} disabled={loading}>
                        {loading ? 'Submitting...' : 'Submit'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
