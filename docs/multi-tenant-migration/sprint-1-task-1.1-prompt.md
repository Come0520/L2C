# Sprint 1 — 任务 1.1：新增 tenant_members 表 + 更新 Schema 导出 + 更新关系定义

## 你的身份

你是一个实现子代理 (Implementer Subagent)，正在执行 L2C 多租户改造方案的第一个任务。

## 任务描述

创建 `tenant_members` 多对多关联表，并更新 Schema 导出和关系定义。这是整个多租户改造的基础。

**业务背景**：L2C 是一个窗帘行业 B2B SaaS 系统，正在从"单用户-单租户"强绑定模型升级为业界标准的 SaaS Organization 模式（参考 Clerk/WorkOS/Auth0）。核心需求是「一个工人可以同时为多家窗帘公司工作」。

## 具体工作

### 1. 创建 `src/shared/api/schema/tenant-members.ts`

新建文件，定义 `tenant_members` 表：

```typescript
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
      .references(() => users.id)
      .notNull(),

    /** 租户 ID（组织层） */
    tenantId: uuid('tenant_id')
      .references(() => tenants.id)
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
```

### 2. 在 `src/shared/api/schema/index.ts` 中添加导出

在现有导出列表中添加一行：

```typescript
export * from './tenant-members';
```

### 3. 更新 `src/shared/api/schema/relations.ts`

需要做三处修改：

**a) 修改 `tenantsRelations`（约第 115-117 行）：**

```typescript
// 旧代码：
export const tenantsRelations = relations(tenants, ({ many }) => ({
  users: many(users),
}));

// 新代码（保留 users 向后兼容，新增 members）：
export const tenantsRelations = relations(tenants, ({ many }) => ({
  users: many(users), // 向后兼容（过渡期保留）
  members: many(tenantMembers), // 新的成员关系
}));
```

**b) 修改 `usersRelations`（约第 119-124 行）：**

```typescript
// 旧代码：
export const usersRelations = relations(users, ({ one }) => ({
  tenant: one(tenants, {
    fields: [users.tenantId],
    references: [tenants.id],
  }),
}));

// 新代码（保留 tenant 向后兼容，新增 memberships）：
export const usersRelations = relations(users, ({ one, many }) => ({
  tenant: one(tenants, {
    // 向后兼容（过渡期保留，users.tenantId 尚未删除）
    fields: [users.tenantId],
    references: [tenants.id],
  }),
  memberships: many(tenantMembers), // 新的成员关系
}));
```

**c) 新增 `tenantMembersRelations`（在 `usersRelations` 之后添加）：**

```typescript
export const tenantMembersRelations = relations(tenantMembers, ({ one }) => ({
  user: one(users, {
    fields: [tenantMembers.userId],
    references: [users.id],
  }),
  tenant: one(tenants, {
    fields: [tenantMembers.tenantId],
    references: [tenants.id],
  }),
}));
```

**重要**：需要在文件顶部 import 中添加 `tenantMembers`：

```typescript
import { tenantMembers } from './tenant-members';
```

## 注意事项

1. **不要修改 `users` 表结构**！本任务只新增 `tenant_members` 表。`users` 表的改造是任务 1.2 的工作。
2. **保留 `relations.ts` 中现有的 `users.tenantId` 关系**（向后兼容），在过渡期内旧关系和新关系共存。
3. 所有代码注释必须使用**中文**。
4. 工作目录：`c:\Users\bigey\Documents\Antigravity\L2C`

## 验证方式

完成后运行以下命令检查 TypeScript 编译是否通过：

```bash
npx tsc --noEmit --pretty 2>&1 | head -50
```

## 完成后报告

请报告：

- 创建/修改了哪些文件
- TypeScript 编译是否通过
- 是否有任何问题或疑虑
