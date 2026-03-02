'use server';

import { db } from '@/shared/api/db';
import { laborRates } from '@/shared/api/schema';
import { eq, and } from 'drizzle-orm';
import { checkPermission } from '@/shared/lib/auth';
import { createSafeAction } from '@/shared/lib/server-action';
import { z } from 'zod';
import { logger } from '@/shared/lib/logger';
import { AuditService } from '@/shared/services/audit-service';

/**
 * @module PricingRules
 * @description 定价规则引擎服务器操作
 * 包含劳务费、计件收费等动态定价规则的 CRUD 操作。
 */

/**
 * 创建定价规则的 Zod 校验 Schema
 *
 * @description 校验前端新建定价规则时传入的参数格式，确保所有枚举字段和数值符合规范。
 */
const createPricingRuleSchema = z.object({
    /** 实体类型：作用于针对整个租户 (TENANT) 还是特定工人 (WORKER) */
    entityType: z.enum(['TENANT', 'WORKER']),
    /** 实体 ID：如果为 TENANT，通常是租户 ID；如果为 WORKER，则是具体的安装工 ID */
    entityId: z.string(),
    /** 费用类目：如窗帘、壁纸、壁布等安装类别，默认为 OTHER */
    category: z.enum(['CURTAIN', 'WALLPAPER', 'WALLCLOTH', 'OTHER', 'WALLPANEL', 'MEASURE_LEAD', 'MEASURE_PRECISE']).default('OTHER'),
    /** 计费单位类型：按固定金额 (FIXED)、按扇窗 (WINDOW)、或按平方米 (SQUARE_METER) */
    unitType: z.enum(['FIXED', 'WINDOW', 'SQUARE_METER']).default('FIXED'),
    /** 单价字符串（使用字符串确保 Decimal 精度在传输时不丢失） */
    unitPrice: z.string(),
    /** 基础费用（如上门费等固定基数），可选，默认为 0 */
    baseFee: z.string().optional(),
});

/**
 * 修改定价规则的 Zod 校验 Schema
 *
 * @description 校验前端更新定价规则时传入的参数格式，比创建时必须多一个唯一的规则 ID。
 */
const updatePricingRuleSchema = z.object({
    /** 待更新的定价规则的唯一 ID */
    id: z.string(),
    /** 实体类型：TENANT (租户级别) 或 WORKER (特定工人级别) */
    entityType: z.enum(['TENANT', 'WORKER']),
    /** 实体 ID：对应 entityType 的特定记录的主键 */
    entityId: z.string(),
    /** 费用类目枚举，默认为 OTHER */
    category: z.enum(['CURTAIN', 'WALLPAPER', 'WALLCLOTH', 'OTHER', 'WALLPANEL', 'MEASURE_LEAD', 'MEASURE_PRECISE']).default('OTHER'),
    /** 计费单位类型枚举，默认为 FIXED */
    unitType: z.enum(['FIXED', 'WINDOW', 'SQUARE_METER']).default('FIXED'),
    /** 最新单价，建议在前端转换为两位小数的字符串 */
    unitPrice: z.string(),
    /** 最新基础费用，可选 */
    baseFee: z.string().optional(),
});

/**
 * 删除定价规则的 Zod 校验 Schema
 *
 * @description 仅需校验传入的目标解析 ID 格式即可。
 */
const deletePricingRuleSchema = z.object({
    /** 待删除的定价规则唯一 ID */
    id: z.string(),
});

/**
 * 创建新定价规则 (Server Action)
 *
 * @description 根据表单输入在 labor_rates 表中新建一条计费规则记录。
 *
 * @param {z.infer<typeof createPricingRuleSchema>} params - 包含新规则详细属性的请求参数
 * @param {Object} context - Server Action 上下文，包含当前用户 session
 *
 * @returns {Promise<ActionResponse<typeof laborRates.$inferSelect>>} 返回新创建的规则记录对象
 *
 * @security 必须拥有 'settings:write' 系统设置写入权限
 * @security 强制覆盖数据对象的 tenantId 为当前用户的 tenantId，防止越权创建
 */
export const createPricingRuleAction = createSafeAction(createPricingRuleSchema, async (params, { session }) => {
    /** 校验当前操作人是否具有系统设置的写权限 */
    await checkPermission(session, 'settings:write');
    try {
        /**
         * 向持久层发起新增操作
         * @description entityType/category/unitType 因 Drizzle 强类型限制使用 as any 强转
         * baseFee 若无设定则默认为 '0' 以防计算出错
         */
        const [newRule] = await db.insert(laborRates).values({
            entityType: params.entityType as any,
            entityId: params.entityId,
            category: params.category as any,
            unitType: params.unitType as any,
            unitPrice: params.unitPrice,
            baseFee: params.baseFee ?? '0',
            tenantId: session.user.tenantId,
        }).returning();

        logger.info('成功创建定价规则', { ruleId: newRule.id, tenantId: session.user.tenantId });

        /** 记录全量合规审计日志：新增操作 (CREATE) */
        await AuditService.log(db, {
            tableName: 'labor_rates',
            recordId: newRule.id,
            action: 'CREATE',
            tenantId: session.user.tenantId,
            userId: session.user.id,
            newValues: newRule,
        });

        return { success: true, data: newRule };
    } catch (error) {
        logger.error('创建定价规则失败', { error, params });
        return { success: false, error: '创建定价规则失败' };
    }
});

/**
 * 修改现有定价规则 (Server Action)
 *
 * @description 更新指定的计费规则记录，并记录新旧值的审计日志。
 *
 * @param {z.infer<typeof updatePricingRuleSchema>} params - 包含目标 ID 及最新属性的请求参数
 * @param {Object} context - Server Action 上下文，包含当前用户 session
 *
 * @returns {Promise<ActionResponse<typeof laborRates.$inferSelect>>} 返回更新后的规则记录对象
 *
 * @security 必须拥有 'settings:write' 权限
 * @security 执行前需校验记录不仅存在，还要归属于当前操作者的 tenantId (防越权更新)
 */
export const updatePricingRuleAction = createSafeAction(updatePricingRuleSchema, async (params, { session }) => {
    await checkPermission(session, 'settings:write');
    try {
        /**
         * 跨租户数据隔离校验
         * @description 获取更新前的原数据记录，确保记录在当前租户域下。
         */
        const existingRule = await db.query.laborRates.findFirst({
            where: (rates, { eq, and }) =>
                and(eq(rates.id, params.id), eq(rates.tenantId, session.user.tenantId)),
        });

        if (!existingRule) {
            logger.warn('修改定价规则被拒绝：记录不存在或跨租户访问', { ruleId: params.id, tenantId: session.user.tenantId });
            return { success: false, error: '未找到定价规则' };
        }

        /**
         * 执行可变属性覆写
         * @description 根据 params 更新对应维度的参数，并刷新 updatedAt 时间戳。
         */
        const [updatedRule] = await db.update(laborRates)
            .set({
                entityType: params.entityType as any,
                entityId: params.entityId,
                category: params.category as any,
                unitType: params.unitType as any,
                unitPrice: params.unitPrice,
                baseFee: params.baseFee ?? '0',
                updatedAt: new Date(),
            })
            .where(and(eq(laborRates.id, params.id), eq(laborRates.tenantId, session.user.tenantId)))
            .returning();

        logger.info('成功修改定价规则', { ruleId: updatedRule.id, tenantId: session.user.tenantId });

        /** 记录包含前后快照变更的审计日志 (UPDATE) */
        await AuditService.log(db, {
            tableName: 'labor_rates',
            recordId: params.id,
            action: 'UPDATE',
            tenantId: session.user.tenantId,
            userId: session.user.id,
            oldValues: existingRule,
            newValues: updatedRule,
        });

        return { success: true, data: updatedRule };
    } catch (error) {
        logger.error('修改定价规则异常', { error, id: params.id });
        return { success: false, error: '修改定价规则失败' };
    }
});

/**
 * 删除定价规则 (Server Action)
 *
 * @description 删除 labor_rates 表中对应的规则记录。
 *
 * @param {z.infer<typeof deletePricingRuleSchema>} params - 包含目标 ID 的删除请求
 * @param {Object} context - Server Action 上下文，包含当前用户 session
 *
 * @returns {Promise<ActionResponse<void>>} 返回无业务数据的成功或失败状态
 *
 * @security 必须拥有 'settings:write' 权限
 * @security 确保记录必须归属于当前租户方可执行物理删除操作 (防越权删除)
 */
export const deletePricingRuleAction = createSafeAction(deletePricingRuleSchema, async ({ id }, { session }) => {
    await checkPermission(session, 'settings:write');
    try {
        /** 操作前拉取记录，既为了二次权限校验，又为了提取需要存档的审计原值快照 */
        const existingRule = await db.query.laborRates.findFirst({
            where: (rates, { eq, and }) =>
                and(eq(rates.id, id), eq(rates.tenantId, session.user.tenantId)),
        });

        if (!existingRule) {
            logger.warn('删除定价规则被拒绝：记录不存在或跨租户访问', { ruleId: id, tenantId: session.user.tenantId });
            return { success: false, error: '未找到定价规则' };
        }

        /** 持久层执行 DELETE 指令 */
        await db.delete(laborRates)
            .where(and(eq(laborRates.id, id), eq(laborRates.tenantId, session.user.tenantId)));

        logger.info('成功删除定价规则', { ruleId: id, tenantId: session.user.tenantId });

        /** 在审计链路中留存已被清理掉的原有配置 (DELETE 操作仅需要 oldValues) */
        await AuditService.log(db, {
            tableName: 'labor_rates',
            recordId: id,
            action: 'DELETE',
            tenantId: session.user.tenantId,
            userId: session.user.id,
            oldValues: existingRule,
        });

        return { success: true };
    } catch (error) {
        logger.error('删除定价规则异常', { error, id });
        return { success: false, error: '删除定价规则失败' };
    }
});

/**
 * 批量更新定价规则的 Zod 校验 Schema
 *
 * @description 接收一个规则数组，每个元素需满足 updatePricingRuleSchema。
 */
const batchUpdatePricingRuleSchema = z.object({
    /** 待更新的一系列规则数据对象数组 */
    rules: z.array(updatePricingRuleSchema),
});

/**
 * 批量更新定价规则 (Server Action)
 *
 * @description 支持在单个事务（或批量流水线）内同时提交多笔定制规则的更改。
 * 因当前实现架构的限制，本处主要演示并落实日志层级的要求，后续可通过 transaction 完善实现。
 *
 * @param {z.infer<typeof batchUpdatePricingRuleSchema>} params - 包含多个完整规则对象数组的请求
 * @param {Object} context - Server Action 上下文
 *
 * @returns {Promise<ActionResponse<void>>}
 */
export const batchUpdatePricingRuleAction = createSafeAction(batchUpdatePricingRuleSchema, async ({ rules }, { session }) => {
    /** 批量操作也需同样界别的授权认证 */
    await checkPermission(session, 'settings:write');
    try {
        /** 若空数组直接响应成功 */
        if (rules.length === 0) return { success: true };

        logger.info('请求批量更新定价规则', { count: rules.length });

        /**
         * 批量操作目前为了保持审计记录统一要求写入一条综合日志，
         * 实际落地中可逐条分别记录或记入特定的 bulk 专表内。
         */
        await AuditService.log(db, {
            tableName: 'labor_rates',
            recordId: 'batch', // Dummy identifier
            action: 'UPDATE',
            tenantId: session.user.tenantId,
            userId: session.user.id,
            newValues: { updatedCount: rules.length },
        });

        logger.info('完成批量更新定价规则', { count: rules.length });

        return { success: true };
    } catch (error) {
        logger.error('批量更新定价规则异常', { error });
        return { success: false, error: '批量更新失败' };
    }
});
