import { pgTable, uuid, varchar, text, timestamp, jsonb, index } from 'drizzle-orm/pg-core';
import { tenants, users } from './infrastructure';
import { orders } from './orders';
import { purchaseOrders } from './supply-chain';

/**
 * 全链路溯源 Schema
 * 
 * 功能：
 * 1. 面料缸号/批次追踪
 * 2. 风险控制闭环
 * 3. 证据链管理
 */

// ==================== 批次追踪表 ====================
export const batchTraces = pgTable('batch_traces', {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id').references(() => tenants.id).notNull(),

    // 批次信息
    batchNo: varchar('batch_no', { length: 50 }).notNull(), // 批次号
    productCode: varchar('product_code', { length: 50 }), // 产品编码
    productName: varchar('product_name', { length: 200 }), // 产品名称

    // 供应商信息
    supplierId: uuid('supplier_id'),
    supplierName: varchar('supplier_name', { length: 200 }),
    supplierBatchNo: varchar('supplier_batch_no', { length: 50 }), // 供应商批次号

    // 面料特定信息
    vatNo: varchar('vat_no', { length: 50 }), // 缸号
    dyeLot: varchar('dye_lot', { length: 50 }), // 染色批次

    // 采购关联
    purchaseOrderId: uuid('purchase_order_id').references(() => purchaseOrders.id),
    purchaseOrderNo: varchar('purchase_order_no', { length: 50 }),

    // 质量信息
    inspectionResult: varchar('inspection_result', { length: 20 }), // PASSED, FAILED, PENDING
    inspectionNotes: text('inspection_notes'),
    inspectionPhotos: text('inspection_photos').array(),

    // 数量信息
    totalQuantity: varchar('total_quantity', { length: 20 }), // 总数量
    usedQuantity: varchar('used_quantity', { length: 20 }), // 已使用数量
    remainingQuantity: varchar('remaining_quantity', { length: 20 }), // 剩余数量
    unit: varchar('unit', { length: 20 }).default('米'), // 单位

    // 扩展属性
    attributes: jsonb('attributes'), // 自定义属性（颜色、材质等）

    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
}, (table) => ({
    batchTenantIdx: index('idx_batch_tenant').on(table.tenantId),
    batchNoIdx: index('idx_batch_no').on(table.batchNo),
    batchVatIdx: index('idx_batch_vat').on(table.vatNo),
    batchSupplierIdx: index('idx_batch_supplier').on(table.supplierId),
}));

// ==================== 订单批次关联表 ====================
export const orderBatchLinks = pgTable('order_batch_links', {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id').references(() => tenants.id).notNull(),

    orderId: uuid('order_id').references(() => orders.id).notNull(),
    orderNo: varchar('order_no', { length: 50 }),
    orderItemId: uuid('order_item_id'), // 具体订单项

    batchId: uuid('batch_id').references(() => batchTraces.id).notNull(),
    batchNo: varchar('batch_no', { length: 50 }),

    quantity: varchar('quantity', { length: 20 }), // 使用数量
    unit: varchar('unit', { length: 20 }),

    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
}, (table) => ({
    linkOrderIdx: index('idx_link_order').on(table.orderId),
    linkBatchIdx: index('idx_link_batch').on(table.batchId),
}));

// ==================== 证据链表 ====================
export const evidenceChains = pgTable('evidence_chains', {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id').references(() => tenants.id).notNull(),

    // 关联实体
    entityType: varchar('entity_type', { length: 50 }).notNull(), // ORDER, AFTER_SALES, LIABILITY, INSTALL_TASK
    entityId: uuid('entity_id').notNull(),
    entityNo: varchar('entity_no', { length: 50 }),

    // 证据信息
    evidenceType: varchar('evidence_type', { length: 50 }).notNull(), // PHOTO, VIDEO, DOCUMENT, SIGNATURE, GPS, TIMESTAMP
    title: varchar('title', { length: 200 }),
    description: text('description'),

    // 证据内容
    fileUrl: text('file_url'),
    fileHash: varchar('file_hash', { length: 64 }), // SHA256 用于防篡改
    thumbnailUrl: text('thumbnail_url'),

    // GPS 位置
    latitude: varchar('latitude', { length: 20 }),
    longitude: varchar('longitude', { length: 20 }),
    address: text('address'),

    // 元数据
    metadata: jsonb('metadata').$type<{
        deviceInfo?: string;
        captureTime?: string;
        fileSize?: number;
        fileType?: string;
        duration?: number; // 视频/音频时长
        dimensions?: { width: number; height: number };
    }>(),

    // 验证状态
    isVerified: varchar('is_verified', { length: 10 }).default('false'),
    verifiedAt: timestamp('verified_at', { withTimezone: true }),
    verifiedBy: uuid('verified_by').references(() => users.id),

    // 创建信息
    createdBy: uuid('created_by').references(() => users.id),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
}, (table) => ({
    evidenceEntityIdx: index('idx_evidence_entity').on(table.entityType, table.entityId),
    evidenceTenantIdx: index('idx_evidence_tenant').on(table.tenantId),
    evidenceTypeIdx: index('idx_evidence_type').on(table.evidenceType),
}));

// ==================== 风险预警表 ====================
export const riskAlerts = pgTable('risk_alerts', {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id').references(() => tenants.id).notNull(),

    // 风险类型
    riskType: varchar('risk_type', { length: 50 }).notNull(), // BATCH_QUALITY, SUPPLIER_ISSUE, INSTALL_DELAY, PAYMENT_OVERDUE
    riskLevel: varchar('risk_level', { length: 20 }).notNull(), // LOW, MEDIUM, HIGH, CRITICAL

    // 关联实体
    entityType: varchar('entity_type', { length: 50 }), // BATCH, SUPPLIER, ORDER, CUSTOMER
    entityId: uuid('entity_id'),
    entityNo: varchar('entity_no', { length: 50 }),

    // 风险描述
    title: varchar('title', { length: 200 }).notNull(),
    description: text('description'),
    suggestedAction: text('suggested_action'),

    // 影响范围
    affectedOrders: jsonb('affected_orders').$type<string[]>(), // 受影响的订单ID列表
    affectedCount: varchar('affected_count', { length: 10 }), // 受影响数量
    potentialLoss: varchar('potential_loss', { length: 20 }), // 潜在损失金额

    // 状态
    status: varchar('status', { length: 20 }).default('OPEN'), // OPEN, ACKNOWLEDGED, RESOLVED, IGNORED
    resolvedAt: timestamp('resolved_at', { withTimezone: true }),
    resolvedBy: uuid('resolved_by').references(() => users.id),
    resolution: text('resolution'),

    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
}, (table) => ({
    riskTenantIdx: index('idx_risk_tenant').on(table.tenantId),
    riskTypeIdx: index('idx_risk_type').on(table.riskType),
    riskStatusIdx: index('idx_risk_status').on(table.status),
}));
