import { z } from 'zod';

// Define enums as Zod enums or strings if Zod enum from drizzle is not directly compatible
// Drizzle 'pgEnum' exports a value that can be used, but Zod usually wants native string array or z.enum()
const customerLevels = ['A', 'B', 'C', 'D'] as const;
const customerTypes = ['INDIVIDUAL', 'COMPANY', 'DESIGNER', 'PARTNER'] as const;
const customerLifecycleStages = ['LEAD', 'OPPORTUNITY', 'SIGNED', 'DELIVERED', 'LOST'] as const;
const customerPipelineStatuses = ['UNASSIGNED', 'PENDING_FOLLOWUP', 'PENDING_MEASUREMENT', 'PENDING_QUOTE', 'QUOTE_SENT', 'IN_PRODUCTION', 'PENDING_DELIVERY', 'PENDING_INSTALLATION', 'COMPLETED'] as const;


export const customerSchema = z.object({
    name: z.string().min(1, '姓名不能为空'),
    phone: z.string().min(11, '手机号需为11位').max(11, '手机号需为11位'),
    phoneSecondary: z.string().optional(),
    wechat: z.string().optional(),
    type: z.enum(customerTypes).optional().default('INDIVIDUAL'),
    level: z.enum(customerLevels).optional().default('D'),
    address: z.string().optional(),
    notes: z.string().optional(),
    gender: z.enum(['MALE', 'FEMALE', 'UNKNOWN']).optional(),
    birthday: z.date().optional(),
    referrerCustomerId: z.string().optional(),
    // 渠道来源（如：抖音、小红书、朋友介绍等）
    source: z.string().optional(),
    // 带单人姓名（当无法关联现有客户时使用）
    referrerName: z.string().optional(),
    tags: z.array(z.string()).optional(),
    lifecycleStage: z.enum(customerLifecycleStages).optional().default('LEAD'),
    pipelineStatus: z.enum(customerPipelineStatuses).optional().default('UNASSIGNED'),
});


export const updateCustomerSchema = z.object({
    id: z.string().min(1),
    data: customerSchema.partial(),
});

export const getCustomersSchema = z.object({
    page: z.coerce.number().default(1),
    pageSize: z.coerce.number().default(10),
    search: z.string().optional(),
    type: z.string().optional(),
    level: z.string().optional(),
    assignedSalesId: z.string().optional(),
    lifecycleStage: z.string().optional(),
    pipelineStatus: z.string().optional(),
    sort: z.string().optional(),
}).transform((data) => {
    // 使用 Set 提升查找性能 O(n) → O(1)
    const validTypes = new Set(['INDIVIDUAL', 'COMPANY', 'DESIGNER', 'PARTNER']);
    const validLevels = new Set(['A', 'B', 'C', 'D']);
    const validLifecycleStages = new Set(['LEAD', 'OPPORTUNITY', 'SIGNED', 'DELIVERED', 'LOST']);
    const validPipelineStatuses = new Set(['UNASSIGNED', 'PENDING_FOLLOWUP', 'PENDING_MEASUREMENT', 'PENDING_QUOTE', 'QUOTE_SENT', 'IN_PRODUCTION', 'PENDING_DELIVERY', 'PENDING_INSTALLATION', 'COMPLETED']);

    return {
        ...data,
        type: data.type && validTypes.has(data.type) ? data.type : undefined,
        level: data.level && validLevels.has(data.level) ? data.level : undefined,
        lifecycleStage: data.lifecycleStage && validLifecycleStages.has(data.lifecycleStage) ? data.lifecycleStage : undefined,
        pipelineStatus: data.pipelineStatus && validPipelineStatuses.has(data.pipelineStatus) ? data.pipelineStatus : undefined,
    };
});



export const getCustomerByIdSchema = z.string().min(1);

export const mergeCustomersSchema = z.object({
    targetCustomerId: z.string().min(1),
    sourceCustomerIds: z.array(z.string().min(1)).min(1),
    fieldPriority: z.enum(['PRIMARY', 'LATEST']).default('PRIMARY'),
});
