import { pgTable, text, timestamp, jsonb, uuid } from 'drizzle-orm/pg-core';
import { users } from './infrastructure';

export const auditLogs = pgTable('audit_logs', {
    id: uuid('id').defaultRandom().primaryKey(),
    tableName: text('table_name').notNull(),
    recordId: text('record_id').notNull(),
    action: text('action').notNull(), // UPDATE, DELETE, CREATE
    userId: uuid('user_id').references(() => users.id),

    changedFields: jsonb('changed_fields'), // { field: { old: val, new: val } } or list of fields
    oldValues: jsonb('old_values'),
    newValues: jsonb('new_values'),

    createdAt: timestamp('created_at').defaultNow().notNull(),
});
