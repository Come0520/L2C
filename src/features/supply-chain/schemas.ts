import { z } from 'zod';

export const createSupplierSchema = z.object({
    name: z.string().min(1, "供应商名称必填"),
    contactPerson: z.string().optional(),
    phone: z.string().optional(),
    paymentPeriod: z.enum(['CASH', 'MONTHLY']).default('CASH'),
    address: z.string().optional(),
    remark: z.string().optional(),

    // [NEW] 供应商类型
    supplierType: z.enum(['SUPPLIER', 'PROCESSOR', 'BOTH']).default('SUPPLIER'),

    // [NEW] 加工厂专属字段
    processingPrices: z.object({
        items: z.array(z.object({
            name: z.string().min(1, "工艺名称不能为空"),
            unit: z.string().default("元/米"),
            price: z.coerce.number().min(0, "价格不能为负数")
        }))
    }).optional(),
    contractUrl: z.string().optional(),
    contractExpiryDate: z.coerce.date().optional(),
    businessLicenseUrl: z.string().optional(),
    bankAccount: z.string().optional(),
    bankName: z.string().optional(),
});

export const getSuppliersSchema = z.object({
    page: z.number().min(1).default(1),
    pageSize: z.number().min(1).max(100).default(20),
    query: z.string().optional(),
    type: z.enum(['SUPPLIER', 'PROCESSOR', 'BOTH']).optional(), // [NEW] 类型筛选
});

export const getSupplierByIdSchema = z.object({
    id: z.string().min(1, "ID必填"),
});

export const updateSupplierSchema = createSupplierSchema.partial().extend({
    id: z.string().min(1, "ID必填"),
    isActive: z.boolean().optional(),
});

export const deleteSupplierSchema = z.object({
    id: z.string().min(1, "ID必填"),
});

export const createProcessingOrderSchema = z.object({
    orderId: z.string().min(1, "订单 ID 不能为空"),
    processorName: z.string().min(1, "加工商名称不能为空"),
    items: z.array(z.object({
        productId: z.string(),
        quantity: z.number().min(1, "数量必须大于 0"),
        cost: z.number().min(0, "成本不能为负数"),
    })),
});

export const createPOSchema = z.object({
    supplierId: z.string().min(1, "请选择供应商"),
    orderId: z.string().optional(),
    /** P1-04 修复：新增 type 字段，区分成品/面料/库存采购 */
    type: z.enum(['FINISHED', 'FABRIC', 'STOCK']).default('FINISHED'),
    items: z.array(z.object({
        productId: z.string().min(1, "请选择产品"),
        quantity: z.coerce.number().positive("数量必须大于 0"),
        unitCost: z.coerce.number().min(0, "单价不能为负数"),
        taxRate: z.coerce.number().optional()
    })).min(1, "请至少添加一个商品")
});

export type CreatePOFormData = z.infer<typeof createPOSchema>;


export const createProductBundleSchema = z.object({
    bundleSku: z.string().min(1, "套件 SKU 不能为空"),
    name: z.string().min(1, "套件名称不能为空"),
    category: z.string().optional(),
    retailPrice: z.coerce.number().min(0).default(0),
    channelPrice: z.coerce.number().min(0).default(0),
    items: z.array(z.object({
        productId: z.string().min(1, "产品 ID 不能为空"),
        quantity: z.coerce.number().min(0.01, "数量必须大于 0"),
        unit: z.string().optional(),
    })).min(1, "套件至少需要包含一个产品"),
});

export const updateProductBundleSchema = createProductBundleSchema.partial().extend({
    id: z.string().min(1, "套件 ID 不能为空"),
    items: z.array(z.object({
        productId: z.string(),
        quantity: z.coerce.number(),
        unit: z.string().optional(),
    })).optional(),
});

export const addressSchema = z.object({
    province: z.string().optional(),
    city: z.string().optional(),
    district: z.string().optional(),
    detail: z.string().optional(),
});

export const contactInfoSchema = z.object({
    name: z.string().optional(),
    phone: z.string().optional(),
    email: z.string().email().optional(),
    title: z.string().optional(),
});

export const shipmentTrackingSchema = z.object({
    status: z.string(),
    events: z.array(z.object({
        time: z.string(),
        location: z.string(),
        description: z.string(),
    })),
});
