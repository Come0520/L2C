import { vi, describe, it, expect, beforeEach } from 'vitest';
import {
    getShowroomItems,
    createShowroomItem,
    updateShowroomItem,
    deleteShowroomItem
} from '../items';
import { ShowroomErrors } from '../../errors';
import { canManageShowroomItem } from '../../logic/permissions';
import { auth } from '@/shared/lib/auth';
import { AuditService } from '@/shared/services/audit-service';

// Hoist mocks
const mocks = vi.hoisted(() => ({
    findFirst: vi.fn(),
    findMany: vi.fn(),
    returning: vi.fn(),
    values: vi.fn(),
    set: vi.fn(),
    from: vi.fn(),
    where: vi.fn(),
    UUID_1: '11111111-1111-4111-8111-111111111111',
}));

// Recursive mock structure helper
mocks.values.mockReturnValue({ returning: mocks.returning });
mocks.set.mockReturnValue({
    where: vi.fn(() => ({ returning: mocks.returning }))
});
mocks.from.mockReturnValue({
    where: vi.fn().mockReturnValue({
        orderBy: vi.fn().mockReturnValue({
            limit: vi.fn().mockReturnValue({
                offset: vi.fn().mockResolvedValue([{
                    item: { id: mocks.UUID_1, title: '测试素材' },
                    totalCount: 1
                }])
            })
        })
    })
});

vi.mock('@/shared/api/db', () => ({
    db: {
        query: {
            showroomItems: {
                findFirst: mocks.findFirst,
                findMany: mocks.findMany,
            },
        },
        insert: vi.fn(() => ({ values: mocks.values })),
        update: vi.fn(() => ({ set: mocks.set })),
        select: vi.fn(() => ({ from: mocks.from })),
    },
}));

vi.mock('@/shared/lib/auth', () => ({
    auth: vi.fn(),
    checkPermission: vi.fn(),
}));

vi.mock('@/shared/services/audit-service', () => ({
    AuditService: {
        log: vi.fn(),
    },
}));

vi.mock('../../logic/permissions', () => ({
    canManageShowroomItem: vi.fn(),
}));

vi.mock('isomorphic-dompurify', () => ({
    default: { sanitize: vi.fn((html) => html.replace(/<script.*?>.*?<\/script>/gi, '')) },
}));

vi.mock('next/cache', () => ({
    revalidatePath: vi.fn(),
}));

import type { Session } from 'next-auth';
const UUID_1 = mocks.UUID_1;
const mockSession = { user: { id: 'u1', tenantId: 't1' } } as unknown as Session;

describe('getShowroomItems() Action', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(auth).mockResolvedValue(mockSession);
        mocks.findMany.mockResolvedValue([]);
    });

    it('应返回带分页的数据', async () => {
        const result = await getShowroomItems({ page: 1, pageSize: 10 });
        expect(result.data).toBeInstanceOf(Array);
        expect(result.pagination.total).toBe(1);
        expect(result.data[0].title).toBe('测试素材');
    });
});

describe('createShowroomItem() Action', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(auth).mockResolvedValue(mockSession);
        mocks.returning.mockReturnValue([{
            id: UUID_1, title: '测试素材', type: 'CASE', tenantId: 't1', createdBy: 'u1', score: 40
        }]);
    });

    it('应成功创建并记录审计日志', async () => {
        const input = {
            type: 'CASE' as const,
            title: '测试素材',
            content: '内容',
            images: ['http://ex.com/a.jpg'],
            tags: [],
            status: 'PUBLISHED' as const
        };
        const result = await createShowroomItem(input);
        expect(result.id).toBe(UUID_1);
        expect(AuditService.log).toHaveBeenCalled();
    });

    it('创建时应清洗 XSS 内容', async () => {
        const input = {
            type: 'CASE' as const,
            title: 'XSS',
            content: '<script>alert(1)</script>safe',
            images: [],
            tags: [],
            status: 'PUBLISHED' as const,
        };
        // 模拟数据库返回的是由 Action 处理（清洗）过后的数据
        mocks.returning.mockImplementation((values) => [{
            ...input,
            ...values,
            content: 'safe', // 显式匹配清洗后的内容
            id: UUID_1,
            tenantId: 't1',
            createdBy: 'u1'
        }]);
        await createShowroomItem(input);
        expect(AuditService.log).toHaveBeenCalledWith(
            expect.anything(),
            expect.objectContaining({
                tableName: 'showroom_items',
                action: 'CREATE',
                newValues: expect.objectContaining({ content: expect.not.stringContaining('<script>') })
            })
        );
    });
});

describe('updateShowroomItem() Action', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(auth).mockResolvedValue(mockSession);
        vi.mocked(canManageShowroomItem).mockResolvedValue(true);
        mocks.returning.mockReturnValue([{
            id: UUID_1, title: '新', tenantId: 't1', createdBy: 'u1'
        }]);
    });

    it('应成功更新并记录审计日志', async () => {
        mocks.findFirst.mockResolvedValue({
            id: UUID_1, title: '旧', createdBy: 'u1', tenantId: 't1', images: [], tags: [], status: 'PUBLISHED'
        });

        const result = await updateShowroomItem({ id: UUID_1, title: '新' });
        expect(result.id).toBe(UUID_1);
        expect(AuditService.log).toHaveBeenCalledWith(
            expect.anything(),
            expect.objectContaining({
                tableName: 'showroom_items',
                recordId: UUID_1,
                action: 'UPDATE',
                oldValues: expect.any(Object),
                newValues: expect.any(Object)
            })
        );
    });

    it('更新不存在的记录应抛出 Item not found', async () => {
        mocks.findFirst.mockResolvedValue(undefined);
        await expect(updateShowroomItem({ id: UUID_1, title: 'new' })).rejects.toThrow(ShowroomErrors.ITEM_NOT_FOUND.message);
    });

    it('非创建者更新应抛出权限异常', async () => {
        mocks.findFirst.mockResolvedValue({
            id: UUID_1, title: '旧', createdBy: 'u2', tenantId: 't1', images: [], tags: [], status: 'PUBLISHED'
        });
        vi.mocked(canManageShowroomItem).mockResolvedValue(false);

        await expect(updateShowroomItem({ id: UUID_1, title: 'new' })).rejects.toThrow(ShowroomErrors.FORBIDDEN.message);
    });
});

describe('deleteShowroomItem() Action', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(auth).mockResolvedValue(mockSession);
        vi.mocked(canManageShowroomItem).mockResolvedValue(true);
    });

    it('应执行软删除', async () => {
        mocks.findFirst.mockResolvedValue({
            id: UUID_1, title: 'Del', createdBy: 'u1', tenantId: 't1'
        });

        const result = await deleteShowroomItem({ id: UUID_1 });
        expect(result.success).toBe(true);
        expect(mocks.set).toHaveBeenCalledWith(expect.objectContaining({ status: 'ARCHIVED' }));
        expect(AuditService.log).toHaveBeenCalled();
    });
});
