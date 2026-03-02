# Sprint 1 — 任务 1.2：改造 users 表 — 新增 lastActiveTenantId

## 你的身份

你是一个实现子代理 (Implementer Subagent)，正在执行 L2C 多租户改造方案。

**前置任务**：任务 1.1 已完成（tenant_members 表已创建）。

## 任务描述

改造 `users` 表，使其成为纯粹的「全局身份表」。

**重要策略**：本任务采用**渐进式迁移**策略。我们**暂时保留** `users` 表中的 `tenantId`、`role`、`roles`、`permissions` 字段不做删除，仅新增 `lastActiveTenantId` 字段。等系统稳定运行 1-2 个版本后，再通过后续任务删除旧列。

## 具体工作

### 1. 修改 `src/shared/api/schema/infrastructure.ts`

在 `users` 表定义中新增 `lastActiveTenantId` 字段：

```typescript
export const users = pgTable('users', {
  // ... 现有字段保持不变 ...

  isPlatformAdmin: boolean('is_platform_admin').default(false),

  /** 上次活跃的租户 ID（登录时自动进入，类似 Slack "上次打开的 Workspace"） */
  lastActiveTenantId: uuid('last_active_tenant_id'),

  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});
```

在 `isPlatformAdmin` 字段之后、`createdAt` 之前插入即可。

### 2. 不需要做的事情

- ❌ **不要**删除 `tenantId`、`role`、`roles`、`permissions` 列（过渡期保留）
- ❌ **不要**修改 `relations.ts`（任务 1.1 已处理）
- ❌ **不要**修改 phone 的唯一约束（这是数据库迁移层面的事，不在 Schema 代码中）

## 注意事项

1. 所有代码注释必须使用**中文**。
2. 工作目录：`c:\Users\bigey\Documents\Antigravity\L2C`

## 验证方式

```bash
npx tsc --noEmit --pretty 2>&1 | head -50
```

## 完成后报告

请报告修改了哪些文件、编译是否通过。
