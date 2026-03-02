import { pgTable, uuid, varchar, jsonb, boolean, timestamp, unique } from 'drizzle-orm/pg-core';
import { users, tenants } from './infrastructure';

/**
 * 租户成员表 (Membership)
 *
 * 业界标准 SaaS 模型核心表：
 * - 一个 user 可以属于多个 tenant（一人多份工）
 * - 每个 membership 记录用户在该租户内的角色和权限
 * - 参考 Clerk Organizations / WorkOS Organizations
 */
export const tenantMembers = pgTable(
  'tenant_members',
  {
    id: uuid('id').primaryKey().defaultRandom(),

    /** 用户 ID（身份层） */
    userId: uuid('user_id')
      .references(() => users.id, { onDelete: 'cascade' })
      .notNull(),

    /** 租户 ID（组织层） */
    tenantId: uuid('tenant_id')
      .references(() => tenants.id, { onDelete: 'cascade' })
      .notNull(),

    /** 主角色（向后兼容） */
    role: varchar('role', { length: 50 }).default('SALES'),

    /** 多角色列表 */
    roles: jsonb('roles').$type<string[]>().default([]),

    /** 细粒度权限 */
    permissions: jsonb('permissions').default([]),

    /** 是否激活（软删除/停用） */
    isActive: boolean('is_active').default(true),

    /** 加入时间 */
    joinedAt: timestamp('joined_at', { withTimezone: true }).defaultNow(),

    /** 更新时间 */
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
  },
  (table) => [unique('uq_user_tenant').on(table.userId, table.tenantId)]
);
