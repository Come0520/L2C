import { Metadata } from 'next';

import { siteConfig } from '@/config/site';
import { LoginView } from '@/features/auth/components/LoginView';

export const metadata: Metadata = {
  title: `登录 - ${siteConfig.name}`,
  description: '登录您的账户以访问L2C',
};

export default function LoginPage() {
  return <LoginView />;
}
