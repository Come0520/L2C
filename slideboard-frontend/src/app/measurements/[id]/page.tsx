import { Metadata } from 'next';

import { MeasurementTaskDetailClient } from './client';

export const metadata: Metadata = {
  title: '测量任务详情',
};

// params 类型在 Next.js 15 中可能是 Promise
interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function MeasurementTaskDetailPage({ params }: PageProps) {
  const { id } = await params;
  return <MeasurementTaskDetailClient id={id} />;
}
