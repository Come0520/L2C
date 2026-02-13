import { z } from 'zod';

/**
 * 窗帘属性定义 (Curtain Attributes)
 */
export const CurtainAttributesSchema = z.object({
    material: z.string().optional(),
    color: z.string().optional(),
    pattern: z.string().optional(),
    lining: z.string().optional(), // 衬里
    valance: z.string().optional(), // 帘头
    openingStyle: z.enum(['SINGLE', 'DOUBLE', 'MULTI']).default('DOUBLE'),
    installPosition: z.enum(['WINDOW_BOX', 'INSIDE', 'OUTSIDE']).default('WINDOW_BOX'),
    groundClearance: z.number().default(2), // 离地高度
    remarks: z.string().optional(),
});

/**
 * 窗帘计算参数快照 (Curtain Calculation Snapshot)
 */
export const CurtainCalculationParamsSchema = z.object({
    measuredWidth: z.number(),
    measuredHeight: z.number(),
    foldRatio: z.number().default(2.0),
    sideLoss: z.number().optional(),
    headerLoss: z.number().optional(),
    bottomLoss: z.number().optional(),
    fabricType: z.enum(['FIXED_HEIGHT', 'FIXED_WIDTH']),
    fabricWidth: z.number(),
    stripCount: z.number().optional(),
    usage: z.number(),
    unitPrice: z.number(),
    warnings: z.array(z.string()).optional(),
});

/**
 * 墙纸属性定义 (Wallpaper Attributes)
 */
export const WallpaperAttributesSchema = z.object({
    material: z.string().optional(),
    patternMatch: z.enum(['STRAIGHT', 'OFFSET', 'NONE']).default('NONE'), // 对花方式
    patternRepeat: z.number().default(0), // 花距
    remarks: z.string().optional(),
});

/**
 * 墙纸计算参数快照 (Wallpaper Calculation Snapshot)
 */
export const WallpaperCalculationParamsSchema = z.object({
    measuredWidth: z.number(),
    measuredHeight: z.number(),
    rollWidth: z.number(),
    rollLength: z.number(),
    widthLoss: z.number().default(20),
    cutLoss: z.number().default(10),
    totalStrips: z.number(),
    stripsPerRoll: z.number(),
    usage: z.number(), // 卷数
    unitPrice: z.number(),
});

/**
 * 墙布属性定义 (Wallcloth Attributes)
 */
export const WallclothAttributesSchema = z.object({
    material: z.string().optional(),
    fixedHeight: z.number(), // 定高值 (通常 2.8m - 3.2m)
    remarks: z.string().optional(),
});

/**
 * 墙布计算参数快照 (Wallcloth Calculation Snapshot)
 */
export const WallclothCalculationParamsSchema = z.object({
    measuredWidth: z.number(),
    measuredHeight: z.number(),
    widthLoss: z.number().default(20),
    heightLoss: z.number().default(10),
    usage: z.number(), // 平方米
    unitPrice: z.number(),
});

export type CurtainAttributes = z.infer<typeof CurtainAttributesSchema>;
export type CurtainCalculationParams = z.infer<typeof CurtainCalculationParamsSchema>;
export type WallpaperAttributes = z.infer<typeof WallpaperAttributesSchema>;
export type WallpaperCalculationParams = z.infer<typeof WallpaperCalculationParamsSchema>;
export type WallclothAttributes = z.infer<typeof WallclothAttributesSchema>;
export type WallclothCalculationParams = z.infer<typeof WallclothCalculationParamsSchema>;
