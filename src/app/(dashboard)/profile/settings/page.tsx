import { DashboardPageHeader } from '@/shared/ui/dashboard-page-header';
import { UserPreferenceSettings } from '@/features/settings/components/user-preference-settings';
import { getUserPreferences } from '@/features/settings/actions/preference-actions';

/**
 * 用户个人设置页面
 * 这是用户级别的设置，独立于系统设置模块
 */
export default async function ProfileSettingsPage() {
    const prefs = await getUserPreferences();

    return (
        <div className="space-y-6">
            <DashboardPageHeader
                title="个人设置"
                subtitle="管理您的账户信息和偏好设置"
            />

            <UserPreferenceSettings initialQuoteMode={prefs.quoteMode ?? 'PRODUCT_FIRST'} />
        </div>
    );
}
