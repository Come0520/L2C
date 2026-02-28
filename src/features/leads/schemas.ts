import { z } from 'zod';
import { isValidPhoneNumber } from 'libphonenumber-js/min';

// ==================== Base Schemas ====================

export const leadSchema = z
  .object({
    customerName: z.string().min(1, '客户姓名不能为空'),
    customerPhone: z
      .string()
      .refine((val) => isValidPhoneNumber(val, 'CN'), { message: '请输入有效的电话号码' }),
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
  })
  .describe('核心线索数据结构，涵盖客户信息、地址、来源渠道及意向级别等');

export const updateLeadSchema = leadSchema
  .partial()
  .extend({
    id: z.string().uuid(),
    version: z.number().optional(),
  })
  .describe('更新线索信息的请求数据结构，要求包含主键id与版本号用于乐观锁控制');

// ==================== Mutation Schemas ====================

export const createLeadSchema = leadSchema.describe(
  '创建新线索的数据结构定义，包含客户基本信息及来源维度'
);

export const createCustomerSchema = z
  .object({
    name: z.string(),
    phone: z.string(),
  })
  .describe('创建客户基础信息结构，包含姓名与必填手机号');

export const assignLeadSchema = z
  .object({
    id: z.string().uuid(),
    salesId: z.string().min(1, '请选择销售人员'),
    version: z.number().optional(),
  })
  .describe('将指定线索分配给对应销售人员的数据结构');

export const bulkAssignSchema = z
  .object({
    ids: z.array(z.string().uuid()).min(1, '请至少选择一个线索'),
    salesId: z.string().min(1, '请选择销售人员'),
  })
  .describe('批量将多个线索分配给指定销售人员的数据结构');

export const convertLeadSchema = z
  .object({
    leadId: z.string().uuid(),
    customerId: z.string().uuid().optional(),
    force: z.boolean().optional(),
    version: z.number().optional(),
  })
  .describe('线索转化为客户的过程数据结构，记录转化的目标客户对象及强制转换标识');

export const followUpTypeEnum = z.enum([
  'PHONE_CALL',
  'WECHAT_CHAT',
  'STORE_VISIT',
  'HOME_VISIT',
  'QUOTE_SENT',
  'SYSTEM',
  'OTHER',
]);

export const addLeadFollowupSchema = z
  .object({
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
  })
  .describe('为销售线索添加跟进记录的请求结构，支持设置下次跟进时间及意向变化');

export const voidLeadSchema = z
  .object({
    id: z.string().uuid(),
    reason: z.string().min(1, '请输入作废原因'),
    version: z.number().optional(),
  })
  .describe('作废无效线索的数据结构，必须提供作废原因');

export const deleteLeadSchema = z.object({
  id: z.string().uuid(),
});

export const restoreLeadSchema = z.object({
  id: z.string().uuid(),
  reason: z.string().optional(), // 恢复原因
});

// ==================== Filter/Query Schemas ====================

export const leadFilterSchema = z
  .object({
    page: z.number().min(1).default(1),
    pageSize: z.number().min(1).max(100).default(10),
    // Matching leadStatusEnum: PENDING_ASSIGNMENT, PENDING_FOLLOWUP, FOLLOWING_UP, WON, INVALID
    status: z.array(z.string()).optional(),
    intentionLevel: z.enum(['HIGH', 'MEDIUM', 'LOW']).optional(),
    search: z.string().optional(),
    salesId: z.string().optional(), // 'ME' | 'UNASSIGNED' | userId
    sourceCategoryId: z.string().optional(),
    channelId: z.string().uuid().optional(),
    dateRange: z
      .object({
        from: z.date().optional(),
        to: z.date().optional(),
      })
      .optional(),
    tags: z.array(z.string()).optional(),
  })
  .transform((data) => {
    const validStatuses = [
      'PENDING_ASSIGNMENT',
      'PENDING_FOLLOWUP',
      'FOLLOWING_UP',
      'WON',
      'INVALID',
      'PENDING_APPROVAL',
      'MEASUREMENT_SCHEDULED',
      'QUOTED',
      'LOST',
      'PENDING_REVIEW',
    ];
    return {
      ...data,
      status: data.status?.filter((s) => validStatuses.includes(s)),
    };
  })
  .describe('线索列表多维检索过滤条件结构，支持按状态、意向、来源、分配人员及时间段进行组合筛选');

export const getLeadTimelineLogsSchema = z
  .object({
    leadId: z.string().uuid(),
  })
  .describe('拉取单个线索详细时间线操作日志的请求结构');

export const analyticsDateRangeSchema = z.object({
  from: z.date().optional(),
  to: z.date().optional(),
});

export type LeadFormValues = z.infer<typeof leadSchema>;
