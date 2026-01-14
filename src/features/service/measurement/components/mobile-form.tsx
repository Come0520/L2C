'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@/shared/ui/button';

export function MeasurementMobileForm() {
    const form = useForm();
    const [submitting, setSubmitting] = useState(false);

    const onSubmit = (data: any) => {
        setSubmitting(true);
        setTimeout(() => {
            setSubmitting(false);
            alert('Measurement submitted (mock)');
        }, 1000);
    };

    return (
        <form onSubmit={form.handleSubmit(onSubmit)} className="p-4 space-y-6">
            <h1 className="text-xl font-bold">Mobile Measurement Form</h1>
            <div className="py-8 text-center text-muted-foreground border-2 border-dashed rounded-lg">
                Mobile form content not available in recovery mode.
            </div>
            <div className="fixed bottom-0 left-0 right-0 p-4 bg-background border-t">
                <Button type="submit" className="w-full" disabled={submitting}>
                    {submitting ? 'Submitting...' : 'Submit Measurement'}
                </Button>
            </div>
        </form>
    );
}
