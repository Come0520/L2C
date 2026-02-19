import { z } from 'zod';
import { createShowroomItemSchema } from '../actions/schema';

/**
 * 计算展厅素材的质量得分
 * 评分算法：
 * - 基础分：20
 * - 包含图片：+20
 * - 内容描述 > 50字：+20
 * - 关联商品：+20
 * - 包含标签：+20
 * 
 * @param data 素材数据 (部分)
 * @returns 最终得分 (0-100)
 */
export const calculateScore = (data: Partial<z.infer<typeof createShowroomItemSchema>>) => {
    let score = 20; // 基础分
    if (data.images && data.images.length > 0) score += 20;
    if (data.content && data.content.length > 50) score += 20;
    if (data.productId) score += 20;
    if (data.tags && data.tags.length > 0) score += 20;
    return Math.min(score, 100);
}
