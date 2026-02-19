import { z } from 'zod';
import { afterSalesStatusEnum, liablePartyTypeEnum, liabilityReasonCategoryEnum } from '@/shared/api/schema/enums';

export const createTicketSchema = z.object({
    orderId: z.string().uuid(),
    type: z.string(), // REPAIR, RETURN, COMPLAINT
    description: z.string().min(1, "问题描述不能为空"),
    photos: z.array(z.string()).optional(),
    priority: z.enum(['HIGH', 'MEDIUM', 'LOW']).default('MEDIUM'),
    assignedTo: z.string().uuid().optional(),
});

export const updateStatusSchema = z.object({
    ticketId: z.string().uuid(),
    status: z.enum(afterSalesStatusEnum.enumValues),
    resolution: z.string().optional(),
});

export const createLiabilitySchema = z.object({
    afterSalesId: z.string().uuid(),
    liablePartyType: z.enum(liablePartyTypeEnum.enumValues),
    liablePartyId: z.string().uuid().optional(),
    reason: z.string().min(1, "定责原因描述不能为空"),
    liabilityReasonCategory: z.enum(liabilityReasonCategoryEnum.enumValues).optional(),
    amount: z.coerce.number().min(0, "金额必须大于等于0"),
    evidencePhotos: z.array(z.string()).optional(),

    // 追溯关联 (可选)
    sourcePurchaseOrderId: z.string().uuid().optional(),
    sourceInstallTaskId: z.string().uuid().optional(),
});

export const confirmLiabilitySchema = z.object({
    noticeId: z.string().uuid(),
});

export const disputeLiabilitySchema = z.object({
    noticeId: z.string().uuid(),
    disputeReason: z.string().min(1, "争议原因不能为空"),
});

export const arbitrateLiabilitySchema = z.object({
    noticeId: z.string().uuid(),
    arbitrationResult: z.string().min(1, "仲裁结果描述不能为空"),
});

export const getQualityAnalyticsSchema = z.object({
    startDate: z.string().optional(),
    endDate: z.string().optional(),
});

export const checkWarrantySchema = z.object({
    orderId: z.string().uuid(),
});

// 占位导出：待完善的功能
export const _placeholderSchema = z.object({
    id: z.string().optional(),
});
