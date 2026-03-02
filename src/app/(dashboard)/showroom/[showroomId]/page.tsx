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
  let item;
  try {
    item = await getShowroomItemDetail(showroomId);
  } catch (e) {
    console.error('[SHOWROOM_DEBUG] 详情页加载异常:', {
      message: e instanceof Error ? e.message : String(e),
      name: e instanceof Error ? e.name : undefined,
      stack: e instanceof Error ? e.stack : undefined,
      showroomId,
    });
    throw e; // 重新抛出让 error.tsx 处理
  }

  if (!item) {
    notFound();
  }

  return <ShowroomDetailClient item={item} />;
}
