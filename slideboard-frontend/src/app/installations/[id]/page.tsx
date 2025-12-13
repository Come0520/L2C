import { Metadata } from 'next';

import { InstallationTaskDetailClient } from './client';

export const metadata: Metadata = {
  title: '安装任务详情',
};

// params 类型在 Next.js 15 中可能是 Promise
interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function InstallationTaskDetailPage({ params }: PageProps) {
  const { id } = await params;
  return <InstallationTaskDetailClient id={id} />;
}
