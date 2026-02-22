import { z } from 'zod';
import { showroomItemStatusEnum, showroomItemTypeEnum } from '@/shared/api/schema/showroom';

/**
 * 云展厅模块 Zod Schema 定义
 * 用于参数校验与字段说明
 */

/** 通用查询参数 */
export const getShowroomItemsSchema = z.object({
    page: z.number().int().positive().default(1).describe('页码'),
    pageSize: z.number().int().positive().max(100).default(10).describe('每页条数'),
    search: z.string().optional().describe('搜索关键词'),
    type: z.enum(showroomItemTypeEnum.enumValues).optional().describe('素材类型'),
    categoryId: z.string().optional().describe('产品分类'),
    status: z.enum(showroomItemStatusEnum.enumValues).optional().describe('素材状态'),
    minScore: z.number().optional().describe('最低评分'),
    sortBy: z.enum(['latest', 'score', 'views']).default('score').describe('排序规则'),
});

/** 创建展厅素材参数 */
export const createShowroomItemSchema = z.object({
    type: z.enum(showroomItemTypeEnum.enumValues).describe('素材类型'),
    productId: z.string().uuid().optional().describe('关联商品 ID'),
    title: z.string().min(1, '标题不能为空').max(200).describe('标题'),
    content: z.string().optional().describe('富文本内容'),
    images: z.array(z.string().url()).describe('图片 URL 列表'),
    tags: z.array(z.string()).describe('标签列表'),
    status: z.enum(showroomItemStatusEnum.enumValues).default('DRAFT').describe('初始状态'),
});

/** 更新展厅素材参数 */
export const updateShowroomItemSchema = createShowroomItemSchema.partial().extend({
    id: z.string().uuid().describe('素材 ID'),
});

/** 删除展厅素材参数 */
export const deleteShowroomItemSchema = z.object({
    id: z.string().uuid().describe('素材 ID'),
});

/** 创建分享链接参数 */
export const createShareLinkSchema = z.object({
    customerId: z.string().uuid().optional().describe('关联客户 ID (可选)'),
    items: z.array(z.object({
        itemId: z.string().uuid().describe('素材 ID'),
        overridePrice: z.number().optional().describe('改价快照 (可选)'),
    })).min(1, '请至少选择一个商品').describe('分享列表'),
    expiresInDays: z.number().int().min(1).max(365).default(15).describe('有效天数'),
    password: z.string().min(4).max(6).optional().describe('访问提取码 (可选)'),
    maxViews: z.number().int().min(1).max(9999).optional().describe('最大访问次数 (选填阅后即焚)'),
});

/** 获取分享内容验证参数 */
export const getShareContentSchema = z.object({
    shareId: z.string().uuid().describe('分享记录 ID'),
    password: z.string().optional().describe('提取码参数'),
});

/** 停用分享链接参数 */
export const deactivateShareSchema = z.object({
    shareId: z.string().uuid().describe('分享记录 ID'),
});
