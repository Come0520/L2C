'use server';

import { z } from 'zod';
import { db } from '@/shared/api/db';
import { approvalFlows, approvalNodes } from '@/shared/api/schema/approval';
import { eq, and } from 'drizzle-orm';
import { auth } from '@/shared/lib/auth';
import { createSafeAction } from '@/shared/lib/server-action';
import { flattenApprovalGraph } from '../lib/graph-utils';
import { revalidatePath } from 'next/cache';

const saveFlowDefinitionSchema = z.object({
    flowId: z.string(),
    definition: z.object({
        nodes: z.array(z.any()),
        edges: z.array(z.any()),
    }),
});

const createFlowSchema = z.object({
    name: z.string().min(1),
    code: z.string().min(1),
    description: z.string().optional(),
});

export const createApprovalFlow = createSafeAction(
    createFlowSchema,
    async ({ name, code, description }, { session }) => {
        const { tenantId } = session.user;
        if (!tenantId) throw new Error('Unauthorized');

        // Check duplicate code
        const existing = await db.query.approvalFlows.findFirst({
            where: and(eq(approvalFlows.code, code), eq(approvalFlows.tenantId, tenantId))
        });

        if (existing) {
            // If exists, maybe we should error or return existing?
            // For now, return existing compatible
            return existing;
        }

        const [flow] = await db.insert(approvalFlows).values({
            tenantId,
            name,
            code,
            description,
            definition: { nodes: [], edges: [] }, // Init empty
            isActive: false,
        }).returning();

        revalidatePath('/settings/approvals');
        return flow;
    }
);

export const saveFlowDefinition = createSafeAction(
    saveFlowDefinitionSchema,
    async ({ flowId, definition }, { session }) => {
        const { tenantId } = session.user;
        if (!tenantId) throw new Error('Unauthorized');

        await db.update(approvalFlows)
            .set({
                definition,
                updatedAt: new Date(),
            })
            .where(eq(approvalFlows.id, flowId));

        return { success: true };
    }
);

const publishFlowSchema = z.object({
    flowId: z.string(),
});

export const publishApprovalFlow = createSafeAction(
    publishFlowSchema,
    async ({ flowId }, { session }) => {
        const { tenantId } = session.user;
        if (!tenantId) throw new Error('Unauthorized');

        // 1. Fetch Definition
        const flow = await db.query.approvalFlows.findFirst({
            where: and(eq(approvalFlows.id, flowId), eq(approvalFlows.tenantId, tenantId))
        });

        if (!flow || !flow.definition) {
            throw new Error('Flow definition not found');
        }

        const definition = flow.definition as { nodes: any[], edges: any[] };

        // 2. Flatten Graph to Nodes
        const flatNodes = flattenApprovalGraph(definition.nodes, definition.edges);

        // 3. Update DB in Transaction
        await db.transaction(async (tx) => {
            // Clear existing nodes
            await tx.delete(approvalNodes)
                .where(eq(approvalNodes.flowId, flowId));

            // Insert new nodes
            if (flatNodes.length > 0) {
                await tx.insert(approvalNodes).values(
                    flatNodes.map(node => ({
                        tenantId,
                        flowId,
                        name: node.name,
                        approverRole: node.approverType === 'ROLE' ? node.approverValue as any : undefined,
                        approverUserId: node.approverType === 'USER' ? node.approverValue : undefined,
                        conditions: node.conditions,
                        sortOrder: node.sortOrder,
                        nodeType: 'APPROVAL',
                        // Defaults
                        approverMode: node.approverMode || 'ANY',
                        timeoutAction: 'REMIND' as const
                    }))
                );
            }

            // Activate Flow
            await tx.update(approvalFlows)
                .set({ isActive: true, updatedAt: new Date() })
                .where(eq(approvalFlows.id, flowId));
        });

        revalidatePath('/settings/approval');
        return { success: true };
    }
);
