
import { Metadata } from 'next';
import { auth } from '@/shared/lib/auth';
import { redirect } from 'next/navigation';
import { NotificationList } from '@/features/notifications/components/notification-list';
import { getNotificationsPure } from '@/features/notifications/actions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card';

export const metadata: Metadata = {
    title: '通知中心 | L2C',
    description: '查看和管理您的所有通知消息',
};

export default async function NotificationsPage() {
    const session = await auth();
    if (!session?.user) {
        redirect('/login');
    }

    const { data, meta } = await getNotificationsPure(session.user, {
        page: 1,
        limit: 20,
        onlyUnread: false
    });

    return (
        <div className="container mx-auto p-6 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">通知中心</h2>
                    <p className="text-muted-foreground">
                        查看系统的所有通知消息，包括审批、预警和系统公告
                    </p>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>消息列表</CardTitle>
                    <CardDescription>
                        共 {meta.total} 条消息
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <NotificationList
                        initialNotifications={data}
                        total={meta.total}
                    />
                </CardContent>
            </Card>
        </div>
    );
}
