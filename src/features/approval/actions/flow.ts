'use server';

import { z } from 'zod';
import { db } from '@/shared/api/db';
import { approvalFlows, approvalNodes } from '@/shared/api/schema/approval';
import { eq, and } from 'drizzle-orm';
import { createSafeAction } from '@/shared/lib/server-action';
import { flattenApprovalGraph } from '../lib/graph-utils';
import { revalidatePath } from 'next/cache';
import type { ApprovalNode, ApprovalEdge } from '../schema';

const flowNodeSchema = z.object({
    id: z.string(),
    type: z.string(),
    data: z.record(z.string(), z.unknown()),
    position: z.object({ x: z.number(), y: z.number() }),
});

const flowEdgeSchema = z.object({
    id: z.string(),
    source: z.string(),
    target: z.string(),
    type: z.string().optional(),
});

const saveFlowDefinitionSchema = z.object({
    flowId: z.string(),
    definition: z.object({
        nodes: z.array(flowNodeSchema),
        edges: z.array(flowEdgeSchema),
    }),
});

const createFlowSchema = z.object({
    name: z.string().min(1),
    code: z.string().min(1),
    description: z.string().optional(),
});

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

export async function createApprovalFlow(params: z.infer<typeof createFlowSchema>) {
    return createApprovalFlowActionInternal(params);
}

const saveFlowDefinitionActionInternal = createSafeAction(
    saveFlowDefinitionSchema,
    async ({ flowId, definition }, { session }) => {
        const { tenantId } = session.user;
        if (!tenantId) throw new Error('Unauthorized');

        await db.update(approvalFlows)
            .set({ definition, updatedAt: new Date() })
            .where(eq(approvalFlows.id, flowId));

        return { success: true };
    }
);

export async function saveFlowDefinition(params: z.infer<typeof saveFlowDefinitionSchema>) {
    return saveFlowDefinitionActionInternal(params);
}

const publishFlowSchema = z.object({
    flowId: z.string(),
});

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

        const flatNodes = flattenApprovalGraph(definition.nodes, definition.edges);

        await db.transaction(async (tx) => {
            await tx.delete(approvalNodes)
                .where(eq(approvalNodes.flowId, flowId));

            if (flatNodes.length > 0) {
                await tx.insert(approvalNodes).values(
                    flatNodes.map(node => ({
                        tenantId,
                        flowId,
                        name: node.name,
                        // 类型安全：使用 approverRoleEnum 定义的值
                        approverRole: node.approverType === 'ROLE' ? node.approverValue as 'ADMIN' | 'STORE_MANAGER' | 'FINANCE' | 'PURCHASING' | 'DISPATCHER' : undefined,
                        approverUserId: node.approverType === 'USER' ? node.approverValue : undefined,
                        conditions: node.conditions,
                        sortOrder: node.sortOrder,
                        nodeType: 'APPROVAL',
                        approverMode: node.approverMode || 'ANY',
                        timeoutAction: 'REMIND' as const
                    }))
                );
            }

            await tx.update(approvalFlows)
                .set({ isActive: true, updatedAt: new Date() })
                .where(eq(approvalFlows.id, flowId));
        });

        revalidatePath('/settings/approval');
        return { success: true };
    }
);

export async function publishApprovalFlow(params: z.infer<typeof publishFlowSchema>) {
    return publishApprovalFlowActionInternal(params);
}
