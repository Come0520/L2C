import { z } from 'zod';

// Define enums as Zod enums or strings if Zod enum from drizzle is not directly compatible
// Drizzle 'pgEnum' exports a value that can be used, but Zod usually wants native string array or z.enum()
const customerLevels = ['A', 'B', 'C', 'D'] as const;
const customerTypes = ['INDIVIDUAL', 'COMPANY', 'DESIGNER', 'PARTNER'] as const;
export const customerLifecycleStages = [
  'LEAD',
  'OPPORTUNITY',
  'SIGNED',
  'DELIVERED',
  'LOST',
] as const;
export const customerPipelineStatuses = [
  'UNASSIGNED',
  'PENDING_FOLLOWUP',
  'PENDING_MEASUREMENT',
  'PENDING_QUOTE',
  'QUOTE_SENT',
  'IN_PRODUCTION',
  'PENDING_DELIVERY',
  'PENDING_INSTALLATION',
  'COMPLETED',
] as const;

// 中国大陆手机号正则
const phoneRegex = /^\d{8,11}$/;

/**
 * 客户偏好设置 Schema (JSONB)
 * 用于存储非结构化的客户偏好数据，如风格、颜色偏好等
 */
export const preferencesSchema = z
  .object({
    style: z.string().optional(),
    color: z.string().optional(),
    budget: z.string().optional(),
    // Allow other keys
  })
  .passthrough();

/**
 * 创建客户 Schema
 * 包含客户的基本信息、联系方式、标签和初始状态
 */
export const customerSchema = z.object({
  name: z.string().min(1, '姓名不能为空').max(50, '姓名不能超过50字'), // 客户姓名
  phone: z.string().regex(phoneRegex, '请输入有效的中国大陆手机号'), // 主联系电话
  phoneSecondary: z
    .string()
    .regex(phoneRegex, '请输入有效的中国大陆手机号')
    .optional()
    .or(z.literal('')), // 备用电话
  wechat: z.string().max(50).optional(), // 微信 ID
  type: z.enum(customerTypes).optional().default('INDIVIDUAL'), // 客户类型
  level: z.enum(customerLevels).optional().default('D'), // 客户等级 (A/B/C/D)
  address: z.string().max(200, '地址不能超过200字').optional(), // 详细地址
  notes: z.string().max(500, '备注不能超过500字').optional(), // 备注信息
  gender: z.enum(['MALE', 'FEMALE', 'UNKNOWN']).optional(), // 性别
  birthday: z.date().optional(), // 生日
  referrerCustomerId: z.string().optional(), // 推荐人客户 ID
  // 渠道来源（如：抖音、小红书、朋友介绍等）
  source: z.string().max(50).optional(),
  // 带单人姓名（当无法关联现有客户时使用）
  referrerName: z.string().max(50).optional(),
  tags: z.array(z.string().max(20)).optional(), // 客户标签
  lifecycleStage: z.enum(customerLifecycleStages).optional().default('LEAD'), // 生命周期阶段
  pipelineStatus: z.enum(customerPipelineStatuses).optional().default('UNASSIGNED'), // 管道/跟进状态
  preferences: preferencesSchema.optional(), // 个性化偏好
});

/**
 * 编辑客户 Schema
 * 排除生命周期和管道状态等系统管理字段，这些字段应通过专用 Action 修改
 */
export const editableCustomerSchema = z.object({
  id: z.string().min(1),
  version: z.number().int().optional(),
  data: customerSchema
    .omit({
      lifecycleStage: true,
      pipelineStatus: true,
    })
    .partial(),
});

export const updateCustomerSchema = z.object({
  id: z.string().min(1),
  version: z.number().int().optional(),
  data: customerSchema.partial(), // Keep for compatibility if needed, but optimally should use editableCustomerSchema
});

/**
 * 客户跟进记录 Schema
 * 用于记录销售对客户的跟进活动，包括拜访、电话、微信等
 */
export const activitySchema = z.object({
  customerId: z.string().uuid(),
  type: z.enum(['VISIT', 'PHONE', 'WECHAT', 'OTHER']),
  description: z.string().min(1, '内容不能为空').max(1000, '内容不能超过1000字'),
  images: z.array(z.string().url()).optional(),
  location: z.string().optional(),
  nextFollowUpTime: z.date().optional(),
});

/**
 * 获取客户列表查询参数 Schema
 * 支持分页、搜索、筛选和排序
 */
export const getCustomersSchema = z
  .object({
    page: z.coerce.number().default(1),
    pageSize: z.coerce.number().max(100, '每页最多100条').default(10),
    search: z.string().optional(),
    type: z.string().optional(),
    level: z.string().optional(),
    assignedSalesId: z.string().optional(),
    lifecycleStage: z.string().optional(),
    pipelineStatus: z.string().optional(),
    sort: z.string().optional(),
  })
  .transform((data) => {
    // 使用 Set 提升查找性能 O(n) → O(1)
    const validTypes = new Set(['INDIVIDUAL', 'COMPANY', 'DESIGNER', 'PARTNER']);
    const validLevels = new Set(['A', 'B', 'C', 'D']);
    const validLifecycleStages = new Set(['LEAD', 'OPPORTUNITY', 'SIGNED', 'DELIVERED', 'LOST']);
    const validPipelineStatuses = new Set([
      'UNASSIGNED',
      'PENDING_FOLLOWUP',
      'PENDING_MEASUREMENT',
      'PENDING_QUOTE',
      'QUOTE_SENT',
      'IN_PRODUCTION',
      'PENDING_DELIVERY',
      'PENDING_INSTALLATION',
      'COMPLETED',
    ]);

    return {
      ...data,
      type: data.type && validTypes.has(data.type) ? data.type : undefined,
      level: data.level && validLevels.has(data.level) ? data.level : undefined,
      lifecycleStage:
        data.lifecycleStage && validLifecycleStages.has(data.lifecycleStage)
          ? data.lifecycleStage
          : undefined,
      pipelineStatus:
        data.pipelineStatus && validPipelineStatuses.has(data.pipelineStatus)
          ? data.pipelineStatus
          : undefined,
    };
  });

export const getCustomerByIdSchema = z.string().min(1);

/**
 * 合并客户 Schema
 * @param targetCustomerId 保留的目标客户 ID
 * @param sourceCustomerIds 被合并的源客户 ID 列表
 * @param fieldPriority 字段合并策略 (PRIMARY: 保留目标客户字段, LATEST: 使用最新更新的字段)
 */
export const mergeCustomersSchema = z.object({
  targetCustomerId: z.string().min(1),
  targetCustomerVersion: z.number().int().optional(),
  sourceCustomerIds: z.array(z.string().min(1)).min(1),
  fieldPriority: z.enum(['PRIMARY', 'LATEST']).default('PRIMARY'),
});

export const getReferralChainSchema = z.object({
  customerId: z.string().min(1),
});
