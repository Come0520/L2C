'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/shared/ui/dialog';
import { Button } from '@/shared/ui/button';
import { toast } from 'sonner';

interface CreateInstallTaskDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess: () => void;
}

export function CreateInstallTaskDialog({ open, onOpenChange, onSuccess }: CreateInstallTaskDialogProps) {
    const [loading, setLoading] = useState(false);

    const handleCreate = async () => {
        setLoading(true);
        setTimeout(() => {
            setLoading(false);
            toast.success('Installation task created (mock)');
            onSuccess();
            onOpenChange(false);
        }, 1000);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Create Installation Task</DialogTitle>
                </DialogHeader>
                <div className="py-4 text-center text-muted-foreground">
                    Create installation task form not available in recovery mode.
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                    <Button onClick={handleCreate} disabled={loading}>
                        {loading ? 'Creating...' : 'Create'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
