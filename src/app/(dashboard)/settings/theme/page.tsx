'use client';

import { DashboardPageHeader } from '@/shared/ui/dashboard-page-header';
import { ThemeSettings } from '@/features/settings/components/theme-settings';
import { ThemePreview } from '@/features/settings/components/theme-preview';

/**
 * 主题设置页面
 * 自定义系统外观主题
 */
export default function ThemeSettingsPage() {
  return (
    <div className="space-y-6">
      <DashboardPageHeader title="主题设置" subtitle="自定义系统外观主题" />

      <ThemeSettings />
      <ThemePreview />
    </div>
  );
}
