import { z } from 'zod';

// 引用枚举值 (为了避免循环依赖，这里手动复制或从 enums 导入值)
// 注意：Drizzle schema 中定义的 enums 实际上是用来生成 SQL 的，
// Zod 需要具体的值列表。

export const InstallTypeSchema = z.enum(['TOP', 'SIDE']);
export const WallMaterialSchema = z.enum(['CONCRETE', 'WOOD', 'GYPSUM']);

/**
 * 报价项属性 (Quote Item Attributes)
 * 存储动态属性，如安装方式、材质信息等
 */
export const QuoteItemAttributesSchema = z.object({
    // 测量信息 (来自 MeasureItem)
    installType: InstallTypeSchema.optional().nullable(),
    wallMaterial: WallMaterialSchema.optional().nullable(),
    bracketDist: z.union([z.string(), z.number()]).optional().nullable(), // 支架距离
    hasBox: z.boolean().optional().nullable(), // 是否有窗帘箱
    boxDepth: z.union([z.string(), z.number()]).optional().nullable(), // 窗帘箱深度
    isElectric: z.boolean().optional().nullable(), // 是否电动

    // 材质选择
    materialId: z.string().optional(), // 面料/材质 ID
    color: z.string().optional(),

    // 分段数据 (用于超宽窗帘分段)
    segmentData: z.array(z.object({
        width: z.number(),
        quantity: z.number().default(1)
    })).optional().nullable(),

    // 备注
    remark: z.string().optional(),

    // 其他可能的扩展字段
}).catchall(z.any()); // 允许其他字段以保持向前兼容

export type QuoteItemAttributes = z.infer<typeof QuoteItemAttributesSchema>;


/**
 * 报价计算参数 (Quote Calculation Params)
 * 存储计算价格时的快照参数，如损耗率、幅宽、工艺倍率等
 */
export const QuoteCalculationParamsSchema = z.object({
    // 基础参数
    unitPriceSnapshot: z.number().optional(), // 单价快照

    // 窗帘/布艺参数
    fabricWidth: z.number().optional(), // 面料幅宽 (cm)
    patternRepeat: z.number().optional(), // 花距 (cm)
    lossRate: z.number().optional(), // 损耗率 (e.g. 0.15 for 15%)

    // 工艺参数
    headType: z.enum(['PUNCH', 'HOOK', 'FIXED_PLEAT']).optional(), // 工艺类型
    foldRatio: z.number().optional(), // 褶皱倍率 (e.g. 2.0)

    // 辅料计算
    tapeRatio: z.number().optional(), // 挂带系数

    // 算法版本 (用于回溯计算逻辑)
    algoVersion: z.string().optional(),
}).catchall(z.any());

export type QuoteCalculationParams = z.infer<typeof QuoteCalculationParamsSchema>;
