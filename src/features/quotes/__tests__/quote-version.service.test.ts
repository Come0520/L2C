import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QuoteVersionService } from '../services/quote-version.service';
import { db } from '@/shared/api/db';

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
              returning: vi.fn().mockResolvedValue([{ id: 'mock-quote-id' }]),
            }),
          }),
        }),
        insert: vi.fn().mockReturnValue({
          values: vi.fn().mockReturnValue({
            returning: vi.fn().mockResolvedValue([{ id: 'new-mock-id' }]),
          }),
        }),
      });
    }),
    query: {
      quotes: {
        findMany: vi.fn(),
      },
    },
    update: vi.fn().mockReturnValue({
      set: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([{ id: 'expired-id' }]),
        }),
      }),
    }),
  },
}));

describe('报价单版本与生命周期服务 (Quote Version & Lifecycle Service)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createNextVersion', () => {
    it('当报价单不存在时抛出异常', async () => {
      vi.mocked(db.transaction).mockImplementationOnce(
        async (callback: (tx: unknown) => Promise<unknown>) => {
          return callback({
            query: { quotes: { findFirst: vi.fn().mockResolvedValue(null) } },
          });
        }
      );

      await expect(
        QuoteVersionService.createNextVersion('invalid-id', 'user-1', 'tenant-1')
      ).rejects.toThrow('Quote not found');
    });

    it('成功创建新版本并增加版本号', async () => {
      const mockQuote = {
        id: 'quote-1',
        tenantId: 'tenant-1',
        rootQuoteId: 'quote-root',
        quoteNo: 'Q-2026-V1',
        version: 1,
        rooms: [{ id: 'room-1', tenantId: 'tenant-1', name: '客厅' }],
        items: [{ id: 'item-1', tenantId: 'tenant-1', category: 'CURTAIN', roomId: 'room-1' }],
      };

      vi.mocked(db.transaction).mockImplementationOnce(
        async (callback: (tx: unknown) => Promise<unknown>) => {
          return callback({
            query: { quotes: { findFirst: vi.fn().mockResolvedValue(mockQuote) } },
            update: vi.fn().mockReturnValue({
              set: vi.fn().mockReturnValue({
                where: vi.fn().mockResolvedValue([]),
              }),
            }),
            insert: vi.fn().mockReturnValue({
              values: vi.fn().mockReturnValue({
                returning: vi.fn().mockResolvedValue([{ id: 'new-quote-id' }]),
                execute: vi.fn().mockResolvedValue(undefined),
              }),
            }),
          });
        }
      );

      const result = await QuoteVersionService.createNextVersion('quote-1', 'user-1', 'tenant-1');
      expect(result).toBeDefined();
    });
  });

  describe('activateVersion', () => {
    it('当报价单不存在时抛出异常', async () => {
      vi.mocked(db.transaction).mockImplementationOnce(
        async (callback: (tx: unknown) => Promise<unknown>) => {
          return callback({
            query: { quotes: { findFirst: vi.fn().mockResolvedValue(null) } },
          });
        }
      );

      await expect(QuoteVersionService.activateVersion('quote-1', 'tenant-x')).rejects.toThrow(
        'Quote not found'
      );
    });

    it('应成功激活报价单', async () => {
      const mockQuote = { id: 'quote-1', tenantId: 'tenant-1', rootQuoteId: 'quote-root' };

      vi.mocked(db.transaction).mockImplementationOnce(
        async (callback: (tx: unknown) => Promise<unknown>) => {
          return callback({
            query: { quotes: { findFirst: vi.fn().mockResolvedValue(mockQuote) } },
            update: vi.fn().mockReturnValue({
              set: vi.fn().mockReturnValue({
                where: vi.fn().mockReturnValue({
                  returning: vi.fn().mockResolvedValue([{ id: 'mock-quote-id' }]),
                }),
              }),
            }),
          });
        }
      );

      await expect(
        QuoteVersionService.activateVersion('quote-1', 'tenant-1')
      ).resolves.toBeDefined();
    });
  });

  describe('copyQuote', () => {
    it('应复制报价单并生成新版本链', async () => {
      const mockQuote = {
        id: 'quote-1',
        tenantId: 'tenant-1',
        quoteNo: 'Q-2026',
        rooms: [],
        items: [],
      };

      vi.mocked(db.transaction).mockImplementationOnce(
        async (callback: (tx: unknown) => Promise<unknown>) => {
          return callback({
            query: { quotes: { findFirst: vi.fn().mockResolvedValue(mockQuote) } },
            insert: vi.fn().mockReturnValue({
              values: vi.fn().mockReturnValue({
                returning: vi.fn().mockResolvedValue([{ id: 'new-quote-id', rootQuoteId: null }]),
              }),
            }),
            update: vi.fn().mockReturnValue({
              set: vi.fn().mockReturnValue({
                where: vi.fn().mockResolvedValue([]),
              }),
            }),
          });
        }
      );

      const result = await QuoteVersionService.copyQuote('quote-1', 'user-1', 'tenant-1');
      expect(result).toBeDefined();
    });
  });
});
