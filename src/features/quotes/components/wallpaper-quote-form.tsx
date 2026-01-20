'use client';

import { useForm } from 'react-hook-form';
import { Form } from '@/shared/ui/form';
import { Button } from '@/shared/ui/button';

export function WallpaperQuoteForm() {
    const form = useForm();
    return (
        <Form {...form}>
            <form className="space-y-4">
                <div className="py-8 text-center text-muted-foreground border-2 border-dashed rounded-lg">
                    Wallpaper quote form not available in recovery mode.
                </div>
                <div className="flex justify-end pt-4">
                    <Button type="submit">Submit Quote</Button>
                </div>
            </form>
        </Form>
    );
}
