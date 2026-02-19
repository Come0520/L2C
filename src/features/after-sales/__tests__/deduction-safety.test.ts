import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getDeductionLedger, checkDeductionAllowed, DEDUCTION_SAFETY_CONFIG } from '../logic/deduction-safety';

// Mock Dependencies
vi.mock('@/shared/api/db', () => ({
    db: {
        query: {
            liabilityNotices: {
                findMany: vi.fn(),
            },
            suppliers: {
                findFirst: vi.fn(),
            },
            users: {
                findFirst: vi.fn(),
            },
            customers: {
                findFirst: vi.fn(),
            },
        },
        select: vi.fn(() => ({
            from: vi.fn(() => ({
                where: vi.fn(() => Promise.resolve([{ total: '50000' }])),
            })),
        })),
    },
}));

vi.mock('@/shared/lib/auth', () => ({
    auth: vi.fn(() => Promise.resolve({ user: { id: 'user-1', tenantId: 'tenant-1' } })),
}));

import { db } from '@/shared/api/db';

describe('Deduction Safety Logic', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('getDeductionLedger', () => {
        it('should return null if no notices found', async () => {
            (db.query.liabilityNotices.findMany as any).mockResolvedValue([]);
            const result = await getDeductionLedger('INSTALLER', 'inst-1');
            expect(result).toBeNull();
        });

        it('should calculate pending amount correctly for INSTALLER', async () => {
            (db.query.liabilityNotices.findMany as any).mockResolvedValue([
                { amount: '1000', status: 'CONFIRMED', financeStatus: 'PENDING' },
                { amount: '500', status: 'CONFIRMED', financeStatus: 'SYNCED' },
                { amount: '2000', status: 'DRAFT', financeStatus: 'PENDING' },
            ]);
            (db.query.users.findFirst as any).mockResolvedValue({ name: 'Installer A' });

            const result = await getDeductionLedger('INSTALLER', 'inst-1');

            expect(result?.totalDeducted).toBe(1500);
            expect(result?.totalSettled).toBe(500);
            expect(result?.pendingAmount).toBe(1000);
            expect(result?.maxAllowed).toBe(DEDUCTION_SAFETY_CONFIG.INSTALLER_MAX_DEDUCTION);
            expect(result?.status).toBe('NORMAL');
        });

        it('should trigger WARNING status when reaching threshold', async () => {
            const warningLimit = DEDUCTION_SAFETY_CONFIG.INSTALLER_MAX_DEDUCTION * DEDUCTION_SAFETY_CONFIG.WARNING_THRESHOLD;
            (db.query.liabilityNotices.findMany as any).mockResolvedValue([
                { amount: warningLimit.toString(), status: 'CONFIRMED', financeStatus: 'PENDING' },
            ]);
            (db.query.users.findFirst as any).mockResolvedValue({ name: 'Installer A' });

            const result = await getDeductionLedger('INSTALLER', 'inst-1');
            expect(result?.status).toBe('WARNING');
        });

        it('should trigger BLOCKED status when exceeding limit', async () => {
            const blockedLimit = DEDUCTION_SAFETY_CONFIG.INSTALLER_MAX_DEDUCTION + 1;
            (db.query.liabilityNotices.findMany as any).mockResolvedValue([
                { amount: blockedLimit.toString(), status: 'CONFIRMED', financeStatus: 'PENDING' },
            ]);
            (db.query.users.findFirst as any).mockResolvedValue({ name: 'Installer A' });

            const result = await getDeductionLedger('INSTALLER', 'inst-1');
            expect(result?.status).toBe('BLOCKED');
        });

        it('should calculate dynamic limit for FACTORY based on purchase history', async () => {
            (db.query.liabilityNotices.findMany as any).mockResolvedValue([
                { amount: '1000', status: 'CONFIRMED', financeStatus: 'PENDING' },
            ]);
            (db.query.suppliers.findFirst as any).mockResolvedValue({ name: 'Supplier X' });

            // Mock purchase history of 1,000,000
            const mockSelect = (db.select as any).mockReturnValue({
                from: vi.fn().mockReturnThis(),
                where: vi.fn().mockResolvedValue([{ total: '1000000' }])
            });

            const result = await getDeductionLedger('FACTORY', 'factory-1');

            // Limit should be 1,000,000 * 0.1 = 100,000
            expect(result?.maxAllowed).toBe(100000);
            expect(result?.partyName).toBe('Supplier X');
        });
    });

    describe('checkDeductionAllowed', () => {
        it('should allow first deduction for a new party', async () => {
            (db.query.liabilityNotices.findMany as any).mockResolvedValue([]);

            const result = await checkDeductionAllowed('INSTALLER', 'inst-new', 1000);

            expect(result.allowed).toBe(true);
            expect(result.status).toBe('NORMAL');
            expect(result.remainingQuota).toBe(DEDUCTION_SAFETY_CONFIG.INSTALLER_MAX_DEDUCTION - 1000);
        });

        it('should block if total exceeds limit after new deduction', async () => {
            (db.query.liabilityNotices.findMany as any).mockResolvedValue([
                { amount: '4500', status: 'CONFIRMED', financeStatus: 'PENDING' },
            ]);
            (db.query.users.findFirst as any).mockResolvedValue({ name: 'Installer A' });

            const result = await checkDeductionAllowed('INSTALLER', 'inst-1', 1000);

            expect(result.allowed).toBe(false);
            expect(result.status).toBe('BLOCKED');
            expect(result.message).toContain('超过最大限额');
        });

        it('should warn if total reaches warning threshold after new deduction', async () => {
            (db.query.liabilityNotices.findMany as any).mockResolvedValue([
                { amount: '3500', status: 'CONFIRMED', financeStatus: 'PENDING' },
            ]);
            (db.query.users.findFirst as any).mockResolvedValue({ name: 'Installer A' });

            // New total = 3500 + 500 = 4000 (Exactly 80% of 5000)
            const result = await checkDeductionAllowed('INSTALLER', 'inst-1', 500);

            expect(result.allowed).toBe(true);
            expect(result.status).toBe('WARNING');
            expect(result.message).toContain('警告');
        });
    });
});
