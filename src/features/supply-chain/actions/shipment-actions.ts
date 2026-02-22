'use server';

import { z } from 'zod';
import { requireAuth, requirePOManagePermission, requireViewPermission } from '../helpers';
import { SUPPLY_CHAIN_PATHS, isValidPoTransition } from '../constants';
import { db } from '@/shared/api/db';
import { purchaseOrders, poShipments } from '@/shared/api/schema';
import { eq, and, desc } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { AuditService } from '@/shared/lib/audit-service';

/**
 * 发货管理 Actions
 *
 * Round 5 迁移：使用独立的 poShipments 表存储发货/物流记录，
 * 替代原先直接修改 purchaseOrders 表物流字段的方式。
 * 支持多次发货和多次物流追踪。
 */

const createShipmentSchema = z.object({
    /** 关联采购单 ID */
    poId: z.string().uuid('请选择有效的采购单'),
    /** 物流公司 */
    logisticsCompany: z.string().max(100).optional(),
    /** 物流单号 */
    logisticsNo: z.string().max(100).optional(),
    /** 物流追踪链接 */
    trackingUrl: z.string().url().optional().or(z.literal('')),
    /** 发货时间 */
    shippedAt: z.string().refine((val) => !isNaN(Date.parse(val)), "无效的日期").optional(),
    /** 备注 */
    remark: z.string().max(500).optional(),
});

const updateShipmentSchema = z.object({
    /** 物流公司 */
    logisticsCompany: z.string().max(100).optional(),
    /** 物流单号 */
    logisticsNo: z.string().max(100).optional(),
    /** 物流追踪链接 */
    trackingUrl: z.string().url().optional().or(z.literal('')),
    /** 备注 */
    remark: z.string().max(500).optional(),
});

/**
 * 创建发货记录
 *
 * @description 在独立的 poShipments 表中插入物流信息记录。
 * 核心逻辑：验证采购单状态，开启事务插入记录并将采购单状态同步更新为 SHIPPED。
 * @param input 包含以下属性的对象：
 * - `poId` (string): 采购单 ID
 * - `logisticsCompany` (string, optional): 物流快递公司名称
 * - `logisticsNo` (string, optional): 运单号
 * - `trackingUrl` (string, optional): 物流详情查询 URL
 * - `shippedAt` (string, optional): 实际发货日期时间
 * - `remark` (string, optional): 内部备注
 * @returns {Promise<{success: boolean, data?: {id: string}, error?: string}>} 返回创建成功的记录 ID
 */
export async function createShipment(input: z.infer<typeof createShipmentSchema>) {
    const authResult = await requireAuth();
    if (!authResult.success) return { success: false, error: authResult.error };
    const session = authResult.session;

    const permResult = await requirePOManagePermission(session);
    if (!permResult.success) return { success: false, error: permResult.error };

    const validated = createShipmentSchema.safeParse(input);
    if (!validated.success) {
        console.warn('[supply-chain] createShipment 输入校验失败:', validated.error.issues);
        return { success: false, error: validated.error.issues[0].message };
    }
    const data = validated.data;

    console.warn('[supply-chain] createShipment 开始创建:', { poId: data.poId });
    try {
        return await db.transaction(async (tx) => {
            // 1. 验证采购单存在且属于当前租户
            const po = await tx.query.purchaseOrders.findFirst({
                where: and(
                    eq(purchaseOrders.id, data.poId),
                    eq(purchaseOrders.tenantId, session.user.tenantId)
                ),
                columns: { id: true, status: true },
            });

            if (!po) {
                console.error('[supply-chain] createShipment 采购单不存在:', data.poId);
                return { success: false, error: '采购单不存在' };
            }

            // 2. 使用状态转换矩阵校验是否允许发货
            if (!isValidPoTransition(po.status!, 'SHIPPED')) {
                console.error('[supply-chain] createShipment 状态非法:', po.status);
                return { success: false, error: `当前状态「${po.status}」不允许发货` };
            }

            // 3. 插入物流记录到独立表
            const [shipment] = await tx.insert(poShipments).values({
                tenantId: session.user.tenantId,
                poId: data.poId,
                logisticsCompany: data.logisticsCompany,
                logisticsNo: data.logisticsNo,
                trackingUrl: data.trackingUrl,
                shippedAt: data.shippedAt ? new Date(data.shippedAt) : new Date(),
                remark: data.remark,
                createdBy: session.user.id,
            }).returning();

            // 4. 更新采购单状态为 SHIPPED
            await tx.update(purchaseOrders)
                .set({
                    status: 'SHIPPED',
                    shippedAt: data.shippedAt ? new Date(data.shippedAt) : new Date(),
                    updatedAt: new Date(),
                })
                .where(and(
                    eq(purchaseOrders.id, data.poId),
                    eq(purchaseOrders.tenantId, session.user.tenantId)
                ));

            // 5. 记录审计日志
            await AuditService.recordFromSession(session, 'poShipments', shipment.id, 'CREATE', {
                new: {
                    poId: data.poId,
                    logisticsCompany: data.logisticsCompany,
                    logisticsNo: data.logisticsNo,
                    status: 'SHIPPED'
                }
            }, tx);

            console.warn('[supply-chain] createShipment 创建成功:', shipment.id);
            revalidatePath(SUPPLY_CHAIN_PATHS.PURCHASE_ORDERS);
            return { success: true, data: { id: shipment.id }, message: '发货信息已录入' };
        });
    } catch (error) {
        console.error('[supply-chain] createShipment 内部错误:', error);
        return { success: false, error: error instanceof Error ? error.message : '创建发货记录失败' };
    }
}

/**
 * 更新发货记录
 *
 * @description 修改已录入的物流追踪信息（公司、单号、链接、备注）。
 * @param shipmentId 待修改的物流记录唯一标识
 * @param input 符合 updateShipmentSchema 的更新内容数据
 * @returns {Promise<{success: boolean, error?: string}>} 执行结果状态
 */
export async function updateShipment(shipmentId: string, input: z.infer<typeof updateShipmentSchema>) {
    const authResult = await requireAuth();
    if (!authResult.success) return { success: false, error: authResult.error };
    const session = authResult.session;

    const permResult = await requirePOManagePermission(session);
    if (!permResult.success) return { success: false, error: permResult.error };

    const validated = updateShipmentSchema.safeParse(input);
    if (!validated.success) {
        console.warn('[supply-chain] updateShipment 输入校验失败:', validated.error.issues);
        return { success: false, error: validated.error.issues[0].message };
    }
    const data = validated.data;

    console.warn('[supply-chain] updateShipment 开始更新:', { shipmentId });
    try {
        // ... (保持原有逻辑)
        // 验证记录存在且属于当前租户
        const existing = await db.query.poShipments.findFirst({
            where: and(
                eq(poShipments.id, shipmentId),
                eq(poShipments.tenantId, session.user.tenantId)
            ),
        });

        if (!existing) {
            console.error('[supply-chain] updateShipment 记录不存在:', shipmentId);
            return { success: false, error: '物流记录不存在' };
        }

        await db.update(poShipments)
            .set({
                logisticsCompany: data.logisticsCompany,
                logisticsNo: data.logisticsNo,
                trackingUrl: data.trackingUrl,
                remark: data.remark,
            })
            .where(and(
                eq(poShipments.id, shipmentId),
                eq(poShipments.tenantId, session.user.tenantId)
            ));

        // 记录审计日志
        await AuditService.recordFromSession(session, 'poShipments', shipmentId, 'UPDATE', {
            old: {
                logisticsCompany: existing.logisticsCompany,
                logisticsNo: existing.logisticsNo
            },
            new: data
        });

        console.warn('[supply-chain] updateShipment 更新成功');
        revalidatePath(SUPPLY_CHAIN_PATHS.PURCHASE_ORDERS);
        return { success: true };
    } catch (error) {
        console.error('[supply-chain] updateShipment 更新失败:', error);
        return { success: false, error: '更新发货记录失败' };
    }
}

/**
 * 获取采购单的发货记录列表
 *
 * @description 查询指定采购单关联的所有物流详情记录。
 * @param params 包含 `poId` (string) 采购单 ID 的查询参数对象
 * @returns {Promise<{success: boolean, data: any[]}>} 返回包含发货详情的数组包装结果
 */
export async function getShipments(params: { poId: string }) {
    console.warn('[supply-chain] getShipments 查询参数:', params);
    const authResult = await requireAuth();
    // ... (保持原有逻辑)
    if (!authResult.success) return { success: false, error: authResult.error, data: [] };
    const session = authResult.session;

    const permResult = await requireViewPermission(session);
    if (!permResult.success) return { success: false, error: permResult.error, data: [] };

    const { poId } = params;
    if (!poId) return { success: true, data: [] };

    // 先验证采购单属于当前租户
    const po = await db.query.purchaseOrders.findFirst({
        where: and(
            eq(purchaseOrders.id, poId),
            eq(purchaseOrders.tenantId, session.user.tenantId)
        ),
        columns: { id: true },
    });

    if (!po) return { success: true, data: [] };

    // 从独立表查询物流记录
    const shipments = await db.query.poShipments.findMany({
        where: and(
            eq(poShipments.poId, poId),
            eq(poShipments.tenantId, session.user.tenantId)
        ),
        orderBy: [desc(poShipments.createdAt)],
    });

    return { success: true, data: shipments };
}
