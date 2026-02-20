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
    auditLogs
} from '@/shared/api/schema';
import { z } from 'zod';
import {
    addressSchema,
    contactInfoSchema,
    shipmentTrackingSchema
} from './schemas';

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
 * Purchase Order List Item for tables
 */
export interface PurchaseOrderListItem extends PurchaseOrder {
    itemCount?: number;
}

/**
 * Split Rule with relational data
 */
export type SplitConditionOp = 'eq' | 'neq' | 'gt' | 'lt' | 'in' | 'contains';

export interface SplitCondition {
    field: string;
    operator: SplitConditionOp;
    value: string | number | string[] | number[];
}

export interface SplitRuleWithRelations extends SplitRule {
    supplier?: Supplier | null;
    conditions: SplitCondition[] | null;
}

/**
 * Structure for Logistics Tracking Component
 */
export interface ShipmentTrackerProps {
    orderId?: string;
    company?: string;
    trackingNo?: string;
    status?: string;
    trackingData?: z.infer<typeof shipmentTrackingSchema>; // To be refined if we integrate with external tracking API
    updatedAt?: string | Date;
}

/**
 * Extended Supplier type for Processor operations
 */
export interface ProcessorFormData {
    id?: string;
    tenantId?: string;
    name: string;
    supplierNo: string;
    contactInfo?: z.infer<typeof contactInfoSchema> | null;
    address?: z.infer<typeof addressSchema> | null;
    rating?: number | null;
    tags?: string[] | null;
    status?: string | null; // e.g., 'ACTIVE', 'INACTIVE'

    // Processor specific fields
    supplierType?: 'PROCESSOR' | 'SUPPLIER' | 'logistics' | 'other';
    processingPrices?: {
        items: Array<{
            name: string;
            price: number;
            unit: string;
            currency?: string;
        }>;
    };
    paymentPeriod?: string;

    // Virtual fields for form state (files handling)
    files?: Array<{
        name: string;
        url: string;
        type: string;
    }>;
}

/**
 * Initial data structure for ProcessorDialog
 */
export type ProcessorInitialData = Partial<ProcessorFormData> & {
    id?: string;
};

/**
 * Shipment tracking data structure
 */
export interface ShipmentTrackingData {
    status: string;
    events: Array<{
        time: string;
        location: string;
        description: string;
    }>;
}

// Re-export common types from schema if needed or keep them scoped here
