import { z } from 'zod';
import { productCategorySchema } from './constants';

// ==================== Quote Bundle Schemas ====================

export const createQuoteBundleSchema = z.object({
    leadId: z.string().optional(),
    customerId: z.string(),
    summaryMode: z.enum(['BY_CATEGORY', 'BY_ROOM']).default('BY_CATEGORY'),
    remark: z.string().optional(),
});

export const getQuoteBundleByIdSchema = z.object({
    id: z.string(),
});

export const updateQuoteBundleSchema = z.object({
    id: z.string(),
    summaryMode: z.enum(['BY_CATEGORY', 'BY_ROOM']),
    remark: z.string().optional(),
});

// ==================== Quote Item Schema ====================

export const QuoteItemAttachmentSchema = z.object({
    id: z.string().optional(),
    name: z.string(),
    type: z.enum(['IMAGE', 'DOCUMENT']),
    url: z.string(),
});

export const QuoteItemInputSchema = z.object({
    id: z.string().optional(),
    name: z.string(),
    quantity: z.number(),
    unitPrice: z.number(),
    amount: z.number(),
    unit: z.string().optional(),
    remark: z.string().optional(),
    roomName: z.string().optional(),
    width: z.number().optional(),
    height: z.number().optional(),
    foldRatio: z.number().optional(),
    fabricWidth: z.number().optional(),
    installPosition: z.enum(['CURTAIN_BOX', 'INSIDE', 'OUTSIDE', 'CUSTOM']).optional(),
    attachments: z.array(QuoteItemAttachmentSchema).optional(),
});

// ==================== List/Filter Schemas ====================

export const getQuoteBundlesSchema = z.object({
    page: z.number().optional(),
    pageSize: z.number().optional(),
    status: z.enum(['ALL', 'DRAFT', 'ACTIVE', 'LOCKED', 'EXPIRED']).optional(),
    search: z.string().optional(),
});

// ==================== Item Version Schemas ====================

export const activateQuoteItemVersionSchema = z.object({
    quoteId: z.string(),
    roomId: z.string().optional(),
    versionTag: z.string(),
});

export const getQuoteItemVersionsSchema = z.object({
    quoteId: z.string(),
    roomId: z.string().optional(),
});

export const createQuoteBundleWithQuotesSchema = z.object({
    customerId: z.string(),
    leadId: z.string().optional(),
    summaryMode: z.enum(['BY_CATEGORY', 'BY_ROOM']).default('BY_CATEGORY'),
    remark: z.string().optional(),
    quotes: z.array(z.object({
        category: productCategorySchema,
        items: z.array(QuoteItemInputSchema),
    })).min(1),
});

export const updateQuoteBundleWithQuotesSchema = createQuoteBundleWithQuotesSchema.extend({
    bundleId: z.string(),
});
