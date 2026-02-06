import { pgTable, uuid, varchar, text, timestamp, uniqueIndex } from 'drizzle-orm/pg-core';
import { tenants, users } from './infrastructure';

/**
 * 角色权限覆盖表
 * 存储租户对系统预设角色的权限微调
 * 
 * 设计思路：
 * - 系统预设角色（ADMIN, SALES, WORKER 等）定义在代码中
 * - 此表存储租户对预设权限的"增加"和"移除"配置
 * - 运行时合并：最终权限 = 预设权限 + addedPermissions - removedPermissions
 */
export const roleOverrides = pgTable('role_overrides', {
    id: uuid('id').primaryKey().defaultRandom(),

    // 租户关联
    tenantId: uuid('tenant_id').references(() => tenants.id).notNull(),

    // 角色代码（对应 ROLES 中的 code，如 'ADMIN', 'SALES'）
    roleCode: varchar('role_code', { length: 50 }).notNull(),

    // 在预设基础上新增的权限（JSON 数组）
    addedPermissions: text('added_permissions').default('[]').notNull(),

    // 从预设中移除的权限（JSON 数组）
    removedPermissions: text('removed_permissions').default('[]').notNull(),

    // 审计字段
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
    updatedBy: uuid('updated_by').references(() => users.id),
}, (table) => ({
    // 唯一约束：同一租户下角色代码唯一
    tenantRoleUnique: uniqueIndex('idx_role_overrides_tenant_role').on(table.tenantId, table.roleCode),
}));

// 导出类型
export type RoleOverride = typeof roleOverrides.$inferSelect;
export type NewRoleOverride = typeof roleOverrides.$inferInsert;
