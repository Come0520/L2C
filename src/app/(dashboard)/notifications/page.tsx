
import { Metadata } from 'next';
import { auth } from '@/shared/lib/auth';
import { redirect } from 'next/navigation';
import { NotificationList } from '@/features/notifications/components/notification-list';
import { getNotificationsPure } from '@/features/notifications/actions';


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
        <div className="h-full flex flex-col p-4">
            <div className="flex-1 min-h-0 glass-liquid-ultra rounded-2xl border border-white/20 p-4 flex flex-col gap-4">
                <div className="flex-1 min-h-0 overflow-auto">
                    <NotificationList
                        initialNotifications={data}
                        total={meta.total}
                    />
                </div>
            </div>
        </div>
    );
}
