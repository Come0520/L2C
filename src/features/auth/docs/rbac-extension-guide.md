# Auth 模块 RBAC 扩展指南

> 版本：v1.0 | 最后更新：2026-02-23

---

## 现有 RBAC 角色体系

| 角色 | 说明 | 关键权限 |
|:---|:---|:---|
| `admin` | 系统超级管理员 | 所有操作 |
| `manager` | 租户管理员 | 租户内全部操作 |
| `BOSS` | 老板（移动端角色） | 报表查看、目标设定 |
| `sales` | 销售人员 | 线索/报价/客户 CRUD |
| `WORKER` | 工人（移动端） | 任务处理 |
| `supply` | 采购专员 | 供应链操作 |

---

## 添加新角色：标准步骤

### 第 1 步：更新数据库枚举

```typescript
// src/shared/api/schema/enums.ts
export const userRoleEnum = pgEnum('user_role', [
  'admin', 'manager', 'sales', 'worker', 'supply',
  'NEW_ROLE', // 在此追加
]);
```

### 第 2 步：更新权限矩阵

```typescript
// src/shared/lib/rbac.ts - 在 PERMISSIONS 对象中添加新角色的权限映射
export const ROLE_PERMISSIONS = {
  ...existingRoles,
  NEW_ROLE: [
    'feature:read',
    'feature:write',
  ],
};
```

### 第 3 步：更新 RBAC 测试

```bash
# 在 src/features/auth/__tests__/rbac.test.ts 添加测试用例
# 验证新角色的权限，验证旧角色的隔离
```

### 第 4 步：移动端角色映射（如需跨端）

```typescript
// src/app/api/mobile/auth/login/route.ts
switch (dbRole) {
  case 'NEW_ROLE':
    mobileRole = 'CORRESPONDING_MOBILE_ROLE';
    break;
}
```

---

## SSO 扩展预留接口

未来引入企业 SSO（LDAP / OIDC）时，在 `auth.config.ts` 中：

```typescript
// auth.config.ts - 预留扩展点
providers: [
  Credentials({ ... }), // 当前：密码登录
  // OIDC({ ... }),     // 预留：企业 SSO
  // LDAP({ ... }),     // 预留：LDAP
]
```

> [!IMPORTANT]
> 引入 SSO 时需同步更新 `tenant.settings.ssoConfig` 并确保多租户隔离不被破坏。
