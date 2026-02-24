'use server';

import { createSafeAction } from '@/shared/lib/server-action';
import { z } from 'zod';
import { QuoteConfigService, type QuoteConfig } from '@/services/quote-config.service';
import { revalidatePath } from 'next/cache';
import { auth } from '@/shared/lib/auth';
import { AuditService } from '@/shared/lib/audit-service';
import { logger } from '@/shared/lib/logger';

const updateModeSchema = z.object({
    mode: z.enum(['simple', 'advanced'])
});

const updateGlobalConfigSchema = z.object({
    mode: z.enum(['simple', 'advanced']).optional(),
    visibleFields: z.array(z.string()).optional(),
    presetLoss: z.object({
        curtain: z.object({
            sideLoss: z.number().optional(),
            bottomLoss: z.number().optional(),
            headerLoss: z.number().optional(), // 兼容旧版
            headerLossWrapped: z.number().optional(),
            headerLossAttached: z.number().optional(),
            defaultHeaderType: z.enum(['WRAPPED', 'ATTACHED']).optional(),
            defaultFoldRatio: z.number().optional(),
            heightWarningThreshold: z.number().optional(),
        }).optional(),
        wallpaper: z.object({
            widthLoss: z.number().optional(),
            cutLoss: z.number().optional(),
        }).optional(),
    }).optional(),
    discountControl: z.object({
        minDiscountRate: z.number().min(0).max(1),
        requireApprovalBelow: z.number().min(0).max(1),
    }).optional(),
    defaultPlan: z.enum(['ECONOMIC', 'COMFORT', 'LUXURY']).optional(),
    planSettings: z.object({
        ECONOMIC: z.object({
            markup: z.number().min(0).max(2),
            quality: z.string(),
            description: z.string().optional(),
        }).optional(),
        COMFORT: z.object({
            markup: z.number().min(0).max(2),
            quality: z.string(),
            description: z.string().optional(),
        }).optional(),
        LUXURY: z.object({
            markup: z.number().min(0).max(2),
            quality: z.string(),
            description: z.string().optional(),
        }).optional(),
    }).optional(),
});

const updateUserPlanSchema = z.object({
    plan: z.enum(['ECONOMIC', 'COMFORT', 'LUXURY'])
});

/**
 * 获取当前用户的报价单配置 (Get Current User Config)
 * 逻辑：自动获取会话信息 -> 合并租户配置、用户个人配置与系统默认值。
 * 
 * @returns 深度合并后的 QuoteConfig 对象
 */
export async function getMyQuoteConfig() {
    const session = await auth();
    if (!session?.user) {
        return QuoteConfigService.getMergedConfig('default', 'guest');
    }

    return await QuoteConfigService.getMergedConfig(session.user.tenantId, session.user.id);
}

const toggleQuoteModeActionInternal = createSafeAction(updateModeSchema, async (data) => {
    const session = await auth();
    if (!session?.user?.id) {
        throw new Error('Unauthorized');
    }

    await QuoteConfigService.updateUserMode(session.user.id, data.mode);
    revalidatePath('/quotes');
    logger.info('[quotes] 报价模式切换成功', { userId: session.user.id, mode: data.mode });
    return { success: true };
});

/**
 * 客户端调用：切换当前用户的报价模式 (Toggle View Mode)
 * 支持模式：'simple' (精简模式) | 'advanced' (高级/工厂模式)。
 * 
 * @param params - 包含目标模式的对象
 * @returns 操作结果成功状态
 */
export async function toggleQuoteMode(params: z.infer<typeof updateModeSchema>) {
    return toggleQuoteModeActionInternal(params);
}

const updateGlobalQuoteConfigActionInternal = createSafeAction(updateGlobalConfigSchema, async (data) => {
    const session = await auth();
    if (!session?.user?.id || !session.user.tenantId) {
        throw new Error('Unauthorized');
    }
    logger.info('[quotes] 开始更新全局报价配置', { userId: session.user.id, tenantId: session.user.tenantId });

    // Simple Admin Check (Extend with checkPermission if needed later)
    if (session.user.role !== 'ADMIN') {
        throw new Error('Permission denied: Only admins can change global config');
    }

    // Zod schema 中 presetLoss 的所有子字段都是可选的，但 QuoteConfig 要求完整对象
    // 服务层 updateTenantConfig 会将传入的部分配置与现有配置/默认值进行深度合并
    // 因此这里的类型断言是安全的
    const updateData: Partial<QuoteConfig> = {
        mode: data.mode,
        visibleFields: data.visibleFields,
        presetLoss: data.presetLoss as QuoteConfig['presetLoss'],
        discountControl: data.discountControl,
        defaultPlan: data.defaultPlan,
        planSettings: data.planSettings
    };
    await QuoteConfigService.updateTenantConfig(
        session.user.tenantId,
        updateData
    );

    // 审计日志：记录全局配置更新
    await AuditService.recordFromSession(session, 'quoteConfig', session.user.tenantId, 'UPDATE', {
        new: updateData as Record<string, unknown>,
    });

    revalidatePath('/quotes');
    return { success: true };
});

/**
 * 客户端调用：更新租户级别的全局报价配置 (Update Tenant Global Config)
 * 【权限校验】仅管理员 (ADMIN) 角色可执行此操作。
 * 包含：默认损耗系数、方案毛利、可见字段、折扣控制等。
 * 
 * @param params - 符合 updateGlobalConfigSchema 的配置对象
 * @returns 操作结果成功状态
 */
export async function updateGlobalQuoteConfig(params: z.infer<typeof updateGlobalConfigSchema>) {
    return updateGlobalQuoteConfigActionInternal(params);
}

const updateUserPlanActionInternal = createSafeAction(updateUserPlanSchema, async (data) => {
    const session = await auth();
    if (!session?.user?.id) {
        throw new Error('Unauthorized');
    }

    await QuoteConfigService.updateUserPlan(session.user.id, data.plan);
    revalidatePath('/quotes');
    logger.info('[quotes] 用户方案更新成功', { userId: session.user.id, plan: data.plan });
    return { success: true };
});

/**
 * 客户端调用：更新当前用户默认选中的报价方案 (Update User Default Plan)
 * @param params - 方案类型：'ECONOMIC' | 'COMFORT' | 'LUXURY'
 * @returns 操作结果成功状态
 */
export async function updateUserPlan(params: z.infer<typeof updateUserPlanSchema>) {
    return updateUserPlanActionInternal(params);
}

/**
 * 获取特定报价方案的详细配置 (Fetch Plan Specific Settings)
 * 返回该方案下的毛利加价率 (markup)、品质描述及功能配置。
 * 
 * @param plan - 方案类型
 * @returns 方案配置详情
 */
export async function getPlanSettings(plan: 'ECONOMIC' | 'COMFORT' | 'LUXURY') {
    const session = await auth();
    if (!session?.user) {
        throw new Error('Unauthorized');
    }

    return await QuoteConfigService.getPlanSettings(
        session.user.tenantId,
        session.user.id,
        plan
    );
}
