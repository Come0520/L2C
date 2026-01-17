import { pgTable, uuid, varchar, text, timestamp, index, integer, boolean } from 'drizzle-orm/pg-core';
import { tenants, users } from './infrastructure';

// 审批流程定义
export const approvalFlows = pgTable('approval_flows', {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id').references(() => tenants.id).notNull(),

    code: varchar('code', { length: 50 }).notNull(), // e.g., 'QUOTE', 'PRICE_ADJUST'
    name: varchar('name', { length: 100 }).notNull(),
    description: text('description'),

    isActive: boolean('is_active').default(true),

    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
}, (table) => ({
    flowTenantCodeIdx: index('idx_approval_flows_tenant_code').on(table.tenantId, table.code),
}));

// 审批节点定义
export const approvalNodes = pgTable('approval_nodes', {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id').references(() => tenants.id).notNull(),
    flowId: uuid('flow_id').references(() => approvalFlows.id).notNull(),

    name: varchar('name', { length: 100 }).notNull(),

    approverRole: varchar('approver_role', { length: 50 }), // e.g., 'MANAGER', 'FINANCE'
    approverUserId: uuid('approver_user_id').references(() => users.id), // Specific user

    nodeType: varchar('node_type', { length: 20 }).default('APPROVAL'), // APPROVAL, COPY
    sortOrder: integer('sort_order').default(0), // 1, 2, 3...

    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
}, (table) => ({
    nodeFlowIdx: index('idx_approval_nodes_flow').on(table.flowId),
}));

// 审批实例 (Existing table updated)
export const approvals = pgTable('approvals', {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id').references(() => tenants.id).notNull(),

    flowId: uuid('flow_id').references(() => approvalFlows.id), // Linked flow

    entityType: varchar('entity_type', { length: 50 }).notNull(),
    entityId: uuid('entity_id').notNull(),

    status: varchar('status', { length: 50 }).default('PENDING'), // PENDING, APPROVED, REJECTED, CANCELED

    requesterId: uuid('requester_id').references(() => users.id).notNull(),

    currentNodeId: uuid('current_node_id'), // Pointer to current definition node

    comment: text('comment'), // Overall comment/reason

    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
    completedAt: timestamp('completed_at', { withTimezone: true }),
}, (table) => ({
    apprTenantIdx: index('idx_approvals_tenant').on(table.tenantId),
    apprEntityIdx: index('idx_approvals_entity').on(table.entityId),
    apprRequesterIdx: index('idx_approvals_requester').on(table.requesterId),
    apprStatusIdx: index('idx_approvals_status').on(table.status),
}));

// 审批任务 (待办项)
export const approvalTasks = pgTable('approval_tasks', {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id').references(() => tenants.id).notNull(),

    approvalId: uuid('approval_id').references(() => approvals.id).notNull(),
    nodeId: uuid('node_id').references(() => approvalNodes.id), // Which definition node

    approverId: uuid('approver_id').references(() => users.id), // Actual assignee

    status: varchar('status', { length: 50 }).default('PENDING'), // PENDING, APPROVED, REJECTED
    comment: text('comment'),

    actionAt: timestamp('action_at', { withTimezone: true }), // When approved/rejected

    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
}, (table) => ({
    taskApproverIdx: index('idx_approval_tasks_approver').on(table.approverId),
    taskApprovalIdx: index('idx_approval_tasks_approval').on(table.approvalId),
}));
