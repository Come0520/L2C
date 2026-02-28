import { z } from 'zod';
import { isValidPhoneNumber } from 'libphonenumber-js/min';

export const createSupplierSchema = z.object({
  name: z.string().min(1, '供应商名称必填').describe('供应商显示名称'),
  contactPerson: z.string().optional().describe('主要联系人姓名'),
  phone: z
    .string()
    .refine((val) => !val || isValidPhoneNumber(val, 'CN'), { message: '请输入有效的电话号码' })
    .optional()
    .describe('联系电话'),
  paymentPeriod: z.enum(['CASH', 'MONTHLY']).default('CASH').describe('结算周期'),
  address: z.string().optional().describe('具体地址'),
  remark: z.string().optional().describe('备注信息'),

  // [NEW] 供应商类型
  supplierType: z
    .enum(['SUPPLIER', 'PROCESSOR', 'BOTH'])
    .default('SUPPLIER')
    .describe('供应商的业务类型'),

  // [NEW] 加工厂专属字段
  processingPrices: z
    .object({
      items: z.array(
        z.object({
          name: z.string().min(1, '工艺名称不能为空').describe('工艺的名称'),
          unit: z.string().default('元/米').describe('计价单位'),
          price: z.coerce.number().min(0, '价格不能为负数').describe('工艺单价'),
        })
      ),
    })
    .optional()
    .describe('加工服务价格表'),
  contractUrl: z.string().optional().describe('合同URL地址'),
  contractExpiryDate: z.coerce.date().optional().describe('合同到期时间'),
  businessLicenseUrl: z.string().optional().describe('营业执照URL地址'),
  bankAccount: z.string().optional().describe('银行账号'),
  bankName: z.string().optional().describe('开户银行名称'),
});

export const getSuppliersSchema = z.object({
  page: z.number().min(1).default(1).describe('页码'),
  pageSize: z.number().min(1).max(100).default(20).describe('每页条数'),
  query: z.string().optional().describe('搜索关键词'),
  type: z.enum(['SUPPLIER', 'PROCESSOR', 'BOTH']).optional().describe('按业务类型筛选'), // [NEW] 类型筛选
});

export const getSupplierByIdSchema = z.object({
  id: z.string().min(1, 'ID必填').describe('供应商唯一系统ID'),
});

export const updateSupplierSchema = createSupplierSchema.partial().extend({
  id: z.string().min(1, 'ID必填').describe('供应商唯一系统ID'),
  isActive: z.boolean().optional().describe('是否处于启用状态'),
});

export const deleteSupplierSchema = z.object({
  id: z.string().min(1, 'ID必填').describe('供应商唯一系统ID'),
});

export const createProcessingOrderSchema = z.object({
  orderId: z.string().min(1, '订单 ID 不能为空').describe('关联业务订单ID'),
  processorName: z.string().min(1, '加工商名称不能为空').describe('加工商名称'),
  items: z
    .array(
      z.object({
        productId: z.string().describe('商品唯一标识ID'),
        quantity: z.number().min(1, '数量必须大于 0').describe('加工数量'),
        cost: z.number().min(0, '成本不能为负数').describe('加工成本'),
      })
    )
    .describe('加工明细信息'),
});

export const createPOSchema = z.object({
  supplierId: z.string().min(1, '请选择供应商').describe('关联的供应商ID'),
  orderId: z.string().optional().describe('关联业务订单ID'),
  /** P1-04 修复：新增 type 字段，区分成品/面料/库存采购 */
  type: z.enum(['FINISHED', 'FABRIC', 'STOCK']).default('FINISHED').describe('采购单类型'),
  items: z
    .array(
      z.object({
        productId: z.string().min(1, '请选择产品').describe('关联的产品ID'),
        quantity: z.coerce.number().positive('数量必须大于 0').describe('采购数量'),
        unitCost: z.coerce.number().min(0, '单价不能为负数').describe('采购单价'),
        taxRate: z.coerce.number().optional().describe('适用税率'),
      })
    )
    .min(1, '请至少添加一个商品')
    .describe('采购明细'),
});

export type CreatePOFormData = z.infer<typeof createPOSchema>;

export const createProductBundleSchema = z.object({
  bundleSku: z.string().min(1, '套件 SKU 不能为空').describe('套件的SKU编码'),
  name: z.string().min(1, '套件名称不能为空').describe('套件名称'),
  category: z.string().optional().describe('套件的分类'),
  retailPrice: z.coerce.number().min(0).default(0).describe('套件零售价'),
  channelPrice: z.coerce.number().min(0).default(0).describe('套件渠道价'),
  items: z
    .array(
      z.object({
        productId: z.string().min(1, '产品 ID 不能为空').describe('包含的产品ID'),
        quantity: z.coerce.number().min(0.01, '数量必须大于 0').describe('包含的数量'),
        unit: z.string().optional().describe('数量单位'),
      })
    )
    .min(1, '套件至少需要包含一个产品')
    .describe('套件包含的具体明细'),
});

export const updateProductBundleSchema = createProductBundleSchema.partial().extend({
  id: z.string().min(1, '套件 ID 不能为空').describe('套件的唯一系统ID'),
  items: z
    .array(
      z.object({
        productId: z.string().describe('包含的产品ID'),
        quantity: z.coerce.number().describe('包含的数量'),
        unit: z.string().optional().describe('数量单位'),
      })
    )
    .optional()
    .describe('套件包含的具体明细'),
});

export const addressSchema = z.object({
  province: z.string().optional().describe('省份或州'),
  city: z.string().optional().describe('城市'),
  district: z.string().optional().describe('区县'),
  detail: z.string().optional().describe('详细街道地址'),
});

export const contactInfoSchema = z.object({
  name: z.string().optional().describe('联系人姓名'),
  phone: z
    .string()
    .refine((val) => !val || isValidPhoneNumber(val, 'CN'), { message: '请输入有效的电话号码' })
    .optional()
    .describe('联系人电话'),
  email: z.string().email().optional().describe('联系人邮箱'),
  title: z.string().optional().describe('联系人职务'),
});

export const shipmentTrackingSchema = z.object({
  status: z.string().describe('物流当前状态'),
  events: z
    .array(
      z.object({
        time: z.string().describe('事件时间'),
        location: z.string().describe('所处位置'),
        description: z.string().describe('事件描述'),
      })
    )
    .describe('物流跟踪事件列表'),
});

/**
 * 确认付款 Schema
 */
export const confirmPaymentSchema = z.object({
  poId: z.string(),
  paymentMethod: z.enum(['CASH', 'WECHAT', 'ALIPAY', 'BANK']),
  paymentAmount: z.number().min(0.01, '付款金额必须大于0'),
  paymentTime: z.string(),
  paymentVoucherImg: z.string().optional(),
  remark: z.string().optional(),
});

/**
 * 确认收货 Schema
 * 支持部分收货：每个商品可以指定本次收货数量
 */
export const confirmReceiptSchema = z.object({
  poId: z.string().uuid(),
  warehouseId: z.string().uuid(),
  receivedDate: z.string().refine((val) => !isNaN(Date.parse(val)), '无效的日期'),
  remark: z.string().max(500).optional(),
  items: z.array(
    z.object({
      /** 采购单明细 ID，用于幂等性校验 */
      poItemId: z.string().uuid(),
      productId: z.string(),
      /** 本次收货数量 */
      quantity: z.number().min(0),
    })
  ),
});
