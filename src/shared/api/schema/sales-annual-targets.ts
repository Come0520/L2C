import { pgTable, uuid, integer, decimal, timestamp, uniqueIndex } from 'drizzle-orm/pg-core';
import { users, tenants } from './infrastructure';

/**
 * 年度销售目标表
 *
 * @description 管理层为每位销售设定的年度业绩目标，
 *   可一键拆解为12个月度目标（均分）
 */
export const salesAnnualTargets = pgTable(
  'sales_annual_targets',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id')
      .references(() => tenants.id)
      .notNull(),
    userId: uuid('user_id')
      .references(() => users.id)
      .notNull(),
    year: integer('year').notNull(),
    targetAmount: decimal('target_amount', { precision: 12, scale: 2 }).notNull().default('0'),

    // 审计字段
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
    updatedBy: uuid('updated_by'),
  },
  (t) => ({
    // 同一人同一年只能有一个年度目标
    unq: uniqueIndex('sales_annual_targets_user_year_idx').on(t.tenantId, t.userId, t.year),
  })
);
