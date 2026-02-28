import OnboardingWizard from '@/features/settings/components/onboarding-wizard';

/**
 * 新租户初始化引导页面
 *
 * 路由守卫检测到 tenants.onboardingStatus === 'pending' 时，
 * 将 BOSS 用户重定向到此页面，展示全屏问卷向导。
 */
export default function OnboardingPage() {
  return <OnboardingWizard />;
}
