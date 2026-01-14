'use client';

import { useForm } from 'react-hook-form';
import { Button } from '@/shared/ui/button';
import { Form } from '@/shared/ui/form';

export function ProcessingOrderForm() {
    const form = useForm();
    return (
        <Form {...form}>
            <form className="space-y-8">
                <div className="text-muted-foreground p-4 text-center border rounded">
                    Processing order creation not available in recovery mode.
                </div>
            </form>
        </Form>
    );
}
