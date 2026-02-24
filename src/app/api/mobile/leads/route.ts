/**
 * 销售端 - 客户列表查询
 *
 * @route GET /api/mobile/leads
 * @auth JWT Token (销售角色)
 * @query {string} [type='mine'] - 查询类型：mine (我的客户) | pool (公海客户)
 * @query {number} [page=1] - 页码
 * @query {number} [pageSize=20] - 每页条数
 * @query {string} [keyword] - 搜索关键词（客户姓名/手机号）
 * @returns {PaginatedResponse<LeadItem>} 分页客户信息
 */

import { NextRequest } from 'next/server';
import { apiError, apiPaginated, apiSuccess } from '@/shared/lib/api-response';
import { authenticateMobile, requireSales } from '@/shared/middleware/mobile-auth';
import { LeadStatusMap, getStatusText } from '@/shared/lib/status-maps';
import { maskPhone } from '@/shared/lib/utils';
import { LeadService } from '@/services/lead.service';
import { createLeadSchema } from '@/features/leads/schemas';
import { AuditService } from '@/shared/services/audit-service';
import { db } from '@/shared/api/db';
import { createLogger } from '@/shared/lib/logger';


const log = createLogger('mobile/leads');
export async function GET(request: NextRequest) {
    // 1. 认证
    const authResult = await authenticateMobile(request);
    if (!authResult.success) {
        return authResult.response;
    }
    const { session } = authResult;

    // 2. 权限检查
    const roleCheck = requireSales(session);
    if (!roleCheck.allowed) {
        return roleCheck.response;
    }

    // 3. 解析查询参数
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'mine';  // mine | pool
    if (type !== 'mine' && type !== 'pool') {
        return apiError('无效的查询类型', 400);
    }
    const page = Math.max(parseInt(searchParams.get('page') || '1') || 1, 1);
    const pageSize = Math.min(Math.max(parseInt(searchParams.get('pageSize') || '20') || 20, 1), 100);
    const keyword = searchParams.get('keyword');

    try {
        // 4. 调用 Service 查询
        const { items: leadList, total } = await LeadService.getMobileLeads(
            session.tenantId,
            session.userId,
            type as 'mine' | 'pool',
            page,
            pageSize,
            keyword
        );

        // 5. 格式化响应
        const items = leadList.map(lead => ({
            id: lead.id,
            leadNo: lead.leadNo,
            name: lead.customerName,
            phone: maskPhone(lead.customerPhone || ''),
            address: lead.address,
            status: lead.status,
            statusText: getStatusText(LeadStatusMap, lead.status),
            intentionLevel: lead.intentionLevel,
            lastActivityAt: lead.lastActivityAt?.toISOString(),
            nextFollowupAt: lead.nextFollowupAt?.toISOString(),
            decorationProgress: lead.decorationProgress,
            createdAt: lead.createdAt?.toISOString(),
        }));

        return apiPaginated(items, page, pageSize, total);

    } catch (error) {
        log.error('客户列表查询错误', {}, error);
        return apiError('查询客户列表失败', 500);
    }
}



/**
 * 销售端 - 创建线索
 *
 * @route POST /api/mobile/leads
 * @auth JWT Token (销售角色)
 * @body {CreateLeadInput} body - 线索详细信息，符合 createLeadSchema
 * @returns {ApiResponse<Lead>} 创建成功的线索详情
 * @throws {409} 手机号或地址重复时返回冲突 ID
 */
export async function POST(request: NextRequest) {
    // 1. 认证
    const authResult = await authenticateMobile(request);
    if (!authResult.success) {
        return authResult.response;
    }
    const { session } = authResult;

    // 2. 权限检查
    const roleCheck = requireSales(session);
    if (!roleCheck.allowed) {
        return roleCheck.response;
    }

    try {
        const json = await request.json() as Record<string, unknown>;

        // 3. 验证数据
        const parseResult = createLeadSchema.safeParse(json);
        if (!parseResult.success) {
            log.error('[API] Validation failed', { detail: JSON.stringify(parseResult.error, null, 2) });
            return apiError(parseResult.error.issues[0].message, 400);
        }
        const data = parseResult.data;

        // 4. 调用 Service 创建线索
        const result = await LeadService.createLead({
            ...data,
            estimatedAmount: data.estimatedAmount ? String(data.estimatedAmount) : null,
            notes: data.remark ?? null,
        }, session.tenantId, session.userId);

        if (result.isDuplicate) {
            return apiError(`重复线索: ${result.duplicateReason === 'PHONE' ? '手机号重复' : '地址重复'}`, 409, {
                conflictId: result.lead.id
            });
        }

        // 5. 记录审计日志（排除 PII 敏感字段）
        await AuditService.log(db, {
            tableName: 'leads',
            recordId: result.lead.id,
            action: 'CREATE_MOBILE',
            userId: session.userId,
            tenantId: session.tenantId,
            newValues: { leadNo: result.lead.leadNo, status: result.lead.status },
        });

        return apiSuccess(result.lead);

    } catch (error) {
        log.error('创建线索错误', {}, error);
        return apiError('创建线索失败', 500);
    }
}

// maskPhone 已从 @/shared/lib/utils 导入，消除重复定义
