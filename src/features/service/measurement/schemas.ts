import { z } from 'zod';

// 枚举常量
export const WINDOW_TYPES = ['STRAIGHT', 'L_SHAPE', 'U_SHAPE', 'ARC'] as const;
export const INSTALL_TYPES = ['TOP', 'SIDE'] as const;
export const WALL_MATERIALS = ['CONCRETE', 'WOOD', 'GYPSUM'] as const;
export const MEASURE_TASK_STATUS = ['PENDING', 'DISPATCHING', 'PENDING_VISIT', 'PENDING_CONFIRM', 'COMPLETED', 'CANCELLED'] as const;
export const MEASURE_SHEET_STATUS = ['DRAFT', 'CONFIRMED', 'ARCHIVED'] as const;

// 基础明细校验
export const measureItemSchema = z.object({
    id: z.string().uuid().optional(),
    roomName: z.string().min(1, '请输入空间名称'),
    windowType: z.enum(WINDOW_TYPES),
    width: z.number().positive('宽度必须大于0').max(10000, '宽度超过限制'),
    height: z.number().positive('高度必须大于0').max(6000, '高度超过限制'),
    installType: z.enum(INSTALL_TYPES).optional(),
    bracketDist: z.number().nonnegative().optional(),
    wallMaterial: z.enum(WALL_MATERIALS).optional(),
    hasBox: z.boolean().default(false),
    boxDepth: z.number().nonnegative().optional(),
    isElectric: z.boolean().default(false),
    remark: z.string().optional(),
});

// 测量表单校验 (包含多个明细)
export const measureSheetSchema = z.object({
    taskId: z.string().uuid(),
    round: z.number().int().positive(),
    variant: z.string().min(1),
    items: z.array(measureItemSchema).min(1, '至少需要录入一个空间的测量数据'),
    sitePhotos: z.array(z.string().url()).optional(),
    sketchMap: z.string().url().optional(),
});

// 任务创建校验
export const createMeasureTaskSchema = z.object({
    leadId: z.string().uuid(),
    customerId: z.string().uuid(),
    scheduledAt: z.string().datetime().or(z.date()),
    remark: z.string().optional(),
});

// 任务指派校验
export const dispatchMeasureTaskSchema = z.object({
    id: z.string().uuid(),
    assignedWorkerId: z.string().uuid(),
    scheduledAt: z.string().datetime().or(z.date()),
});

// 签到校验
export const checkInSchema = z.object({
    id: z.string().uuid(),
    location: z.object({
        lat: z.number(),
        lng: z.number(),
        address: z.string().optional(),
    }),
});

// 审核/驳回校验
export const reviewMeasureTaskSchema = z.object({
    id: z.string().uuid(),
    action: z.enum(['APPROVE', 'REJECT']),
    reason: z.string().optional(),
});
