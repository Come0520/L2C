'use client';

import { useForm } from 'react-hook-form';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/shared/ui/card';
import { Button } from '@/shared/ui/button';
import { Form } from '@/shared/ui/form';

export function WallpaperQuickQuoteConfig() {
    const form = useForm();
    return (
        <Form {...form}>
            <form>
                <Card>
                    <CardHeader>
                        <CardTitle>Wallpaper Quote Config</CardTitle>
                        <CardDescription>Configure quick quote parameters for wallpaper.</CardDescription>
                    </CardHeader>
                     <CardContent>
                        <div className="py-4 text-center text-muted-foreground">
                            Configuration not available in recovery mode.
                        </div>
                    </CardContent>
                </Card>
            </form>
        </Form>
    );
}
