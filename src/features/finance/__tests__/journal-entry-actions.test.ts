import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('next/cache', () => ({
    revalidateTag: vi.fn(),
    updateTag: vi.fn(),
    unstable_cache: vi.fn((fn) => fn),
}));

vi.mock('@/shared/lib/auth', () => ({
    auth: vi.fn(),
    checkPermission: vi.fn().mockResolvedValue(true),
}));

vi.mock('@/shared/services/audit-service', () => ({
    AuditService: { log: vi.fn().mockResolvedValue(undefined) },
}));

const mockUpdateWhere = vi.fn().mockResolvedValue([{ id: 'entry-1' }]);
const mockSet = vi.fn(() => ({ where: mockUpdateWhere }));
const mockUpdate = vi.fn(() => ({ set: mockSet }));

vi.mock('@/shared/api/db', () => ({
    db: {
        transaction: vi.fn((fn) =>
            fn({
                select: vi.fn(() => ({
                    from: vi.fn(() => ({
                        where: vi.fn().mockResolvedValue([{
                            id: 'entry-1',
                            status: 'DRAFT',
                            tenantId: 'tenant-1',
                            description: 'test'
                        }]),
                    })),
                })),
                update: mockUpdate,
            })
        ),
    },
}));

vi.mock('@/features/finance/actions/simple-mode-actions', () => ({
    getFinanceMode: vi.fn().mockResolvedValue({ success: true, mode: 'professional' }),
}));

// Provide mocked eq and and functions
vi.mock('drizzle-orm', async (importOriginal) => {
    const actual = await importOriginal<typeof import('drizzle-orm')>();
    return {
        ...actual,
        eq: vi.fn((col, val) => ({ type: 'eq', col, val })),
        and: vi.fn((...args) => ({ type: 'and', args })),
        desc: vi.fn(),
    };
});

import { auth } from '@/shared/lib/auth';
import { updateJournalEntryStatus } from '../actions/journal-entry-actions';

describe('[D3-001] updateJournalEntryStatus - Multi-tenant Security test', () => {
    const mockSession = {
        user: { id: 'user-1', tenantId: 'tenant-1', roles: ['ADMIN'], role: 'ADMIN' },
    };

    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(auth).mockResolvedValue(mockSession as any);
    });

    it('RED: WHERE clause must include tenantId filtering to prevent cross-tenant IDOR', async () => {
        // Calling the function
        const result = await updateJournalEntryStatus({ id: 'entry-1', status: 'PENDING_REVIEW' });

        expect(result.success).toBe(true);
        expect(mockUpdateWhere).toHaveBeenCalled();

        const whereArgs = mockUpdateWhere.mock.calls[0][0];

        // We expect the update WHERE clause to be an 'and' containing a 'tenantId' check
        expect(whereArgs).toBeDefined();
        expect(whereArgs.type).toBe('and');

        // Find the tenant check inside args
        const hasTenantCheck = whereArgs.args?.some((arg: any) =>
            arg.type === 'eq' && arg.val === 'tenant-1'
        );

        expect(hasTenantCheck).toBe(true);
    });
});
