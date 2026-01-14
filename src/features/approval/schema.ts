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
