import { pgTable, uuid, varchar, text, timestamp, index } from 'drizzle-orm/pg-core';
import { tenants, users } from './infrastructure';

export const approvals = pgTable('approvals', {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id').references(() => tenants.id).notNull(),
    
    entityType: varchar('entity_type', { length: 50 }).notNull(), // 'QUOTE', 'ORDER', 'PO'
    entityId: uuid('entity_id').notNull(),
    
    status: varchar('status', { length: 50 }).default('PENDING'),
    
    requesterId: uuid('requester_id').references(() => users.id).notNull(),
    approverId: uuid('approver_id').references(() => users.id),
    
    comment: text('comment'),
    
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
}, (table) => ({
    apprTenantIdx: index('idx_approvals_tenant').on(table.tenantId),
    apprEntityIdx: index('idx_approvals_entity').on(table.entityId),
}));
