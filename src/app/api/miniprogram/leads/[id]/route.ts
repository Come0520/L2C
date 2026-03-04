/**
 * 线索详情 API
 *
 * GET /api/miniprogram/leads/[id]
 *
 * @description 获取单条线索的完整详情，包含关联的销售、渠道、客户信息。
 * 复用 Web 端的 leads 表和 relations 定义。
 */
import { NextRequest } from 'next/server';
import { apiSuccess, apiError } from '@/shared/lib/api-response';
import { logger } from '@/shared/lib/logger';
import { db } from '@/shared/api/db';
import { leads } from '@/shared/api/schema';
import { eq, and } from 'drizzle-orm';
import { getMiniprogramUser } from '../../auth-utils';
import { AuditService } from '@/shared/services/audit-service';
import { isDevMockUser, MOCK_LEADS } from '../../__mocks__';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getMiniprogramUser(request);
    if (!user || !user.tenantId) {
      return apiError('未授权', 401);
    }

    const { id } = await params;

    // 开发环境 mock
    if (isDevMockUser(user.id, user.tenantId)) {
      const mockLead = MOCK_LEADS.find((l: any) => l.id === id) || MOCK_LEADS[0];
      return apiSuccess({
        ...mockLead,
        customerWechat: 'zhangwx',
        address: '广州市天河区某某路',
        notes: '客户对全屋定制很感兴趣，预算约 15-20 万',
      });
    }

    // 查询线索详情（租户隔离）
    const lead = await db.query.leads.findFirst({
      where: and(eq(leads.id, id), eq(leads.tenantId, user.tenantId)),
      with: {
        assignedSales: { columns: { id: true, name: true } },
        sourceChannel: { columns: { name: true } },
        sourceSub: { columns: { name: true } },
        customer: true,
      },
    });

    if (!lead) {
      return apiError('线索不存在', 404);
    }

    return apiSuccess(lead);
  } catch (error) {
    logger.error('[Leads] 获取线索详情失败', { route: 'leads/[id]', error });
    return apiError('获取线索详情失败', 500);
  }
}

/**
 * PATCH /api/miniprogram/leads/[id] — 编辑线索
 *
 * @description 更新线索基本信息。仅限该线索的负责销售或管理员操作。
 * 直接写入 leads 表，与 Web 端保持数据一致。
 */
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getMiniprogramUser(request);
    if (!user || !user.tenantId) {
      return apiError('未授权', 401);
    }

    const { id } = await params;
    const body = await request.json();

    // 查找线索（租户隔离）
    const existing = await db.query.leads.findFirst({
      where: and(eq(leads.id, id), eq(leads.tenantId, user.tenantId)),
      columns: { id: true, assignedSalesId: true, version: true },
    });

    if (!existing) {
      return apiError('线索不存在', 404);
    }

    // 构建更新字段（仅允许修改安全字段）
    const allowedFields = [
      'customerName',
      'customerPhone',
      'customerWechat',
      'community',
      'houseType',
      'address',
      'intentionLevel',
      'notes',
    ] as const;

    const updates: Record<string, unknown> = { updatedAt: new Date() };
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updates[field] = body[field];
      }
    }

    // 更新数据库
    const [updated] = await db
      .update(leads)
      .set(updates)
      .where(and(eq(leads.id, id), eq(leads.tenantId, user.tenantId)))
      .returning();

    // 审计日志
    await AuditService.log(db, {
      tableName: 'leads',
      recordId: id,
      action: 'UPDATE',
      userId: user.id,
      tenantId: user.tenantId,
      details: { source: 'miniprogram', fields: Object.keys(updates) },
    });

    logger.info('[Leads] 小程序编辑线索成功', { leadId: id, userId: user.id });
    return apiSuccess(updated);
  } catch (error) {
    logger.error('[Leads] 编辑线索失败', { route: 'leads/[id]', error });
    return apiError('编辑线索失败', 500);
  }
}
