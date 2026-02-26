import { vi, describe, it, expect, beforeEach } from 'vitest';

// Mock 所有外部依赖
vi.mock('@/shared/api/db', () => ({
    db: {
        select: vi.fn().mockReturnValue({
            from: vi.fn().mockReturnValue({
                where: vi.fn().mockResolvedValue([]),
            }),
        }),
        insert: vi.fn().mockReturnValue({
            values: vi.fn().mockReturnValue({
                returning: vi.fn().mockResolvedValue([{ id: 'entry-1' }]),
            }),
        }),
        transaction: vi.fn(),
    },
}));

vi.mock('../services/accounting-period-service', () => ({
    getOrCreateCurrentPeriod: vi.fn().mockResolvedValue({
        id: 'period-1',
        year: 2026,
        month: 2,
        quarter: 1,
        status: 'OPEN',
    }),
}));

vi.mock('../services/finance-audit-service', () => ({
    writeFinanceAuditLog: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('../services/voucher-number-service', () => ({
    generateVoucherNo: vi.fn().mockResolvedValue('VOUCHER-TEST-001'),
}));

import { db } from '@/shared/api/db';
import { generateEntryFromReceiptBill, generateEntryFromPaymentBill } from '../services/auto-journal-service';
import { getOrCreateCurrentPeriod } from '../services/accounting-period-service';

describe('自动凭证引擎 (auto-journal-service)', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('generateEntryFromReceiptBill', () => {
        it('正常生成：应从收款单成功生成凭证', async () => {
            // 模拟收款单查询
            const mockReceipt = {
                id: 'receipt-1',
                tenantId: 'tenant-1',
                totalAmount: '5000.00',
                customerName: '测试客户A',
                receivedAt: new Date('2026-02-15'),
            };
            // 模拟凭证模板查询
            const mockTemplate = {
                id: 'tpl-1',
                debitAccountId: 'account-cash',
                creditAccountId: 'account-ar',
                isActive: true,
            };

            // 设置 db.select 的链式调用
            const whereMock = vi.fn()
                .mockResolvedValueOnce([mockReceipt])  // 第1次：查收款单
                .mockResolvedValueOnce([])              // 第2次：防重校验（无已有凭证）
                .mockResolvedValueOnce([mockTemplate]); // 第3次：查模板

            const fromMock = vi.fn().mockReturnValue({ where: whereMock });
            vi.mocked(db.select).mockReturnValue({ from: fromMock } as never);

            // 设置事务 mock
            const mockTx = {
                insert: vi.fn().mockReturnValue({
                    values: vi.fn().mockReturnValue({
                        returning: vi.fn().mockResolvedValue([{ id: 'new-entry-1' }]),
                    }),
                }),
            };
            vi.mocked(db.transaction).mockImplementation(async (cb: (tx: never) => unknown) => cb(mockTx as never));

            const result = await generateEntryFromReceiptBill('receipt-1', 'user-1');

            expect(result.success).toBe(true);
            expect(result.entryId).toBe('new-entry-1');
        });

        it('防重测试：同一收款单不能重复生成凭证', async () => {
            const mockReceipt = {
                id: 'receipt-1',
                tenantId: 'tenant-1',
                totalAmount: '5000.00',
                customerName: '测试客户A',
                receivedAt: new Date('2026-02-15'),
            };
            const existingEntry = { id: 'existing-entry', sourceType: 'AUTO_RECEIPT', sourceId: 'receipt-1' };

            const whereMock = vi.fn()
                .mockResolvedValueOnce([mockReceipt])  // 查收款单
                .mockResolvedValueOnce([existingEntry]); // 防重校验：已存在凭证

            const fromMock = vi.fn().mockReturnValue({ where: whereMock });
            vi.mocked(db.select).mockReturnValue({ from: fromMock } as never);

            const result = await generateEntryFromReceiptBill('receipt-1', 'user-1');

            expect(result.success).toBe(false);
            expect(result.error).toContain('不能重复生成');
        });

        it('缺少模板时应返回错误', async () => {
            const mockReceipt = {
                id: 'receipt-2',
                tenantId: 'tenant-1',
                totalAmount: '3000.00',
                customerName: '测试客户B',
                receivedAt: new Date('2026-02-15'),
            };

            const whereMock = vi.fn()
                .mockResolvedValueOnce([mockReceipt])  // 查收款单
                .mockResolvedValueOnce([])              // 防重校验：无已有凭证
                .mockResolvedValueOnce([]);             // 查模板：未找到

            const fromMock = vi.fn().mockReturnValue({ where: whereMock });
            vi.mocked(db.select).mockReturnValue({ from: fromMock } as never);

            const result = await generateEntryFromReceiptBill('receipt-2', 'user-1');

            expect(result.success).toBe(false);
            expect(result.error).toContain('未找到');
        });

        it('账期已关闭时应返回错误', async () => {
            const mockReceipt = {
                id: 'receipt-3',
                tenantId: 'tenant-1',
                totalAmount: '2000.00',
                customerName: '测试客户C',
                receivedAt: new Date('2026-02-15'),
            };
            const mockTemplate = {
                id: 'tpl-1',
                debitAccountId: 'account-cash',
                creditAccountId: 'account-ar',
                isActive: true,
            };

            const whereMock = vi.fn()
                .mockResolvedValueOnce([mockReceipt])
                .mockResolvedValueOnce([])
                .mockResolvedValueOnce([mockTemplate]);

            const fromMock = vi.fn().mockReturnValue({ where: whereMock });
            vi.mocked(db.select).mockReturnValue({ from: fromMock } as never);

            // 模拟账期已关闭
            vi.mocked(getOrCreateCurrentPeriod).mockResolvedValueOnce({
                id: 'period-closed',
                year: 2026,
                month: 1,
                quarter: 1,
                status: 'CLOSED',
            });

            const result = await generateEntryFromReceiptBill('receipt-3', 'user-1');

            expect(result.success).toBe(false);
            expect(result.error).toContain('账期已关闭');
        });
    });

    describe('generateEntryFromPaymentBill', () => {
        it('收款单不存在时应抛出错误', async () => {
            const whereMock = vi.fn().mockResolvedValueOnce([]); // 查不到付款单
            const fromMock = vi.fn().mockReturnValue({ where: whereMock });
            vi.mocked(db.select).mockReturnValue({ from: fromMock } as never);

            await expect(generateEntryFromPaymentBill('nonexistent', 'user-1'))
                .rejects.toThrow('付款单不存在');
        });
    });
});
