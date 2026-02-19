import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
    getCompanyVirtualCosts,
    getVirtualCostSummary,
    exportVirtualCostReport,
    getVirtualCostByDepartment,
    COST_ACCOUNT_CODES
} from '../logic/virtual-cost-accounting';

// Mock Dependencies
vi.mock('@/shared/api/db', () => ({
    db: {
        query: {
            liabilityNotices: {
                findMany: vi.fn(),
            },
        },
    },
}));

vi.mock('@/shared/lib/auth', () => ({
    auth: vi.fn(() => Promise.resolve({ user: { id: 'user-1', tenantId: 'tenant-1' } })),
}));

import { db } from '@/shared/api/db';

describe('Virtual Cost Accounting Logic', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    const mockNotices = [
        {
            id: 'n-1',
            noticeNo: 'LN001',
            afterSalesId: 'as-1',
            liabilityReasonCategory: 'SALES_ERROR',
            amount: '1000',
            reason: 'Wrong price quoted',
            confirmedAt: new Date('2026-01-15T10:00:00Z'),
            status: 'CONFIRMED',
            liablePartyType: 'COMPANY',
        },
        {
            id: 'n-2',
            noticeNo: 'LN002',
            afterSalesId: 'as-2',
            liabilityReasonCategory: 'DELAY',
            amount: '500',
            reason: 'Delivery delay',
            confirmedAt: new Date('2026-02-10T10:00:00Z'),
            status: 'CONFIRMED',
            liablePartyType: 'COMPANY',
        },
        {
            id: 'n-3',
            noticeNo: 'LN003',
            afterSalesId: 'as-3',
            liabilityReasonCategory: 'PRODUCT_DEFECT',
            amount: '2000',
            reason: 'Screws missing',
            confirmedAt: new Date('2026-02-20T10:00:00Z'),
            status: 'CONFIRMED',
            liablePartyType: 'COMPANY',
        }
    ];

    describe('getCompanyVirtualCosts', () => {
        it('should map notices to virtual cost records correctly', async () => {
            (db.query.liabilityNotices.findMany as any).mockResolvedValue(mockNotices);

            const result = await getCompanyVirtualCosts();

            expect(result.length).toBe(3);
            expect(result[0].accountCode).toBe('SALES_ERROR');
            expect(result[0].amount).toBe(1000);
            expect(result[0].category).toBe('SALES');
            expect(result[0].accountName).toBe(COST_ACCOUNT_CODES.SALES_ERROR.name);

            expect(result[1].accountCode).toBe('SERVICE_DELAY'); // DELAY -> SERVICE_DELAY
            expect(result[1].category).toBe('SERVICE');
        });

        it('should return empty array if no notices found', async () => {
            (db.query.liabilityNotices.findMany as any).mockResolvedValue([]);
            const result = await getCompanyVirtualCosts();
            expect(result).toEqual([]);
        });
    });

    describe('getVirtualCostSummary', () => {
        it('should aggregate costs by category and account', async () => {
            (db.query.liabilityNotices.findMany as any).mockResolvedValue(mockNotices);

            const summary = await getVirtualCostSummary();

            expect(summary.totalAmount).toBe(3500);
            expect(summary.byCategory['SALES']).toBe(1000);
            expect(summary.byCategory['SERVICE']).toBe(500);
            expect(summary.byCategory['PRODUCT']).toBe(2000);

            expect(summary.byAccount[COST_ACCOUNT_CODES.SALES_ERROR.name]).toBe(1000);
            expect(summary.trend.length).toBe(2); // Jan and Feb
            expect(summary.trend[0].month).toBe('2026-01');
            expect(summary.trend[1].month).toBe('2026-02');
            expect(summary.trend[1].amount).toBe(2500); // 500 + 2000
        });
    });

    describe('exportVirtualCostReport', () => {
        it('should generate correct headers and rows', async () => {
            (db.query.liabilityNotices.findMany as any).mockResolvedValue([mockNotices[0]]);

            const report = await exportVirtualCostReport();

            expect(report.headers).toContain('金额');
            expect(report.rows[0]).toContain('1000.00');
            expect(report.rows[0]).toContain(COST_ACCOUNT_CODES.SALES_ERROR.name);
        });
    });

    describe('getVirtualCostByDepartment', () => {
        it('should group costs by department and calculate percentages', async () => {
            (db.query.liabilityNotices.findMany as any).mockResolvedValue(mockNotices);

            const byDept = await getVirtualCostByDepartment();

            expect(byDept['销售部'].amount).toBe(1000);
            expect(byDept['服务部'].amount).toBe(500);
            expect(byDept['采购部'].amount).toBe(2000);

            // 1000/3500 * 100 = 28.57...
            expect(byDept['销售部'].percentage).toBeCloseTo(28.57, 1);
            expect(byDept['采购部'].percentage).toBeCloseTo(57.14, 1);
        });
    });
});
