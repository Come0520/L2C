'use server';

import { db } from '@/shared/api/db';
import { laborRates } from '@/shared/api/schema';
import { auth } from '@/shared/lib/auth';
import { z } from 'zod';
import { eq, and } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

// ============================================================
// Schema Definitions
// ============================================================

const laborCategoryValues = [
    'CURTAIN',
    'WALLPAPER',
    'WALLCLOTH',
    'WALLPANEL',
    'MEASURE_LEAD',
    'MEASURE_PRECISE',
    'OTHER',
] as const;

const laborUnitTypeValues = ['WINDOW', 'SQUARE_METER', 'FIXED'] as const;
const entityTypeValues = ['TENANT', 'WORKER'] as const;

const upsertLaborRateSchema = z.object({
    entityType: z.enum(entityTypeValues),
    entityId: z.string().uuid(),
    category: z.enum(laborCategoryValues),
    unitPrice: z.number().min(0),
    baseFee: z.number().min(0).default(0),
    unitType: z.enum(laborUnitTypeValues),
});

// ============================================================
// Actions
// ============================================================

/**
 * 获取指定实体的劳务工费规则列表
 * @param entityType - 实体类型 ('TENANT' 或 'WORKER')
 * @param entityId - 实体 ID
 */
export async function getLaborRates(entityType: 'TENANT' | 'WORKER', entityId: string) {
    const session = await auth();
    if (!session?.user?.tenantId) {
        return { success: false, error: '未授权' };
    }

    try {
        const rates = await db.query.laborRates.findMany({
            where: and(
                eq(laborRates.tenantId, session.user.tenantId),
                eq(laborRates.entityType, entityType),
                eq(laborRates.entityId, entityId)
            ),
        });

        return { success: true, data: rates };
    } catch (error) {
        console.error('获取工费规则失败:', error);
        return { success: false, error: '获取工费规则失败' };
    }
}

/**
 * 获取租户标准工费规则
 */
export async function getTenantLaborRates() {
    const session = await auth();
    if (!session?.user?.tenantId) {
        return { success: false, error: '未授权' };
    }

    return getLaborRates('TENANT', session.user.tenantId);
}

/**
 * 更新或创建劳务工费规则
 */
export async function upsertLaborRate(data: z.infer<typeof upsertLaborRateSchema>) {
    const session = await auth();
    if (!session?.user?.tenantId) {
        return { success: false, error: '未授权' };
    }

    try {
        const validated = upsertLaborRateSchema.parse(data);

        // 查找是否已存在该规则
        const existing = await db.query.laborRates.findFirst({
            where: and(
                eq(laborRates.tenantId, session.user.tenantId),
                eq(laborRates.entityType, validated.entityType),
                eq(laborRates.entityId, validated.entityId),
                eq(laborRates.category, validated.category)
            ),
        });

        if (existing) {
            // 更新现有规则
            await db.update(laborRates)
                .set({
                    unitPrice: String(validated.unitPrice),
                    baseFee: String(validated.baseFee),
                    unitType: validated.unitType,
                    updatedAt: new Date(),
                })
                .where(eq(laborRates.id, existing.id));
        } else {
            // 创建新规则
            await db.insert(laborRates).values({
                tenantId: session.user.tenantId,
                entityType: validated.entityType,
                entityId: validated.entityId,
                category: validated.category,
                unitPrice: String(validated.unitPrice),
                baseFee: String(validated.baseFee),
                unitType: validated.unitType,
            });
        }

        revalidatePath('/settings/labor-pricing');
        return { success: true };
    } catch (error) {
        console.error('保存工费规则失败:', error);
        return { success: false, error: '保存工费规则失败' };
    }
}

/**
 * 批量更新租户标准工费规则
 */
export async function batchUpsertTenantLaborRates(
    rates: Array<{
        category: (typeof laborCategoryValues)[number];
        unitPrice: number;
        baseFee?: number;
        unitType: (typeof laborUnitTypeValues)[number];
    }>
) {
    const session = await auth();
    if (!session?.user?.tenantId) {
        return { success: false, error: '未授权' };
    }

    try {
        for (const rate of rates) {
            await upsertLaborRate({
                entityType: 'TENANT',
                entityId: session.user.tenantId,
                category: rate.category,
                unitPrice: rate.unitPrice,
                baseFee: rate.baseFee ?? 0,
                unitType: rate.unitType,
            });
        }

        revalidatePath('/settings/labor-pricing');
        return { success: true };
    } catch (error) {
        console.error('批量保存工费规则失败:', error);
        return { success: false, error: '批量保存工费规则失败' };
    }
}

// ============================================================
// 工费计算逻辑
// ============================================================

interface LaborFeeCalculationInput {
    category: (typeof laborCategoryValues)[number];
    quantity: number; // 窗户数或平方米数
    workerId?: string; // 可选的师傅ID，用于个性化定价
}

/**
 * 计算劳务工费
 * 优先使用师傅个性化价格，兜底使用租户标准价
 */
export async function calculateLaborFee(input: LaborFeeCalculationInput) {
    const session = await auth();
    if (!session?.user?.tenantId) {
        return { success: false, error: '未授权' };
    }

    try {
        let rate = null;

        // 1. 优先查询师傅个性化规则
        if (input.workerId) {
            const workerRateResult = await db.query.laborRates.findFirst({
                where: and(
                    eq(laborRates.tenantId, session.user.tenantId),
                    eq(laborRates.entityType, 'WORKER'),
                    eq(laborRates.entityId, input.workerId),
                    eq(laborRates.category, input.category)
                ),
            });
            rate = workerRateResult;
        }

        // 2. 兜底使用租户标准规则
        if (!rate) {
            const tenantRateResult = await db.query.laborRates.findFirst({
                where: and(
                    eq(laborRates.tenantId, session.user.tenantId),
                    eq(laborRates.entityType, 'TENANT'),
                    eq(laborRates.entityId, session.user.tenantId),
                    eq(laborRates.category, input.category)
                ),
            });
            rate = tenantRateResult;
        }

        // 3. 如果没有配置规则，返回 0
        if (!rate) {
            return {
                success: true,
                data: {
                    baseFee: 0,
                    unitFee: 0,
                    totalFee: 0,
                    rateSource: 'DEFAULT' as const,
                },
            };
        }

        // 4. 计算费用
        const baseFee = parseFloat(rate.baseFee || '0');
        const unitPrice = parseFloat(rate.unitPrice || '0');
        const unitFee = unitPrice * input.quantity;
        const totalFee = baseFee + unitFee;

        return {
            success: true,
            data: {
                baseFee,
                unitFee,
                totalFee,
                rateSource: (input.workerId && rate.entityType === 'WORKER' ? 'WORKER' : 'TENANT') as 'WORKER' | 'TENANT',
                unitPrice,
                unitType: rate.unitType,
            },
        };
    } catch (error) {
        console.error('计算工费失败:', error);
        return { success: false, error: '计算工费失败' };
    }
}
