'use server';

import { db } from '@/shared/api/db';
import { leads, leadStatusHistory } from '@/shared/api/schema';
import { eq, and, desc } from 'drizzle-orm';
import { z } from 'zod';
import { restoreLeadSchema } from '../schemas';
import { revalidatePath, revalidateTag } from 'next/cache';
import { auth, checkPermission } from '@/shared/lib/auth';
import { PERMISSIONS } from '@/shared/config/permissions';

// 线索状态类型（与 schema 中的 leadStatusEnum 保持一致）
type LeadStatus = 'PENDING_ASSIGNMENT' | 'PENDING_FOLLOWUP' | 'FOLLOWING_UP' | 'WON' | 'INVALID';

/**
 * 恢复已作废的线索
 * 
 * 业务规则：
 * 1. 仅 INVALID 状态的线索可恢复
 * 2. 恢复到作废前的状态
 * 3. 记录恢复操作到状态历史
 * 
 * 权限要求：LEAD.MANAGE 权限
 */
export async function restoreLeadAction(
    input: z.infer<typeof restoreLeadSchema>
): Promise<{ success: boolean; error?: string; targetStatus?: string }> {
    // 认证和权限检查
    const session = await auth();
    if (!session?.user?.tenantId || !session?.user?.id) {
        return { success: false, error: 'Unauthorized: 未登录或缺少租户信息' };
    }
    await checkPermission(session, PERMISSIONS.LEAD.MANAGE);

    const tenantId = session.user.tenantId;
    const userId = session.user.id;
    console.log('Restoring lead with input:', input);
    const { id, reason } = restoreLeadSchema.parse(input);

    try {
        // 1. 获取线索（使用 session 中的 tenantId 保证租户隔离）
        const lead = await db.query.leads.findFirst({
            where: and(
                eq(leads.id, id),
                eq(leads.tenantId, tenantId)
            )
        });

        if (!lead) {
            return { success: false, error: '线索不存在' };
        }

        if (lead.status !== 'INVALID') {
            return { success: false, error: '仅可恢复已作废的线索' };
        }

        // 2. 检查是否有审批流程
        const { submitApproval } = await import('@/features/approval/actions/submission');
        const { approvalFlows } = await import('@/shared/api/schema');
        const flow = await db.query.approvalFlows.findFirst({
            where: and(
                eq(approvalFlows.tenantId, tenantId),
                eq(approvalFlows.code, 'LEAD_RESTORE'),
                eq(approvalFlows.isActive, true)
            )
        });

        if (flow) {
            // 走审批流程
            try {
                const result = await submitApproval({
                    tenantId,
                    requesterId: userId,
                    flowCode: 'LEAD_RESTORE',
                    entityType: 'LEAD_RESTORE',
                    entityId: id,
                    comment: reason
                });

                if (result.success) {
                    return { success: true, error: undefined, targetStatus: '审批中' };
                } else {
                    return { success: false, error: 'error' in result && typeof result.error === 'string' ? result.error : '审批提交失败' };
                }
            } catch (e: unknown) {
                const message = e instanceof Error ? e.message : '审批提交失败';
                return { success: false, error: message };
            }
        }

        // 3. 无审批流程，直接恢复
        // 使用事务处理，防止并发修改
        const txResult = await db.transaction(async (tx) => {
            // 锁定线索，防止并发修改
            const [currentLead] = await tx.select().from(leads)
                .where(and(eq(leads.id, id), eq(leads.tenantId, tenantId)))
                .for('update');

            if (!currentLead) {
                throw new Error('线索不存在');
            }

            if (currentLead.status !== 'INVALID') {
                throw new Error('仅可恢复已作废的线索');
            }

            // 获取作废前的状态
            const lastHistory = await tx.query.leadStatusHistory.findFirst({
                where: and(
                    eq(leadStatusHistory.leadId, id),
                    eq(leadStatusHistory.newStatus, 'INVALID')
                ),
                orderBy: desc(leadStatusHistory.changedAt)
            });

            // 默认恢复到待分配状态
            const targetStatus = lastHistory?.oldStatus || 'PENDING_ASSIGNMENT';

            // 更新线索状态
            await tx.update(leads)
                .set({
                    status: targetStatus as LeadStatus,
                    lostReason: null,
                    updatedAt: new Date()
                })
                .where(eq(leads.id, id));

            // 记录恢复操作
            await tx.insert(leadStatusHistory).values({
                tenantId,
                leadId: id,
                oldStatus: 'INVALID',
                newStatus: targetStatus,
                changedBy: userId,
                reason: reason || '恢复作废线索'
            });

            return { targetStatus };
        });

        // 清除缓存
        revalidatePath('/leads');
        revalidatePath(`/leads/${id}`);
        revalidateTag(`leads-${tenantId}`, 'default');
        revalidateTag(`lead-${tenantId}-${id}`, 'default');

        return { success: true, targetStatus: txResult.targetStatus };

    } catch (error: unknown) {
        console.error('Restore lead error:', error);
        const message = error instanceof Error ? error.message : '恢复失败';
        return { success: false, error: message };
    }
}

/**
 * 检查线索是否可恢复
 */
export async function canRestoreLead(
    leadId: string
): Promise<{ canRestore: boolean; reason?: string }> {
    // 认证检查
    const session = await auth();
    if (!session?.user?.tenantId) {
        return { canRestore: false, reason: '未登录或缺少租户信息' };
    }
    const tenantId = session.user.tenantId;

    const lead = await db.query.leads.findFirst({
        where: and(
            eq(leads.id, leadId),
            eq(leads.tenantId, tenantId)
        ),
        columns: { status: true }
    });

    if (!lead) {
        return { canRestore: false, reason: '线索不存在' };
    }

    if (lead.status !== 'INVALID') {
        return { canRestore: false, reason: '仅可恢复已作废的线索' };
    }

    return { canRestore: true };
}
