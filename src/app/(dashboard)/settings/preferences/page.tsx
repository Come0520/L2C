import { DashboardPageHeader } from '@/shared/ui/dashboard-page-header';
import { UserPreferenceSettings } from '@/features/settings/components/user-preference-settings';

/**
 * 偏好设置页面
 * 个性化用户使用体验
 */
export default function PreferencesSettingsPage() {
    return (
        <div className="space-y-6">
            <DashboardPageHeader
                title="偏好设置"
                subtitle="个性化您的使用体验"
            />

            <UserPreferenceSettings initialQuoteMode="PRODUCT_FIRST" />
        </div>
    );
}
