import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getAvailableRoles } from '../actions/roles';
import { ROLES } from '@/shared/config/roles';

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  checkPermission: vi.fn(),
  dbFindMany: vi.fn(),
  dbInsertValues: vi.fn(),
  dbOnConflictDoNothing: vi.fn(),
}));

vi.mock('@/shared/lib/auth', () => ({
  auth: mocks.auth,
  checkPermission: mocks.checkPermission,
}));

vi.mock('@/shared/api/db', () => ({
  db: {
    query: {
      roles: {
        findMany: mocks.dbFindMany,
      },
    },
    insert: vi.fn().mockReturnValue({
      values: vi.fn().mockReturnValue({
        onConflictDoNothing: mocks.dbOnConflictDoNothing,
      }),
    }),
  },
}));

describe('Roles Actions', () => {
  const mockSession = { user: { id: 'u1', tenantId: 't1' } };
  const mockDbRoles = [
    { id: '1', name: 'Admin', code: 'ADMIN', description: 'desc', isSystem: true },
    { id: '2', name: 'User', code: 'USER', description: '', isSystem: false },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    mocks.auth.mockResolvedValue(mockSession);
    // 默认 checkPermission 返回 true（模拟有权限的管理员账号）
    mocks.checkPermission.mockResolvedValue(true);
  });

  it('should return available roles from database', async () => {
    mocks.dbFindMany.mockResolvedValue(mockDbRoles);

    const result = await getAvailableRoles();
    expect(result.length).toBe(2);
    expect(result[0]).toEqual({
      label: 'Admin (ADMIN)',
      value: 'ADMIN',
      description: 'desc',
      isSystem: true,
    });
    expect(result[1]).toEqual({
      label: 'User (USER)',
      value: 'USER',
      description: '',
      isSystem: false,
    });
  });

  it('should initialize default roles if none exist', async () => {
    // First call returns empty, second call returns initialized roles
    mocks.dbFindMany
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([
        { name: ROLES.ADMIN.name, code: ROLES.ADMIN.code, description: '', isSystem: true },
      ]);

    mocks.dbOnConflictDoNothing.mockResolvedValue(undefined);

    const result = await getAvailableRoles();

    expect(mocks.dbOnConflictDoNothing).toHaveBeenCalled();
    expect(result.length).toBe(1);
    expect(result[0].value).toBe(ROLES.ADMIN.code);
  });

  it('should handle unauthenticated user', async () => {
    mocks.auth.mockResolvedValue(null);
    const result = await getAvailableRoles();
    expect(result).toEqual([]);
  });

  it('should handle database error gracefully', async () => {
    mocks.dbFindMany.mockRejectedValue(new Error('DB Error'));
    const result = await getAvailableRoles();
    expect(result).toEqual([]);
  });
});
