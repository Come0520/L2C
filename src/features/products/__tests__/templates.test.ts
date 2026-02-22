'use strict';

import { describe, it, expect, vi, beforeEach } from 'vitest';

// ---------------------------------------------------------
// Mock 闭包：数据库与鉴权
// ---------------------------------------------------------
const { mockInsert, mockUpdate, mockQueryFindFirst } = vi.hoisted(() => {
    const fnUpdate = vi.fn().mockReturnValue({
        set: vi.fn().mockReturnValue({
            where: vi.fn().mockResolvedValue(undefined)
        })
    });
    const fnInsert = vi.fn().mockReturnValue({
        values: vi.fn().mockReturnValue({
            returning: vi.fn().mockResolvedValue([{ id: '880e8400-e29b-41d4-a716-446655440001', tenantId: '880e8400-e29b-41d4-a716-446655440000', category: 'PHYSICAL', templateSchema: [] }])
        })
    });
    return {
        mockInsert: fnInsert,
        mockUpdate: fnUpdate,
        mockQueryFindFirst: vi.fn(),
    };
});

vi.mock('@/shared/api/db', () => ({
    db: {
        insert: mockInsert,
        update: mockUpdate,
        query: {
            productAttributeTemplates: {
                findFirst: mockQueryFindFirst,
            }
        }
    }
}));

vi.mock('@/shared/api/schema', () => ({
    productCategoryEnum: {
        enumValues: ['PHYSICAL', 'VIRTUAL', 'SERVICE', 'SOFTWARE']
    },
    productAttributeTemplates: {
        id: 'productAttributeTemplates.id',
        tenantId: 'productAttributeTemplates.tenantId',
        category: 'productAttributeTemplates.category',
    }
}));

// Mock permission checker
vi.mock('@/shared/lib/auth', () => ({
    auth: vi.fn(),
    checkPermission: vi.fn().mockResolvedValue(true)
}));

vi.mock('next/cache', () => ({
    revalidatePath: vi.fn()
}));

vi.mock('@/shared/services/audit-service', () => ({
    AuditService: { log: vi.fn().mockResolvedValue(undefined) }
}));

vi.mock('drizzle-orm', async (importOriginal) => {
    const actual = await importOriginal();
    return { ...actual, eq: vi.fn(), and: vi.fn() };
});

// --- 由于 createSafeAction 内部调用 server-only 逻辑，需要特殊处理 auth ---
// 但是为了简单起见，我们在外部已经把 auth mock 掉了。

import {
    upsertAttributeTemplate,
    getAttributeTemplate
} from '../actions/templates';
import { db } from '@/shared/api/db';
import { auth, checkPermission } from '@/shared/lib/auth';
import { revalidatePath } from 'next/cache';

// ---------------------------------------------------------
// 测试常量
// ---------------------------------------------------------
const mockTenantId = '880e8400-e29b-41d4-a716-446655440000';
const mockId = '880e8400-e29b-41d4-a716-446655440001';

const mockSession = {
    user: {
        id: 'u-001',
        tenantId: mockTenantId,
    }
};

describe('Attribute Templates Actions', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(auth).mockResolvedValue(mockSession as any);
        vi.mocked(checkPermission).mockResolvedValue(true);
    });

    describe('upsertAttributeTemplate', () => {
        const validInput = {
            category: 'PHYSICAL' as const,
            templateSchema: [
                {
                    key: 'color',
                    label: '颜色',
                    type: 'STRING' as const,
                    required: true,
                    showInQuote: false,
                }
            ]
        };

        it('记录不存在时进行 Insert 操作', async () => {
            mockQueryFindFirst.mockResolvedValueOnce(null); // 不存在

            const result = await upsertAttributeTemplate(validInput);

            expect(result.success).toBe(true);
            expect(result.data).toEqual({ success: true });
            expect(mockInsert).toHaveBeenCalled();
            expect(mockUpdate).not.toHaveBeenCalled();
            expect(revalidatePath).toHaveBeenCalledWith('/settings/products/templates');
            expect(revalidatePath).toHaveBeenCalledWith('/supply-chain/products');
        });

        it('记录存在时进行 Update 操作', async () => {
            mockQueryFindFirst.mockResolvedValueOnce({ id: mockId }); // 已存在

            const result = await upsertAttributeTemplate(validInput);

            expect(result.success).toBe(true);
            expect(result.data).toEqual({ success: true });
            expect(mockUpdate).toHaveBeenCalled();
            expect(mockInsert).not.toHaveBeenCalled();
        });

        it('Schema 字段格式错误时抛异常', async () => {
            const invalidInput = {
                category: 'PHYSICAL' as const,
                templateSchema: [
                    {
                        key: 'invalid key with spaces', // regex will fail
                        label: '标签',
                        type: 'STRING' as const,
                    }
                ]
            };

            const result = await upsertAttributeTemplate(invalidInput as any);

            expect(result.success).toBe(false);
            expect(result.error).toContain('输入验证失败');
        });
    });

    describe('getAttributeTemplate', () => {
        it('获取存在的模板', async () => {
            const mockTemplate = {
                id: mockId,
                category: 'PHYSICAL',
                templateSchema: [{ key: 'size', label: '尺码', type: 'STRING' }]
            };
            mockQueryFindFirst.mockResolvedValueOnce(mockTemplate);

            const result = await getAttributeTemplate({ category: 'PHYSICAL' });

            expect(result.success).toBe(true);
            expect(result.data).toEqual(mockTemplate);
        });

        it('获取不存在的模板时返回空 Schema', async () => {
            mockQueryFindFirst.mockResolvedValueOnce(null);

            const result = await getAttributeTemplate({ category: 'VIRTUAL' });

            expect(result.success).toBe(true);
            expect(result.data).toEqual({ category: 'VIRTUAL', templateSchema: [] });
        });

        it('未登录查模板时报错', async () => {
            vi.mocked(auth).mockResolvedValueOnce(null);

            const result = await getAttributeTemplate({ category: 'PHYSICAL' });

            expect(result.success).toBe(false);
            expect(result.error).toContain('未授权访问');
        });
    });
});
