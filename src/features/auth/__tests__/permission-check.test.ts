/**
 * @vitest-environment node
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { checkPermission } from '@/shared/lib/auth';

// ===== Mock 依赖 =====
vi.mock('next-auth', () => ({
  default: vi.fn(() => ({
    handlers: {},
    auth: vi.fn(),
    signIn: vi.fn(),
    signOut: vi.fn(),
  })),
}));

vi.mock('next-auth/providers/credentials', () => ({
  default: vi.fn(),
}));
// 注意：db 的 mock 必须放在最外层，且在 import logic 之前
vi.mock('@/shared/api/db', () => ({
  db: {
    query: {
      roles: { findFirst: vi.fn() },
    },
    insert: vi.fn(() => ({ values: vi.fn() })),
  },
}));

vi.mock('@/shared/lib/logger', () => ({
  logger: { info: vi.fn(), error: vi.fn(), warn: vi.fn() },
}));

vi.mock('next/cache', () => ({
  unstable_cache: vi.fn((fn) => fn),
}));

describe('Auth 权限检查边界', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('跨租户权限拦截：即使角色名相同，但若数据库库回权限不匹配应拦截', async () => {
    const { db } = await import('@/shared/api/db');
    const session = {
      user: { id: 'u1', tenantId: 'tenant-a', roles: ['SALES'] },
    };

    // 模拟数据库中该租户的 SALES 角色没有管理权限
    vi.mocked(db.query.roles.findFirst).mockResolvedValue({
      permissions: ['sales.view'],
    });

    const result = await checkPermission(session as any, 'admin.config');
    expect(result).toBe(false);
  });

  it('权限层级推导：all 权限应自动包含 own 权限', async () => {
    const { db } = await import('@/shared/api/db');
    const session = {
      user: { id: 'u1', tenantId: 't1', roles: ['MANAGER'] },
    };

    vi.mocked(db.query.roles.findFirst).mockResolvedValue({
      permissions: ['order.all.edit'],
    });

    // 验证 order.own.edit 是否能通过检查
    const result = await checkPermission(session as any, 'order.own.edit');
    expect(result).toBe(true);
  });

  it('通配符 ** 权限验证', async () => {
    const { db } = await import('@/shared/api/db');
    const session = {
      user: { id: 'u1', tenantId: 't1', roles: ['ADMIN'] },
    };

    vi.mocked(db.query.roles.findFirst).mockResolvedValue({
      permissions: ['**'],
    });

    const result = await checkPermission(session as any, 'any.system.operation');
    expect(result).toBe(true);
  });
});
