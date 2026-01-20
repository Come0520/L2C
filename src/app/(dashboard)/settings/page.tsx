import { redirect } from 'next/navigation';

/**
 * 系统设置默认页面
 * 自动跳转到基础设置 - 租户信息
 */
export default async function SettingsPage() {
    redirect('/settings/general');
}
