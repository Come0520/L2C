/**
 * 线索列表 API
 *
 * GET  /api/miniprogram/leads — 分页列表数据
 * POST /api/miniprogram/leads — 创建新线索
 *
 * @description 为小程序线索页提供分页列表数据。
 * 查询 leads 表，支持 salesId=ME（当前销售的线索）和 salesId=UNASSIGNED（公共线索池）。
 *
 * 查询参数:
 * - page: 页码（默认 1）
 * - pageSize: 每页条数（默认 20）
 * - search: 搜索关键字（客户姓名/手机号）
 * - salesId: 'ME' | 'UNASSIGNED' | 具体 UUID
 */
import { NextRequest } from 'next/server';
import {
  apiSuccess,
  apiError,
  apiBadRequest,
  apiServerError,
  apiUnauthorized,
} from '@/shared/lib/api-response';
import { logger } from '@/shared/lib/logger';
import { db } from '@/shared/api/db';
import { leads } from '@/shared/api/schema';
import { eq, and, isNull, like, or, desc, count } from 'drizzle-orm';
import { withMiniprogramAuth } from '../auth-utils';
import { createLeadSchema } from '@/features/leads/schemas';
import { AuditService } from '@/shared/services/audit-service';
import { isDevMockUser, MOCK_LEADS } from '../__mocks__';

export const GET = withMiniprogramAuth(
  async (request: NextRequest, user) => {
    try {
      if (!user || !user.tenantId) {
        return apiUnauthorized('未授权');
      }

      const { searchParams } = new URL(request.url);
      const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
      const pageSize = Math.min(50, Math.max(1, parseInt(searchParams.get('pageSize') || '20')));
      const search = searchParams.get('search');
      const salesId = searchParams.get('salesId');
      const statusFilter = searchParams.get('status');
      const intentionFilter = searchParams.get('intentionLevel');

      // 开发环境 mock 用户：返回虚拟线索数据
      if (isDevMockUser(user.id, user.tenantId)) {
        // 模拟 salesId 筛选
        const filtered =
          salesId === 'UNASSIGNED'
            ? MOCK_LEADS.filter((l) => !l.assignedSales)
            : MOCK_LEADS.filter((l) => !!l.assignedSales);

        return apiSuccess({ data: filtered, total: filtered.length });
      }

      // ────── 真实数据库查询（查 leads 表） ──────
      const conditions = [eq(leads.tenantId, user.tenantId)];

      // salesId 筛选
      if (salesId === 'ME') {
        conditions.push(eq(leads.assignedSalesId, user.id));
      } else if (salesId === 'UNASSIGNED') {
        conditions.push(isNull(leads.assignedSalesId));
      } else if (salesId) {
        conditions.push(eq(leads.assignedSalesId, salesId));
      }

      // 搜索筛选（排除无效值）
      if (search && search !== 'undefined' && search.trim()) {
        conditions.push(
          or(
            like(leads.customerName, `%${search.trim()}%`),
            like(leads.customerPhone, `%${search.trim()}%`)
          )!
        );
      }

      // 状态筛选
      if (statusFilter && statusFilter !== 'ALL') {
        conditions.push(eq(leads.status, statusFilter as any));
      }

      // 意向级别筛选
      if (intentionFilter && intentionFilter !== 'ALL') {
        conditions.push(eq(leads.intentionLevel, intentionFilter as any));
      }

      const whereClause = and(...conditions);

      // 总数
      const totalResult = await db.select({ count: count() }).from(leads).where(whereClause);
      const total = totalResult[0]?.count || 0;

      // 分页数据（含关联的销售、来源渠道信息）
      const offset = (page - 1) * pageSize;
      const rows = await db.query.leads.findMany({
        where: whereClause,
        orderBy: [desc(leads.createdAt)],
        limit: pageSize,
        offset,
        with: {
          assignedSales: { columns: { name: true } },
          sourceChannel: { columns: { name: true } },
          sourceSub: { columns: { name: true } },
        },
      });

      // 映射为前端所需格式（手机号脱敏）
      const data = rows.map((lead) => ({
        id: lead.id,
        leadNo: lead.leadNo,
        customerName: lead.customerName,
        customerPhone: lead.customerPhone
          ? lead.customerPhone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2')
          : '',
        community: lead.community || '',
        houseType: lead.houseType || '',
        intentionLevel: lead.intentionLevel || 'MEDIUM',
        status: lead.status || 'PENDING_FOLLOWUP',
        createdAt: lead.createdAt ? new Date(lead.createdAt).toISOString() : '',
        assignedSales: lead.assignedSales ? { name: lead.assignedSales.name } : null,
        sourceChannel: lead.sourceChannel ? { name: lead.sourceChannel.name } : null,
        sourceSub: lead.sourceSub ? { name: lead.sourceSub.name } : null,
      }));

      return apiSuccess({ data, total });
    } catch (error) {
      logger.error('[Leads] 获取线索列表失败', { route: 'leads', error });
      return apiServerError('获取线索列表失败');
    }
  },
  ['SALES', 'MANAGER', 'ADMIN']
);

export const POST = withMiniprogramAuth(
  async (request: NextRequest, user) => {
    try {
      if (!user || !user.tenantId) {
        return apiUnauthorized('未授权');
      }

      const body = await request.json();

      // 使用 Web 端 Schema 验证
      const parsed = createLeadSchema.safeParse(body);
      if (!parsed.success) {
        return apiBadRequest(parsed.error.issues[0].message);
      }

      const input = parsed.data;

      // 手机号重复检测
      if (input.customerPhone) {
        const existing = await db.query.leads.findFirst({
          where: and(
            eq(leads.tenantId, user.tenantId),
            eq(leads.customerPhone, input.customerPhone)
          ),
          columns: { id: true, customerName: true },
        });
        if (existing) {
          return apiError(`手机号已存在（客户：${existing.customerName}）`, 409);
        }
      }

      // 生成线索编号
      const now = new Date();
      const datePrefix = `L${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
      const todayCount = await db
        .select({ count: count() })
        .from(leads)
        .where(and(eq(leads.tenantId, user.tenantId)));
      const leadNo = `${datePrefix}${String((todayCount[0]?.count || 0) + 1).padStart(4, '0')}`;

      // 插入数据库
      const [newLead] = await db
        .insert(leads)
        .values({
          tenantId: user.tenantId,
          leadNo,
          customerName: input.customerName,
          customerPhone: input.customerPhone,
          customerWechat: input.customerWechat || null,
          community: input.community || null,
          houseType: input.houseType || null,
          address: input.address || null,
          sourceDetail: input.sourceDetail || input.remark || null,
          intentionLevel: input.intentionLevel || null,
          notes: input.remark || null,
          status: 'PENDING_FOLLOWUP',
          assignedSalesId: user.id, // 小程序创建的线索自动分配给当前销售
          createdBy: user.id,
        })
        .returning();

      // 审计日志
      await AuditService.log(db, {
        tableName: 'leads',
        recordId: newLead.id,
        action: 'CREATE',
        userId: user.id,
        tenantId: user.tenantId,
        details: { source: 'miniprogram', leadNo },
      });

      logger.info('[Leads] 小程序创建线索成功', {
        route: 'leads',
        leadId: newLead.id,
        leadNo,
        userId: user.id,
        tenantId: user.tenantId,
      });

      return apiSuccess(newLead);
    } catch (error) {
      logger.error('[Leads] 创建线索失败', { route: 'leads', error });
      return apiServerError('创建线索失败');
    }
  },
  ['SALES', 'MANAGER', 'ADMIN']
);
