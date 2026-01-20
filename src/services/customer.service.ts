import { db } from "@/shared/api/db";
import { customers, customerAddresses, customerMergeLogs } from "@/shared/api/schema";
import { orders } from "@/shared/api/schema/orders";
import { quotes } from "@/shared/api/schema/quotes";
import { leads } from "@/shared/api/schema/leads";
import { afterSalesTickets } from "@/shared/api/schema/after-sales";
import { measureTasks } from "@/shared/api/schema/service";
import { eq, and, inArray, sql } from "drizzle-orm";
import { randomBytes } from 'crypto';
import { format } from 'date-fns';

export class CustomerService {

    /**
     * 通过手机号查找客户
     * @param phone 手机号
     */
    static async findByPhone(phone: string) {
        const customer = await db.query.customers.findFirst({
            where: eq(customers.phone, phone),
        });
        return customer || null;
    }

    /**
     * 生成唯一客户编号
     * 格式: C + YYYYMMDD + 4位随机HEX
     */
    private static async generateCustomerNo() {
        const prefix = `C${format(new Date(), 'yyyyMMdd')}`;
        const random = randomBytes(2).toString('hex').toUpperCase();
        return `${prefix}${random}`;
    }

    /**
     * 创建新客户
     * @param data 客户数据
     * @param tenantId 租户ID
     * @param userId 操作人ID
     * @param addressData 可选的默认地址
     */
    static async createCustomer(
        data: Omit<typeof customers.$inferInsert, 'id' | 'customerNo' | 'createdAt' | 'updatedAt' | 'tenantId' | 'createdBy' | 'deletedAt'>,
        tenantId: string,
        userId: string,
        addressData?: { address: string }
    ) {
        // 1. 检查手机号是否已存在
        const existing = await db.query.customers.findFirst({
            where: and(
                eq(customers.phone, data.phone),
                eq(customers.tenantId, tenantId)
            )
        });

        if (existing) {
            return { isDuplicate: true, customer: existing };
        }

        // 2. 生成客户编号
        const customerNo = await this.generateCustomerNo();

        // 3. 事务内创建客户
        const newCustomer = await db.transaction(async (tx) => {
            const [customer] = await tx.insert(customers).values({
                ...data,
                customerNo,
                tenantId,
                createdBy: userId,
            }).returning();

            // 4. 如果有地址则创建默认地址
            if (addressData?.address) {
                await tx.insert(customerAddresses).values({
                    tenantId,
                    customerId: customer.id,
                    address: addressData.address,
                    isDefault: true,
                    label: '默认',
                });
            }

            return customer;
        });

        return { isDuplicate: false, customer: newCustomer };
    }

    /**
     * 预览客户合并效果
     * 返回两个客户的字段对比，用于UI展示
     */
    static async previewMerge(primaryId: string, secondaryId: string, tenantId: string) {
        const primary = await db.query.customers.findFirst({
            where: and(eq(customers.id, primaryId), eq(customers.tenantId, tenantId)),
        });
        const secondary = await db.query.customers.findFirst({
            where: and(eq(customers.id, secondaryId), eq(customers.tenantId, tenantId)),
        });

        if (!primary || !secondary) {
            throw new Error('客户不存在');
        }

        // 对比关键字段
        const conflicts: Record<string, { primary: unknown; secondary: unknown }> = {};
        const compareFields = ['phone', 'phoneSecondary', 'wechat', 'gender', 'birthday', 'notes', 'tags'];

        for (const field of compareFields) {
            const pVal = (primary as Record<string, unknown>)[field];
            const sVal = (secondary as Record<string, unknown>)[field];
            if (pVal !== sVal && (pVal || sVal)) {
                conflicts[field] = { primary: pVal, secondary: sVal };
            }
        }

        // 统计将要迁移的关联数据
        const [orderCount, quoteCount, leadCount] = await Promise.all([
            db.select({ count: sql<number>`count(*)` }).from(orders).where(eq(orders.customerId, secondaryId)),
            db.select({ count: sql<number>`count(*)` }).from(quotes).where(eq(quotes.customerId, secondaryId)),
            db.select({ count: sql<number>`count(*)` }).from(leads).where(eq(leads.customerId, secondaryId)),
        ]);

        return {
            primary,
            secondary,
            conflicts,
            affectedData: {
                orders: Number(orderCount[0]?.count || 0),
                quotes: Number(quoteCount[0]?.count || 0),
                leads: Number(leadCount[0]?.count || 0),
            },
        };
    }

    /**
     * 合并客户档案
     * 将 mergedIds 中所有客户的关联数据迁移到 primaryId，并标记原档案为已合并
     * 
     * @param primaryId 主档案ID（保留）
     * @param mergedIds 被合并档案ID列表
     * @param fieldPriority 字段冲突时的优先策略
     * @param tenantId 租户ID
     * @param operatorId 操作人ID
     */
    static async mergeCustomers(
        primaryId: string,
        mergedIds: string[],
        fieldPriority: 'PRIMARY' | 'LATEST',
        tenantId: string,
        operatorId: string
    ) {
        // 1. 获取所有客户信息
        const primary = await db.query.customers.findFirst({
            where: and(eq(customers.id, primaryId), eq(customers.tenantId, tenantId)),
        });

        if (!primary) {
            throw new Error('主档案不存在');
        }

        const mergedCustomers = await db.query.customers.findMany({
            where: and(
                inArray(customers.id, mergedIds),
                eq(customers.tenantId, tenantId)
            ),
        });

        if (mergedCustomers.length !== mergedIds.length) {
            throw new Error('部分被合并档案不存在');
        }

        // 2. 事务执行合并
        const result = await db.transaction(async (tx) => {
            const affectedTables: string[] = [];

            // 2.1 迁移订单
            await tx.update(orders)
                .set({ customerId: primaryId })
                .where(inArray(orders.customerId, mergedIds));
            affectedTables.push('orders');

            // 2.2 迁移报价单
            await tx.update(quotes)
                .set({ customerId: primaryId })
                .where(inArray(quotes.customerId, mergedIds));
            affectedTables.push('quotes');

            // 2.3 迁移线索
            await tx.update(leads)
                .set({ customerId: primaryId })
                .where(inArray(leads.customerId, mergedIds));
            affectedTables.push('leads');

            // 2.4 迁移售后单
            await tx.update(afterSalesTickets)
                .set({ customerId: primaryId })
                .where(inArray(afterSalesTickets.customerId, mergedIds));
            affectedTables.push('after_sales_tickets');

            // 2.5 迁移测量单
            await tx.update(measureTasks)
                .set({ customerId: primaryId })
                .where(inArray(measureTasks.customerId, mergedIds));
            affectedTables.push('measure_tasks');

            // 2.6 迁移地址
            await tx.update(customerAddresses)
                .set({ customerId: primaryId })
                .where(inArray(customerAddresses.customerId, mergedIds));
            affectedTables.push('customer_addresses');

            // 3. 累加统计字段
            let totalOrders = primary.totalOrders || 0;
            let totalAmount = Number(primary.totalAmount || 0);

            for (const mc of mergedCustomers) {
                totalOrders += mc.totalOrders || 0;
                totalAmount += Number(mc.totalAmount || 0);
            }

            const avgOrderAmount = totalOrders > 0 ? totalAmount / totalOrders : 0;

            // 4. 更新主档案
            await tx.update(customers)
                .set({
                    totalOrders,
                    totalAmount: totalAmount.toString(),
                    avgOrderAmount: avgOrderAmount.toFixed(2),
                    mergedFrom: [...(primary.mergedFrom || []), ...mergedIds],
                    updatedAt: new Date(),
                })
                .where(eq(customers.id, primaryId));

            // 5. 标记被合并档案
            await tx.update(customers)
                .set({
                    isMerged: true,
                    deletedAt: new Date(),
                })
                .where(inArray(customers.id, mergedIds));

            // 6. 记录合并日志
            const [mergeLog] = await tx.insert(customerMergeLogs).values({
                tenantId,
                primaryCustomerId: primaryId,
                mergedCustomerIds: mergedIds,
                operatorId,
                fieldConflicts: {}, // 可以在此记录字段冲突决策
                affectedTables,
            }).returning();

            return mergeLog;
        });

        return result;
    }
}

