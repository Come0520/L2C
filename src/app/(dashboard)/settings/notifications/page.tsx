import { DashboardPageHeader } from '@/shared/ui/dashboard-page-header';
import { NotificationPreferencesForm } from '@/features/settings/components/notification-preferences-form';

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
