import { InferSelectModel, InferInsertModel } from 'drizzle-orm';
import {
    suppliers,
    purchaseOrders,
    purchaseOrderItems,
    splitRouteRules,
    productBundles,
    productBundleItems,
    poShipments,
    poPayments,
    productionTasks,
    fabricInventory,
    fabricInventoryLogs,
    warehouses,
    auditLogs
} from '@/shared/api/schema';



// --- Base Models from Schema ---

// Suppliers
export type Supplier = InferSelectModel<typeof suppliers>;
export type NewSupplier = InferInsertModel<typeof suppliers>;

// Purchase Orders
export type PurchaseOrder = InferSelectModel<typeof purchaseOrders>;
export type NewPurchaseOrder = InferInsertModel<typeof purchaseOrders>;

export type PurchaseOrderItem = InferSelectModel<typeof purchaseOrderItems>;
export type NewPurchaseOrderItem = InferInsertModel<typeof purchaseOrderItems>;

// Split Rules
export type SplitRule = InferSelectModel<typeof splitRouteRules>;
export type NewSplitRule = InferInsertModel<typeof splitRouteRules>;

// Product Bundles
export type ProductBundle = InferSelectModel<typeof productBundles>;
export type NewProductBundle = InferInsertModel<typeof productBundles>;

export type ProductBundleItem = InferSelectModel<typeof productBundleItems>;
export type NewProductBundleItem = InferInsertModel<typeof productBundleItems>;

// Logistics & Payments
export type PoShipment = InferSelectModel<typeof poShipments>;
export type NewPoShipment = InferInsertModel<typeof poShipments>;

export type PoPayment = InferSelectModel<typeof poPayments>;
export type NewPoPayment = InferInsertModel<typeof poPayments>;

// Production
export type ProductionTask = InferSelectModel<typeof productionTasks>;
export type NewProductionTask = InferInsertModel<typeof productionTasks>;

// Inventory
export type FabricInventory = InferSelectModel<typeof fabricInventory>;
export type NewFabricInventory = InferInsertModel<typeof fabricInventory>;

export type FabricInventoryLog = InferSelectModel<typeof fabricInventoryLogs>;
export type NewFabricInventoryLog = InferInsertModel<typeof fabricInventoryLogs>;

// Audit
export type AuditLog = InferSelectModel<typeof auditLogs>;
export type NewAuditLog = InferInsertModel<typeof auditLogs>;

// --- Composite DTOs for UI ---

/**
 * Purchase Order with full details for detail view
 */
export interface PurchaseOrderAuditLog extends AuditLog {
    createdBy?: string | null; // User name
    changes?: Record<string, unknown> | null; // Processed changes
}

export interface PurchaseOrderDetail extends PurchaseOrder {
    orderNo?: string | null; // Joined from orders table
    supplier?: Supplier | null;
    items?: PurchaseOrderItem[];
    shipments?: PoShipment[];
    payments?: PoPayment[];
    auditLogs?: PurchaseOrderAuditLog[];
}

/**
 * 采购单列表项（含关联数据）
 */
export interface PurchaseOrderListItem extends PurchaseOrder {
    order?: {
        orderNo: string;
        customerName?: string | null;
    } | null;
    items?: PurchaseOrderItem[];
    itemCount?: number;
}

/**
 * 采购单详情（含完整关联数据）
 */
export interface PurchaseOrderDetail extends PurchaseOrder {
    order?: {
        id: string;
        orderNo: string;
        customerName?: string | null;
    } | null;
    supplier?: Supplier | null;
    items?: PurchaseOrderItem[];
    shipments?: PoShipment[];
    payments?: PoPayment[];
    auditLogs?: PurchaseOrderAuditLog[];
    creator?: {
        id: string;
        name: string | null;
    } | null;
}

/**
 * 采购仪表盘汇总指标
 */
export interface ProcurementMetrics {
    pending: number;
    inTransit: number;
    delayed: number;
    completed: number;
}

// --- Inventory composite types ---

/**
 * 库存水平列表项
 */
export interface InventoryListItem {
    id: string;
    warehouseId: string;
    warehouseName: string | null;
    productId: string;
    productName: string | null;
    quantity: number;
    updatedAt: Date | null;
}

/**
 * 库存预警详情
 */
export interface InventoryAlert {
    level: 'CRITICAL' | 'WARNING' | 'OK';
    item: {
        id: string;
        warehouseId: string;
        warehouseName: string | null;
        productId: string;
        productName: string | null;
        productCategory: string | null;
        quantity: number;
        minStock: number | null;
    };
    shortage: number;
}

/**
 * 补货建议
 */
export interface RestockSuggestion {
    productId: string;
    productName: string | null;
    warehouseId: string;
    warehouseName: string | null;
    currentStock: number;
    minStock: number | null;
    suggestedRestock: number;
    level: 'CRITICAL' | 'WARNING' | 'OK';
}

/**
 * 仓库信息及其库存摘要（可选）
 */
export interface WarehouseWithSummary extends InferSelectModel<typeof warehouses> {
    inventoryCount?: number;
    totalValue?: string;
}
/**
 * 供应商评价指标数据
 */
export interface SupplierRating {
    supplierId: string;
    supplierName: string;
    metrics: {
        onTimeRate: number | null;
        qualityRate: number | null;
        overallScore: number | null;
        starRating: number | null;
        ratingLabel: string;
    };
    details: {
        totalDeliveredPOs: number;
        onTimePOs: number;
        qualityIssueCount: number;
    };
    period: {
        startDate: string;
        endDate: string;
    };
}

/**
 * 供应商交付排名数据
 */
export interface SupplierRanking {
    id: string;
    name: string;
    supplierNo: string | null;
    deliveredPOs: number;
}

/**
 * 商品-供应商关联列表项
 */
export interface ProductSupplierListItem {
    id: string;
    supplierId: string;
    supplierName: string;
    contactPerson: string;
    phone: string;
    purchasePrice: number | null;
    logisticsCost: number | null;
    processingCost: number | null;
    leadTimeDays: number | null;
    minOrderQuantity: number | null;
    isDefault: boolean;
    createdAt: Date | null;
}

/**
 * 加工单列表项
 */
export interface ProcessingOrderListItem {
    id: string;
    processingNo: string;
    status: string;
    processorName: string;
    order: {
        id?: string;
        orderNo: string;
    };
    startedAt: string;
    completedAt: string | null;
    createdAt: string;
    remark?: string | null;
}

/**
 * 加工单详细信息 (包含明细)
 */
export interface ProcessingOrderDetail {
    id: string;
    processingNo: string | null;
    status: string | null;
    processorName: string;
    order: {
        id?: string;
        orderNo: string;
    };
    items: Array<{
        id: string;
        productName: string;
        sku: string;
        quantity: number;
        status: string | null;
    }>;
    startedAt: Date | null;
    completedAt: Date | null;
    remark: string | null;
    createdAt: Date | null;
}

/**
 * 拆单规则关联数据
 */
export interface SplitRuleWithRelations extends SplitRule {
    supplier?: Supplier | null;
}

/**
 * 拆单规则条件定义
 */
export interface SplitCondition {
    /** 匹配字段 (category, productName, productType) */
    field: string;
    /** 操作符 (eq, neq, contains, in) */
    operator: 'eq' | 'neq' | 'contains' | 'in';
    /** 匹配值 */
    value: string | string[];
}

/**
 * 加工厂表单初始数据 (用于编辑预览)
 */
export interface ProcessorInitialData extends Supplier {
    /**
     * 加工单价列表 (jsonb 存储)
     */
    processingPrices: {
        items: Array<{
            name: string;
            unit: string;
            price: number;
        }>;
    } | null;
}



/**
 * 物流追踪明细数据
 */
export interface ShipmentTrackingData {
    /** 运单号 */
    logisticsNo: string;
    /** 物流公司代码 */
    logisticsCode?: string;
    /** 当前状态 */
    status: string;
    /** 状态描述 */
    statusText?: string;
    /** 追踪事件列表 */
    events: ShipmentTrackingEvent[];
}

/**
 * 物流追踪事件记录
 */
export interface ShipmentTrackingEvent {
    /** 事件发生时间 */
    time: string;
    /** 事件描述 */
    content: string;
    /** 当前地点 (可选) */
    location?: string;
    /** 状态代码 (可选) */
    statusCode?: string;
}

