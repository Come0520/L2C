# 系统设置（租户管理）模块 L3→L4 升级实施计划

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 将系统设置模块从 L3 (6.4/10) 升级到 L4 (≥7.0/10)，解除所有降级锁定

**Architecture:** 按四个阶段推进——文档补齐 → 测试扩充 → 代码质量 → 性能增强。每个阶段独立可交付，采用 TDD 流程。现有测试已覆盖 `tenant-config`、`system-settings`、`channel-actions`，需补充 `user-actions`、`roles-management`、`tenant-info`、`reminder-actions` 的单元测试。

**Tech Stack:** Next.js 16, Vitest, Drizzle ORM, Zod, TypeScript

---

## 阶段一：补齐文档 (D4: 2→6)

> 预计工作量：0.5 天
> 目标：解除 D4 ≤ 2 降级锁定

### Task 1: 创建模块需求文档

**Files:**

- Create: `docs/02-requirements/modules/settings.md`

**Step 1: 编写需求文档**

包含以下章节：

1. 模块概述（配置中枢角色定位）
2. 功能清单（8 大功能域 × 具体子功能）
3. 数据模型（`tenants`、`roles`、`users`、`system_settings` 表关系）
4. 权限模型（`SETTINGS.MANAGE`、`SETTINGS.USER_MANAGE`）
5. 业务规则（最后管理员保护、系统角色不可删除、软删除策略）
6. API 清单（所有导出 Server Actions）

**Step 2: Commit**

```bash
git add docs/02-requirements/modules/settings.md
git commit -m "docs: 创建系统设置模块需求文档"
```

### Task 2: 补充核心 Actions 的 JSDoc

**Files:**

- Modify: `src/features/settings/actions/system-settings-actions.ts`
- Modify: `src/features/settings/actions/user-actions.ts`
- Modify: `src/features/settings/actions/roles-management.ts`
- Modify: `src/features/settings/reminder-actions.ts`

**Step 1: 为每个导出函数补充完整 JSDoc**

每个函数需包含：

- `@description` 功能说明
- `@param` 参数说明
- `@returns` 返回值说明
- `@throws` 可能抛出的异常
- `@example` 调用示例（对外 API）

示例格式：

```typescript
/**
 * 获取当前租户的系统配置值
 *
 * @description 获取指定 key 的配置值，自动解析类型（BOOLEAN/INTEGER/DECIMAL/JSON/ENUM）。
 * 如果配置不存在，回退到 DEFAULT_SYSTEM_SETTINGS 默认值。
 *
 * @param key - 配置项键名，例如 'ENABLE_LEAD_AUTO_RECYCLE'
 * @returns Promise<unknown> 解析后的配置值
 * @throws Error 未授权访问时抛出
 */
```

**Step 2: Commit**

```bash
git add src/features/settings/
git commit -m "docs: 为系统设置核心 Actions 补充完整 JSDoc"
```

---

## 阶段二：扩充测试覆盖 (D3: 4→7)

> 预计工作量：2 天
> 目标：核心业务路径覆盖率 ≥ 80%

### 现有测试参考

现有 3 个测试文件采用统一的 mock 模式：

```typescript
// 1. vi.hoisted() 提升 mock
const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  checkPermission: vi.fn(),
  revalidatePath: vi.fn(),
  logAudit: vi.fn(),
}));

// 2. vi.mock() 注入
vi.mock('@/shared/lib/auth', () => ({
  auth: mocks.auth,
  checkPermission: mocks.checkPermission,
}));
vi.mock('next/cache', () => ({ revalidatePath: mocks.revalidatePath }));
vi.mock('@/shared/services/audit-service', () => ({
  AuditService: { log: mocks.logAudit },
}));

// 3. vi.mock('@/shared/api/db') 模拟数据库
```

### Task 3: 用户管理单元测试

**Files:**

- Create: `src/features/settings/__tests__/user-actions.test.ts`

**Step 1: 编写失败测试**

测试用例清单（~12 个）：

```typescript
describe('UserActions', () => {
  // === updateUser ===
  describe('updateUser', () => {
    it('应成功更新用户名称和角色');
    it('未授权时应返回错误');
    it('无权限时应返回错误');
    it('Zod 校验失败时应返回格式错误');
    it('用户不存在时应返回错误');
    it('不能禁用自己的账号');
    it('不能移除最后一个管理员角色');
    it('主角色应优先选择 ADMIN');
  });

  // === toggleUserActive ===
  describe('toggleUserActive', () => {
    it('应成功切换用户状态');
    it('不能禁用自己');
    it('不能禁用最后一个管理员');
  });

  // === deleteUser ===
  describe('deleteUser', () => {
    it('应执行软删除（禁用账号）');
    it('不能删除自己');
    it('不能删除最后一个管理员');
  });
});
```

**Step 2: 运行测试确认失败**

```bash
npx vitest run src/features/settings/__tests__/user-actions.test.ts
```

Expected: 全部 FAIL

**Step 3: 完善 mock 和测试断言使测试通过**

Mock 数据库需要模拟：

- `db.query.users.findFirst` — 返回用户对象
- `db.query.users.findMany` — 返回管理员列表（用于 `isLastAdmin`）
- `db.select().from().where()` — 管理员计数
- `db.transaction()` — 事务包裹
- `db.update().set().where()` — 更新操作

**Step 4: 运行测试确认通过**

```bash
npx vitest run src/features/settings/__tests__/user-actions.test.ts
```

Expected: 全部 PASS

**Step 5: Commit**

```bash
git add src/features/settings/__tests__/user-actions.test.ts
git commit -m "test: 用户管理 Actions 单元测试"
```

### Task 4: 角色管理单元测试

**Files:**

- Create: `src/features/settings/__tests__/roles-management.test.ts`

**Step 1: 编写失败测试**

测试用例清单（~10 个）：

```typescript
describe('RolesManagement Actions', () => {
  // === getRolesAction ===
  describe('getRolesAction', () => {
    it('应返回租户下所有角色');
    it('未授权时应抛出错误');
  });

  // === createRole ===
  describe('createRole', () => {
    it('应成功创建自定义角色');
    it('Zod 校验失败时应返回错误');
    it('角色代码重复时应返回错误');
    it('无效权限代码应返回错误');
  });

  // === updateRole ===
  describe('updateRole', () => {
    it('应成功更新自定义角色');
    it('系统角色不能修改权限');
    it('角色不存在时应返回错误');
  });

  // === deleteRole ===
  describe('deleteRole', () => {
    it('应成功删除自定义角色');
    it('系统角色不能删除');
    it('有用户使用时不能删除');
  });
});
```

**Step 2-5: 同 Task 3 流程**

运行命令：

```bash
npx vitest run src/features/settings/__tests__/roles-management.test.ts
```

Commit:

```bash
git add src/features/settings/__tests__/roles-management.test.ts
git commit -m "test: 角色管理 Actions 单元测试"
```

### Task 5: 租户信息管理单元测试

**Files:**

- Create: `src/features/settings/__tests__/tenant-info.test.ts`

**Step 1: 编写失败测试**

测试用例清单（~8 个）：

```typescript
describe('TenantInfo Actions', () => {
  // === getTenantInfo ===
  describe('getTenantInfo', () => {
    it('应返回租户基本信息');
    it('未授权时应返回错误');
  });

  // === canEditTenantInfo ===
  describe('canEditTenantInfo', () => {
    it('有权限时返回 true');
    it('无权限时返回 false');
  });

  // === updateTenantInfo ===
  describe('updateTenantInfo', () => {
    it('应成功更新租户名称');
    it('Zod 校验失败（名称为空）应返回错误');
    it('邮箱格式不正确应返回错误');
  });

  // === submitVerification ===
  describe('submitVerification', () => {
    it('应成功提交企业认证申请');
  });
});
```

**Step 2-5: 同 Task 3 流程**

运行命令：

```bash
npx vitest run src/features/settings/__tests__/tenant-info.test.ts
```

Commit:

```bash
git add src/features/settings/__tests__/tenant-info.test.ts
git commit -m "test: 租户信息管理 Actions 单元测试"
```

### Task 6: 提醒规则单元测试

**Files:**

- Create: `src/features/settings/__tests__/reminder-actions.test.ts`

**Step 1: 编写失败测试**

测试用例清单（~6 个）：

```typescript
describe('ReminderActions', () => {
  describe('getReminderRules', () => {
    it('应返回规则列表');
    it('规则不存在时返回空数组');
  });

  describe('createReminderRule', () => {
    it('应成功创建提醒规则');
    it('未授权时应返回错误');
  });

  describe('updateReminderRule', () => {
    it('应成功更新提醒规则');
    it('规则不存在时应返回错误');
  });

  describe('deleteReminderRule', () => {
    it('应成功删除提醒规则');
  });
});
```

**Step 2-5: 同 Task 3 流程**

运行命令：

```bash
npx vitest run src/features/settings/__tests__/reminder-actions.test.ts
```

Commit:

```bash
git add src/features/settings/__tests__/reminder-actions.test.ts
git commit -m "test: 提醒规则 Actions 单元测试"
```

---

## 阶段三：消除代码质量问题 (D2: 7→8)

> 预计工作量：0.5 天

### Task 7: 替换 `any` 类型

**Files:**

- Modify: `src/features/settings/components/role-list.tsx:16-17`
- Modify: `src/features/settings/components/role-form.tsx:11`
- Modify: `src/features/settings/components/channel-list.tsx:16-17`
- Modify: `src/features/settings/components/roles-settings-actions.tsx:63`
- Modify: `src/features/settings/components/reminder-rule-form.tsx:11`

**Step 1: 定义类型并替换**

为每个 `any` 定义对应的接口：

```typescript
// role-list.tsx
interface RoleListItem {
    id: string;
    code: string;
    name: string;
    description: string | null;
    permissions: string[];
    isSystem: boolean;
}

// Props 替换
data: RoleListItem[];
onEdit?: (role: RoleListItem) => void;

// channel-list.tsx
interface ChannelListItem {
    id: string;
    name: string;
    code: string | null;
    parentId: string | null;
    isActive: boolean;
}

data: ChannelListItem[];
categories?: ChannelListItem[];
```

**Step 2: 运行类型检查确认无错误**

```bash
npx tsc --noEmit --pretty 2>&1 | Select-String "settings"
```

**Step 3: Commit**

```bash
git add src/features/settings/components/
git commit -m "refactor: 替换 settings 模块 7 处 any 类型"
```

### Task 8: 清理重复注释

**Files:**

- Modify: `src/features/settings/actions/user-actions.ts:244,317`
- Modify: `src/features/settings/actions/roles-management.ts:189,279,347`

**Step 1: 删除重复注释行**

以下位置有连续重复的 `// 记录xxx日志`，删除多余的一行：

- `user-actions.ts` 第 244 行: `// 记录状态变更日志` (重复)
- `user-actions.ts` 第 317 行: `// 记录软删除日志` (重复)
- `roles-management.ts` 第 189 行: `// 记录创建日志` (重复)
- `roles-management.ts` 第 279 行: `// 记录更新日志` (重复)
- `roles-management.ts` 第 347 行: `// 记录删除日志` (重复)

**Step 2: Commit**

```bash
git add src/features/settings/actions/
git commit -m "refactor: 清理 settings 重复注释"
```

---

## 阶段四：增强性能 (D8: 5→6)

> 预计工作量：1 天

### Task 9: 设置子页面按 Tab 懒加载

**Files:**

- Modify: 设置页面路由组件（`src/app/(dashboard)/settings/` 下的各子页面）

**Step 1: 使用 `next/dynamic` 动态导入配置组件**

```typescript
import dynamic from 'next/dynamic';

const SystemParamsConfig = dynamic(
    () => import('@/features/settings/components/system-params-config'),
    { loading: () => <Skeleton className="h-96 w-full" /> }
);
```

对 48 个组件中较重的组件（>10KB）实施懒加载：

- `approval-flow-designer.tsx` (12KB)
- `permission-matrix.tsx` (14KB)
- `tenant-info-form.tsx` (15KB)
- `verification-form.tsx` (16KB)
- `split-rules-config.tsx` (13KB)
- `audit-log-panel.tsx` (10KB)
- `tenant-feature-control.tsx` (10KB)

**Step 2: 验证页面正常加载**

启动开发服务器并手动验证每个 Tab 切换是否正常：

```bash
pnpm dev -p 3000
```

访问 `http://localhost:3000/settings` 逐个点击 Tab 确认组件正常渲染。

**Step 3: Commit**

```bash
git add src/app/\(dashboard\)/settings/
git commit -m "perf: 设置子页面重型组件按需加载"
```

### Task 10: 替换 console.error 为结构化日志

**Files:**

- Modify: `src/features/settings/actions/system-settings-actions.ts`

**Step 1: 统一错误处理**

将 `console.error` 替换为可追溯的结构化错误输出：

```typescript
// Before
console.error(`获取分类 ${category} 的配置失败:`, error);

// After
console.error(`[Settings][getSettingsByCategory] 分类=${category}`, {
  error: error instanceof Error ? error.message : error,
  tenantId: session.user.tenantId,
});
```

**Step 2: Commit**

```bash
git add src/features/settings/actions/system-settings-actions.ts
git commit -m "refactor: 系统设置 Actions 结构化错误日志"
```

---

## 验证计划

### 自动化测试

完成所有 Task 后，运行全量测试：

```bash
npx vitest run src/features/settings/__tests__/ --reporter=verbose
```

Expected: 全部 PASS（预计 7 个测试文件，~70 个用例）

### 类型检查

```bash
npx tsc --noEmit --pretty 2>&1 | Select-String "settings"
```

Expected: 零类型错误

### 预估升级后得分

|     维度      |  当前   |  预估   |   变化    |
| :-----------: | :-----: | :-----: | :-------: |
| D1 功能完整性 |    8    |    8    |     —     |
|  D2 代码质量  |    7    |    8    |    ↑1     |
|  D3 测试覆盖  |    4    |    7    |    ↑3     |
| D4 文档完整性 |    2    |    6    |    ↑4     |
|   D5 UI/UX    |    7    |    7    |     —     |
|  D6 安全规范  |    8    |    8    |     —     |
|  D7 可运维性  |    7    |    7    |     —     |
|  D8 性能优化  |    5    |    6    |    ↑1     |
| **综合得分**  | **6.4** | **7.2** | **↑0.8**  |
|   **等级**    |   L3    | **L4**  | **↑1 级** |

无降级规则触发，预计达成 🟢 **L4 生产就绪 (Production-Ready)**。
