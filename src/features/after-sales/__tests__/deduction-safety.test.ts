
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getDeductionLedger, checkDeductionAllowed, getAllDeductionLedgers, DEDUCTION_SAFETY_CONFIG } from '../logic/deduction-safety';
import { db } from '@/shared/api/db';
import { liabilityNotices } from '@/shared/api/schema/after-sales';
import { sql } from 'drizzle-orm';

// Mock Dependencies
vi.mock('@/shared/api/db', () => ({
    db: {
        query: {
            liabilityNotices: { findMany: vi.fn() },
            suppliers: { findFirst: vi.fn(), findMany: vi.fn() },
            users: { findFirst: vi.fn(), findMany: vi.fn() },
            customers: { findFirst: vi.fn(), findMany: vi.fn() },
        },
        select: vi.fn(() => ({
            from: vi.fn(() => ({
                where: vi.fn(() => Promise.resolve([])),
                groupBy: vi.fn(() => Promise.resolve([])),
            })),
        })),
    },
}));

vi.mock('@/shared/lib/auth', () => ({
    auth: vi.fn(() => Promise.resolve({ user: { id: 'user-1', tenantId: 'tenant-1' } })),
}));

describe('Deduction Safety Logic (Optimized)', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('getDeductionLedger', () => {
        it('should return null if summary has no data', async () => {
            // Mock empty select result
            (db.select as any).mockReturnValue({
                from: vi.fn().mockReturnThis(),
                where: vi.fn().mockResolvedValue([{ totalDeducted: null, totalSettled: null }])
            });

            const result = await getDeductionLedger('INSTALLER', 'inst-1');
            expect(result).toBeNull();
        });

        it('should calculate pending amount correctly', async () => {
            // Mock aggregate summary
            (db.select as any).mockReturnValue({
                from: vi.fn().mockReturnThis(),
                where: vi.fn().mockResolvedValue([{
                    totalDeducted: '1500',
                    totalSettled: '500'
                }])
            });
            (db.query.users.findFirst as any).mockResolvedValue({ name: 'Installer A' });

            const result = await getDeductionLedger('INSTALLER', 'inst-1');

            expect(result?.totalDeducted).toBe(1500);
            expect(result?.totalSettled).toBe(500);
            expect(result?.pendingAmount).toBe(1000);
            expect(result?.status).toBe('NORMAL');
        });

        it('should handle WARNING status', async () => {
            const warningLimit = DEDUCTION_SAFETY_CONFIG.INSTALLER_MAX_DEDUCTION * 0.9;
            (db.select as any).mockReturnValue({
                from: vi.fn().mockReturnThis(),
                where: vi.fn().mockResolvedValue([{
                    totalDeducted: warningLimit.toString(),
                    totalSettled: '0'
                }])
            });
            (db.query.users.findFirst as any).mockResolvedValue({ name: 'Installer A' });

            const result = await getDeductionLedger('INSTALLER', 'inst-1');
            expect(result?.status).toBe('WARNING');
        });
    });

    describe('getAllDeductionLedgers', () => {
        it('should batch process multiple ledgers efficiently', async () => {
            // Mock grouped result
            (db.select as any).mockReturnValue({
                from: vi.fn().mockReturnThis(),
                where: vi.fn().mockReturnThis(),
                groupBy: vi.fn().mockResolvedValue([
                    { partyType: 'INSTALLER', partyId: 'inst-1', totalDeducted: '1000', totalSettled: '200' },
                    { partyType: 'FACTORY', partyId: 'fact-1', totalDeducted: '5000', totalSettled: '0' }
                ])
            });

            // Mock batch name lookups
            (db.query.users.findMany as any).mockResolvedValue([{ id: 'inst-1', name: 'User 1' }]);
            (db.query.suppliers.findMany as any).mockResolvedValue([{ id: 'fact-1', name: 'Supplier 1' }]);

            const results = await getAllDeductionLedgers();

            expect(results.length).toBe(2);
            expect(results.find(r => r.partyId === 'inst-1')?.partyName).toBe('User 1');
            expect(results.find(r => r.partyId === 'fact-1')?.partyName).toBe('Supplier 1');
        });
    });

    describe('checkDeductionAllowed', () => {
        it('should respect limits', async () => {
            (db.select as any).mockReturnValue({
                from: vi.fn().mockReturnThis(),
                where: vi.fn().mockResolvedValue([{
                    totalDeducted: '4500',
                    totalSettled: '0'
                }])
            });
            (db.query.users.findFirst as any).mockResolvedValue({ name: 'Installer A' });

            const result = await checkDeductionAllowed('INSTALLER', 'inst-1', 1000);
            expect(result.allowed).toBe(false);
            expect(result.status).toBe('BLOCKED');
        });

        it('should allow if new deduction is within limit for new party', async () => {
            (db.select as any).mockReturnValue({
                from: vi.fn().mockReturnThis(),
                where: vi.fn().mockResolvedValue([{ totalDeducted: null, totalSettled: null }]) // empty ledger
            });
            const result = await checkDeductionAllowed('INSTALLER', 'inst-2', 1000); // Installer max is 5000
            expect(result.allowed).toBe(true);
            expect(result.status).toBe('NORMAL');
            expect(result.remainingQuota).toBe(4000);
        });

        it('should block if new deduction exceeds limit for new party', async () => {
            (db.select as any).mockReturnValue({
                from: vi.fn().mockReturnThis(),
                where: vi.fn().mockResolvedValue([{ totalDeducted: null, totalSettled: null }]) // empty ledger
            });
            const result = await checkDeductionAllowed('INSTALLER', 'inst-2', 6000); // Exceeds 5000
            expect(result.allowed).toBe(false);
            expect(result.status).toBe('BLOCKED');
            expect(result.remainingQuota).toBe(5000);
        });

        it('should warn if new total approaches limit', async () => {
            (db.select as any).mockReturnValue({
                from: vi.fn().mockReturnThis(),
                where: vi.fn().mockResolvedValue([{ totalDeducted: '3000', totalSettled: '0' }])
            });
            (db.query.users.findFirst as any).mockResolvedValue({ name: 'Installer A' });

            const result = await checkDeductionAllowed('INSTALLER', 'inst-1', 1500); // 3000+1500=4500, ratio 0.9
            expect(result.allowed).toBe(true);
            expect(result.status).toBe('WARNING');
        });
    });

    describe('Tenant Context & Other Party Types', () => {
        it('should return null/empty if no tenant session', async () => {
            const authModule = await import('@/shared/lib/auth');
            const auth = authModule.auth as any;
            auth.mockResolvedValueOnce({ user: { id: 'user-1' } }); // No tenantId

            const ledger = await getDeductionLedger('INSTALLER', 'inst-1');
            expect(ledger).toBeNull();

            auth.mockResolvedValueOnce({ user: { id: 'user-1' } });
            const ledgers = await getAllDeductionLedgers();
            expect(ledgers).toEqual([]);
        });

        it('should correctly configure limits for MEASURER, LOGISTICS, CUSTOMER, COMPANY', async () => {
            (db.select as any).mockReturnValue({
                from: vi.fn().mockReturnThis(),
                where: vi.fn().mockResolvedValue([{ totalDeducted: '100', totalSettled: '0' }])
            });

            // MEASURER
            let ledger = await getDeductionLedger('MEASURER', 'p-1');
            expect(ledger?.maxAllowed).toBe(DEDUCTION_SAFETY_CONFIG.MEASURER_MAX_DEDUCTION);

            // LOGISTICS
            ledger = await getDeductionLedger('LOGISTICS', 'p-2');
            expect(ledger?.maxAllowed).toBe(DEDUCTION_SAFETY_CONFIG.LOGISTICS_MAX_DEDUCTION);

            // CUSTOMER
            ledger = await getDeductionLedger('CUSTOMER', 'p-3');
            expect(ledger?.maxAllowed).toBe(9999999);

            // COMPANY
            ledger = await getDeductionLedger('COMPANY', 'p-4');
            expect(ledger?.maxAllowed).toBe(9999999);
            expect(ledger?.partyName).toBe('公司内部');
        });
    });
});
