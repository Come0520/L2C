import { pgTable, text, timestamp, jsonb, uuid, index } from 'drizzle-orm/pg-core';
import { users, tenants } from './infrastructure';

export const auditLogs = pgTable('audit_logs', {
    id: uuid('id').defaultRandom().primaryKey(),
    tenantId: uuid('tenant_id').references(() => tenants.id).notNull(),
    tableName: text('table_name').notNull(),
    recordId: text('record_id').notNull(),
    action: text('action').notNull(), // UPDATE, DELETE, CREATE
    userId: uuid('user_id').references(() => users.id),

    changedFields: jsonb('changed_fields'), // { field: { old: val, new: val } } or list of fields
    oldValues: jsonb('old_values'),
    newValues: jsonb('new_values'),

    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
    auditTenantIdx: index('idx_audit_logs_tenant').on(table.tenantId),
    auditTableIdx: index('idx_audit_logs_table').on(table.tableName),
    auditCreatedIdx: index('idx_audit_logs_created').on(table.createdAt),
}));

