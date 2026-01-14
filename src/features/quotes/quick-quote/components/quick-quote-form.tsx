'use client';

import React from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@/shared/ui/button';
import { Form } from '@/shared/ui/form';

export function QuickQuoteForm() {
    const form = useForm();
    return (
        <Form {...form}>
            <form className="space-y-4">
                <h2 className="text-2xl font-bold">Quick Quote Form</h2>
                <div className="py-8 text-center text-muted-foreground border-2 border-dashed rounded-lg">
                    Quick quote form not available in recovery mode.
                </div>
                <div className="flex justify-end pt-4">
                    <Button type="submit">Generate Quote</Button>
                </div>
            </form>
        </Form>
    );
}
