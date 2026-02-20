import { z } from 'zod';

// ==================== Base Schemas ====================

export const leadSchema = z.object({
    customerName: z.string().min(1, '客户姓名不能为空'),
    customerPhone: z.string().min(11, '手机号必须为11位').max(11, '手机号必须为11位'),
    customerWechat: z.string().optional().nullable(),

    // Address & House
    community: z.string().optional().nullable(),
    houseType: z.string().optional().nullable(),
    address: z.string().optional().nullable(),

    // Channel
    sourceCategoryId: z.string().optional().nullable(),
    sourceChannelId: z.string().optional().nullable(), // Alias if needed, or stick to table names
    sourceSubId: z.string().optional().nullable(),
    sourceDetail: z.string().optional().nullable(),

    // New Channel Module Links
    channelId: z.string().uuid().optional().nullable(),
    channelContactId: z.string().uuid().optional().nullable(),

    intentionLevel: z.enum(['HIGH', 'MEDIUM', 'LOW']).optional().nullable(),
    estimatedAmount: z.number().optional().nullable(),

    // Notes
    remark: z.string().optional().nullable(), // Will map to 'notes'
    tags: z.array(z.string()).optional(),

    // Linking to existing customer (Lead = Opportunity)
    customerId: z.string().uuid().optional().nullable(),
});


export const updateLeadSchema = leadSchema.partial().extend({
    id: z.string().uuid(),
    version: z.number().optional(),
});

// ==================== Mutation Schemas ====================

export const createLeadSchema = leadSchema;

export const createCustomerSchema = z.object({
    name: z.string(),
    phone: z.string(),
});

export const assignLeadSchema = z.object({
    id: z.string().uuid(),
    salesId: z.string().min(1, '请选择销售人员'),
    version: z.number().optional(),
});

export const bulkAssignSchema = z.object({
    ids: z.array(z.string().uuid()).min(1, '请至少选择一个线索'),
    salesId: z.string().min(1, '请选择销售人员'),
});

export const convertLeadSchema = z.object({
    leadId: z.string().uuid(),
    customerId: z.string().uuid().optional(),
    force: z.boolean().optional(),
    version: z.number().optional(),
});

export const followUpTypeEnum = z.enum(['PHONE_CALL', 'WECHAT_CHAT', 'STORE_VISIT', 'HOME_VISIT', 'QUOTE_SENT', 'SYSTEM', 'OTHER']);

export const addLeadFollowupSchema = z.object({
    leadId: z.string().uuid(),
    // Matching leadActivityTypeEnum: PHONE_CALL, WECHAT_CHAT, STORE_VISIT, HOME_VISIT, QUOTE_SENT, SYSTEM
    // Matching leadActivityTypeEnum: PHONE_CALL, WECHAT_CHAT, STORE_VISIT, HOME_VISIT, QUOTE_SENT, SYSTEM
    type: followUpTypeEnum.default('PHONE_CALL'),
    content: z.string().min(1, '跟进内容不能为空'),
    nextFollowupAt: z.date().optional(),
    quoteId: z.string().uuid().optional(),
    purchaseIntention: z.enum(['HIGH', 'MEDIUM', 'LOW']).optional(),
    customerLevel: z.string().optional(),
    version: z.number().optional(),
});

export const voidLeadSchema = z.object({
    id: z.string().uuid(),
    reason: z.string().min(1, '请输入作废原因'),
    version: z.number().optional(),
});

export const deleteLeadSchema = z.object({
    id: z.string().uuid(),
});

export const restoreLeadSchema = z.object({
    id: z.string().uuid(),
    reason: z.string().optional(), // 恢复原因
});

// ==================== Filter/Query Schemas ====================

export const leadFilterSchema = z.object({
    page: z.number().min(1).default(1),
    pageSize: z.number().min(1).max(100).default(10),
    // Matching leadStatusEnum: PENDING_ASSIGNMENT, PENDING_FOLLOWUP, FOLLOWING_UP, WON, INVALID
    status: z.array(z.string()).optional(),
    intentionLevel: z.enum(['HIGH', 'MEDIUM', 'LOW']).optional(),
    search: z.string().optional(),
    salesId: z.string().optional(), // 'ME' | 'UNASSIGNED' | userId
    sourceCategoryId: z.string().optional(),
    channelId: z.string().uuid().optional(),
    dateRange: z.object({
        from: z.date().optional(),
        to: z.date().optional(),
    }).optional(),
    tags: z.array(z.string()).optional(),
}).transform((data) => {
    const validStatuses = ['PENDING_ASSIGNMENT', 'PENDING_FOLLOWUP', 'FOLLOWING_UP', 'WON', 'INVALID', 'PENDING_APPROVAL', 'MEASUREMENT_SCHEDULED', 'QUOTED', 'LOST', 'PENDING_REVIEW'];
    return {
        ...data,
        status: data.status?.filter(s => validStatuses.includes(s)),
    };
});

export const getLeadTimelineLogsSchema = z.object({
    leadId: z.string().uuid(),
});

export const analyticsDateRangeSchema = z.object({
    from: z.date().optional(),
    to: z.date().optional(),
});

export type LeadFormValues = z.infer<typeof leadSchema>;

