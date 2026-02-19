import dynamic from 'next/dynamic';
import { DashboardPageHeader } from '@/shared/ui/dashboard-page-header';
import { Skeleton } from '@/shared/ui/skeleton';

/** 懒加载：通知偏好设置表单 */
const NotificationPreferencesForm = dynamic(
    () => import('@/features/settings/components/notification-preferences-form').then(m => m.NotificationPreferencesForm),
    { loading: () => <Skeleton className="h-[400px] w-full rounded-lg" /> }
);

/**
 * 通知设置页面
 * 管理系统通知偏好
 */
export default function NotificationsSettingsPage() {
    return (
        <div className="space-y-6">
            <DashboardPageHeader
                title="通知设置"
                subtitle="管理系统通知偏好和推送渠道"
            />

            <NotificationPreferencesForm />
        </div>
    );
}
