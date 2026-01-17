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
    type: z.enum(customerTypes).optional(),
    level: z.enum(customerLevels).optional(),
    assignedSalesId: z.string().optional(),
    lifecycleStage: z.enum(customerLifecycleStages).optional(),
    pipelineStatus: z.enum(customerPipelineStatuses).optional(),
    sort: z.string().optional(),
});



export const getCustomerByIdSchema = z.string().min(1);

export const mergeCustomersSchema = z.object({
    targetCustomerId: z.string().min(1),
    sourceCustomerIds: z.array(z.string().min(1)).min(1),
});
