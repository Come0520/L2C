'use server';

import { db } from '@/shared/api/db';
import { approvalFlows } from '@/shared/api/schema/approval';
import { createSafeAction } from '@/shared/lib/server-action';

import { eq, and } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { publishApprovalFlow } from './flow';
import { initializeTemplatesSchema } from '../schema';

const initializeDefaultTemplatesActionInternal = createSafeAction(
    initializeTemplatesSchema,
    async (_, { session }) => {
        const { tenantId } = session.user;
        if (!tenantId) throw new Error('Unauthorized');

        const templates = [
            {
                code: 'QUOTE_DISCOUNT',
                name: '大额报价审批',
                description: '当报价金额超过 50,000 元时触发审批',
                definition: {
                    nodes: [
                        { id: 'start', type: 'start', data: { label: '开始' }, position: { x: 250, y: 50 } },
                        {
                            id: 'approver-1',
                            type: 'approver',
                            data: { label: '店长审批', approverType: 'ROLE', approverValue: 'STORE_MANAGER', approverMode: 'ANY' },
                            position: { x: 250, y: 200 }
                        },
                        { id: 'end', type: 'end', data: { label: '结束' }, position: { x: 250, y: 350 } }
                    ],
                    edges: [
                        { id: 'e1', source: 'start', target: 'approver-1', type: 'default' },
                        { id: 'e2', source: 'approver-1', target: 'end', type: 'default' }
                    ]
                }
            },
            {
                code: 'ORDER_CHANGE',
                name: '订单变更审批',
                description: '订单关键信息变更时触发审批',
                definition: {
                    nodes: [
                        { id: 'start', type: 'start', data: { label: '开始' }, position: { x: 250, y: 50 } },
                        {
                            id: 'approver-1',
                            type: 'approver',
                            data: { label: '财务审核', approverType: 'ROLE', approverValue: 'FINANCE', approverMode: 'ANY' },
                            position: { x: 250, y: 200 }
                        },
                        { id: 'end', type: 'end', data: { label: '结束' }, position: { x: 250, y: 350 } }
                    ],
                    edges: [
                        { id: 'e1', source: 'start', target: 'approver-1', type: 'default' },
                        { id: 'e2', source: 'approver-1', target: 'end', type: 'default' }
                    ]
                }
            },
            {
                code: 'BAD_DEBT',
                name: '坏账核销审批',
                description: '坏账申请需经过多级审批',
                definition: {
                    nodes: [
                        { id: 'start', type: 'start', data: { label: '开始' }, position: { x: 250, y: 50 } },
                        {
                            id: 'approver-1',
                            type: 'approver',
                            data: { label: '财务初审', approverType: 'ROLE', approverValue: 'FINANCE', approverMode: 'ANY' },
                            position: { x: 250, y: 200 }
                        },
                        {
                            id: 'approver-2',
                            type: 'approver',
                            data: { label: '老板终审', approverType: 'ROLE', approverValue: 'ADMIN', approverMode: 'ALL' },
                            position: { x: 250, y: 350 }
                        },
                        { id: 'end', type: 'end', data: { label: '结束' }, position: { x: 250, y: 500 } }
                    ],
                    edges: [
                        { id: 'e1', source: 'start', target: 'approver-1', type: 'default' },
                        { id: 'e2', source: 'approver-1', target: 'approver-2', type: 'default' },
                        { id: 'e3', source: 'approver-2', target: 'end', type: 'default' }
                    ]
                }
            }
        ];

        let createdCount = 0;

        await db.transaction(async (tx) => {
            for (const tmpl of templates) {
                const existing = await tx.query.approvalFlows.findFirst({
                    where: and(
                        eq(approvalFlows.code, tmpl.code),
                        eq(approvalFlows.tenantId, tenantId)
                    )
                });

                if (!existing) {
                    const [newFlow] = await tx.insert(approvalFlows).values({
                        tenantId,
                        code: tmpl.code,
                        name: tmpl.name,
                        description: tmpl.description,
                        definition: tmpl.definition,
                        isActive: true
                    }).returning();

                    await publishApprovalFlow({ flowId: newFlow.id });
                    createdCount++;
                }
            }
        });

        revalidatePath('/settings/approvals');
        return { success: true, message: `已初始化 ${createdCount} 个模板` };
    }
);

/**
 * 初始化系统内置审批流程模板
 * @returns 成功信息
 */
export async function initializeDefaultTemplates() {
    return initializeDefaultTemplatesActionInternal({});
}
