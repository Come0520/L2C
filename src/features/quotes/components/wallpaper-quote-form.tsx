'use client';

import { useForm } from 'react-hook-form';
import { Form } from '@/shared/ui/form';
import { Button } from '@/shared/ui/button';

export function WallpaperQuoteForm() {
  const form = useForm();
  return (
    <Form {...form}>
      <form className="space-y-4">
        <div className="text-muted-foreground rounded-lg border-2 border-dashed py-8 text-center">
          Wallpaper quote form not available in recovery mode.
        </div>
        <div className="flex justify-end pt-4">
          <Button type="submit">Submit Quote</Button>
        </div>
      </form>
    </Form>
  );
}
