'use client';

import { useTransition } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/shared/ui/card';
import { Label } from '@/shared/ui/label';
import { Switch } from '@/shared/ui/switch';
import { toast } from 'sonner';

export function NotificationPreferencesForm() {
    const [isPending, startTransition] = useTransition();

    const handleToggle = (key: string, enabled: boolean) => {
        startTransition(async () => {
             // Mock update
             toast.success(`Preference ${key} updated (mock)`);
        });
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Notification Preferences</CardTitle>
                <CardDescription>Manage how you receive notifications.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="flex items-center justify-between space-x-2">
                    <Label htmlFor="notify-email" className="flex flex-col space-y-1">
                        <span>Email Notifications</span>
                        <span className="font-normal text-sm text-muted-foreground">Receive updates via email.</span>
                    </Label>
                    <Switch id="notify-email" onCheckedChange={(val) => handleToggle('email', val)} disabled={isPending} />
                </div>
                <div className="flex items-center justify-between space-x-2">
                    <Label htmlFor="notify-sms" className="flex flex-col space-y-1">
                        <span>SMS Notifications</span>
                        <span className="font-normal text-sm text-muted-foreground">Receive updates via text message.</span>
                    </Label>
                    <Switch id="notify-sms" onCheckedChange={(val) => handleToggle('sms', val)} disabled={isPending} />
                </div>
            </CardContent>
        </Card>
    );
}
