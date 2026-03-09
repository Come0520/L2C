/**
 * AI 积分账单引擎单元测试 (TDD RED — credits-service)
 *
 * 测试策略：
 * - Mock DB 事务，验证积分扣减的原子性与余额快照
 * - 验证余额不足时抛出 InsufficientCreditsError
 * - 验证充值（PLEDGE/ADDON）正常插入流水
 * - 验证退还（REFUND）正常插入并更新余额
 */
import { describe, expect, it, vi, beforeEach } from 'vitest';

// =====================================================
// DB + Schema Mock（inline factory 避免 hoisting 问题）
// =====================================================
const mockTxFindFirst = vi.fn();
const mockTxInsertReturning = vi.fn().mockResolvedValue([{ id: 'txn-123', balance: 45 }]);

vi.mock('@/shared/api/db', () => ({
    db: {
        query: {
            aiCreditTransactions: { findFirst: vi.fn() },
        },
        transaction: vi.fn(async (cb: (tx: unknown) => unknown) => {
            // 构造事务 mock 对象传给回调
            const tx = {
                query: {
                    aiCreditTransactions: { findFirst: mockTxFindFirst },
                },
                insert: vi.fn(() => ({
                    values: vi.fn(() => ({
                        returning: mockTxInsertReturning,
                    })),
                })),
            };
            return cb(tx);
        }),
    },
}));

import { db } from '@/shared/api/db';
import { CreditsService, InsufficientCreditsError } from '../credits-service';

// =====================================================
// 测试套件
// =====================================================
const TENANT_ID = 'tenant-xyz-001';

describe('CreditsService', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    // ——— deductCredits（扣减积分） ———

    describe('deductCredits', () => {
        it('余额充足时应成功扣减并返回新余额', async () => {
            // 最后一笔流水余额为 100
            mockTxFindFirst.mockResolvedValue({ balance: 100 });
            mockTxInsertReturning.mockResolvedValue([{ id: 'txn-001', balance: 70 }]);

            const result = await CreditsService.deductCredits(TENANT_ID, 30, '生成全景渲染图');
            expect(result.balance).toBe(70);
        });

        it('余额不足时应抛出 InsufficientCreditsError', async () => {
            mockTxFindFirst.mockResolvedValue({ balance: 10 });

            await expect(
                CreditsService.deductCredits(TENANT_ID, 30, '生成全景渲染图')
            ).rejects.toThrow(InsufficientCreditsError);
        });

        it('InsufficientCreditsError 应包含 current / required 属性', async () => {
            mockTxFindFirst.mockResolvedValue({ balance: 5 });

            try {
                await CreditsService.deductCredits(TENANT_ID, 20, '出图');
                expect.fail('应当抛出异常');
            } catch (e) {
                expect(e).toBeInstanceOf(InsufficientCreditsError);
                const err = e as InsufficientCreditsError;
                expect(err.current).toBe(5);
                expect(err.required).toBe(20);
            }
        });

        it('账户无流水记录时余额应视为 0 并判定为不足', async () => {
            mockTxFindFirst.mockResolvedValue(null); // 无流水记录

            await expect(
                CreditsService.deductCredits(TENANT_ID, 5, '第一次出图')
            ).rejects.toThrow(InsufficientCreditsError);
        });
    });

    // ——— addCredits（充值/发放） ———

    describe('addCredits', () => {
        it('应成功插入 PLEDGE 类型流水并返回新余额', async () => {
            mockTxFindFirst.mockResolvedValue({ balance: 50 });
            mockTxInsertReturning.mockResolvedValue([{ id: 'txn-002', balance: 550 }]);

            const result = await CreditsService.addCredits(TENANT_ID, 500, 'PLEDGE', '月初配额发放');
            expect(result.balance).toBe(550);
        });

        it('应成功插入 ADDON 类型流水（购买增值包）', async () => {
            mockTxFindFirst.mockResolvedValue({ balance: 0 });
            mockTxInsertReturning.mockResolvedValue([{ id: 'txn-003', balance: 100 }]);

            const result = await CreditsService.addCredits(TENANT_ID, 100, 'ADDON', '购买积分包 ×100');
            expect(result.balance).toBe(100);
        });
    });

    // ——— refundCredits（退还） ———

    describe('refundCredits', () => {
        it('应成功插入 REFUND 类型流水', async () => {
            mockTxFindFirst.mockResolvedValue({ balance: 20 });
            mockTxInsertReturning.mockResolvedValue([{ id: 'txn-004', balance: 30 }]);

            const result = await CreditsService.refundCredits(TENANT_ID, 10, '渲染失败退回');
            expect(result.balance).toBe(30);
        });
    });

    // ——— getCurrentBalance（查询当前余额） ———

    describe('getCurrentBalance', () => {
        it('有流水时返回最后一笔余额', async () => {
            vi.mocked(db.query.aiCreditTransactions.findFirst).mockResolvedValue({ balance: 88 } as never);
            const balance = await CreditsService.getCurrentBalance(TENANT_ID);
            expect(balance).toBe(88);
        });

        it('无流水时返回 0', async () => {
            vi.mocked(db.query.aiCreditTransactions.findFirst).mockResolvedValue(null);
            const balance = await CreditsService.getCurrentBalance(TENANT_ID);
            expect(balance).toBe(0);
        });
    });
});
