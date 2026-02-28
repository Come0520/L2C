import { pgTable, uuid, integer, decimal, timestamp, uniqueIndex } from 'drizzle-orm/pg-core';
import { users, tenants } from './infrastructure';

/**
 * 周销售目标表
 *
 * @description 管理层为每位销售设定的周度目标，
 *   使用 ISO 周编号（1~53），与年份一起唯一标识一个周
 */
export const salesWeeklyTargets = pgTable(
  'sales_weekly_targets',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id')
      .references(() => tenants.id)
      .notNull(),
    userId: uuid('user_id')
      .references(() => users.id)
      .notNull(),
    year: integer('year').notNull(),
    /** ISO 周编号 (1~53) */
    week: integer('week').notNull(),
    targetAmount: decimal('target_amount', { precision: 12, scale: 2 }).notNull().default('0'),

    // 审计字段
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
    updatedBy: uuid('updated_by'),
  },
  (t) => ({
    // 同一人同一周只能有一个目标
    unq: uniqueIndex('sales_weekly_targets_user_week_idx').on(t.tenantId, t.userId, t.year, t.week),
  })
);
