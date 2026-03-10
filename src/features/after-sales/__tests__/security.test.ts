import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createAfterSalesTicket, updateTicketStatus } from '../actions/ticket';
import { createLiabilityNotice } from '../actions/liability';
import { createDamageReport } from '../actions/damage-report';

vi.mock('@/shared/lib/auth', () => {
    const checkPermissionMock = vi.fn();
    return {
        auth: vi.fn(),
        checkPermission: checkPermissionMock,
        requirePermission: vi.fn((...args: any[]) => {
            if (!checkPermissionMock(...args)) throw new Error('无权操作');
        }),
    };
});

// 2. Mock 数据库和 audit service 以防产生实际调用
vi.mock('@/shared/api/db', () => ({
    db: {
        transaction: vi.fn(),
        query: {
            afterSalesTickets: { findFirst: vi.fn() },
        },
        update: vi.fn(),
        insert: vi.fn(),
    },
}));

vi.mock('@/shared/services/audit-service', () => ({
    AuditService: { recordFromSession: vi.fn() },
}));

import { auth, checkPermission, requirePermission } from '@/shared/lib/auth';

describe('After-Sales Module Security & Validation Tests', () => {
    const mockTenantId = 'tenant-123';
    const mockUserId = 'user-123';

    beforeEach(() => {
        vi.clearAllMocks();
    });



    describe('D2-P1-1: Damage Report Float Precision Bypass', () => {
        it('should accurately detect precision mismatches and reject using Decimal.js', async () => {
            // 模拟已登录并拥有权限
            (auth as any).mockResolvedValue({
                user: { id: mockUserId, tenantId: mockTenantId },
            });
            (checkPermission as any).mockReturnValue(true);

            // Javascript中的浮点数会导致 99999.995 + 0.005 === 100000 不精确的情况
            // 用一个会触发 JS 浮点问题的数字
            const res = await createDamageReport({
                afterSalesTicketId: '550e8400-e29b-41d4-a716-446655440001',
                totalDamageAmount: 100000,
                description: 'float issue test',
                liabilities: [
                    { liablePartyType: 'FACTORY', amount: 99999.99, reason: 'reason A' },
                    { liablePartyType: 'COMPANY', amount: 0.02, reason: 'reason B' }, // 99999.99 + 0.02 = 100000.01 != 100000
                ],
            });

            expect(res.success).toBe(true);
            expect(res.data?.success).toBe(false);
            expect(res.data?.message).toContain('100000');
        });
    });
});
