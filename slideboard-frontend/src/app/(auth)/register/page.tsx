import { Metadata } from 'next';

import { siteConfig } from '@/config/site';
import { RegisterView } from '@/features/auth/components/RegisterView';

export const metadata: Metadata = {
  title: `注册 - ${siteConfig.name}`,
  description: '创建新账户以开始使用',
};

export default function RegisterPage() {
  return <RegisterView />;
}
