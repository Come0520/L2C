import { notFound } from 'next/navigation';
import { getShowroomItemDetail } from '@/features/showroom/actions';
import { ShowroomDetailClient } from '@/features/showroom/components/showroom-detail-client';

/**
 * 云展厅详情页 - Server Component
 * 负责数据获取和 404 处理
 */
export default async function ShowroomDetailPage({
  params,
}: {
  params: Promise<{ showroomId: string }>;
}) {
  const { showroomId } = await params;
  const item = await getShowroomItemDetail(showroomId);

  if (!item) {
    notFound();
  }

  return <ShowroomDetailClient item={item} />;
}
