import { describe, it, expect, beforeEach, vi } from 'vitest';
import { submitQuoteAction } from '../actions/quote-lifecycle-actions';

// 下面的模块在 quote-lifecycle-actions.ts 中被直接调用，必须 mock
vi.mock('next/cache', () => ({
    revalidatePath: vi.fn(),
    revalidateTag: vi.fn(),
}));

vi.mock('@/shared/lib/logger', () => ({
    logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

// 使用 vi.hoisted 提升所有 mock 变量，避免工厂闭包报错
const {
    mockUpdate, mockCheckPermission, mockAuth,
    mockQuoteLifecycleSubmit, mockAuditRecordFromSession
} = vi.hoisted(() => ({
    mockUpdate: vi.fn(),
    mockCheckPermission: vi.fn(),
    mockAuth: vi.fn(),
    mockQuoteLifecycleSubmit: vi.fn(),
    mockAuditRecordFromSession: vi.fn(),
}));

vi.mock('@/shared/api/db', () => ({
    db: {
        update: mockUpdate
    }
}));

vi.mock('@/shared/lib/auth', () => ({
    auth: mockAuth,
    checkPermission: mockCheckPermission
}));

vi.mock('@/services/quote-lifecycle.service', () => ({
    QuoteLifecycleService: {
        submit: mockQuoteLifecycleSubmit
    }
}));

// AuditService.recordFromSession 内部会尝试访问 DB
// 需要 mock 避免真实 DB 操作
vi.mock('@/shared/lib/audit-service', () => ({
    logAuditEvent: vi.fn().mockResolvedValue(undefined),
    AuditService: {
        record: vi.fn().mockResolvedValue(undefined),
        recordFromSession: mockAuditRecordFromSession,
    },
}));

describe('报价单并发保护测试', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        // 重新设置 hoisted mock 的默认返回值（clearAllMocks 会清除实现）
        mockAuth.mockResolvedValue({ user: { id: 'test-user-id', tenantId: 'test-tenant-id' } });
        mockCheckPermission.mockResolvedValue(true);
        mockQuoteLifecycleSubmit.mockResolvedValue(undefined);
        mockAuditRecordFromSession.mockResolvedValue(undefined);
    });

    it('版本号不匹配时应阻断更新 (乐观锁验证)', async () => {
        // 模拟 DB update 返回空数组 (即通过 version 过滤后未找到记录)
        mockUpdate.mockReturnValue({
            set: vi.fn().mockReturnThis(),
            where: vi.fn().mockReturnThis(),
            returning: vi.fn().mockResolvedValue([])
        } as any);

        const result = await submitQuoteAction({
            id: '110e8400-e29b-41d4-a716-446655440000',
            version: 1 // 携带旧版本号
        });

        // 断言返回并发冲突错误
        expect(result).toMatchObject({
            error: expect.stringContaining('报价数据已被修改')
        });
    });

    it('未提供版本号时应跳过检查 (兼容性)', async () => {
        // 模拟未传 version，正常执行（preflightVersionCheck 直接返回，不调用 db.update）
        mockUpdate.mockReturnValue({
            set: vi.fn().mockReturnThis(),
            where: vi.fn().mockReturnThis(),
            returning: vi.fn().mockResolvedValue([{ id: '110e8400-e29b-41d4-a716-446655440000' }])
        } as any);

        const result = await submitQuoteAction({
            id: '110e8400-e29b-41d4-a716-446655440000'
            // 没有 version 字段
        });

        expect(result?.error).toBeUndefined();
    });
});
