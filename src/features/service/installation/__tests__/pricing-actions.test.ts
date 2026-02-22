import { describe, it, expect, vi, beforeEach } from 'vitest';
import { calculateLaborFee } from '../actions/pricing-actions';
import { db } from '@/shared/api/db';

// Mock dependencies
vi.mock('@/shared/api/db', () => ({
    db: {
        query: {
            laborRates: {
                findFirst: vi.fn(),
                findMany: vi.fn(),
            }
        }
    }
}));

vi.mock('@/shared/lib/auth', () => ({
    auth: vi.fn().mockResolvedValue({
        user: {
            id: 'test-user-id',
            tenantId: 'test-tenant-id'
        }
    })
}));

vi.mock('@/shared/lib/audit-service', () => ({
    AuditService: {
        recordFromSession: vi.fn().mockResolvedValue(true)
    }
}));

vi.mock('next/cache', () => ({
    revalidatePath: vi.fn(),
    revalidateTag: vi.fn(),
}));

describe('Pricing Actions Logic', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('calculateLaborFee - 分级定价逻辑', () => {
        const tenantId = 'test-tenant-id';
        const workerId = 'worker-123';

        it('应优先使用师傅个人定价', async () => {
            // Mock 师傅定价
            vi.mocked(db.query.laborRates.findFirst).mockResolvedValueOnce({
                id: 'rate-worker',
                entityType: 'WORKER',
                entityId: workerId,
                category: 'CURTAIN',
                unitPrice: '50.00',
                baseFee: '100.00',
                unitType: 'WINDOW',
                tenantId: 'tenant-1',
                createdAt: new Date(),
                updatedAt: new Date()
            });

            const result = await calculateLaborFee({
                category: 'CURTAIN',
                quantity: 2,
                workerId: workerId
            });

            expect(result.success).toBe(true);
            if (result.success && result.data && 'totalFee' in result.data) {
                expect(result.data.totalFee).toBe(200); // 100 + 50 * 2
                expect(result.data.rateSource).toBe('WORKER');
            }
        });

        it('当师傅无定价时应兜底使用租户标准定价', async () => {
            // 第一次查询 (WORKER) 返回 null
            vi.mocked(db.query.laborRates.findFirst).mockResolvedValueOnce(null as any);
            // 第二次查询 (TENANT) 返回标准价
            vi.mocked(db.query.laborRates.findFirst).mockResolvedValueOnce({
                id: 'rate-tenant',
                entityType: 'TENANT',
                entityId: tenantId,
                category: 'CURTAIN',
                unitPrice: '40.00',
                baseFee: '80.00',
                unitType: 'WINDOW',
                tenantId: 'tenant-1',
                createdAt: new Date(),
                updatedAt: new Date()
            });

            const result = await calculateLaborFee({
                category: 'CURTAIN',
                quantity: 2,
                workerId: workerId
            });

            expect(result.success).toBe(true);
            if (result.success && result.data && 'totalFee' in result.data) {
                expect(result.data.totalFee).toBe(160); // 80 + 40 * 2
                expect(result.data.rateSource).toBe('TENANT');
            }
        });

        it('若均无配置应返回 0 费用对象', async () => {
            vi.mocked(db.query.laborRates.findFirst).mockResolvedValue(null as any);

            const result = await calculateLaborFee({
                category: 'CURTAIN',
                quantity: 2,
                workerId: workerId
            });

            expect(result.success).toBe(true);
            if (result.success && result.data && 'totalFee' in result.data) {
                expect(result.data.totalFee).toBe(0);
                expect(result.data.rateSource).toBe('DEFAULT');
            }
        });

        it('应能够处理纯基础费的固定价格模式', async () => {
            vi.mocked(db.query.laborRates.findFirst).mockResolvedValueOnce({
                id: 'rate-fixed',
                entityType: 'TENANT',
                entityId: tenantId,
                category: 'OTHER',
                unitPrice: '0.00',
                baseFee: '500.00',
                unitType: 'FIXED',
                tenantId: 'tenant-1',
                createdAt: new Date(),
                updatedAt: new Date()
            });

            const result = await calculateLaborFee({
                category: 'OTHER',
                quantity: 99, // 数量不影响固定价
            });

            expect(result.success).toBe(true);
            if (result.success && result.data && 'totalFee' in result.data) {
                expect(result.data.totalFee).toBe(500);
            }
        });
    });
});
