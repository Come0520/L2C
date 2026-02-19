
import { NextRequest } from 'next/server';
import { apiSuccess } from '@/shared/lib/api-response';
import { authenticateMobile, requireWorker } from '@/shared/middleware/mobile-auth';

export async function POST(
    request: NextRequest,
    props: { params: Promise<{ id: string }> }
) {
    const auth = await authenticateMobile(request);
    if (!auth.success) return auth.response;

    const isWorker = requireWorker(auth.session);
    if (!isWorker.allowed) return isWorker.response;

    // 目前数据库不支持已读状态字段，暂返回成功以支持前端防呆
    return apiSuccess({ success: true }, '已标记为已读');
}
