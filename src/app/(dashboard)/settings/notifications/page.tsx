import { auth } from '@/shared/lib/auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card';
import { NotificationPreferencesFormContent } from '@/features/settings/components/notification-preferences-form';
import { getNotificationPreferences } from '@/features/monitoring/preference-actions';

export default async function NotificationsSettingsPage() {
    const session = await auth();
    if (!session?.user) return null;

    const prefsRes = await getNotificationPreferences(session.user.id);
    const initialPrefs = prefsRes.data?.map(p => ({
        notificationType: p.notificationType,
        channels: p.channels
    })) || [];

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold tracking-tight">通知设置</h1>
                <p className="text-muted-foreground">
                    管理您接收通知的渠道和类型偏好
                </p>
            </div>

            <div className="grid gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle>通知偏好</CardTitle>
                        <CardDescription>
                            自定义各类通知的接收渠道。注意：站内�?(In-App) 通常为必选渠道�?
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <NotificationPreferencesFormContent
                            userId={session.user.id}
                            initialPreferences={initialPrefs}
                        />
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
