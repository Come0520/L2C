# Sprint 4 — 任务 4.1：新增测试 + 全量回归

## 你的身份

你是一个实现子代理 (Implementer Subagent)，正在执行 L2C 多租户改造方案的测试阶段。

**前置条件**：Sprint 1-3 已全部完成。

## 任务描述

为多租户改造新增核心测试，并运行全量回归确保未破坏现有功能。

## 具体工作

### 1. 新增测试文件

#### `src/shared/api/schema/__tests__/tenant-members.test.ts`

测试 tenant_members Schema 定义：

```typescript
import { describe, it, expect } from 'vitest';
import { tenantMembers } from '../tenant-members';

describe('tenant_members Schema 定义', () => {
  it('应该导出 tenantMembers 表定义', () => {
    expect(tenantMembers).toBeDefined();
  });

  it('应该包含必要字段', () => {
    // 检查关键列是否存在
    const columns = Object.keys(tenantMembers);
    expect(columns).toContain('id');
    expect(columns).toContain('userId');
    expect(columns).toContain('tenantId');
    expect(columns).toContain('role');
    expect(columns).toContain('roles');
    expect(columns).toContain('permissions');
    expect(columns).toContain('isActive');
  });
});
```

#### `src/app/api/auth/__tests__/switch-tenant.test.ts`

测试切换租户 API：

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock 依赖
vi.mock('@/shared/lib/auth', () => ({
  auth: vi.fn(),
}));

vi.mock('@/shared/api/db', () => ({
  db: {
    query: {
      tenantMembers: {
        findFirst: vi.fn(),
        findMany: vi.fn(),
      },
    },
    update: vi.fn().mockReturnValue({
      set: vi.fn().mockReturnValue({
        where: vi.fn(),
      }),
    }),
  },
}));

describe('POST /api/auth/switch-tenant', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('未登录应返回 401', async () => {
    const { auth } = await import('@/shared/lib/auth');
    vi.mocked(auth).mockResolvedValue(null);

    const { POST } = await import('../switch-tenant/route');
    const request = new Request('http://localhost/api/auth/switch-tenant', {
      method: 'POST',
      body: JSON.stringify({ targetTenantId: 'some-id' }),
    });

    const response = await POST(request as any);
    expect(response.status).toBe(401);
  });

  it('非该租户成员应返回 403', async () => {
    const { auth } = await import('@/shared/lib/auth');
    vi.mocked(auth).mockResolvedValue({
      user: { id: 'user-1', tenantId: 'tenant-1' },
    } as any);

    const { db } = await import('@/shared/api/db');
    vi.mocked(db.query.tenantMembers.findFirst).mockResolvedValue(undefined);

    const { POST } = await import('../switch-tenant/route');
    const request = new Request('http://localhost/api/auth/switch-tenant', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ targetTenantId: '00000000-0000-0000-0000-000000000001' }),
    });

    const response = await POST(request as any);
    expect(response.status).toBe(403);
  });
});
```

#### `src/shared/lib/__tests__/multi-tenant-auth.test.ts`

测试多租户认证场景：

```typescript
import { describe, it, expect } from 'vitest';

describe('多租户认证逻辑', () => {
  describe('超管登录', () => {
    it('超管应获得 __PLATFORM__ tenantId', () => {
      // 模拟超管认证逻辑
      const user = { isPlatformAdmin: true, id: 'admin-1' };

      if (user.isPlatformAdmin) {
        const result = {
          tenantId: '__PLATFORM__',
          role: 'PLATFORM_ADMIN',
        };
        expect(result.tenantId).toBe('__PLATFORM__');
        expect(result.role).toBe('PLATFORM_ADMIN');
      }
    });
  });

  describe('单租户用户', () => {
    it('只有一个成员资格时应自动选择', () => {
      const memberships = [{ tenantId: 'tenant-1', role: 'SALES' }];

      if (memberships.length === 1) {
        const result = memberships[0];
        expect(result.tenantId).toBe('tenant-1');
      }
    });
  });

  describe('多租户用户', () => {
    it('应优先使用 lastActiveTenantId', () => {
      const memberships = [
        { tenantId: 'tenant-1', role: 'SALES' },
        { tenantId: 'tenant-2', role: 'INSTALLER' },
      ];
      const lastActiveTenantId = 'tenant-2';

      const activeMembership =
        memberships.find((m) => m.tenantId === lastActiveTenantId) || memberships[0];

      expect(activeMembership.tenantId).toBe('tenant-2');
    });

    it('lastActiveTenantId 无效时应使用第一个', () => {
      const memberships = [
        { tenantId: 'tenant-1', role: 'SALES' },
        { tenantId: 'tenant-2', role: 'INSTALLER' },
      ];
      const lastActiveTenantId = 'deleted-tenant';

      const activeMembership =
        memberships.find((m) => m.tenantId === lastActiveTenantId) || memberships[0];

      expect(activeMembership.tenantId).toBe('tenant-1');
    });
  });
});
```

### 2. 运行全量回归

```bash
npx vitest run 2>&1 | tail -30
```

确保所有现有测试通过。如果有测试因为多租户改造而失败，逐个分析修复。

## 注意事项

1. 测试中所有 mock 数据要有实际意义，不能用无意义的字符串
2. 所有测试描述和注释必须使用**中文**
3. 如果全量回归发现了因改造导致的失败，需要在报告中详细说明
4. 工作目录：`c:\Users\bigey\Documents\Antigravity\L2C`

## 验证方式

```bash
# 运行新增的测试
npx vitest run tenant-members switch-tenant multi-tenant-auth

# 运行全量回归
npx vitest run
```

## 完成后报告

请报告：

- 创建了哪些测试文件
- 新增测试的通过/失败状况
- 全量回归的结果（通过/失败数量）
- 如有失败测试，分析是因为改造导致还是原有问题
