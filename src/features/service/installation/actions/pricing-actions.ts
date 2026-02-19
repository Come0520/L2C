'use server';

import { db, type Transaction } from '@/shared/api/db';
import { laborRates } from '@/shared/api/schema';
import { auth } from '@/shared/lib/auth';
import { z } from 'zod';
import { eq, and } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { AuditService } from '@/shared/lib/audit-service';

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
 * 
 * @param entityType - 实体类型 ('TENANT' | 'WORKER')
 * @param entityId - 实体 ID (租户 ID 或师傅 ID)
 * @returns 包含成功状态和费率数据的对象
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
    } catch (error: unknown) {
        console.error('获取工费规则失败:', error);
        return { success: false, error: '获取工费规则失败' };
    }
}

/**
 * 获取租户标准工费规则
 * 
 * @returns 包含成功状态和租户级标准费率数据的对象
 */
export async function getTenantLaborRates() {
    const session = await auth();
    if (!session?.user?.tenantId) {
        return { success: false, error: '未授权' };
    }

    return getLaborRates('TENANT', session.user.tenantId);
}

/**
 * 内部逻辑：更新或创建劳务工费规则 (支持事务)
 */
async function upsertLaborRateInternal(
    tx: Transaction,
    tenantId: string,
    validated: z.infer<typeof upsertLaborRateSchema>
) {
    // 查找是否已存在该规则
    const existing = await tx.query.laborRates.findFirst({
        where: and(
            eq(laborRates.tenantId, tenantId),
            eq(laborRates.entityType, validated.entityType),
            eq(laborRates.entityId, validated.entityId),
            eq(laborRates.category, validated.category)
        ),
    });

    if (existing) {
        // 更新现有规则
        await tx.update(laborRates)
            .set({
                unitPrice: String(validated.unitPrice),
                baseFee: String(validated.baseFee),
                unitType: validated.unitType,
                updatedAt: new Date(),
            })
            .where(eq(laborRates.id, existing.id));
    } else {
        // 创建新规则
        await tx.insert(laborRates).values({
            tenantId: tenantId,
            entityType: validated.entityType,
            entityId: validated.entityId,
            category: validated.category,
            unitPrice: String(validated.unitPrice),
            baseFee: String(validated.baseFee),
            unitType: validated.unitType,
        });
    }
}

/**
 * 更新或创建劳务工费规则 (单条)
 * 
 * @param data - 符合 upsertLaborRateSchema 规范的费率数据
 * @returns 包含成功状态的操作结果
 */
export async function upsertLaborRate(data: z.infer<typeof upsertLaborRateSchema>) {
    const session = await auth();
    if (!session?.user?.tenantId) {
        return { success: false, error: '未授权' };
    }

    try {
        const validated = upsertLaborRateSchema.parse(data);
        const tenantId = session.user.tenantId;

        // 使用事务确保审计与操作原子性
        await db.transaction(async (tx) => {
            await upsertLaborRateInternal(tx, tenantId, validated);

            // 记录工费配置审计日志
            await AuditService.recordFromSession(session, 'laborRates', validated.entityId, 'UPDATE', {
                new: { action: 'UPSERT_LABOR_RATE', ...validated },
            }, tx);
        });

        revalidatePath('/settings/labor-pricing');
        return { success: true };
    } catch (error: unknown) {
        console.error('保存工费规则失败:', error);
        return { success: false, error: '保存工费规则失败' };
    }
}

/**
 * 批量更新租户标准工费规则
 * 
 * @param rates - 费率项数组
 * @returns 包含成功状态的操作结果
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
        const tenantId = session.user.tenantId;

        // 批量操作使用事务
        await db.transaction(async (tx) => {
            for (const rate of rates) {
                // 构造完整数据对象
                const data = {
                    entityType: 'TENANT' as const,
                    entityId: tenantId,
                    category: rate.category,
                    unitPrice: rate.unitPrice,
                    baseFee: rate.baseFee ?? 0,
                    unitType: rate.unitType,
                };

                // 验证数据 (复用 Schema 验证)
                const validated = upsertLaborRateSchema.parse(data);

                await upsertLaborRateInternal(tx, tenantId, validated);
            }

            // 记录批量更新审计日志
            await AuditService.recordFromSession(session, 'tenants', tenantId, 'UPDATE', {
                new: { action: 'BATCH_UPSERT_LABOR_RATES', count: rates.length },
            }, tx);
        });

        revalidatePath('/settings/labor-pricing');
        return { success: true };
    } catch (error: unknown) {
        console.error('批量保存工费规则失败:', error);
        return { success: false, error: '批量保存工费规则失败' };
    }
}

// ============================================================
// 工费计算逻辑 (Business Logic)
// ============================================================

interface LaborFeeCalculationInput {
    category: (typeof laborCategoryValues)[number];
    quantity: number; // 窗户数或平方米数
    workerId?: string; // 可选的师傅ID，用于个性化定价
}

/**
 * 计算劳务工费 (分级差价算法)
 * 
 * 费率优先级逻辑：
 * 1. 师傅个人定制单价 (WORKER 级别)
 * 2. 租户标准单价 (TENANT 级别)
 * 3. 若无匹配规则则返回 0
 * 
 * @param input - 计算输入 (品类、数量、师傅 ID)
 * @returns 包含计算详情 (基础费、单位费、总费用及来源) 的结果
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

        // 3. 如果没有配置规则，返回 0 结果对象
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

        // 4. 执行费用计算
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
    } catch (error: unknown) {
        console.error('计算工费失败:', error);
        return { success: false, error: '计算工费失败' };
    }
}
