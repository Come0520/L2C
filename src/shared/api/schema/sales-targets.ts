import { pgTable, uuid, integer, decimal, timestamp, uniqueIndex } from 'drizzle-orm/pg-core';
import { users, tenants } from './infrastructure';

export const salesTargets = pgTable('sales_targets', {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id').references(() => tenants.id).notNull(),
    userId: uuid('user_id').references(() => users.id).notNull(), // 关联销售人员
    year: integer('year').notNull(),
    month: integer('month').notNull(),
    targetAmount: decimal('target_amount', { precision: 12, scale: 2 }).notNull().default('0'),

    // Audit fields
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
    updatedBy: uuid('updated_by'), // 记录谁修改的
}, (t) => ({
    // 同一人同一月只能有一个目标 - 使用 tenantId + userId + year + month 唯一索引
    unq: uniqueIndex('sales_targets_user_date_idx').on(t.tenantId, t.userId, t.year, t.month),
}));
