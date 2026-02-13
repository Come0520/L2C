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

export const createProcessingOrderSchema = z.object({
    orderId: z.string().min(1, "Order ID is required"),
    processorName: z.string().min(1, "Processor name is required"),
    items: z.array(z.object({
        productId: z.string(),
        quantity: z.number().min(1),
        cost: z.number().min(0),
    })),
});


export const createProductBundleSchema = z.object({
    bundleSku: z.string().min(1, "Bundle SKU is required"),
    name: z.string().min(1, "Bundle Name is required"),
    category: z.string().optional(),
    retailPrice: z.coerce.number().min(0).default(0),
    channelPrice: z.coerce.number().min(0).default(0),
    items: z.array(z.object({
        productId: z.string().min(1, "Product ID is required"),
        quantity: z.coerce.number().min(0.01, "Quantity must be greater than 0"),
        unit: z.string().optional(),
    })).min(1, "At least one item is required in the bundle"),
});

export const updateProductBundleSchema = createProductBundleSchema.partial().extend({
    id: z.string().min(1, "Bundle ID is required"),
    items: z.array(z.object({
        productId: z.string(),
        quantity: z.coerce.number(),
        unit: z.string().optional(),
    })).optional(),
});
