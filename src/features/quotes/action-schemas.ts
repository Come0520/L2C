import { z } from 'zod';
import { productCategorySchema } from './constants';

// ==================== Quote Bundle Schemas ====================

export const createQuoteBundleSchema = z.object({
    leadId: z.string().optional().describe('关联线索 ID'),
    customerId: z.string().describe('客户 ID'),
    summaryMode: z.enum(['BY_CATEGORY', 'BY_ROOM']).default('BY_CATEGORY').describe('汇总模式：按分类或按空间'),
    remark: z.string().optional().describe('报价单合集备注'),
}).describe('创建报价单合集请求参数');

export const getQuoteBundleByIdSchema = z.object({
    id: z.string().describe('报价单合集 ID'),
}).describe('获取报价单合集详情请求参数');

export const updateQuoteBundleSchema = z.object({
    id: z.string().describe('报价单合集 ID'),
    summaryMode: z.enum(['BY_CATEGORY', 'BY_ROOM']).describe('汇总模式：按分类或按空间'),
    remark: z.string().optional().describe('报价单合集备注'),
}).describe('更新报价单合集请求参数');

// ==================== Quote Item Schema ====================

export const QuoteItemAttachmentSchema = z.object({
    id: z.string().optional().describe('附件 ID'),
    name: z.string().describe('附件名称'),
    type: z.enum(['IMAGE', 'DOCUMENT']).describe('附件类型'),
    url: z.string().describe('附件URL地址'),
}).describe('报价明细附件对象');

export const QuoteItemInputSchema = z.object({
    id: z.string().optional().describe('明细项 ID'),
    name: z.string().describe('明细名称/产品名称'),
    quantity: z.number().describe('数量'),
    unitPrice: z.number().describe('单价'),
    amount: z.number().describe('总价/金额'),
    unit: z.string().optional().describe('单位'),
    remark: z.string().optional().describe('备注信息'),
    roomName: z.string().optional().describe('关联空间名称'),
    width: z.number().optional().describe('宽度（如适用）'),
    height: z.number().optional().describe('高度（如适用）'),
    foldRatio: z.number().optional().describe('褶皱倍数（窗帘适用）'),
    fabricWidth: z.number().optional().describe('门幅/布幅（窗帘适用）'),
    installPosition: z.enum(['CURTAIN_BOX', 'INSIDE', 'OUTSIDE', 'CUSTOM']).optional().describe('安装位置'),
    attachments: z.array(QuoteItemAttachmentSchema).optional().describe('附件列表'),
}).describe('报价单明细录入参数');

// ==================== List/Filter Schemas ====================

export const getQuoteBundlesSchema = z.object({
    page: z.number().optional().describe('页码'),
    pageSize: z.number().optional().describe('每页条数'),
    status: z.enum(['ALL', 'DRAFT', 'ACTIVE', 'LOCKED', 'EXPIRED']).optional().describe('报价单状态过滤'),
    search: z.string().optional().describe('搜索关键字'),
}).describe('报价单分页列表查询参数');

// ==================== Item Version Schemas ====================

export const activateQuoteItemVersionSchema = z.object({
    quoteId: z.string().describe('主报价单 ID'),
    roomId: z.string().optional().describe('所属空间 ID'),
    versionTag: z.string().describe('要激活的版本标签'),
}).describe('激活报价单明细指定版本参数');

export const getQuoteItemVersionsSchema = z.object({
    quoteId: z.string().describe('主报价单 ID'),
    roomId: z.string().optional().describe('所属空间 ID'),
}).describe('获取报价单明细历史版本参数');

export const createQuoteBundleWithQuotesSchema = z.object({
    customerId: z.string().describe('客户 ID'),
    leadId: z.string().optional().describe('关联线索 ID'),
    summaryMode: z.enum(['BY_CATEGORY', 'BY_ROOM']).default('BY_CATEGORY').describe('汇总模式：按分类或按空间'),
    remark: z.string().optional().describe('备注'),
    quotes: z.array(z.object({
        category: productCategorySchema.describe('报价产品大类'),
        items: z.array(QuoteItemInputSchema).describe('该分类下的明细列表'),
    })).min(1).describe('按分类构建的初始报价单数据列表'),
}).describe('创建带有初始报价数据的合集参数');

export const updateQuoteBundleWithQuotesSchema = createQuoteBundleWithQuotesSchema.extend({
    bundleId: z.string().describe('要更新的报价单合集 ID'),
}).describe('更新带有初始报价数据的合集参数');
