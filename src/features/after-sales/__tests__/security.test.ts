import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createAfterSalesTicket, updateTicketStatus } from '../actions/ticket';
import { createLiabilityNotice } from '../actions/liability';
import { createDamageReport } from '../actions/damage-report';

// 1. Mock 认证和权限检查
vi.mock('@/shared/lib/auth', () => ({
    auth: vi.fn(),
    checkPermission: vi.fn(),
}));

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

import { auth, checkPermission } from '@/shared/lib/auth';

describe('After-Sales Module Security & Validation Tests', () => {
    const mockTenantId = 'tenant-123';
    const mockUserId = 'user-123';

    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('D3-P0-1 & D3-P0-2: Permission Rejection', () => {
        it('should reject createAfterSalesTicket if missing OWN_EDIT permission', async () => {
            // 模拟已登录但无权限
            (auth as any).mockResolvedValue({
                user: { id: mockUserId, tenantId: mockTenantId },
            });
            (checkPermission as any).mockReturnValue(false);

            await expect(
                createAfterSalesTicket({
                    orderId: 'uuid-1',
                    type: 'RETURN',
                    description: 'test',
                    isWarranty: false,
                })
            ).rejects.toThrow('无权创建售后工单');
        });

        it('should reject updateTicketStatus if missing OWN_EDIT permission', async () => {
            (auth as any).mockResolvedValue({
                user: { id: mockUserId, tenantId: mockTenantId },
            });
            (checkPermission as any).mockReturnValue(false);

            const res = await updateTicketStatus({ ticketId: 'uuid-1', newStatus: 'PROCESSING' });
            expect(res.success).toBe(false);
            expect(res.message).toBe('无权操作工单');
        });

        it('should reject createLiabilityNotice if missing OWN_EDIT permission', async () => {
            (auth as any).mockResolvedValue({
                user: { id: mockUserId, tenantId: mockTenantId },
            });
            (checkPermission as any).mockReturnValue(false);

            const res = await createLiabilityNotice({
                afterSalesId: 'uuid-1',
                liablePartyType: 'FACTORY',
                amount: 100,
                reason: 'test',
            });
            expect(res.success).toBe(false);
            expect(res.message).toBe('无权操作工单定责');
        });

        it('should reject createDamageReport if missing OWN_EDIT permission', async () => {
            (auth as any).mockResolvedValue({
                user: { id: mockUserId, tenantId: mockTenantId },
            });
            (checkPermission as any).mockReturnValue(false);

            const res = await createDamageReport({
                afterSalesTicketId: 'uuid-1',
                totalDamageAmount: 100,
                description: 'test',
                liabilities: [
                    { liablePartyType: 'FACTORY', amount: 100, reason: 'test' },
                ],
            });
            expect(res.success).toBe(false);
            expect(res.message).toBe('无权发起定损');
        });
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
                afterSalesTicketId: 'uuid-1',
                totalDamageAmount: 100000,
                description: 'float issue test',
                liabilities: [
                    { liablePartyType: 'FACTORY', amount: 99999.99, reason: 'reason A' },
                    { liablePartyType: 'STAFF', amount: 0.02, reason: 'reason B' }, // 99999.99 + 0.02 = 100000.01 != 100000
                ],
            });

            expect(res.success).toBe(false);
            expect(res.message).toContain('必须等于定损总金额(¥100000)');
        });
    });
});
