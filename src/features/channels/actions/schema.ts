import { z } from 'zod';

// 中国大陆手机号正则 (11位，以1开头，第二位为3-9)
const phoneRegex = /^1[3-9]\d{9}$/;

// 阶梯费率结构
const tieredRateSchema = z.object({
    minAmount: z.number().min(0),
    maxAmount: z.number().optional(),
    rate: z.number().min(0).max(100),
});

// 银行账户信息结构
const bankInfoSchema = z.object({
    bankName: z.string().min(1, '请输入开户银行'),
    accountName: z.string().min(1, '请输入账户名称'),
    accountNumber: z.string().min(1, '请输入银行账号'),
    bankBranch: z.string().optional(),
}).optional();

export const channelSchema = z.object({
    // 多层级支持
    parentId: z.string().uuid().optional().nullable(),    // 父级渠道 ID
    hierarchyLevel: z.number().int().min(1).max(3).default(1),  // 层级深度
    categoryId: z.string().uuid().optional().nullable(),  // 关联渠道类型表

    // 基础信息
    name: z.string().min(1, '请输入渠道名称').max(100, '渠道名称不能超过100字'),
    code: z.string().min(1, '请输入渠道编号').max(50, '渠道编号不能超过50字'),
    category: z.enum(['ONLINE', 'OFFLINE', 'REFERRAL']).default('OFFLINE'),
    channelType: z.enum(['DECORATION_CO', 'DESIGNER', 'CROSS_INDUSTRY', 'DOUYIN', 'XIAOHONGSHU', 'STORE', 'OTHER']),
    customChannelType: z.string().max(50, '自定义类型不能超过50字').optional(),
    level: z.enum(['S', 'A', 'B', 'C']).default('C'),
    contactName: z.string().min(1, '请输入核心联系人').max(50, '联系人姓名不能超过50字'),
    phone: z.string().regex(phoneRegex, '请输入有效的中国大陆手机号'),

    // 财务配置
    commissionRate: z.coerce.number().min(0, '返点比例不能小于0').max(100, '返点比例不能超过100'),
    commissionType: z.enum(['FIXED', 'TIERED']).optional(),
    tieredRates: z.array(tieredRateSchema).optional(),  // 替换 z.any() 为具体类型

    cooperationMode: z.enum(['BASE_PRICE', 'COMMISSION']),
    priceDiscountRate: z.coerce.number().min(0, '折扣率不能小于0').max(2, '折扣率不能超过2').optional(),

    settlementType: z.enum(['PREPAY', 'MONTHLY']),
    bankInfo: bankInfoSchema,  // 替换 z.any() 为具体类型

    assignedManagerId: z.string().uuid().optional(),
    status: z.string().default('ACTIVE'),
}).refine((data) => {
    if (data.channelType === 'OTHER' && !data.customChannelType) {
        return false;
    }
    return true;
}, {
    message: '请输入自定义类型名称',
    path: ['customChannelType'],
});

export const channelContactSchema = z.object({
    channelId: z.string().uuid(),
    name: z.string().min(1, '请输入姓名').max(50, '姓名不能超过50字'),
    position: z.string().max(50, '职位名称不能超过50字').optional(),
    phone: z.string().regex(phoneRegex, '请输入有效的中国大陆手机号'),
    isMain: z.boolean().default(false),
});

export type ChannelInput = z.infer<typeof channelSchema>;
export type ChannelContactInput = z.infer<typeof channelContactSchema>;

// 渠道类型 Schema
export const channelCategorySchema = z.object({
    name: z.string().min(1, '类型名称不能为空').max(50),
    code: z.string().min(1, '类型代码不能为空').max(50),
    description: z.string().optional(),
    isActive: z.boolean().default(true),
    sortOrder: z.number().int().default(0),
});

export type ChannelCategoryInput = z.infer<typeof channelCategorySchema>;

// 归因设置类型
export type AttributionModel = 'FIRST_TOUCH' | 'LAST_TOUCH';

export interface AttributionSettings {
    defaultModel: AttributionModel;
    graceWindowDays: number; // 归因有效期（天）
    excludeDirectSales: boolean;
}

// 渠道分析数据类型
export interface ChannelAnalyticsData {
    channelId: string;
    channelName: string;
    totalLeads: number;
    convertedLeads: number;
    conversionRate: number;
    totalRevenue: number;
    totalCommission: number;
    pendingCommission: number;
    paidCommission: number;
}
