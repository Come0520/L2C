'use server';

import { z } from 'zod';
import { db } from '@/shared/api/db';
import { logger } from '@/shared/lib/logger';
import { approvalFlows, approvalNodes } from '@/shared/api/schema/approval';
import { eq, and } from 'drizzle-orm';
import { createSafeAction } from '@/shared/lib/server-action';
import { flattenApprovalGraph } from '../lib/graph-utils';
import { revalidatePath } from 'next/cache';
import type { ApprovalNode, ApprovalEdge } from '../schema';
import { createFlowSchema, saveFlowDefinitionSchema, publishFlowSchema } from '../schema';

const createApprovalFlowActionInternal = createSafeAction(
    createFlowSchema,
    async ({ name, code, description }, { session }) => {
        const { tenantId } = session.user;
        if (!tenantId) throw new Error('Unauthorized');

        const existing = await db.query.approvalFlows.findFirst({
            where: and(eq(approvalFlows.code, code), eq(approvalFlows.tenantId, tenantId))
        });

        if (existing) {
            return existing;
        }

        const [flow] = await db.insert(approvalFlows).values({
            tenantId,
            name,
            code,
            description,
            definition: { nodes: [], edges: [] },
            isActive: false,
        }).returning();

        revalidatePath('/settings/approvals');
        return flow;
    }
);

/**
 * 创建新的审批流程定义（仅基础信息）
 * @param params - 流程名称、编码、描述
 * @returns 流程对象
 */
export async function createApprovalFlow(params: z.infer<typeof createFlowSchema>) {
    return createApprovalFlowActionInternal(params);
}

const saveFlowDefinitionActionInternal = createSafeAction(
    saveFlowDefinitionSchema,
    async ({ flowId, definition }, { session }) => {
        const { tenantId } = session.user;
        if (!tenantId) throw new Error('Unauthorized');

        const [updated] = await db.update(approvalFlows)
            .set({ definition, updatedAt: new Date() })
            .where(and(eq(approvalFlows.id, flowId), eq(approvalFlows.tenantId, tenantId)))
            .returning({ id: approvalFlows.id });

        if (!updated) {
            throw new Error('未找到审批流或无权修改');
        }
        return { success: true };
    }
);

/**
 * 保存流程图定义（画板上的节点和连线）
 * @param params - 流程 ID 及图义 JSON
 * @returns 成功标识
 */
export async function saveFlowDefinition(params: z.infer<typeof saveFlowDefinitionSchema>) {
    return saveFlowDefinitionActionInternal(params);
}

const publishApprovalFlowActionInternal = createSafeAction(
    publishFlowSchema,
    async ({ flowId }, { session }) => {
        const { tenantId } = session.user;
        if (!tenantId) throw new Error('Unauthorized');

        const flow = await db.query.approvalFlows.findFirst({
            where: and(eq(approvalFlows.id, flowId), eq(approvalFlows.tenantId, tenantId))
        });

        if (!flow || !flow.definition) {
            throw new Error('Flow definition not found');
        }

        // 类型安全：将数据库中的 definition 转换为正确的类型
        const definition = flow.definition as { nodes: ApprovalNode[], edges: ApprovalEdge[] };

        // P2-2: 发布前校验节点数
        const nodes = definition.nodes || [];
        if (!nodes || nodes.length < 2) { // 至少需要 Start 和 End
            return { success: false, error: "审批流必须包含至少一个有效环节" };
        }

        const flatNodes = flattenApprovalGraph(definition.nodes, definition.edges);

        await db.transaction(async (tx) => {
            // 物理删除旧节点（发布即覆盖）
            await tx.delete(approvalNodes)
                .where(and(eq(approvalNodes.flowId, flowId), eq(approvalNodes.tenantId, tenantId)));

            if (flatNodes.length > 0) {
                const approverRoles = ['STORE_MANAGER', 'ADMIN', 'FINANCE', 'PURCHASING', 'DISPATCHER'] as const;

                await tx.insert(approvalNodes).values(
                    flatNodes.map(node => {
                        // 校验并匹配角色枚举
                        const matchedRole = approverRoles.find(r => r === node.approverValue);

                        return {
                            tenantId,
                            flowId,
                            name: node.name,
                            approverRole: node.approverType === 'ROLE' ? (matchedRole || null) : null,
                            approverUserId: node.approverType === 'USER' ? node.approverValue : null,
                            conditions: node.conditions,
                            sortOrder: node.sortOrder,
                            nodeType: 'APPROVAL',
                            approverMode: node.approverMode || 'ANY',
                            timeoutAction: 'REMIND' as const
                        };
                    })
                );
            }

            await tx.update(approvalFlows)
                .set({ isActive: true, updatedAt: new Date() })
                .where(eq(approvalFlows.id, flowId));
        });

        logger.info(`[Approval-Flow] Published flow ${flowId} with ${flatNodes.length} active nodes.`);

        revalidatePath('/settings/approval');
        return { success: true };
    }
);

/**
 * 发布审批流程
 *
 * 将图形定义（DAG）扁平化为线性节点序列存入数据库，并激活流程。
 *
 * @param params - 流程 ID
 * @returns 发布结果
 */
export async function publishApprovalFlow(params: z.infer<typeof publishFlowSchema>) {
    return publishApprovalFlowActionInternal(params);
}
