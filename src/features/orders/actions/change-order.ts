'use server';

import { z } from 'zod';
import { auth, checkPermission } from '@/shared/lib/auth';
import type { Session } from 'next-auth';
import { PERMISSIONS } from '@/shared/config/permissions';
import { ChangeOrderService } from '@/services/change-order.service';
import { submitApproval } from '@/features/approval/actions/submission';
import Decimal from 'decimal.js';
import { logger } from '@/shared/lib/logger';

export const createChangeRequestSchema = z.object({
    orderId: z.string().uuid(),
    type: z.enum(['FIELD_CHANGE', 'CUSTOMER_CHANGE', 'STOCK_OUT', 'OTHER']),
    reason: z.string().min(1, 'Reason is required'),
    diffAmount: z.string().optional(),
});

/**
 * 辅助函数：安全获取用户的 tenantId
 */
function getTenantId(session: Session | null): string {
    const tenantId = session?.user?.tenantId;
    if (!tenantId) {
        throw new Error('Unauthorized: 缺少租户信息');
    }
    return tenantId;
}

/**
 * 创建订单变更请求 Action。
 * 
 * @description 针对已存在的订单发起修改申请。支持修改基础字段、客户信息或进行拆单出库。
 * 包含逻辑：
 * 1. 校验编辑权限。
 * 2. 调用 ChangeOrderService 创建数据库变更记录。
 * 3. 触发审批流 (`ORDER_CHANGE`)。
 * 
 * @param input 包含订单 ID、变更类型、原因及差额。
 * @returns 操作成功标识。
 */
export async function createChangeRequestAction(input: z.infer<typeof createChangeRequestSchema>) {
    const session = await auth();
    if (!session?.user) throw new Error('Unauthorized');

    const tenantId = getTenantId(session);

    // 权限检查：需要订单编辑权限
    await checkPermission(session, PERMISSIONS.ORDER.OWN_EDIT);

    try {
        const result = await ChangeOrderService.createRequest(input.orderId, tenantId, {
            type: input.type,
            reason: input.reason,
            diffAmount: input.diffAmount ? new Decimal(input.diffAmount).toNumber() : 0,
            requestedBy: session.user.id,
        });

        // 提交审批
        await submitApproval({
            tenantId,
            requesterId: session.user.id,
            flowCode: 'ORDER_CHANGE',
            entityType: 'ORDER_CHANGE',
            entityId: result.id,
            amount: result.diffAmount ? new Decimal(result.diffAmount).abs().toNumber() : 0,
            comment: input.reason,
        });

        console.log('[orders] 订单变更请求创建成功:', { orderId: input.orderId, tenantId, type: input.type, requestId: result.id });

        return { success: true };
    } catch (e: unknown) {
        logger.error('Create Change Request Error:', e);
        const error = e as Error;
        console.log('[orders] 订单变更请求创建失败:', { orderId: input.orderId, error: error.message });
        const message = e instanceof Error ? e.message : '创建变更请求失败';
        return { success: false, error: message };
    }
}

/**
 * 审批通过变更请求 Action。
 * 
 * @description 正式应用订单变更。调用此 Action 会将 `orderChanges` 的内容生效到 `orders` 主表。
 * @param requestId 变更请求记录的 ID。
 * @returns 操作结果。
 */
export async function approveChangeRequestAction(requestId: string) {
    const session = await auth();
    if (!session?.user) throw new Error('Unauthorized');

    const tenantId = getTenantId(session);

    // 权限检查：需要审批权限
    await checkPermission(session, PERMISSIONS.FINANCE.APPROVE);

    try {
        await ChangeOrderService.approveRequest(requestId, tenantId, session.user.id);

        console.log('[orders] 订单变更请求已审批通过:', { requestId, tenantId });

        return { success: true };
    } catch (e: unknown) {
        const error = e as Error;
        console.log('[orders] 订单变更审批失败:', { requestId, error: error.message });
        const message = e instanceof Error ? e.message : '审批失败';
        return { success: false, error: message };
    }
}

/**
 * 拒绝变更请求
 * 已修复：添加权限检查和类型安全
 */
export async function rejectChangeRequestAction(requestId: string, reason?: string) {
    const session = await auth();
    if (!session?.user) throw new Error('Unauthorized');

    const tenantId = getTenantId(session);

    // 权限检查：需要审批权限
    await checkPermission(session, PERMISSIONS.FINANCE.APPROVE);

    try {
        await ChangeOrderService.rejectRequest(requestId, tenantId, session.user.id, reason);

        console.log('[orders] 订单变更请求已拒绝:', { requestId, tenantId, reason });

        return { success: true };
    } catch (e: unknown) {
        const error = e as Error;
        console.log('[orders] 订单变更拒绝动作失败:', { requestId, error: error.message });
        const message = e instanceof Error ? e.message : '拒绝失败';
        return { success: false, error: message };
    }
}
