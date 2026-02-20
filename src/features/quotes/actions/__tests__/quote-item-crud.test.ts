/**
 * Quotes 模块 Server Actions 集成测试 (CRUD: 报价单行项目)
 *
 * 覆盖范围：
 * - createQuoteItem (计算引擎、自动补充产品属性、自动配件推荐)
 * - updateQuoteItem
 * - deleteQuoteItem
 * - reorderQuoteItems
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

// ── 导入 Mock 工具 ──
import { createMockDb } from '@/shared/tests/mock-db';
// 绕开路径别名问题，直接使用 mock-factory (通过路径)
import { createMockSession } from '@/shared/tests/mock-factory';

const MOCK_QUOTE_ID = '110e8400-e29b-41d4-a716-446655440000';
const MOCK_ITEM_ID = '330e8400-e29b-41d4-a716-446655440000';
const MOCK_SESSION = createMockSession();
const MOCK_TENANT_ID = MOCK_SESSION.user.tenantId;

// ── Mock Db Config ──
const mockDb = createMockDb(['quotes', 'quoteItems', 'products']);

// 为了测试插入，我们需要捕获插入的数据
const mockInsertChain = {
    values: vi.fn().mockReturnThis(),
    returning: vi.fn().mockResolvedValue([{ id: MOCK_ITEM_ID }])
};
mockDb.insert = vi.fn(() => mockInsertChain) as unknown as typeof mockDb.insert;

const mockUpdateChain = {
    set: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    returning: vi.fn().mockResolvedValue([{ id: MOCK_ITEM_ID }])
};
mockDb.update = vi.fn(() => mockUpdateChain) as unknown as typeof mockDb.update;

const mockDeleteChain = {
    where: vi.fn().mockReturnThis(),
    returning: vi.fn().mockResolvedValue([{ id: MOCK_ITEM_ID }])
};
mockDb.delete = vi.fn(() => mockDeleteChain) as unknown as typeof mockDb.delete;

mockDb.transaction = vi.fn().mockImplementation(async (callback) => callback(mockDb));

vi.mock('@/shared/api/db', () => ({
    db: mockDb,
}));

// Mock Server Action Middleware
vi.mock('@/shared/lib/server-action', () => ({
    createSafeAction: (schema: unknown, handler: (input: unknown, ctx: unknown) => Promise<unknown>) => {
        return async (input: unknown) => {
            return handler(input, { session: MOCK_SESSION });
        };
    }
}));

// Mock Audit
vi.mock('@/shared/lib/audit-service', () => ({
    AuditService: { recordFromSession: vi.fn() },
}));

vi.mock('next/cache', () => ({
    revalidatePath: vi.fn(),
}));

// Mock 相关服务
vi.mock('@/services/quote-config.service', () => ({
    QuoteConfigService: {
        getMergedConfig: vi.fn().mockResolvedValue({
            presetLoss: {
                curtain: { defaultFoldRatio: 2, sideLoss: 0.1, bottomLoss: 0.1, headerLoss: 0.1 },
                wallpaper: { widthLoss: 0.05, cutLoss: 0.05 }
            }
        })
    }
}));

vi.mock('../../services/accessory-linkage.service', () => ({
    AccessoryLinkageService: {
        getRecommendedAccessories: vi.fn().mockResolvedValue([])
    }
}));

// Mock StrategyFactory (计算引擎)
vi.mock('../../calc-strategies/strategy-factory', () => ({
    StrategyFactory: {
        getStrategy: vi.fn().mockReturnValue({
            calculate: vi.fn().mockReturnValue({
                usage: 5.5,
                details: { info: 'Calculated using mock strategy' }
            })
        })
    }
}));

// Mock shared-helpers (总计更新)
vi.mock('../shared-helpers', () => ({
    calculateSubtotal: vi.fn().mockReturnValue('100.00'), // 假数值
    updateQuoteTotal: vi.fn().mockResolvedValue(true),
}));

vi.mock('@/shared/api/schema/quotes', () => ({
    quotes: { id: 'quotes.id', tenantId: 'quotes.tenantId' },
    quoteItems: { id: 'quoteItems.id', tenantId: 'quoteItems.tenantId', quoteId: 'quoteItems.quoteId' }
}));
vi.mock('@/shared/api/schema/catalogs', () => ({
    products: { id: 'products.id' }
}));
vi.mock('@/shared/lib/validators', () => ({
    SizeValidator: { validate: vi.fn().mockReturnValue({ messages: [] }) }
}));

// ── 测试套件 ──
describe('Quote Items CRUD Actions (L5)', () => {
    beforeEach(() => {
        vi.clearAllMocks();

        // 默认模拟：找到关联的主报价单
        mockDb.query.quotes.findFirst.mockResolvedValue({
            id: MOCK_QUOTE_ID,
            tenantId: MOCK_TENANT_ID,
            createdBy: MOCK_SESSION.user.id
        });

        // 默认模拟：没有找到任何相关产品（简化逻辑）
        mockDb.query.products.findFirst.mockResolvedValue(null);

        // 默认模拟：找到存在的报价明细项 (为了 update 和 delete)
        mockDb.query.quoteItems.findFirst.mockResolvedValue({
            id: MOCK_ITEM_ID,
            quoteId: MOCK_QUOTE_ID,
            tenantId: MOCK_TENANT_ID,
            category: 'CURTAIN',
            width: '200',
            height: '250',
            foldRatio: '2',
            attributes: {},
            unitPrice: '50.00',
            quantity: '1'
        });
    });

    it('createQuoteItem 应当成功记录并在通过计算策略获取到用量', async () => {
        // 让推荐配件服务返回一个配件
        const { AccessoryLinkageService } = await import('../../services/accessory-linkage.service');
        vi.mocked(AccessoryLinkageService.getRecommendedAccessories).mockResolvedValue([{
            category: 'ACCESSORY',
            productId: 'acc-1',
            productName: '轨道',
            unitPrice: 10,
            quantity: 1,
            remark: '推荐'
        }]);

        const { createQuoteItem } = await import('../quote-item-crud');
        const { updateQuoteTotal } = await import('../shared-helpers');
        const { StrategyFactory } = await import('../../calc-strategies/strategy-factory');

        const input = {
            quoteId: MOCK_QUOTE_ID,
            category: 'CURTAIN' as const,
            productName: '测试窗帘',
            unitPrice: 50,
            quantity: 1, // 原始传入 1，但应当被计算引擎覆盖
            width: 200,
            height: 250
        };

        const result = await createQuoteItem(input);

        // 验证调用了计算策略的工厂
        expect(StrategyFactory.getStrategy).toHaveBeenCalledWith('CURTAIN');

        // 验证配件追加插件被调用
        expect(AccessoryLinkageService.getRecommendedAccessories).toHaveBeenCalled();

        // 验证主数据和配件数据都被插入 (2 次 calls: 主体 + 配件)
        expect(mockInsertChain.values).toHaveBeenCalledTimes(2);

        // 验证主体插入中的属性覆盖 (计算得到的 usage 5.5 被转为 '5.5')
        const mainInsertValues = mockInsertChain.values.mock.calls[0][0];
        expect(mainInsertValues.quantity).toBe('5.5');
        expect(mainInsertValues.attributes.calcResult).toBeDefined();

        // 验证总额更新 (会被调用多次，主体一次、配件插入后又一次)
        expect(updateQuoteTotal).toHaveBeenCalledWith(MOCK_QUOTE_ID, MOCK_TENANT_ID);

        expect(result).toHaveProperty('id', MOCK_ITEM_ID);
    });

    it('updateQuoteItem 应当成功读取旧数据合并计算并更新', async () => {
        const { updateQuoteItem } = await import('../quote-item-crud');
        const { StrategyFactory } = await import('../../calc-strategies/strategy-factory');

        const result = await updateQuoteItem({
            id: MOCK_ITEM_ID,
            width: 300 // 只修改宽度，其他复用 existing
        });

        // 验证计算策略再次被获取并调用 (因为宽高改变)
        expect(StrategyFactory.getStrategy).toHaveBeenCalledWith('CURTAIN');

        // 检查 Update 语句的参数
        const updateSetArgs = mockUpdateChain.set.mock.calls[0][0];
        // 策略 Mock 默认返回 5.5，宽度变了也会套用模拟计算
        expect(updateSetArgs.width).toBe('300');
        expect(updateSetArgs.quantity).toBe('5.5');

        expect(result).toEqual({ success: true });
    });

    it('deleteQuoteItem 应当记录审计日志并删除', async () => {
        const { deleteQuoteItem } = await import('../quote-item-crud');
        const { AuditService } = await import('@/shared/lib/audit-service');

        const result = await deleteQuoteItem({ id: MOCK_ITEM_ID });

        expect(mockDeleteChain.where).toHaveBeenCalled();
        expect(AuditService.recordFromSession).toHaveBeenCalledWith(
            MOCK_SESSION, 'quoteItems', MOCK_ITEM_ID, 'DELETE', expect.anything()
        );
        expect(result).toEqual({ success: true });
    });

    it('reorderQuoteItems 应在事务内批量刷新排序', async () => {
        const { reorderQuoteItems } = await import('../quote-item-crud');

        const items = [
            { id: 'item1', sortOrder: 1 },
            { id: 'item2', sortOrder: 2 }
        ];

        const result = await reorderQuoteItems({
            quoteId: MOCK_QUOTE_ID,
            items
        });

        // 事务应该被调用
        expect(mockDb.transaction).toHaveBeenCalled();
        // Update 链应该被循环调用两次
        expect(mockUpdateChain.set).toHaveBeenCalledTimes(2);

        expect(result).toEqual({ success: true });
    });
});
