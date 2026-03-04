import { mobileTaskService } from '@/shared/services/mobile-task.service';
import { NextRequest } from 'next/server';
import { apiPaginated, apiServerError } from '@/shared/lib/api-response';
import { authenticateMobile, requireWorker } from '@/shared/middleware/mobile-auth';
import { createLogger } from '@/shared/lib/logger';
import { withTiming } from '@/shared/middleware/api-timing';

const log = createLogger('mobile/tasks');
export const GET = withTiming(async (request: NextRequest) => {
  try {
    // 1. 认证
    const authResult = await authenticateMobile(request);
    if (!authResult.success) {
      return authResult.response;
    }
    const { session } = authResult;

    // 2. 权限检查 - 仅限工人访问任务列表?
    // 实际上任务列表可能根据角色返回不同内容，这里先假设主要是工人
    // 或者通用查询。根据之前的逻辑是查 measureTasks 和 installTasks，这通常是工人的任务。
    const roleCheck = requireWorker(session);
    if (!roleCheck.allowed) {
      return roleCheck.response;
    }

    const workerId = session.userId;
    const tenantId = session.tenantId;

    // 3. 获取分页和过滤参数
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = Math.min(parseInt(searchParams.get('pageSize') || '20'), 50);
    const status = searchParams.get('status'); // PENDING, IN_PROGRESS, COMPLETED
    const type = searchParams.get('type') || 'all'; // measure, install, all

    // 调用 Service 层以获取分页查询结果
    const { total, combined } = await mobileTaskService.getPaginatedTasks({
      workerId,
      tenantId,
      page,
      pageSize,
      status,
      type,
    });

    return apiPaginated(combined, page, pageSize, total);
  } catch (error) {
    log.error('Mobile Task List Error', {}, error);
    return apiServerError('Internal Server Error');
  }
});
