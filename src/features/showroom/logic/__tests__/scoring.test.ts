import { describe, it, expect } from 'vitest';
import { calculateScore } from '../scoring';

describe('calculateScore 评分算法单元测试', () => {
    it('基础分验证：空数据应返回基础分 20', () => {
        expect(calculateScore({})).toBe(20);
    });

    it('图片得分：包含至少一张图片应加 20 分', () => {
        expect(calculateScore({ images: ['https://example.com/1.jpg'] })).toBe(40);
        expect(calculateScore({ images: [] })).toBe(20);
    });

    it('内容得分：内容超过 50 字应加 20 分', () => {
        // 边界：50 字
        expect(calculateScore({ content: 'a'.repeat(50) })).toBe(20);
        // 边界：51 字
        expect(calculateScore({ content: 'a'.repeat(51) })).toBe(40);
    });

    it('商品关联得分：关联 productId 应加 20 分', () => {
        expect(calculateScore({ productId: '550e8400-e29b-41d4-a716-446655440000' })).toBe(40);
    });

    it('标签得分：包含至少一个标签应加 20 分', () => {
        expect(calculateScore({ tags: ['tag1'] })).toBe(40);
        expect(calculateScore({ tags: [] })).toBe(20);
    });

    it('多维叠加得分：图片 + 商品', () => {
        expect(calculateScore({
            images: ['img'],
            productId: 'uuid'
        })).toBe(60);
    });

    it('满分验证：满足所有条件应返回 100 分', () => {
        expect(calculateScore({
            images: ['img'],
            content: 'x'.repeat(51),
            productId: 'uuid',
            tags: ['tag1']
        })).toBe(100);
    });

    it('封顶验证：得分不应超过 100 分', () => {
        // 构造一个可能理论超过 100 的情况（虽然代码中是 Math.min(score, 100)）
        expect(calculateScore({
            images: ['img1', 'img2'],
            content: 'x'.repeat(100),
            productId: 'uuid',
            tags: ['tag1', 'tag2'],
            // 假设未来加了新维度
        } as any)).toBe(100);
    });

    it('类型敏感：productId 为空字符串时不应作为关联商品加分（依赖逻辑实现，当前逻辑仅判断是否存在）', () => {
        // 当前逻辑是 if (data.productId) score += 20; 
        expect(calculateScore({ productId: '' })).toBe(20);
    });

    it('逻辑鲁棒性：非法或空数组不应加分', () => {
        expect(calculateScore({ images: [] as any, tags: [] as any })).toBe(20);
    });
});
