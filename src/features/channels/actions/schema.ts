import { z } from 'zod';

export const channelSchema = z.object({
    name: z.string().min(1, '请输入渠道名称'),
    code: z.string().min(1, '请输入渠道编号'),
    category: z.enum(['ONLINE', 'OFFLINE', 'REFERRAL']).default('OFFLINE'),
    channelType: z.enum(['DECORATION_CO', 'DESIGNER', 'CROSS_INDUSTRY', 'DOUYIN', 'XIAOHONGSHU', 'STORE', 'OTHER']),
    level: z.enum(['S', 'A', 'B', 'C']).default('C'),
    contactName: z.string().min(1, '请输入核心联系人'),
    phone: z.string().min(1, '请输入联系电话'),

    commissionRate: z.coerce.number().min(0).max(100),
    commissionType: z.enum(['FIXED', 'TIERED']).optional(),
    tieredRates: z.any().optional(),

    cooperationMode: z.enum(['BASE_PRICE', 'COMMISSION']),
    priceDiscountRate: z.coerce.number().min(0).max(2).optional(),

    settlementType: z.enum(['PREPAY', 'MONTHLY']),
    bankInfo: z.any().optional(),

    assignedManagerId: z.string().uuid().optional(),
    status: z.string().default('ACTIVE'),
});

export const channelContactSchema = z.object({
    channelId: z.string().uuid(),
    name: z.string().min(1, '请输入姓名'),
    position: z.string().optional(),
    phone: z.string().min(1, '请输入电话'),
    isMain: z.boolean().default(false),
});

export type ChannelInput = z.infer<typeof channelSchema>;
export type ChannelContactInput = z.infer<typeof channelContactSchema>;
