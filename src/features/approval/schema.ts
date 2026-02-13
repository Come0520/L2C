import { z } from 'zod';
import { type Transaction } from '@/shared/api/db';

// ==================== Types ====================
export interface ApprovalStep {
    order: number;
    name: string;
    approverType: 'ROLE' | 'USER' | 'CREATOR_MANAGER';
    approverValue: string;
    required: boolean;
}

// Graph-based types for Visual Designer
export type NodeType = 'start' | 'end' | 'approver' | 'condition' | 'parallel';

export interface ApprovalNode {
    id: string;
    type: NodeType;
    data: {
        label: string;
        approverType?: 'ROLE' | 'USER' | 'CREATOR_MANAGER';
        approverValue?: string; // userId or roleId
        approverMode?: 'ANY' | 'ALL' | 'MAJORITY';
        condition?: string; // Expression for conditional nodes
    };
    position: { x: number; y: number }; // For visual layout
}

export interface ApprovalEdge {
    id: string;
    source: string;
    target: string;
    type: 'default' | 'smoothstep';
    label?: string; // For condition branches (e.g., "Yes", "No")
}

export interface ApprovalFlowDefinition {
    nodes: ApprovalNode[];
    edges: ApprovalEdge[];
}

export interface ApprovalInstance {
    id: string;
    tenantId: string;
    flowId: string | null;
    module: string;
    entityId: string;
    status: string | null;
    currentStep: number | null;
    applicantId: string | null;
    appliedAt: Date | null;
    completedAt: Date | null;
    deadlineAt: Date | null;
    remindedAt: Date | null;
}

export interface NotificationParams {
    tenantId: string;
    userId: string;
    title: string;
    content: string;
    metadata?: Record<string, unknown>;
    tx?: Transaction;
}

// ==================== Schemas ====================

export const submitApprovalSchema = z.object({
    flowId: z.string(),
    entityId: z.string(),
    module: z.string(),
    applicantId: z.string().optional(), // Defaults to session user
});

export const processApprovalSchema = z.object({
    instanceId: z.string(),
    action: z.enum(['APPROVE', 'REJECT']),
    comment: z.string().optional(),
});
