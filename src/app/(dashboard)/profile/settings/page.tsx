import { DashboardPageHeader } from '@/shared/ui/dashboard-page-header';
import { UserPreferenceSettings } from '@/features/settings/components/user-preference-settings';
import { ThemeSettings } from '@/features/settings/components/theme-settings';
import { UserProfileForm } from '@/features/settings/components/user-profile-form';
import { PasswordChangeForm } from '@/features/settings/components/password-change-form';
import { getUserPreferences } from '@/features/settings/actions/preference-actions';
import { auth } from '@/shared/lib/auth';
import { redirect } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/shared/ui/card';

/**
 * 用户个人设置页面
 * 这是用户级别的设置，独立于系统设置模块
 */
export default async function ProfileSettingsPage() {
  const session = await auth();
  if (!session?.user) {
    redirect('/auth/signin');
  }

  const prefs = await getUserPreferences();

  return (
    <div className="flex-1 space-y-8 p-4 pt-6 md:p-8">
      <DashboardPageHeader title="个人偏好" subtitle="自定义您的工作环境、界面风格及交互行为" />

      <div className="grid max-w-5xl gap-8">
        {/* 个人信息设置 */}
        <section>
          <Card>
            <CardHeader>
              <CardTitle>个人信息</CardTitle>
              <CardDescription>管理您的姓名、头像和联系方式</CardDescription>
            </CardHeader>
            <CardContent>
              <UserProfileForm user={session.user} />
            </CardContent>
          </Card>
        </section>

        {/* 界面外观设置 */}
        <section>
          <ThemeSettings />
        </section>

        {/* 密码修改 */}
        <section>
          <Card>
            <CardHeader>
              <CardTitle>安全设置</CardTitle>
              <CardDescription>修改您的登录密码</CardDescription>
            </CardHeader>
            <CardContent>
              <PasswordChangeForm />
            </CardContent>
          </Card>
        </section>

        {/* 业务偏好设置 */}
        <section>
          <UserPreferenceSettings initialQuoteMode={prefs.quoteMode ?? 'PRODUCT_FIRST'} />
        </section>
      </div>
    </div>
  );
}
