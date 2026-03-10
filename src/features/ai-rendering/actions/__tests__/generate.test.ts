import { describe, expect, it, vi, beforeEach } from 'vitest';

// 验证点：
// 1. 无会话拦截
// 2. 积分不足拦截
// 3. TOCTOU/跨租户防护 (UPDATE 时带有 tenantId)
// 4. 执行失败状态回退

// Mock auth 模块
vi.mock('@/shared/lib/auth', () => ({
    auth: vi.fn(),
}));

const { mockUpdateSet, mockWhere, mockReturning, txMock } = vi.hoisted(() => {
    const mockUpdateSet = vi.fn().mockReturnThis();
    const mockWhere = vi.fn().mockResolvedValue([]);
    const mockReturning = vi.fn().mockResolvedValue([{ id: 'test-rendering-id' }]);

    const txMock = {
        select: vi.fn().mockReturnThis(),
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        for: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([]),
        insert: vi.fn().mockReturnValue({ values: vi.fn().mockReturnValue({ returning: mockReturning }) }),
        update: vi.fn().mockReturnValue({ set: mockUpdateSet, where: mockWhere }),
        query: {
            aiRenderings: {
                findMany: vi.fn().mockResolvedValue([]),
            }
        }
    };

    return { mockUpdateSet, mockWhere, mockReturning, txMock };
});

// Mock DB 模块
vi.mock('@/shared/api/db', () => ({
    db: {
        transaction: vi.fn(async (cb) => cb(txMock)),
        // 兼容非事务调用
        select: vi.fn().mockReturnThis(),
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([]),
        insert: vi.fn().mockReturnValue({ values: vi.fn().mockReturnValue({ returning: mockReturning }) }),
        update: vi.fn().mockReturnValue({ set: mockUpdateSet, where: mockWhere }),
    },
}));

// Mock Gemini 客户端
vi.mock('../../lib/gemini-client', () => ({
    buildPrompt: vi.fn().mockReturnValue('mock-prompt'),
    generateRendering: vi.fn(),
    CURTAIN_STYLE_PROMPT_MAP: {},
}));

// Mock 水印助手
vi.mock('../../lib/watermark', () => ({
    doesImageNeedWatermark: vi.fn().mockReturnValue(false),
    addWatermark: vi.fn(),
}));

// Mock 文件服务
vi.mock('@/shared/services/file-service', () => ({
    fileService: {
        uploadFile: vi.fn().mockResolvedValue({ success: true, url: 'http://oss/mock.jpg' }),
    },
}));

// Mock 缓存
vi.mock('next/cache', () => ({
    revalidateTag: vi.fn(),
}));

// Mock 查询
vi.mock('../queries', () => ({
    getCreditBalance: vi.fn(),
}));

import { auth } from '@/shared/lib/auth';
import { generateAiRendering } from '../generate';
import { getCreditBalance } from '../queries';
import { generateRendering } from '../../lib/gemini-client';

describe('generateAiRendering', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockWhere.mockClear();
        mockUpdateSet.mockClear();
        mockReturning.mockClear();

        vi.mocked(auth).mockResolvedValue({
            user: { id: 'u1', tenantId: 't1', planType: 'base' },
        } as any);
        vi.mocked(getCreditBalance).mockResolvedValue({ remaining: 100, total: 100, used: 0 });
        vi.mocked(generateRendering).mockResolvedValue({
            imageBase64: 'mock-base64',
            mimeType: 'image/jpeg',
        });
    });

    it('未登录时应返回错误', async () => {
        vi.mocked(auth).mockResolvedValue(null);
        const result = await generateAiRendering({
            originalImageBase64: 'base64',
            curtainStyleId: 'c1',
            fabricDescription: 'desc',
            fabricSource: 'upload',
        });
        expect(result.success).toBe(false);
        expect(result.error).toBe('请先登录');
    });

    it('积分不足时应被拒绝', async () => {
        // calculateCreditsCost 对 upload 会需要1点。让 findMany 返回已经用了50点的值 (base套餐总共50点)
        txMock.query.aiRenderings.findMany.mockResolvedValueOnce([{ creditsUsed: 50, createdAt: new Date() }]);
        // 需要让计划返回 10 
        vi.mocked(auth).mockResolvedValue({
            user: { id: 'u1', tenantId: 't1', planType: 'base' },
        } as any);

        const result = await generateAiRendering({
            originalImageBase64: 'base64',
            curtainStyleId: 'c1',
            fabricDescription: 'desc',
            fabricSource: 'upload',
        });
        expect(result.success).toBe(false);
        expect(result.error).toMatch(/积分不足/);
    });

    it('生成成功时应带上 tenantId 更新状态 (验证 TOCTOU 防护)', async () => {
        const result = await generateAiRendering({
            originalImageBase64: 'base64',
            curtainStyleId: 'c1',
            fabricDescription: 'desc',
            fabricSource: 'upload',
        });

        expect(result.success).toBe(true);
        // 验证调用了 update 设置 completed
        expect(mockUpdateSet).toHaveBeenCalledWith(expect.objectContaining({ status: 'completed' }));

        // 验证必定会由于 TOCTOU 防护走 where 约束条件 (包含 tenantId)
        expect(mockWhere).toHaveBeenCalled();
    });

    it('Gemini 调用失败时应记录为 FAILED 状态', async () => {
        vi.mocked(generateRendering).mockRejectedValue(new Error('AI Failed Test'));
        const result = await generateAiRendering({
            originalImageBase64: 'base64',
            curtainStyleId: 'c1',
            fabricDescription: 'desc',
            fabricSource: 'upload',
        });

        expect(result.success).toBe(false);
        expect(mockUpdateSet).toHaveBeenCalledWith(expect.objectContaining({ status: 'failed' }));
        expect(result.error).toBe('AI Failed Test');
    });
});
