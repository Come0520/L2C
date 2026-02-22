import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getQuoteModeConfig, saveQuoteModeConfig } from '../actions/quote-config-actions';
import { DEFAULT_QUOTE_MODE_CONFIG, type QuoteModeConfig } from '../lib/quote-mode-constants';

const mocks = vi.hoisted(() => ({
    auth: vi.fn(),
    checkPermission: vi.fn(),
    dbFindFirst: vi.fn(),
    dbUpdateSet: vi.fn(),
    dbUpdateWhere: vi.fn(),
    auditLog: vi.fn(),
}));

vi.mock('@/shared/lib/auth', () => ({
    auth: mocks.auth,
    checkPermission: mocks.checkPermission,
}));

vi.mock('@/shared/services/audit-service', () => ({
    AuditService: {
        log: mocks.auditLog,
    }
}));

vi.mock('@/shared/api/db', () => {
    const tx = {
        query: {
            tenants: { findFirst: mocks.dbFindFirst },
        },
        update: vi.fn().mockReturnValue({
            set: vi.fn().mockReturnValue({
                where: mocks.dbUpdateWhere
            })
        }),
    };

    return {
        db: {
            query: {
                tenants: { findFirst: mocks.dbFindFirst },
            },
            transaction: vi.fn(async (cb) => {
                return await cb(tx);
            })
        }
    };
});

describe('Quote Config Actions', () => {
    const mockSession = { user: { id: 'u1', tenantId: 't1' } };
    const mockConfig: QuoteModeConfig = {
        defaultMode: 'QUICK',
        quickModeFields: ['p1', 'p2'],
        defaultValues: {
            installPosition: 'test',
            groundClearance: 1,
            foldRatio: 1.5,
        }
    };

    beforeEach(() => {
        vi.clearAllMocks();
        mocks.auth.mockResolvedValue(mockSession);
        mocks.checkPermission.mockResolvedValue(undefined);
    });

    describe('getQuoteModeConfig', () => {
        it('should return default config if none set', async () => {
            mocks.dbFindFirst.mockResolvedValue({ settings: {} });
            const result = await getQuoteModeConfig();
            expect(result.data).toEqual(DEFAULT_QUOTE_MODE_CONFIG);
            expect(result.error).toBeUndefined();
        });

        it('should return tenant specific config if set', async () => {
            mocks.dbFindFirst.mockResolvedValue({ settings: { quoteModeConfig: mockConfig } });
            const result = await getQuoteModeConfig();
            expect(result.data).toEqual(mockConfig);
        });

        it('should handle missing tenant info', async () => {
            mocks.auth.mockResolvedValue({ user: { id: 'u1' } }); // missing tenantId
            const result = await getQuoteModeConfig();
            expect(result.error).toBe('未找到租户信息');
        });

        it('should handle tenant not found', async () => {
            mocks.dbFindFirst.mockResolvedValue(null);
            const result = await getQuoteModeConfig();
            expect(result.error).toBe('租户不存在');
        });
    });

    describe('saveQuoteModeConfig', () => {
        it('should save config successfully', async () => {
            mocks.dbFindFirst.mockResolvedValue({ settings: {} });
            mocks.dbUpdateWhere.mockResolvedValue([{ id: 't1' }]);

            const result = await saveQuoteModeConfig(mockConfig);
            expect(result.success).toBe(true);
            expect(mocks.auditLog).toHaveBeenCalled();
        });

        it('should validate input config', async () => {
            const invalidConfig = { defaultMode: 'INVALID' } as any;
            const result = await saveQuoteModeConfig(invalidConfig);
            expect(result.success).toBe(false);
            expect(result.error).toContain('输入数据格式错误');
        });

        it('should handle unauthorized user', async () => {
            mocks.checkPermission.mockRejectedValue(new Error('Unauthorized'));
            const result = await saveQuoteModeConfig(mockConfig);
            expect(result.success).toBe(false);
            expect(result.error).toBe('无权限执行此操作');
        });

        it('should handle missing tenant info', async () => {
            mocks.auth.mockResolvedValue({ user: { id: 'u1' } }); // missing tenantId
            const result = await saveQuoteModeConfig(mockConfig);
            expect(result.success).toBe(false);
            expect(result.error).toBe('未找到租户信息');
        });
    });
});
