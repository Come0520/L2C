// 通用数据工厂
export function createMockSession(overrides: Record<string, unknown> = {}) {
    return {
        user: {
            id: 'test-user-id',
            tenantId: 'test-tenant-id',
            role: 'ADMIN',
            name: 'Test Administrator',
            email: 'admin@test.com',
            ...(overrides.user || {}),
        },
        expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        ...overrides,
    };
}

export function createMockMobileSession(overrides: Record<string, unknown> = {}) {
    return {
        userId: 'test-user-id',
        tenantId: 'test-tenant-id',
        role: 'ADMIN',
        ...overrides,
    };
}
