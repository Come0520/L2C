'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/shared/ui/card';
import { Button } from '@/shared/ui/button';
import { Label } from '@/shared/ui/label';
import { Input } from '@/shared/ui/input';
import { toast } from 'sonner';

export function CurtainCalcSettings() {
    const [isPending, setIsPending] = useState(false);

    const handleSave = () => {
        setIsPending(true);
        setTimeout(() => {
            setIsPending(false);
            toast.success('Curtain settings saved (mock)');
        }, 1000);
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Curtain Calculation Settings</CardTitle>
                <CardDescription>Configure default ratios and loss factors for curtain calculations.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="fold-ratio">Default Fold Ratio</Label>
                        <Input id="fold-ratio" type="number" defaultValue={2} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="loss-factor">Loss Factor (%)</Label>
                        <Input id="loss-factor" type="number" defaultValue={5} />
                    </div>
                </div>
                <div className="flex justify-end pt-4">
                    <Button onClick={handleSave} disabled={isPending}>
                        {isPending ? 'Saving...' : 'Save Settings'}
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}
