import { z } from 'zod';

// 共享 attributes 校验规则：仅允许基础类型值，防止原型链污染或注入复杂对象
// P1-R5-01: 安全修复
const safeAttributesSchema = z.record(
  z.string(),
  z.union([z.string(), z.number(), z.boolean(), z.null(),
  z.array(z.union([z.string(), z.number(), z.boolean(), z.null()]))])
).optional();

export const createQuoteSchema = z.object({
  customerId: z.string().uuid().describe('客户ID'),
  leadId: z.string().uuid().optional().describe('关联线索ID (可选)'),
  measureVariantId: z.string().uuid().optional().describe('测量方案版本ID (可选)'),
  bundleId: z.string().uuid().optional().describe('所属报价套餐ID (可选)'),
  title: z.string().max(200).optional().describe('报价单标题，默认为"新报价单"'),
  notes: z.string().optional().describe('给客户的备注说明'),
});

export const createQuoteBundleSchema = z.object({
  customerId: z.string().uuid().describe('客户ID'),
  leadId: z.string().uuid().optional().describe('关联线索ID (可选)'),
  summaryMode: z.string().optional().describe('套餐汇总模式 (如：分摊、明细)'),
  remark: z.string().optional().describe('套餐内部备注'),
});

export const updateQuoteSchema = z.object({
  id: z.string().uuid().describe('报价单ID'),
  title: z.string().max(200).optional().describe('报价单标题'),
  discountRate: z.number().min(0).max(1).optional().describe('折扣率 (0~1 之间的小数)'),
  discountAmount: z.number().min(0).optional().describe('直接固定折扣减免抵扣金额'),
  notes: z.string().optional().describe('给客户的备注说明'),
  validUntil: z.date().optional().describe('报价单有效截止日期'),
  /**  乐观锁版本号，用于防止并发更新冲突 */
  version: z.number().int().min(0).optional().describe('并发控制版本号(乐观锁)'),
});

export const submitQuoteSchema = z.object({
  id: z.string().uuid().describe('报价单ID'),
});

export const acceptQuoteSchema = z.object({
  id: z.string().uuid().describe('报价单ID'),
});

export const rejectQuoteSchema = z.object({
  id: z.string().uuid().describe('报价单ID'),
  reason: z.string().min(1, '必须提供拒绝原因').describe('拒绝的详细原因或说明'),
});

export const createQuoteRoomSchema = z.object({
  quoteId: z.string().uuid().describe('所属报价单ID'),
  name: z.string().min(1).max(100).describe('房间名称 (如：主卧、客厅)'),
  measureRoomId: z.string().uuid().optional().describe('关联的测量房间ID (可选)'),
});

export const updateQuoteRoomSchema = z.object({
  id: z.string().uuid().describe('房间ID'),
  name: z.string().min(1).max(100).optional().describe('房间名称'),
  sortOrder: z.number().int().optional().describe('排序顺位'),
});

export const createQuoteItemSchema = z.object({
  quoteId: z.string().uuid().describe('所属报价单ID'),
  roomId: z.string().uuid().nullable().optional().describe('所属房间ID (无归属时为 null)'),
  parentId: z.string().uuid().optional().describe('父级项目ID (用于子项)'),

  category: z.string().min(1).max(50).describe('产品大类枚举 (如 CURTAIN, WALLPAPER)'),
  productId: z.string().uuid().optional().describe('关联的系统产品库ID'),
  productName: z.string().min(1).max(200).describe('显示给客户的商品名称'),
  productSku: z.string().max(100).optional().describe('商品SKU编号'),

  unit: z.string().max(20).optional().describe('销售单位 (如 米、卷、个)'),
  unitPrice: z.number().min(0).describe('单价'),
  quantity: z.number().min(0).describe('数量/用料'),

  width: z.number().min(0).optional().describe('成品宽度 (cm)'),
  height: z.number().min(0).optional().describe('成品高度 (cm)'),
  foldRatio: z.number().min(0).optional().describe('褶皱倍数 (如 2.0 倍)'),
  processFee: z.number().min(0).optional().describe('单个项目的额外加工费'),

  // P1-08 安全修复：限制 attributes 值类型，禁止注入任意对象
  // P1-08/P1-R5-01 安全修复：使用统一的安全校验规则
  attributes: safeAttributesSchema.describe('用于各种产品分类计算策略的动态属性(如布幅、拼接损耗等)'),
  remark: z.string().optional().describe('本行备注'),
});

export const updateQuoteItemSchema = z.object({
  id: z.string().uuid().describe('行项目ID'),

  // 产品关联字段（更换产品时使用）
  productId: z.string().uuid().optional().describe('关联的系统产品库ID'),
  productName: z.string().max(200).optional().describe('显示给客户的商品名称'),
  category: z.string().max(50).optional().describe('产品大类枚举'),

  quantity: z.number().min(0).optional().describe('数量/用料 (如果不由计算引擎自覆盖则手动)'),
  unitPrice: z.number().min(0).optional().describe('单价'),

  width: z.number().min(0).optional().describe('成品宽度 (cm)'),
  height: z.number().min(0).optional().describe('成品高度 (cm)'),
  foldRatio: z.number().min(0).optional().describe('褶皱倍数 (如 2.0 倍)'),
  processFee: z.number().min(0).optional().describe('加工附加费'),

  attributes: safeAttributesSchema.describe('用于各种产品分类计算策略的动态属性'),
  remark: z.string().optional().describe('本行备注'),
  unit: z.string().max(20).optional().describe('销售单位'),
  sortOrder: z.number().int().optional().describe('前端手动置换的顺位调整'),
});

export const reorderQuoteItemsSchema = z.object({
  quoteId: z.string().uuid().describe('所属报价单ID'),
  roomId: z.string().uuid().nullable().describe('归属于哪个房间的重新排序'),
  items: z.array(
    z.object({
      id: z.string().uuid().describe('行项目ID'),
      sortOrder: z.number().int().describe('新的排序顺位'),
    })
  ).describe('由前端传递的新顺序数组'),
});

export const deleteQuoteItemSchema = z.object({
  id: z.string().uuid().describe('需要删除的行项目ID'),
});

// 报价转订单 schema（tenantId 从 context 获取）
export const convertQuoteToOrderSchema = z.object({
  quoteId: z.string().uuid().describe('已通过批准将要转为订单的报价单ID'),
});

// 拒绝报价折扣 schema（tenantId 和 rejectedBy 从 context 获取）
export const rejectQuoteDiscountSchema = z.object({
  id: z.string().uuid().describe('折扣越权需撤回的报价单ID'),
  reason: z.string().min(1, '必须提供拒绝原因').describe('拒绝折扣的明细原因'),
});

export const createQuickQuoteSchema = z.object({
  leadId: z.string().uuid().describe('发起快捷报价的线索ID'),
  planType: z.string().describe('一键全屋的套餐包类型(如：全屋三室一厅标配)'),
  rooms: z.array(
    z.object({
      name: z.string().describe('房间名称'),
      width: z.number().positive().describe('开间测量宽度'),
      height: z.number().positive().describe('开间测量高度'),
      hasSheer: z.boolean().default(false).describe('是否需要配套纱帘'),
      hasBox: z.boolean().default(false).describe('是否有窗套(影响安装形态)'),
      windowType: z.string().default('STRAIGHT').describe('窗户物理类型(如：一字窗、L型窗)'),
      hasFabric: z.boolean().default(true).describe('是否需要包含主布'),
    })
  ).describe('批量录入的房间尺寸列表'),
});
