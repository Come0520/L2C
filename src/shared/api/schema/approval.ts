import { pgTable, uuid, varchar, text, timestamp, index, integer, boolean, numeric, jsonb, type AnyPgColumn } from 'drizzle-orm/pg-core';
import { tenants, users } from './infrastructure';
import { approverRoleEnum, approvalNodeModeEnum, approvalTimeoutActionEnum, delegationTypeEnum } from './enums';

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

    // Visual Designer Definition (Positions, Edges, etc.)
    definition: jsonb('definition').default({ nodes: [], edges: [] }),
}, (table) => ({
    flowTenantCodeIdx: index('idx_approval_flows_tenant_code').on(table.tenantId, table.code),
}));

// 审批节点定义
export const approvalNodes = pgTable('approval_nodes', {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id').references(() => tenants.id).notNull(),
    flowId: uuid('flow_id').references(() => approvalFlows.id, { onDelete: 'cascade' }).notNull(),

    name: varchar('name', { length: 100 }).notNull(),

    approverRole: approverRoleEnum('approver_role'),
    approverUserId: uuid('approver_user_id').references(() => users.id), // Specific user

    nodeType: varchar('node_type', { length: 20 }).default('APPROVAL'), // APPROVAL, COPY

    // New features for parallel approval and timeout
    approverMode: approvalNodeModeEnum('approver_mode').default('ANY'),
    timeoutHours: integer('timeout_hours'),
    timeoutAction: approvalTimeoutActionEnum('timeout_action').default('REMIND'),

    minAmount: numeric('min_amount', { precision: 12, scale: 2 }),
    maxAmount: numeric('max_amount', { precision: 12, scale: 2 }),

    // Condition logic: JSON structure like { field: 'dept', operator: 'eq', value: 'sales' }
    conditions: jsonb('conditions').default([]),

    sortOrder: integer('sort_order').default(0), // 1, 2, 3...

    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
}, (table) => ({
    nodeFlowIdx: index('idx_approval_nodes_flow').on(table.flowId),
}));

// 审批委托
export const approvalDelegations = pgTable('approval_delegations', {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id').references(() => tenants.id).notNull(),

    delegatorId: uuid('delegator_id').references(() => users.id).notNull(),
    delegateeId: uuid('delegatee_id').references(() => users.id).notNull(),

    type: delegationTypeEnum('type').default('GLOBAL'),
    flowId: uuid('flow_id').references(() => approvalFlows.id), // Optional if type is FLOW

    startTime: timestamp('start_time', { withTimezone: true }).notNull(),
    endTime: timestamp('end_time', { withTimezone: true }).notNull(),

    reason: text('reason'),
    isActive: boolean('is_active').default(true),

    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
}, (table) => ({
    delegatorIdx: index('idx_approval_delegations_delegator').on(table.delegatorId),
    delegateeIdx: index('idx_approval_delegations_delegatee').on(table.delegateeId),
    activeIdx: index('idx_approval_delegations_active').on(table.isActive),
}));

// 审批实例
export const approvals = pgTable('approvals', {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id').references(() => tenants.id).notNull(),

    flowId: uuid('flow_id').references(() => approvalFlows.id), // Linked flow

    entityType: varchar('entity_type', { length: 50 }).notNull(),
    entityId: uuid('entity_id').notNull(),

    status: varchar('status', { length: 50 }).default('PENDING'), // PENDING, APPROVED, REJECTED, CANCELED

    requesterId: uuid('requester_id').references(() => users.id).notNull(),

    currentNodeId: uuid('current_node_id').references(() => approvalNodes.id), // 当前节点关联

    comment: text('comment'), // 审批说明

    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
    completedAt: timestamp('completed_at', { withTimezone: true }),
}, (table) => ({
    apprTenantIdx: index('idx_approvals_tenant').on(table.tenantId),
    apprEntityIdx: index('idx_approvals_entity').on(table.entityId),
    apprRequesterIdx: index('idx_approvals_requester').on(table.requesterId),
    apprStatusIdx: index('idx_approvals_status').on(table.status),
    // Performance optimization: Composite index for request history queries
    apprTenantRequesterIdx: index('idx_approvals_tenant_requester').on(table.tenantId, table.requesterId),
}));

// 审批任务 (待办项)
export const approvalTasks = pgTable('approval_tasks', {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id').references(() => tenants.id).notNull(),

    approvalId: uuid('approval_id').references(() => approvals.id, { onDelete: 'cascade' }).notNull(),
    nodeId: uuid('node_id').references(() => approvalNodes.id), // Which definition node

    approverId: uuid('approver_id').references(() => users.id), // Actual assignee

    status: varchar('status', { length: 50 }).default('PENDING'), // PENDING, APPROVED, REJECTED
    comment: text('comment'),

    // 加签支持 (Dynamic addition)
    isDynamic: boolean('is_dynamic').default(false),
    parentTaskId: uuid('parent_task_id').references((): AnyPgColumn => approvalTasks.id), // 加签来源

    actionAt: timestamp('action_at', { withTimezone: true }), // When approved/rejected
    timeoutAt: timestamp('timeout_at', { withTimezone: true }), // When this task will timeout

    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
}, (table) => ({
    taskApproverIdx: index('idx_approval_tasks_approver').on(table.approverId),
    taskApprovalIdx: index('idx_approval_tasks_approval').on(table.approvalId),
    taskTimeoutIdx: index('idx_approval_tasks_timeout').on(table.timeoutAt), // Index for timeout queries
    // Performance optimization: Composite index for task queries (Pending/Processed)
    taskTenantApproverStatusIdx: index('idx_approval_tasks_tenant_approver_status').on(table.tenantId, table.approverId, table.status),
}));
