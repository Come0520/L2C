'use server';

import { db } from '@/shared/api/db';
import { measureTasks, measureSheets } from '@/shared/api/schema/service';
import { leads } from '@/shared/api/schema/leads';
import { customers } from '@/shared/api/schema/customers';
import { eq, and } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { ActionState, createSafeAction } from '@/shared/lib/server-action';
import { z } from 'zod';
import { auth } from '@/shared/lib/auth';
import { submitApproval } from '@/features/approval/actions/submission';
import { format } from 'date-fns';
import { randomBytes } from 'crypto';

import { AuditService } from '@/shared/lib/audit-service';

// 🔒 安全修复：移除客户端可控的 tenantId，从 Session 获取
const CreateMeasureTaskSchema = z.object({
    leadId: z.string().uuid().optional(),
    customerId: z.string().uuid(),
    // tenantId: 已移除，从 Session 获取
    type: z.enum(['QUOTE_BASED', 'BLIND', 'SALES_SELF']).default('BLIND'),
    scheduledAt: z.string().datetime().or(z.date()),
    remark: z.string().optional(),
    requiresFee: z.boolean().optional(), // 兼容前端现有字段
    isFeeExempt: z.boolean().optional(), // 新增字段，支持显式申请免费
});

type CreateMeasureTaskInput = z.infer<typeof CreateMeasureTaskSchema>;

const createMeasureTaskActionInternal = createSafeAction(
    CreateMeasureTaskSchema,
    async (input: CreateMeasureTaskInput): Promise<ActionState<{ taskId: string; sheetId: string }>> => {
        // 🔒 安全校验：从 Session 获取租户和用户 ID
        const session = await auth();
        if (!session?.user?.tenantId || !session?.user?.id) {
            return { success: false, error: '未授权访问' };
        }
        const tenantId = session.user.tenantId;

        const { leadId, customerId, type, remark, requiresFee, scheduledAt } = input;

        return await db.transaction(async (tx) => {
            // 🔒 安全校验：验证客户归属当前租户
            const customer = await tx.query.customers.findFirst({
                where: and(
                    eq(customers.id, customerId),
                    eq(customers.tenantId, tenantId) // 强制租户校验
                )
            });

            if (!customer) {
                throw new Error('客户不存在或无权访问');
            }

            // 计算是否申请免费 (isFeeExempt)
            let isFeeExempt = input.isFeeExempt;
            if (isFeeExempt === undefined) {
                // 如果未显式传入 isFeeExempt，则根据 requiresFee 推断
                // requiresFee=true => isFeeExempt=false
                // requiresFee=false/undefined => 默认 false (除非是 VIP)
                if (requiresFee === true) {
                    isFeeExempt = false;
                } else {
                    isFeeExempt = false;
                }
            }

            // 规则：VIP 客户 (等级 A) 总是免费
            if (customer.level === 'A') {
                isFeeExempt = true;
            }

            // 1. 费用准入校验
            const { checkMeasureFeeAdmission } = await import('../logic/fee-admission');
            // 注意：checkMeasureFeeAdmission 的第三个参数是我们计算出的“是否申请免费”
            const admission = await checkMeasureFeeAdmission(leadId || customer.sourceLeadId || '', tenantId, isFeeExempt || false);

            // 生成测量单号: MS + YYYYMMDD + 6位随机十六进制
            const prefix = `MS${format(new Date(), 'yyyyMMdd')}`;
            const random = randomBytes(3).toString('hex').toUpperCase();
            const measureNo = `${prefix}${random}`;

            const targetLeadId = leadId || customer.sourceLeadId;

            // 🔒 安全校验：如果指定了 leadId，验证其归属
            if (targetLeadId) {
                const lead = await tx.query.leads.findFirst({
                    where: and(
                        eq(leads.id, targetLeadId),
                        eq(leads.tenantId, tenantId)
                    ),
                    columns: { id: true }
                });
                if (!lead) {
                    return { success: false, error: '线索不存在或无权访问' };
                }
                if (customer.sourceLeadId !== targetLeadId) {
                    throw new Error('关联线索不匹配');
                }
            } else {
                return { success: false, error: '未找到关联线索，无法创建测量任务' };
            }

            // 判断是否需要审批: 申请免费且非销售自测需要审批
            // checkMeasureFeeAdmission 返回的 exemptApproved 为 false 表示需要审批
            // 但我们需要结合 admission 的结果和业务规则
            // admission.requiresFee=true 且 admission.exemptApproved=false (当 isFeeExempt=true 时) => 需要审批

            const needsApproval = (isFeeExempt && !admission.exemptApproved) && type !== 'SALES_SELF';
            const status = needsApproval ? 'PENDING_APPROVAL' : 'PENDING';

            // 构造备注信息
            const admissionMsg = admission.message ? `[费用准入] ${admission.message}` : '';
            const finalRemark = remark ? `${remark}\n\n${admissionMsg}` : admissionMsg;

            const [newTask] = await tx.insert(measureTasks).values({
                tenantId,
                measureNo,
                leadId: targetLeadId,
                customerId,
                scheduledAt: new Date(scheduledAt),
                status,
                type: type as 'QUOTE_BASED' | 'BLIND' | 'SALES_SELF',
                remark: finalRemark,
                round: 1,
                isFeeExempt: isFeeExempt || false,
                feeCheckStatus: needsApproval ? 'PENDING' : 'NONE', // 如果需要审批，费用检查状态为 PENDING
            }).returning();

            const [newSheet] = await tx.insert(measureSheets).values({
                tenantId,
                taskId: newTask.id,
                status: 'DRAFT',
                round: 1,
                variant: 'Initial',
            }).returning();

            if (needsApproval) {
                // 提交审批流
                const approvalResult = await submitApproval({
                    entityType: 'MEASURE_TASK',
                    entityId: newTask.id,
                    flowCode: 'FREE_MEASURE_APPROVAL',
                    comment: `申请免费测量: ${measureNo}`,
                }, tx);


                if (!approvalResult.success) {
                    const errorMessage = 'error' in approvalResult ? approvalResult.error : 'Approval submission failed';
                    // 事务会回滚
                    throw new Error(`提交审批失败: ${errorMessage}`);
                }

                if ('approvalId' in approvalResult) {
                    await tx.update(measureTasks)
                        .set({ feeApprovalId: approvalResult.approvalId })
                        .where(eq(measureTasks.id, newTask.id));
                }
            }

            // 更新线索和客户状态
            await tx.update(leads)
                .set({ status: 'PENDING_ASSIGNMENT' })
                .where(eq(leads.id, targetLeadId));

            await tx.update(customers)
                .set({ pipelineStatus: 'PENDING_MEASUREMENT' })
                .where(eq(customers.id, customerId));

            revalidatePath('/service/measurement');
            revalidatePath('/service/measurement');

            // 审计日志: 任务创建
            await AuditService.record(
                {
                    tenantId: tenantId,
                    userId: session.user.id,
                    tableName: 'measure_tasks',
                    recordId: newTask.id,
                    action: 'CREATE',
                    newValues: {
                        leadId: targetLeadId,
                        customerId: customerId,
                        measureNo: measureNo,
                        status: status,
                        type: type,
                        isFeeExempt: isFeeExempt,
                    }
                }
            );

            return {
                taskId: newTask.id,
                sheetId: newSheet.id,
                status: newTask.status
            };
        });
    }
);

export async function createMeasureTask(params: CreateMeasureTaskInput) {
    return createMeasureTaskActionInternal(params);
}
