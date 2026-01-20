'use client';

import { useTransition } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/shared/ui/card';
import { Label } from '@/shared/ui/label';
import { RadioGroup, RadioGroupItem } from '@/shared/ui/radio-group';
import { toast } from 'sonner';

interface UserPreferenceSettingsProps {
    initialQuoteMode: 'PRODUCT_FIRST' | 'SPACE_FIRST';
}

export function UserPreferenceSettings({ initialQuoteMode }: UserPreferenceSettingsProps) {
    const [isPending, startTransition] = useTransition();

    const handleModeChange = (value: string) => {
        startTransition(async () => {
            // Mock update
            toast.success('Preference updated (mock)');
        });
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Quote Preferences</CardTitle>
                <CardDescription>Choose your preferred quotation workflow.</CardDescription>
            </CardHeader>
            <CardContent>
                <RadioGroup 
                    defaultValue={initialQuoteMode} 
                    onValueChange={handleModeChange}
                    disabled={isPending}
                    className="grid grid-cols-1 md:grid-cols-2 gap-4"
                >
                    <div className="flex items-start space-x-3 space-y-0 rounded-md border p-4">
                        <RadioGroupItem value="PRODUCT_FIRST" id="mode-product" />
                        <div className="grid gap-1.5 leading-none">
                            <Label htmlFor="mode-product" className="font-bold">Product First</Label>
                            <p className="text-sm text-muted-foreground">Add products directly to the quote.</p>
                        </div>
                    </div>
                    <div className="flex items-start space-x-3 space-y-0 rounded-md border p-4">
                        <RadioGroupItem value="SPACE_FIRST" id="mode-space" />
                        <div className="grid gap-1.5 leading-none">
                            <Label htmlFor="mode-space" className="font-bold">Space First</Label>
                            <p className="text-sm text-muted-foreground">Organize products by room/space.</p>
                        </div>
                    </div>
                </RadioGroup>
            </CardContent>
        </Card>
    );
}
