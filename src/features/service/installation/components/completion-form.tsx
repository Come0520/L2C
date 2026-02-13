'use client';

import { useState } from 'react';
import { Button } from '@/shared/ui/button';
import { toast } from 'sonner';

export function InstallationCompletionForm({ taskId }: { taskId: string }) {
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async () => {
        setSubmitting(true);
        setTimeout(() => {
            setSubmitting(false);
            toast.success('Installation completion submitted (mock)');
        }, 1000);
    };

    return (
        <div className="space-y-4 p-4 border rounded-lg">
            <h3 className="text-lg font-bold">Installation Completion Form</h3>
            <div className="py-8 text-center text-muted-foreground border-2 border-dashed rounded-lg">
                Completion form details not available in recovery mode.
            </div>
            <Button className="w-full" onClick={handleSubmit} disabled={submitting}>
                {submitting ? 'Submitting...' : 'Confirm Completion'}
            </Button>
        </div>
    );
}
