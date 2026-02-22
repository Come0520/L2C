import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QuoteVersionService } from '../services/quote-version.service';
import { db } from '@/shared/api/db';

// 模拟数据库事务与操作
vi.mock('@/shared/api/db', () => ({
    db: {
        transaction: vi.fn(async (callback) => {
            return callback({
                query: {
                    quotes: {
                        findFirst: vi.fn(),
                    },
                },
                update: vi.fn().mockReturnValue({
                    set: vi.fn().mockReturnValue({
                        where: vi.fn().mockReturnValue({
                            returning: vi.fn().mockResolvedValue([{ id: 'mock-quote-id' }])
                        })
                    })
                }),
                insert: vi.fn().mockReturnValue({
                    values: vi.fn().mockReturnValue({
                        returning: vi.fn().mockResolvedValue([{ id: 'new-mock-id' }])
                    })
                }),
            });
        }),
        update: vi.fn().mockReturnValue({
            set: vi.fn().mockReturnValue({
                where: vi.fn().mockReturnValue({
                    returning: vi.fn().mockResolvedValue([{ id: 'expired-id' }])
                })
            })
        })
    },
}));

describe('报价单版本与生命周期服务 (Quote Version & Lifecycle Service)', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('createNewVersion (创建新版本)', () => {
        it('当报价单不存在时抛出异常 (Throw error if quote not found)', async () => {
            // 覆盖模拟使得 findFirst 返回 null
            vi.mocked(db.transaction).mockImplementationOnce(async (callback: any) => {
                return callback({
                    query: {
                        quotes: {
                            findFirst: vi.fn().mockResolvedValue(null),
                        },
                    },
                });
            });

            await expect(
                QuoteVersionService.createNewVersion('invalid-id', 'user-1', 'tenant-1')
            ).rejects.toThrow('报价单不存在或无权操作');
        });

        it('成功创建新版本并增加版本号 (Successfully create and increment version)', async () => {
            const mockQuote = {
                id: 'quote-1',
                tenantId: 'tenant-1',
                rootQuoteId: 'quote-root',
                quoteNo: 'Q-2026-V1',
                version: 1,
                rooms: [{ id: 'room-1', tenantId: 'tenant-1', name: '客厅' }],
                items: [{ id: 'item-1', tenantId: 'tenant-1', category: 'CURTAIN', roomId: 'room-1' }]
            };

            vi.mocked(db.transaction).mockImplementationOnce(async (callback: any) => {
                return callback({
                    query: {
                        quotes: {
                            findFirst: vi.fn().mockResolvedValue(mockQuote),
                        }
                    },
                    update: vi.fn().mockReturnValue({
                        set: vi.fn().mockReturnValue({
                            where: vi.fn().mockResolvedValue([])
                        })
                    }),
                    insert: vi.fn().mockReturnValue({
                        values: vi.fn().mockReturnValue({
                            returning: vi.fn().mockResolvedValue([{ id: 'new-quote-id' }]),
                            execute: vi.fn().mockResolvedValue(undefined)
                        })
                    })
                });
            });

            const rootQuoteId = mockQuote.rootQuoteId;
            const tId = mockQuote.tenantId;

            const result = await QuoteVersionService.createNewVersion('quote-1', 'user-1', tId);
            expect(result).toBeDefined();
        });
    });

    describe('checkExpirations (过期处理自动化)', () => {
        it('应将超期且状态为PENDING_CUSTOMER的报价单标记为已过期 (Mark expired quotes)', async () => {
            const expiredCount = await QuoteVersionService.checkExpirations();
            expect(expiredCount).toBe(1);
        });
    });

    describe('activate (设置为主版本)', () => {
        it('当报价单不存在时抛出异常 (Throw error if quote not found)', async () => {
            vi.mocked(db.transaction).mockImplementationOnce(async (callback: any) => {
                return callback({
                    query: {
                        quotes: {
                            findFirst: vi.fn().mockResolvedValue(null),
                        },
                    },
                });
            });

            await expect(
                QuoteVersionService.activate('quote-1', 'tenant-x')
            ).rejects.toThrow('报价单不存在或无权操作');
        });

        it('应成功激活报价单并降级同家族所有版本 (Successfully activate)', async () => {
            const mockQuote = {
                id: 'quote-1',
                tenantId: 'tenant-1',
                rootQuoteId: 'quote-root',
                quoteNo: 'Q-2026-V1',
                version: 1,
            };

            vi.mocked(db.transaction).mockImplementationOnce(async (callback: any) => {
                return callback({
                    query: {
                        quotes: {
                            findFirst: vi.fn().mockResolvedValue(mockQuote),
                        }
                    },
                    update: vi.fn().mockReturnValue({
                        set: vi.fn().mockReturnValue({
                            where: vi.fn().mockResolvedValue([])
                        })
                    }),
                });
            });

            await expect(QuoteVersionService.activate('quote-1', 'tenant-1')).resolves.not.toThrow();
        });
    });
});
