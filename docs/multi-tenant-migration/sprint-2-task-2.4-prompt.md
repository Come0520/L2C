# Sprint 2 — 任务 2.4：邀请注册改造（invite-token.ts）

## 你的身份

你是一个实现子代理 (Implementer Subagent)，正在执行 L2C 多租户改造方案。

**前置条件**：Sprint 1 和任务 2.1-2.3 已完成。

## 任务描述

改造 `src/shared/lib/invite-token.ts` 中的注册函数，使员工通过邀请链接注册时：

- 先创建/查找全局 user 身份
- 再创建 tenant_members 成员资格记录

## 具体工作

### 改造 `registerEmployeeByInvite` 函数（约第 214-325 行）

核心改动：把原来「在 users 表中插入 tenantId + role」的逻辑，改为「先查找/创建 user，再在 tenant_members 中创建成员资格」。

**需要在文件顶部添加 import：**

```typescript
import { tenantMembers } from '@/shared/api/schema';
```

**替换注册逻辑（约第 253-315 行）：**

```typescript
// === 改造后的员工注册逻辑 ===

// 1. 先查找是否已有全局 user（基于手机号）
let existingUser = await db.query.users.findFirst({
  where: and(eq(users.phone, userData.phone), eq(users.isActive, true)),
});

// 2. 检查是否已经是该租户的成员
if (existingUser) {
  const existingMembership = await db.query.tenantMembers.findFirst({
    where: and(eq(tenantMembers.userId, existingUser.id), eq(tenantMembers.tenantId, tenantId)),
  });
  if (existingMembership) {
    return { success: false, error: '您已加入该企业' };
  }
}

// 3. 如果用户不存在，创建全局 user
if (!existingUser) {
  const passwordHash = await hash(userData.password, 12);

  // 检查邮箱唯一性（全局）
  if (userData.email) {
    const existingEmail = await db.query.users.findFirst({
      where: and(eq(users.email, userData.email), eq(users.isActive, true)),
    });
    if (existingEmail) {
      return { success: false, error: '该邮箱已被使用' };
    }
  }

  const [newUser] = await db
    .insert(users)
    .values({
      tenantId, // 向后兼容（过渡期保留）
      name: userData.name,
      phone: userData.phone,
      email: userData.email || null,
      passwordHash,
      role: roles[0] || 'SALES', // 向后兼容
      roles: roles, // 向后兼容
      permissions: [], // 向后兼容
      wechatOpenId: userData.wechatOpenId,
      isActive: true,
      lastActiveTenantId: tenantId,
    })
    .returning();
  existingUser = newUser;
} else {
  // 已有用户加入新租户：更新 lastActiveTenantId 到新租户
  await db.update(users).set({ lastActiveTenantId: tenantId }).where(eq(users.id, existingUser.id));
}

// 4. 创建 tenant_members 成员资格
const roles =
  validation.payload.defaultRoles ||
  (validation.payload.defaultRole ? [validation.payload.defaultRole] : ['SALES']);

await db.insert(tenantMembers).values({
  userId: existingUser.id,
  tenantId,
  role: roles[0] || 'SALES',
  roles: roles,
  permissions: [],
  isActive: true,
});

// 5. 更新邀请记录
if (invitationId) {
  await db
    .update(invitations)
    .set({
      usedCount: '1',
      isActive: false,
      updatedAt: new Date(),
    })
    .where(eq(invitations.id, invitationId));
}

return { success: true, userId: existingUser.id };
```

### 关于 `registerCustomerByInvite` 函数

暂时不改动客户注册逻辑。客户的多租户场景优先级较低（客户通常只属于一家店），可作为后续迭代。

## 注意事项

1. 过渡期仍向 `users` 表写入 `tenantId`、`role`、`roles`、`permissions`（向后兼容），同时在 `tenant_members` 中也创建记录（双写策略）
2. 如果一个人已在系统中（通过其他租户注册过），现在通过邀请链接加入新租户，不要创建新的 user 记录，只创建新的 tenant_members 记录
3. 所有代码注释必须使用**中文**
4. 工作目录：`c:\Users\bigey\Documents\Antigravity\L2C`

## 验证方式

```bash
npx tsc --noEmit --pretty 2>&1 | head -50
```

## 完成后报告

请报告修改了哪些文件、编译是否通过。
