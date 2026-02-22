import { db } from '@/shared/api/db';
import { and, eq, inArray, asc } from 'drizzle-orm';
import {
    purchaseOrders,
    purchaseOrderItems,
    suppliers,
    splitRouteRules,
    productionTasks,
} from '@/shared/api/schema/supply-chain';
import { orderItems } from '@/shared/api/schema/orders';
import { products } from '@/shared/api/schema/catalogs';
import { generateDocNo } from '@/shared/lib/utils';
import { PO_STATUS } from '../constants';
import { AuditService } from '@/shared/lib/audit-service';
import type { Session } from 'next-auth';
import type { SplitCondition } from '../types';
import crypto from 'crypto';

// ============ 类型定义 ============

/** 订单项与关联产品/供应商信息的完整视图 */
interface EnrichedOrderItem {
    orderItemId: string;
    orderId: string;
    tenantId: string;
    productId: string | null;
    productName: string;
    category: string;
    quantity: string;
    width: string | null;
    height: string | null;
    unitPrice: string;
    subtotal: string;
    productType: 'FINISHED' | 'CUSTOM' | null;
    defaultSupplierId: string | null;
    quoteItemId: string | null;
}

/** 拆分路由结果 */
interface SplitRoutedItem extends EnrichedOrderItem {
    resolvedSupplierId: string | null;
    resolvedSupplierName: string | null;
    resolvedSupplierType: 'SUPPLIER' | 'PROCESSOR' | 'BOTH' | null;
    /** 目标单据类型：PO = 采购单, WO = 加工单, PENDING = 待分配 */
    targetDocType: 'PO' | 'WO' | 'PENDING';
    /** PO 类型：FINISHED / FABRIC */
    poType: 'FINISHED' | 'FABRIC' | null;
}

/** 分组键 */
interface GroupKey {
    supplierId: string;
    supplierName: string;
    docType: 'PO' | 'WO';
    poType: 'FINISHED' | 'FABRIC' | null;
}

/** 拆单引擎执行结果 */
export interface SplitEngineResult {
    /** 生成的采购单 draft IDs */
    createdPOIds: string[];
    /** 生成的加工任务 IDs */
    createdTaskIds: string[];
    /** 进入待采购池的订单项 IDs */
    pendingPoolItemIds: string[];
    /** 执行摘要 */
    summary: {
        totalItems: number;
        finishedCount: number;
        customCount: number;
        poCount: number;
        woCount: number;
        pendingCount: number;
    };
}

// ============ 入口函数 ============

/**
 * 拆单引擎执行入口
 * 
 * @description 核心逻辑分为两阶段：
 * 阶段一：硬拆。根据产品的 productType 将订单项分为【成品采购】和【定制加工】。
 * 阶段二：流向拆。根据供应商类型 (supplierType) 决定生成 PO (采购单) 还是 WO (加工任务)。
 * 
 * @param orderId 待拆分的订单 ID
 * @param tenantId 租户 ID
 * @param session 当前操作员会话
 * @returns 包含生成的单据 IDs 和统计摘要的结果对象
 */
export async function executeSplitRouting(
    orderId: string,
    tenantId: string,
    session: Session
): Promise<SplitEngineResult> {
    console.warn('[supply-chain] executeSplitRouting 启动:', { orderId });
    // 1. 获取订单项并联查产品信息
    const enrichedItems = await getEnrichedOrderItems(orderId, tenantId);

    if (enrichedItems.length === 0) {
        console.warn('[supply-chain] executeSplitRouting: 订单无有效项，跳过');
        return {
            createdPOIds: [],
            createdTaskIds: [],
            pendingPoolItemIds: [],
            summary: { totalItems: 0, finishedCount: 0, customCount: 0, poCount: 0, woCount: 0, pendingCount: 0 },
        };
    }

    // 2. 阶段一：按 productType 硬分类
    const { finishedQueue, customQueue } = classifyByProductType(enrichedItems);

    // 3. 尝试加载自定义路由规则
    const rules = await loadSplitRouteRules(tenantId);

    // 4. 阶段二：对 customQueue 按 supplierType 决定流向
    const routedCustomItems = await resolveBySupplierType(customQueue, rules);

    // 5. 对 finishedQueue 解析供应商（直接使用 defaultSupplierId）
    const routedFinishedItems = resolveFinishedItems(finishedQueue, rules);

    // 6. 合并所有已路由的项
    const allRoutedItems = [...routedFinishedItems, ...routedCustomItems];

    // 7. 生成最终结果
    const result = await generateSplitResult(allRoutedItems, orderId, tenantId, session);

    console.warn('[supply-chain] executeSplitRouting 执行成功:', {
        poCount: result.createdPOIds.length,
        taskCount: result.createdTaskIds.length,
        pendingPoolCount: result.pendingPoolItemIds.length
    });
    return result;
}

// ============ 阶段一：按产品类型硬分类 ============

/**
 * 阶段一：按产品类型进行初步硬分类
 * 
 * @description FINISHED 类型的项进入成品采购队列。
 * CUSTOM 或类型缺失的项进入定制加工队列。
 */
function classifyByProductType(items: EnrichedOrderItem[]): {
    finishedQueue: EnrichedOrderItem[];
    customQueue: EnrichedOrderItem[];
} {
    const finishedQueue: EnrichedOrderItem[] = [];
    const customQueue: EnrichedOrderItem[] = [];

    for (const item of items) {
        if (item.productType === 'FINISHED') {
            finishedQueue.push(item);
        } else {
            // CUSTOM 或 null（未设定类型默认按定制品处理）
            customQueue.push(item);
        }
    }

    return { finishedQueue, customQueue };
}

// ============ 阶段二：按供应商类型决定流向 ============

/**
 * 处理成品采购队列
 * 
 * @description 对于 FINISHED 类型的记录，匹配路由规则或默认供应商后，
 * 设置目标单据类型为 PO，单据子类型为 FINISHED。
 */
function resolveFinishedItems(
    items: EnrichedOrderItem[],
    rules: SplitRuleRow[]
): SplitRoutedItem[] {
    return items.map(item => {
        // 尝试匹配自定义规则
        const matchedRule = matchConditionRules(item, rules);

        const supplierId = matchedRule?.targetSupplierId ?? item.defaultSupplierId;

        if (!supplierId) {
            // 无供应商 → 进入待采购池
            return {
                ...item,
                resolvedSupplierId: null,
                resolvedSupplierName: null,
                resolvedSupplierType: null,
                targetDocType: 'PENDING' as const,
                poType: null,
            };
        }

        return {
            ...item,
            resolvedSupplierId: supplierId,
            resolvedSupplierName: null, // 后续批量查询填充
            resolvedSupplierType: 'SUPPLIER' as const,
            targetDocType: 'PO' as const,
            poType: 'FINISHED' as const,
        };
    });
}

/**
 * 阶段二：处理定制品队列（根据供应商能力决定流向）
 * 
 * @description 决策矩阵：
 * 1. 供应商仅具供应能力 (SUPPLIER) -> 生成 FABRIC 型 PO (采购面料)。
 * 2. 供应商仅具加工能力 (PROCESSOR) -> 生成 WO (加工单)。
 * 3. 供应商兼具两者 (BOTH) -> 生成 FABRIC 型 PO (面料自采自加工模式)。
 * 
 * @param items 定制品订单项列表
 * @param rules 拆单规则列表
 */
async function resolveBySupplierType(
    items: EnrichedOrderItem[],
    rules: SplitRuleRow[]
): Promise<SplitRoutedItem[]> {
    const result: SplitRoutedItem[] = [];

    // 收集所有需要查询的供应商 ID
    const supplierIds = new Set<string>();
    for (const item of items) {
        const matchedRule = matchConditionRules(item, rules);
        const sid = matchedRule?.targetSupplierId ?? item.defaultSupplierId;
        if (sid) supplierIds.add(sid);
    }

    // 批量查询供应商信息
    const supplierMap = await batchGetSuppliers([...supplierIds]);

    for (const item of items) {
        const matchedRule = matchConditionRules(item, rules);
        const supplierId = matchedRule?.targetSupplierId ?? item.defaultSupplierId;

        if (!supplierId) {
            // 无供应商 → 待采购池
            result.push({
                ...item,
                resolvedSupplierId: null,
                resolvedSupplierName: null,
                resolvedSupplierType: null,
                targetDocType: 'PENDING',
                poType: null,
            });
            continue;
        }

        const supplier = supplierMap.get(supplierId);
        if (!supplier) {
            // 供应商不存在 → 待采购池
            result.push({
                ...item,
                resolvedSupplierId: null,
                resolvedSupplierName: null,
                resolvedSupplierType: null,
                targetDocType: 'PENDING',
                poType: null,
            });
            continue;
        }

        const supplierType = supplier.supplierType as 'SUPPLIER' | 'PROCESSOR' | 'BOTH';

        switch (supplierType) {
            case 'SUPPLIER':
                // 面料供应商 → 生成 FABRIC PO
                result.push({
                    ...item,
                    resolvedSupplierId: supplierId,
                    resolvedSupplierName: supplier.name,
                    resolvedSupplierType: 'SUPPLIER',
                    targetDocType: 'PO',
                    poType: 'FABRIC',
                });
                break;

            case 'PROCESSOR':
                // 加工厂 → 生成 WO（加工任务）
                result.push({
                    ...item,
                    resolvedSupplierId: supplierId,
                    resolvedSupplierName: supplier.name,
                    resolvedSupplierType: 'PROCESSOR',
                    targetDocType: 'WO',
                    poType: null,
                });
                break;

            case 'BOTH':
                // 兼具供应和加工 → 生成 FABRIC PO（面料采购）
                // 注：WO 在 PO 到货后由独立流程触发
                console.warn('[supply-chain] resolveBySupplierType: 检测到兼备供应商，流向设为 PO(FABRIC)', { supplierId });
                result.push({
                    ...item,
                    resolvedSupplierId: supplierId,
                    resolvedSupplierName: supplier.name,
                    resolvedSupplierType: 'BOTH',
                    targetDocType: 'PO',
                    poType: 'FABRIC',
                });
                break;

            default:
                result.push({
                    ...item,
                    resolvedSupplierId: null,
                    resolvedSupplierName: null,
                    resolvedSupplierType: null,
                    targetDocType: 'PENDING',
                    poType: null,
                });
        }
    }

    return result;
}

// ============ 规则匹配 ============

/** 路由规则行类型 */
interface SplitRuleRow {
    id: string;
    priority: number | null;
    conditions: SplitCondition[] | null;
    targetType: string;
    targetSupplierId: string | null;
}

/**
 * 加载租户的拆单路由规则（按优先级排序）
 */
async function loadSplitRouteRules(tenantId: string): Promise<SplitRuleRow[]> {
    const rules = await db.query.splitRouteRules.findMany({
        where: and(
            eq(splitRouteRules.tenantId, tenantId),
            eq(splitRouteRules.isActive, true)
        ),
        orderBy: [asc(splitRouteRules.priority)],
    });

    return rules as SplitRuleRow[];
}

/**
 * 条件规则匹配（按优先级从高到低）
 *
 * conditions JSONB 结构示例：
 * [{ "field": "category", "op": "eq", "value": "CURTAIN" }]
 *
 * 支持的字段: category, productName
 * 支持的操作: eq, neq, contains
 */
function matchConditionRules(
    item: EnrichedOrderItem,
    rules: SplitRuleRow[]
): SplitRuleRow | null {
    for (const rule of rules) {
        if (evaluateConditions(item, rule.conditions)) {
            return rule;
        }
    }
    return null;
}

/**
 * 评估条件组（AND 逻辑）
 */
function evaluateConditions(item: EnrichedOrderItem, conditions: SplitCondition[] | null): boolean {
    if (!Array.isArray(conditions) || conditions.length === 0) {
        return false;
    }

    return conditions.every((cond: SplitCondition) => {
        if (!cond.field || !cond.operator) return false;

        const fieldValue = getFieldValue(item, cond.field);
        if (fieldValue === undefined) return false;

        switch (cond.operator) {
            case 'eq':
                return fieldValue === cond.value;
            case 'neq':
                return fieldValue !== cond.value;
            case 'contains':
                return typeof fieldValue === 'string' && typeof cond.value === 'string'
                    && fieldValue.toLowerCase().includes(cond.value.toLowerCase());
            case 'in':
                if (Array.isArray(cond.value)) {
                    return cond.value.includes(fieldValue as never);
                }
                return false;
            default:
                return false;
        }
    });
}

/**
 * 获取订单项的指定字段值（用于规则匹配）
 */
function getFieldValue(item: EnrichedOrderItem, field: string): string | undefined {
    switch (field) {
        case 'category':
            return item.category;
        case 'productName':
            return item.productName;
        case 'productType':
            return item.productType ?? undefined;
        default:
            return undefined;
    }
}

// ============ 分组生成结果 ============

/**
 * 生成拆单最终单据
 * 
 * @description 执行数据库事务：
 * 1. 按 (供应商+单据类型+单据细类) 分组。
 * 2. 批量生成 Draft 状态的采购单及明细。
 * 3. 逐项生成待处理状态的加工任务。
 * 4. 反填订单项的基本信息（poId, supplierId, status = PROCESSING）。
 * 5. 记录全量审计日志。
 */
async function generateSplitResult(
    routedItems: SplitRoutedItem[],
    orderId: string,
    tenantId: string,
    session: Session
): Promise<SplitEngineResult> {
    const createdPOIds: string[] = [];
    const createdTaskIds: string[] = [];
    const pendingPoolItemIds: string[] = [];

    // 分离待分配项
    const pendingItems = routedItems.filter(i => i.targetDocType === 'PENDING');
    const assignedItems = routedItems.filter(i => i.targetDocType !== 'PENDING');

    pendingPoolItemIds.push(...pendingItems.map(i => i.orderItemId));

    // 补充供应商名称（对缺少名称的项批量查询）
    const needNameIds = new Set<string>();
    for (const item of assignedItems) {
        if (item.resolvedSupplierId && !item.resolvedSupplierName) {
            needNameIds.add(item.resolvedSupplierId);
        }
    }
    const nameMap = needNameIds.size > 0 ? await batchGetSuppliers([...needNameIds]) : new Map();
    for (const item of assignedItems) {
        if (item.resolvedSupplierId && !item.resolvedSupplierName) {
            const s = nameMap.get(item.resolvedSupplierId);
            if (s) item.resolvedSupplierName = s.name;
        }
    }

    // 按 (supplierId + docType + poType) 分组
    const groups = groupBySupplierId(assignedItems);

    // 数据库事务：批量创建 PO 和加工任务
    await db.transaction(async (tx) => {
        for (const [, group] of groups) {
            const { key, items } = group;

            if (key.docType === 'PO') {
                // 创建采购单 (DRAFT)
                const poNo = await generateDocNo('PO', tenantId);
                const poType = key.poType ?? 'FINISHED';

                const [newPO] = await tx.insert(purchaseOrders).values({
                    id: `po_${crypto.randomUUID()}`,
                    tenantId,
                    poNo,
                    orderId,
                    supplierId: key.supplierId,
                    supplierName: key.supplierName,
                    type: poType as 'FINISHED' | 'FABRIC' | 'STOCK',
                    status: PO_STATUS.DRAFT,
                    createdBy: session.user.id,
                }).returning({ id: purchaseOrders.id, poNo: purchaseOrders.poNo });

                if (!newPO) continue;
                createdPOIds.push(newPO.id);

                // 创建采购单明细
                const poItemValues = items.map(item => ({
                    id: `poi_${crypto.randomUUID()}`,
                    tenantId,
                    poId: newPO.id,
                    orderItemId: item.orderItemId,
                    productId: item.productId,
                    productName: item.productName,
                    category: item.category,
                    quantity: item.quantity,
                    unitPrice: item.unitPrice,
                    width: item.width,
                    height: item.height,
                    subtotal: item.subtotal,
                    quoteItemId: item.quoteItemId,
                }));

                await tx.insert(purchaseOrderItems).values(poItemValues);

                // 添加审计日志 (PO 生成)
                await AuditService.recordFromSession(session, 'purchaseOrders', newPO.id, 'CREATE', {
                    new: {
                        poNo: newPO.poNo,
                        poType,
                        supplierId: key.supplierId,
                        supplierName: key.supplierName,
                        itemCount: items.length
                    }
                }, tx);

                // 更新订单项的 poId 和 supplierId
                const orderItemIds = items.map(i => i.orderItemId);
                if (orderItemIds.length > 0) {
                    await tx
                        .update(orderItems)
                        .set({
                            poId: newPO.id,
                            supplierId: key.supplierId,
                            status: 'PROCESSING',
                        })
                        .where(inArray(orderItems.id, orderItemIds));
                }

            } else if (key.docType === 'WO') {
                // 创建加工任务 (PENDING)
                for (const item of items) {
                    const taskNo = await generateDocNo('WO', tenantId);
                    const [newTask] = await tx.insert(productionTasks).values({
                        id: `task_${crypto.randomUUID()}`,
                        tenantId,
                        taskNo,
                        orderId,
                        orderItemId: item.orderItemId,
                        workshop: 'SEWING', // 默认车间，可后续调整
                        status: 'PENDING',
                        createdBy: session.user.id,
                    }).returning({ id: productionTasks.id, taskNo: productionTasks.taskNo });

                    if (newTask) {
                        createdTaskIds.push(newTask.id);
                        // 添加审计日志 (WO 生成)
                        await AuditService.recordFromSession(session, 'productionTasks', newTask.id, 'CREATE', {
                            new: {
                                taskNo: newTask.taskNo,
                                orderItemId: item.orderItemId,
                                productName: item.productName
                            }
                        }, tx);
                    }
                }

                // 更新订单项状态
                const orderItemIds = items.map(i => i.orderItemId);
                if (orderItemIds.length > 0) {
                    await tx
                        .update(orderItems)
                        .set({
                            supplierId: key.supplierId,
                            status: 'PROCESSING',
                        })
                        .where(inArray(orderItems.id, orderItemIds));
                }
            }
        }
    });

    // 统计
    const finishedCount = routedItems.filter(i => i.poType === 'FINISHED').length;
    const customCount = routedItems.filter(i => i.poType === 'FABRIC' || i.targetDocType === 'WO').length;

    return {
        createdPOIds,
        createdTaskIds,
        pendingPoolItemIds,
        summary: {
            totalItems: routedItems.length,
            finishedCount,
            customCount,
            poCount: createdPOIds.length,
            woCount: createdTaskIds.length,
            pendingCount: pendingPoolItemIds.length,
        },
    };
}

/**
 * 按 (supplierId + docType + poType) 分组
 */
function groupBySupplierId(items: SplitRoutedItem[]): Map<string, { key: GroupKey; items: SplitRoutedItem[] }> {
    const groups = new Map<string, { key: GroupKey; items: SplitRoutedItem[] }>();

    for (const item of items) {
        if (!item.resolvedSupplierId) continue;

        const groupKey = `${item.resolvedSupplierId}::${item.targetDocType}::${item.poType ?? 'null'}`;

        if (!groups.has(groupKey)) {
            groups.set(groupKey, {
                key: {
                    supplierId: item.resolvedSupplierId,
                    supplierName: item.resolvedSupplierName ?? '',
                    docType: item.targetDocType as 'PO' | 'WO',
                    poType: item.poType,
                },
                items: [],
            });
        }

        groups.get(groupKey)!.items.push(item);
    }

    return groups;
}

// ============ 数据查询辅助 ============

/**
 * 获取订单项并联查产品信息
 */
async function getEnrichedOrderItems(orderId: string, tenantId: string): Promise<EnrichedOrderItem[]> {
    const items = await db
        .select({
            orderItemId: orderItems.id,
            orderId: orderItems.orderId,
            tenantId: orderItems.tenantId,
            productId: orderItems.productId,
            productName: orderItems.productName,
            category: orderItems.category,
            quantity: orderItems.quantity,
            width: orderItems.width,
            height: orderItems.height,
            unitPrice: orderItems.unitPrice,
            subtotal: orderItems.subtotal,
            quoteItemId: orderItems.quoteItemId,
            productType: products.productType,
            defaultSupplierId: products.defaultSupplierId,
        })
        .from(orderItems)
        .leftJoin(products, eq(orderItems.productId, products.id))
        .where(and(
            eq(orderItems.orderId, orderId),
            eq(orderItems.tenantId, tenantId)
        ));

    return items as EnrichedOrderItem[];
}

/**
 * 批量查询供应商基本信息
 */
async function batchGetSuppliers(
    supplierIds: string[]
): Promise<Map<string, { id: string; name: string; supplierType: string | null }>> {
    if (supplierIds.length === 0) return new Map();

    const rows = await db
        .select({
            id: suppliers.id,
            name: suppliers.name,
            supplierType: suppliers.supplierType,
        })
        .from(suppliers)
        .where(inArray(suppliers.id, supplierIds));

    const map = new Map<string, { id: string; name: string; supplierType: string | null }>();
    for (const row of rows) {
        map.set(row.id, row);
    }
    return map;
}
