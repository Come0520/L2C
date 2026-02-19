/**
 * 销售端 - 客户列表 API
 * GET /api/mobile/leads
 * 
 * 支持查询：我的客户 / 公海客户
 */

import { NextRequest } from 'next/server';
import { apiError, apiPaginated, apiSuccess } from '@/shared/lib/api-response';
import { authenticateMobile, requireSales } from '@/shared/middleware/mobile-auth';
import { LeadStatusMap, getStatusText } from '@/shared/lib/status-maps';
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
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '20');
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
            phone: maskPhone(lead.customerPhone),
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
 * 创建线索接口
 * 
 * @description 移动端创建新线索。集成 AuditService 业务审计。
 * 必须具有 SALES 权限。
 * 
 * @param {NextRequest} request - JSON body 包含线索详细信息
 * @returns {Promise<NextResponse>} 返回新创建的线索 ID
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

        // 5. 记录审计日志
        await AuditService.log(db, {
            tableName: 'leads',
            recordId: result.lead.id,
            action: 'CREATE_MOBILE',
            userId: session.userId,
            tenantId: session.tenantId,
            newValues: result.lead,
        });

        return apiSuccess(result.lead);

    } catch (error) {
        log.error('创建线索错误', {}, error);
        return apiError('创建线索失败', 500);
    }
}

/**
 * 手机号脱敏
 */
function maskPhone(phone: string | null): string {
    if (!phone || phone.length < 7) return phone || '';
    return phone.slice(0, 3) + '****' + phone.slice(-4);
}
