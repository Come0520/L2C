# 任务 5：路由守卫与权限拦截

## 任务概述

实现前端路由守卫，确保未登录用户和权限不足用户无法访问受保护页面。

## 项目上下文

- **项目路径**：`miniprogram-taro/`
- **技术栈**：Taro 4.x + React 18 + TypeScript + Zustand
- **认证 Store**：`src/stores/auth.ts`
  - `useAuthStore()` 返回 `{ isLoggedIn, currentRole, userInfo, token }`
  - `UserRole` 类型：`'manager' | 'sales' | 'worker' | 'customer' | 'guest' | 'admin'`
  - `ROLE_HOME` 常量：各角色默认页路径
- **注释语言**：所有代码注释必须使用中文

### 角色与页面访问矩阵

| 页面                   | manager | sales | worker | customer | guest |
| :--------------------- | :-----: | :---: | :----: | :------: | :---: |
| workbench              |   ✅    |  ✅   |   ❌   |    ❌    |  ❌   |
| leads                  |   ❌    |  ✅   |   ❌   |    ❌    |  ❌   |
| showroom               |   ❌    |  ✅   |   ❌   |    ✅    |  ❌   |
| tasks                  |   ❌    |  ❌   |   ✅   |    ❌    |  ❌   |
| quotes                 |   ✅    |  ✅   |   ❌   |    ❌    |  ❌   |
| orders                 |   ✅    |  ✅   |   ❌   |    ❌    |  ❌   |
| crm                    |   ✅    |  ✅   |   ❌   |    ❌    |  ❌   |
| login/register/landing |   ✅    |  ✅   |   ✅   |    ✅    |  ✅   |

## 交付物

### 1. 创建 `src/utils/route-guard.ts`

```typescript
/**
 * 路由守卫工具
 *
 * @description 提供认证和角色两级权限校验。
 */
import Taro from '@tarojs/taro';
import { useAuthStore, ROLE_HOME, type UserRole } from '@/stores/auth';

/** 不需要登录即可访问的页面白名单 */
const PUBLIC_PAGES = [
  '/pages/landing/index',
  '/pages/landing/booking/index',
  '/pages/login/index',
  '/pages/register/index',
  '/pages/status/index',
  '/pages/invite/index',
];

/**
 * 检查是否为公开页面
 */
export function isPublicPage(path: string): boolean {
  return PUBLIC_PAGES.some((p) => path.startsWith(p));
}

/**
 * 认证守卫 — 确保用户已登录
 *
 * @returns true 表示已通过守卫，可继续执行
 */
export function requireAuth(): boolean {
  const { isLoggedIn } = useAuthStore.getState();
  if (!isLoggedIn) {
    Taro.redirectTo({ url: '/pages/login/index' });
    return false;
  }
  return true;
}

/**
 * 角色守卫 — 确保当前角色有权访问
 *
 * @param allowedRoles - 允许访问的角色列表
 * @returns true 表示已通过守卫
 */
export function requireRole(allowedRoles: UserRole[]): boolean {
  if (!requireAuth()) return false;

  const { currentRole } = useAuthStore.getState();
  if (!allowedRoles.includes(currentRole)) {
    // 跳转到该角色的默认首页
    const home = ROLE_HOME[currentRole] || '/pages/login/index';
    Taro.switchTab({ url: home }).catch(() => {
      Taro.redirectTo({ url: home });
    });
    return false;
  }
  return true;
}
```

### 2. 在核心页面添加守卫调用

在以下页面的组件**顶层**（`useLoad` 或组件函数体顶部）调用守卫：

```typescript
// 示例：workbench/index.tsx
import { requireRole } from '@/utils/route-guard';

export default function Workbench() {
  useLoad(() => {
    if (!requireRole(['manager', 'admin', 'sales'])) return;
    // 正常逻辑...
  });
  // ...
}
```

需要添加守卫的页面清单：

| 页面                      | 守卫类型      | 允许角色                        |
| :------------------------ | :------------ | :------------------------------ |
| `workbench/index.tsx`     | `requireRole` | `['manager', 'admin', 'sales']` |
| `leads/index.tsx`         | `requireRole` | `['sales', 'manager', 'admin']` |
| `tasks/index.tsx`         | `requireRole` | `['worker']`                    |
| `quotes/index.tsx`        | `requireRole` | `['manager', 'admin', 'sales']` |
| `orders/index.tsx`        | `requireRole` | `['manager', 'admin', 'sales']` |
| `crm/index.tsx`           | `requireRole` | `['manager', 'admin', 'sales']` |
| `showroom/index.tsx`      | `requireRole` | `['sales', 'customer']`         |
| `users/profile/index.tsx` | `requireAuth` | 所有已登录用户                  |

### 3. 编写单元测试

创建 `src/utils/__tests__/route-guard.test.ts`，至少包含：

| 用例 | 描述                                         |
| :--- | :------------------------------------------- |
| 1    | `requireAuth` 未登录时应重定向到登录页       |
| 2    | `requireAuth` 已登录时应返回 true            |
| 3    | `requireRole` 未登录时应重定向到登录页       |
| 4    | `requireRole` 角色匹配时应返回 true          |
| 5    | `requireRole` 角色不匹配时应重定向到角色首页 |
| 6    | `isPublicPage` 应正确识别公开页面            |
| 7    | `isPublicPage` 应正确拒绝非公开页面          |

## 约束

- 守卫逻辑使用同步方式（从 Store 读取状态），不涉及异步请求
- 白名单页面不需要添加守卫
- 不修改 `auth.ts` Store 源码
- 不修改导航流程（仍使用 switchTab / redirectTo）

## 验证标准

```bash
cd miniprogram-taro && npx jest src/utils/__tests__/route-guard.test.ts
# 输出：1 test suite, 7 tests passed

cd miniprogram-taro && npx taro build --type weapp
# 编译无错误
```
