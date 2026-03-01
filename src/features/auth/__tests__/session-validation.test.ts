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
vi.mock('@/shared/lib/logger', () => ({
  logger: { info: vi.fn(), error: vi.fn(), warn: vi.fn() },
}));

vi.mock('@/shared/api/db', () => ({
  db: {
    query: {
      roles: { findFirst: vi.fn() },
    },
    insert: vi.fn(() => ({ values: vi.fn() })),
  },
}));

vi.mock('next/cache', () => ({
  unstable_cache: vi.fn((fn) => fn),
}));

describe('Auth Session 校验边界', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('无 Session (null) 应拦截', async () => {
    const result = await checkPermission(null, 'any.perm');
    expect(result).toBe(false);
  });

  it('Session 缺失 user 对象应拦截', async () => {
    const result = await checkPermission({} as any, 'any.perm');
    expect(result).toBe(false);
  });

  it('有效 Session 但无角色应拦截', async () => {
    const session = { user: { id: 'u1', tenantId: 't1', roles: [] } };
    const result = await checkPermission(session as any, 'any.perm');
    expect(result).toBe(false);
  });

  it('有效 Session 正常放行', async () => {
    const session = { user: { id: 'u1', tenantId: 't1', roles: ['ADMIN'] } };
    const result = await checkPermission(session as any, 'any.perm');
    expect(result).toBe(true);
  });
});
