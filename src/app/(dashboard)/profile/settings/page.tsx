import { DashboardPageHeader } from '@/shared/ui/dashboard-page-header';
import { UserPreferenceSettings } from '@/features/settings/components/user-preference-settings';
import { ThemeSettings } from '@/features/settings/components/theme-settings';
import { getUserPreferences } from '@/features/settings/actions/preference-actions';

/**
 * 用户个人设置页面
 * 这是用户级别的设置，独立于系统设置模块
 */
export default async function ProfileSettingsPage() {
  const prefs = await getUserPreferences();

  return (
    <div className="flex-1 space-y-8 p-4 pt-6 md:p-8">
      <DashboardPageHeader title="个人偏好" subtitle="自定义您的工作环境、界面风格及交互行为" />

      <div className="grid max-w-5xl gap-8">
        {/* 界面外观设置 */}
        <section>
          <ThemeSettings />
        </section>

        {/* 业务偏好设置 */}
        <section>
          <UserPreferenceSettings initialQuoteMode={prefs.quoteMode ?? 'PRODUCT_FIRST'} />
        </section>
      </div>
    </div>
  );
}
