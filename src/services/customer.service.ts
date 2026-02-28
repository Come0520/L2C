import { db } from '../shared/api/db';
import { customers, customerAddresses, customerMergeLogs } from '../shared/api/schema';
import { orders } from '../shared/api/schema/orders';
import { quotes } from '../shared/api/schema/quotes';
import { leads } from '../shared/api/schema/leads';
import { afterSalesTickets } from '../shared/api/schema/after-sales';
import { measureTasks, installTasks } from '../shared/api/schema/service';
import { customerActivities } from '../shared/api/schema/customer-activities';
import { showroomShares } from '../shared/api/schema/showroom';
import { loyaltyTransactions } from '../shared/api/schema/loyalty';
import {
  arStatements,
  receiptBills,
  paymentOrders,
  creditNotes,
  paymentBills,
  statementConfirmations,
} from '../shared/api/schema/finance';
import { eq, and, inArray, sql } from 'drizzle-orm';
import { randomBytes } from 'node:crypto';
import { format } from 'date-fns';
import { AuditService } from '../shared/services/audit-service';
import { AppError, ERROR_CODES } from '../shared/lib/errors';
import { logger } from '../shared/lib/logger';

export class CustomerService {
  /**
   * 通过手机号查找客户
   * @param phone 手机号
   * @param tenantId 租户 ID（必须提供以确保租户隔离）
   */
  static async findByPhone(phone: string, tenantId: string) {
    const customer = await db.query.customers.findFirst({
      where: and(eq(customers.phone, phone), eq(customers.tenantId, tenantId)),
    });
    return customer || null;
  }

  /**
   * 生成唯一客户编号
   * 格式: C + YYYYMMDD + 4位随机HEX
   * [Fix 2.1] 增加重试机制和唯一性检查
   */
  private static async generateCustomerNo(tenantId: string): Promise<string> {
    const dateStr = format(new Date(), 'yyyyMMdd');
    let attempts = 0;
    const maxAttempts = 3;

    while (attempts < maxAttempts) {
      const random = randomBytes(2).toString('hex').toUpperCase();
      const newCustomerNo = `C${dateStr}${random}`;

      // 检查并在数据库中确认唯一性
      const existing = await db.query.customers.findFirst({
        where: and(eq(customers.customerNo, newCustomerNo), eq(customers.tenantId, tenantId)),
        columns: { id: true },
      });

      if (!existing) {
        return newCustomerNo;
      }
      attempts++;
    }

    throw new AppError('生成客户编号失败，请重试', ERROR_CODES.INTERNAL_ERROR, 500);
  }

  /**
   * 创建新客户
   * @param data 客户数据
   * @param tenantId 租户ID
   * @param userId 操作人ID
   * @param addressData 可选的默认地址
   */
  static async createCustomer(
    data: Omit<
      typeof customers.$inferInsert,
      'id' | 'customerNo' | 'createdAt' | 'updatedAt' | 'tenantId' | 'createdBy' | 'deletedAt'
    >,
    tenantId: string,
    userId: string,
    addressData?: { address: string }
  ) {
    // 1. 检查手机号是否已存在
    const existing = await db.query.customers.findFirst({
      where: and(eq(customers.phone, data.phone), eq(customers.tenantId, tenantId)),
    });

    if (existing) {
      return { isDuplicate: true, customer: existing };
    }

    // 2. 生成客户编号
    const customerNo = await this.generateCustomerNo(tenantId);

    // 3. 事务内创建客户
    const newCustomer = await db.transaction(async (tx) => {
      const [customer] = await tx
        .insert(customers)
        .values({
          ...data,
          customerNo,
          tenantId,
          createdBy: userId,
        })
        .returning();

      // 4. 如果有地址则创建默认地址
      if (addressData?.address) {
        await tx.insert(customerAddresses).values({
          tenantId,
          customerId: customer.id,
          address: addressData.address,
          isDefault: true,
          label: '默认',
          province: null,
          city: null,
          district: null,
          community: null,
        });
      }

      // [Fix 3.1] 记录审计日志
      await AuditService.log(tx, {
        tenantId,
        tableName: 'customers',
        recordId: customer.id,
        action: 'CREATE',
        userId,
        newValues: customer,
      });

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
      throw new AppError('客户不存在', ERROR_CODES.CUSTOMER_NOT_FOUND, 404);
    }

    // [Fix 5.1] 边界检查：自合并
    if (primaryId === secondaryId) {
      throw new AppError('不能将客户与自己合并', ERROR_CODES.INVALID_OPERATION, 400);
    }

    // [Fix 5.1] 边界检查：已合并/已删除
    if (primary.isMerged || primary.deletedAt) {
      throw new AppError('主档案已合并或已删除', ERROR_CODES.INVALID_OPERATION, 400);
    }
    if (secondary.isMerged || secondary.deletedAt) {
      throw new AppError('副档案已合并或已删除', ERROR_CODES.INVALID_OPERATION, 400);
    }

    // 对比关键字段
    const conflicts: Record<string, { primary: unknown; secondary: unknown }> = {};
    const compareFields = [
      'name',
      'phone',
      'phoneSecondary',
      'wechat',
      'gender',
      'birthday',
      'notes',
      'tags',
      'source',
      'referrerName',
      'level',
      'address',
    ];

    for (const field of compareFields) {
      const pVal = (primary as Record<string, unknown>)[field];
      const sVal = (secondary as Record<string, unknown>)[field];
      if (pVal !== sVal && (pVal || sVal)) {
        conflicts[field] = { primary: pVal, secondary: sVal };
      }
    }

    // 统计将要迁移的关联数据
    // [Fix 2.4] 关联数据查询添加 tenantId 过滤
    const [orderCount, quoteCount, leadCount] = await Promise.all([
      db
        .select({ count: sql<number>`count(*)` })
        .from(orders)
        .where(and(eq(orders.customerId, secondaryId), eq(orders.tenantId, tenantId))),
      db
        .select({ count: sql<number>`count(*)` })
        .from(quotes)
        .where(and(eq(quotes.customerId, secondaryId), eq(quotes.tenantId, tenantId))),
      db
        .select({ count: sql<number>`count(*)` })
        .from(leads)
        .where(and(eq(leads.customerId, secondaryId), eq(leads.tenantId, tenantId))),
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
    operatorId: string,
    targetVersion?: number
  ) {
    // 1. 获取所有客户信息
    const primary = await db.query.customers.findFirst({
      where: and(eq(customers.id, primaryId), eq(customers.tenantId, tenantId)),
    });

    if (!primary) {
      throw new AppError('主档案不存在或无权操作', ERROR_CODES.CUSTOMER_NOT_FOUND, 404);
    }

    // 乐观锁初步校验
    if (targetVersion !== undefined && primary.version !== targetVersion) {
      throw new AppError('数据已被修改，请刷新后重试', ERROR_CODES.CONCURRENCY_CONFLICT, 409);
    }

    // [Fix 4.3] 边界情况检查：主档案已合并
    if (primary.isMerged) {
      throw new AppError('主档案已被合并，无法继续操作', ERROR_CODES.INVALID_OPERATION, 400);
    }

    // [Fix 4.3] 边界情况检查：自合并
    if (mergedIds.includes(primaryId)) {
      throw new AppError('不能将客户合并给自己', ERROR_CODES.INVALID_OPERATION, 400);
    }

    // [Fix 4.3] 边界情况检查：重复 ID
    if (new Set(mergedIds).size !== mergedIds.length) {
      throw new AppError('被合并档案列表中包含重复 ID', ERROR_CODES.INVALID_OPERATION, 400);
    }

    const mergedCustomers = await db.query.customers.findMany({
      where: and(inArray(customers.id, mergedIds), eq(customers.tenantId, tenantId)),
    });

    // [Fix 2.6] 确保所有被合并档案都存在且属于该租户
    // 防止攻击者传入属于其他租户的 ID
    if (mergedCustomers.length !== mergedIds.length) {
      throw new AppError('部分被合并档案不存在或无权操作', ERROR_CODES.CUSTOMER_NOT_FOUND, 404);
    }

    // [Fix 5.1] 检查被合并客户是否已合并或已删除
    const invalidSources = mergedCustomers.filter((mc) => mc.isMerged || mc.deletedAt);
    if (invalidSources.length > 0) {
      throw new AppError(
        `被合并档案中包含已合并或已删除的记录: ${invalidSources.map((c) => c.customerNo).join(', ')}`,
        ERROR_CODES.INVALID_OPERATION,
        400
      );
    }

    // 2. 事务执行合并
    const result = await db.transaction(async (tx) => {
      const affectedTables: string[] = [];

      // [Fix 3.6] 迁移关联数据时添加租户隔离
      // 2.1 迁移订单
      await tx
        .update(orders)
        .set({ customerId: primaryId })
        .where(and(inArray(orders.customerId, mergedIds), eq(orders.tenantId, tenantId)));
      affectedTables.push('orders');

      // 2.2 迁移报价单
      await tx
        .update(quotes)
        .set({ customerId: primaryId })
        .where(and(inArray(quotes.customerId, mergedIds), eq(quotes.tenantId, tenantId)));
      affectedTables.push('quotes');

      // 2.3 迁移线索
      await tx
        .update(leads)
        .set({ customerId: primaryId })
        .where(and(inArray(leads.customerId, mergedIds), eq(leads.tenantId, tenantId)));
      affectedTables.push('leads');

      // 2.4 迁移售后单
      await tx
        .update(afterSalesTickets)
        .set({ customerId: primaryId })
        .where(
          and(
            inArray(afterSalesTickets.customerId, mergedIds),
            eq(afterSalesTickets.tenantId, tenantId)
          )
        );
      affectedTables.push('after_sales_tickets');

      // 2.5 迁移测量单
      await tx
        .update(measureTasks)
        .set({ customerId: primaryId })
        .where(
          and(inArray(measureTasks.customerId, mergedIds), eq(measureTasks.tenantId, tenantId))
        );
      affectedTables.push('measure_tasks');

      // 2.6 迁移地址
      await tx
        .update(customerAddresses)
        .set({ customerId: primaryId })
        .where(
          and(
            inArray(customerAddresses.customerId, mergedIds),
            eq(customerAddresses.tenantId, tenantId)
          )
        );
      affectedTables.push('customer_addresses');

      // 2.7 迁移安装单
      await tx
        .update(installTasks)
        .set({ customerId: primaryId })
        .where(
          and(inArray(installTasks.customerId, mergedIds), eq(installTasks.tenantId, tenantId))
        );
      affectedTables.push('install_tasks');

      // 2.8 迁移客户活动
      await tx
        .update(customerActivities)
        .set({ customerId: primaryId })
        .where(
          and(
            inArray(customerActivities.customerId, mergedIds),
            eq(customerActivities.tenantId, tenantId)
          )
        );
      affectedTables.push('customer_activities');

      // 2.9 迁移展厅分享
      await tx
        .update(showroomShares)
        .set({ customerId: primaryId })
        .where(
          and(inArray(showroomShares.customerId, mergedIds), eq(showroomShares.tenantId, tenantId))
        );
      affectedTables.push('showroom_shares');

      // 2.10 迁移积分记录
      await tx
        .update(loyaltyTransactions)
        .set({ customerId: primaryId })
        .where(
          and(
            inArray(loyaltyTransactions.customerId, mergedIds),
            eq(loyaltyTransactions.tenantId, tenantId)
          )
        );
      affectedTables.push('loyalty_transactions');

      // 2.11 迁移财务数据
      // AR Statements
      await tx
        .update(arStatements)
        .set({ customerId: primaryId })
        .where(
          and(inArray(arStatements.customerId, mergedIds), eq(arStatements.tenantId, tenantId))
        );
      affectedTables.push('ar_statements');

      // Receipt Bills
      await tx
        .update(receiptBills)
        .set({ customerId: primaryId })
        .where(
          and(inArray(receiptBills.customerId, mergedIds), eq(receiptBills.tenantId, tenantId))
        );
      affectedTables.push('receipt_bills');

      // Payment Orders (Legacy)
      await tx
        .update(paymentOrders)
        .set({ customerId: primaryId })
        .where(
          and(inArray(paymentOrders.customerId, mergedIds), eq(paymentOrders.tenantId, tenantId))
        );
      affectedTables.push('payment_orders');

      // Credit Notes
      await tx
        .update(creditNotes)
        .set({ customerId: primaryId })
        .where(and(inArray(creditNotes.customerId, mergedIds), eq(creditNotes.tenantId, tenantId)));
      affectedTables.push('credit_notes');

      // Payment Bills (Payee = CUSTOMER)
      await tx
        .update(paymentBills)
        .set({ payeeId: primaryId })
        .where(
          and(
            eq(paymentBills.payeeType, 'CUSTOMER'),
            inArray(paymentBills.payeeId, mergedIds),
            eq(paymentBills.tenantId, tenantId)
          )
        );
      affectedTables.push('payment_bills');

      // Statement Confirmations (Type = CUSTOMER)
      await tx
        .update(statementConfirmations)
        .set({ targetId: primaryId })
        .where(
          and(
            eq(statementConfirmations.type, 'CUSTOMER'),
            inArray(statementConfirmations.targetId, mergedIds),
            eq(statementConfirmations.tenantId, tenantId)
          )
        );
      affectedTables.push('statement_confirmations');

      // 2.3b 迁移线索推荐人 (leads.referrerCustomerId)
      await tx
        .update(leads)
        .set({ referrerCustomerId: primaryId })
        .where(and(inArray(leads.referrerCustomerId, mergedIds), eq(leads.tenantId, tenantId)));

      // 3. 累加统计字段
      let totalOrders = primary.totalOrders || 0;
      let totalAmount = Number(primary.totalAmount || 0);
      let loyaltyPoints = primary.loyaltyPoints || 0;

      // 记录字段冲突决策
      const fieldConflicts: Record<string, unknown> = {};

      // 智能字段合并的中间变量
      let mergedPhoneSecondary = primary.phoneSecondary;
      let mergedNotes = primary.notes || '';
      let mergedTags = [...(primary.tags || [])];
      let mergedWechat = primary.wechat;
      let mergedLevel = primary.level;
      let mergedSource = primary.source;
      let mergedReferrerName = primary.referrerName;
      let mergedFirstOrderAt = primary.firstOrderAt;
      let mergedLastOrderAt = primary.lastOrderAt;

      // 等级优先级映射（A 最高, D 最低）
      const LEVEL_ORDER: Record<string, number> = { A: 4, B: 3, C: 2, D: 1 };

      for (const mc of mergedCustomers) {
        // ── 统计字段累加 ──
        totalOrders += mc.totalOrders || 0;
        totalAmount += Number(mc.totalAmount || 0);
        loyaltyPoints += mc.loyaltyPoints || 0;

        // ── 🔴 高优先级：电话号码 → 备用电话 ──
        if (!mergedPhoneSecondary && mc.phone) {
          mergedPhoneSecondary = mc.phone;
          fieldConflicts['phoneSecondary'] = {
            from: primary.phoneSecondary,
            to: mc.phone,
            source: mc.customerNo,
          };
        }

        // ── 🔴 高优先级：备注追加 ──
        if (mc.notes) {
          mergedNotes = mergedNotes
            ? `${mergedNotes}\n---\n[合并自 ${mc.customerNo}] ${mc.notes}`
            : `[合并自 ${mc.customerNo}] ${mc.notes}`;
          fieldConflicts['notes'] = { action: 'append', source: mc.customerNo };
        }

        // ── 🔴 高优先级：标签并集 ──
        if (mc.tags && mc.tags.length > 0) {
          mergedTags = [...new Set([...mergedTags, ...mc.tags])];
          fieldConflicts['tags'] = { action: 'union', source: mc.customerNo };
        }

        // ── 🟡 中优先级：微信号空值补充 ──
        if (!mergedWechat && mc.wechat) {
          mergedWechat = mc.wechat;
          fieldConflicts['wechat'] = { from: null, to: mc.wechat, source: mc.customerNo };
        }

        // ── 🟡 中优先级：客户等级取更高 ──
        if (mc.level) {
          const currentOrder = LEVEL_ORDER[mergedLevel || 'D'] || 1;
          const mcOrder = LEVEL_ORDER[mc.level] || 1;
          if (mcOrder > currentOrder) {
            fieldConflicts['level'] = { from: mergedLevel, to: mc.level, source: mc.customerNo };
            mergedLevel = mc.level as typeof mergedLevel;
          }
        }

        // ── 🟡 中优先级：时间极值 ──
        if (mc.firstOrderAt) {
          if (!mergedFirstOrderAt || mc.firstOrderAt < mergedFirstOrderAt) {
            mergedFirstOrderAt = mc.firstOrderAt;
          }
        }
        if (mc.lastOrderAt) {
          if (!mergedLastOrderAt || mc.lastOrderAt > mergedLastOrderAt) {
            mergedLastOrderAt = mc.lastOrderAt;
          }
        }

        // ── 🟢 低优先级：来源/带单人空值补充 ──
        if (!mergedSource && mc.source) {
          mergedSource = mc.source;
          fieldConflicts['source'] = { from: null, to: mc.source, source: mc.customerNo };
        }
        if (!mergedReferrerName && mc.referrerName) {
          mergedReferrerName = mc.referrerName;
          fieldConflicts['referrerName'] = {
            from: null,
            to: mc.referrerName,
            source: mc.customerNo,
          };
        }
      }

      const avgOrderAmount = totalOrders > 0 ? totalAmount / totalOrders : 0;

      // 4. 更新主档案（含智能合并字段）
      // [Fix 2.5] 更新主档案增加 tenantId 检查
      const [updatedPrimary] = await tx
        .update(customers)
        .set({
          // 统计字段
          totalOrders,
          totalAmount: totalAmount.toString(),
          avgOrderAmount: avgOrderAmount.toFixed(2),
          loyaltyPoints,
          // 智能合并字段
          phoneSecondary: mergedPhoneSecondary,
          notes: mergedNotes || null,
          tags: mergedTags.length > 0 ? mergedTags : [],
          wechat: mergedWechat,
          level: mergedLevel,
          source: mergedSource,
          referrerName: mergedReferrerName,
          firstOrderAt: mergedFirstOrderAt,
          lastOrderAt: mergedLastOrderAt,
          // 元数据
          mergedFrom: [...(primary.mergedFrom || []), ...mergedIds],
          updatedAt: new Date(),
          version: (primary.version || 0) + 1,
        })
        .where(
          and(
            eq(customers.id, primaryId),
            eq(customers.tenantId, tenantId),
            targetVersion !== undefined ? eq(customers.version, targetVersion) : undefined
          )
        )
        .returning();

      if (!updatedPrimary && targetVersion !== undefined) {
        throw new AppError('并发合并失败，数据已被修改', ERROR_CODES.CONCURRENCY_CONFLICT, 409);
      }

      // 5. 标记被合并档案
      // [Fix 2.6] 标记被合并档案增加 tenantId 检查
      await tx
        .update(customers)
        .set({
          isMerged: true,
          deletedAt: new Date(),
        })
        .where(and(inArray(customers.id, mergedIds), eq(customers.tenantId, tenantId)));

      // 6. 记录合并日志
      const [mergeLog] = await tx
        .insert(customerMergeLogs)
        .values({
          tenantId,
          primaryCustomerId: primaryId,
          mergedCustomerIds: mergedIds,
          operatorId,
          fieldConflicts: fieldConflicts,
          affectedTables,
        })
        .returning();

      // [Fix 3.1] 记录审计日志
      await AuditService.log(tx, {
        tenantId,
        tableName: 'customers',
        recordId: primaryId,
        action: 'MERGE',
        userId: operatorId,
        details: { mergedIds, mergeLogId: mergeLog.id },
      });

      return mergeLog;
    });

    return result;
  }

  /**
   * 更新客户信息
   * [Fix 1.2] 添加等级降级校验
   * [Fix 3.1] 记录审计日志
   * [Fix 3.4] 限制更新字段（在 schema 层已限制，此处为双重保障）
   */
  static async updateCustomer(
    id: string,
    data: Partial<
      Omit<
        typeof customers.$inferInsert,
        'id' | 'customerNo' | 'tenantId' | 'createdAt' | 'createdBy'
      >
    >,
    tenantId: string,
    userId: string,
    version?: number
  ) {
    const existing = await db.query.customers.findFirst({
      where: and(eq(customers.id, id), eq(customers.tenantId, tenantId)),
    });

    if (!existing) {
      throw new AppError('客户不存在或无权操作', ERROR_CODES.CUSTOMER_NOT_FOUND, 404);
    }

    // [Fix 1.2] 等级降级校验
    if (data.level && existing.level && data.level < existing.level) {
      logger.warn(`Customer level downgrade attempt: ${existing.level} -> ${data.level}`);
      // 如果 strict mode: throw new AppError('不允许降低客户等级', ERROR_CODES.INVALID_OPERATION, 400);
    }

    // [Fix 3.2] 乐观锁并发控制
    if (version !== undefined && existing.version !== version) {
      throw new AppError('数据已被修改，请刷新后重试', ERROR_CODES.CONCURRENCY_CONFLICT, 409);
    }

    // 事务执行更新和审计日志
    const updatedCustomer = await db.transaction(async (tx) => {
      const [updated] = await tx
        .update(customers)
        .set({
          ...data,
          updatedAt: new Date(),
          version: (existing.version || 0) + 1,
        })
        .where(
          and(
            eq(customers.id, id),
            eq(customers.tenantId, tenantId),
            version !== undefined ? eq(customers.version, version) : undefined
          )
        )
        .returning();

      if (!updated && version !== undefined) {
        throw new AppError('并发更新失败，请重试', ERROR_CODES.CONCURRENCY_CONFLICT, 409);
      }

      // [Fix 3.1] 审计日志
      await AuditService.log(tx, {
        tenantId,
        tableName: 'customers',
        recordId: id,
        action: 'UPDATE',
        userId,
        oldValues: existing,
        newValues: updated,
      });

      return updated;
    });

    return updatedCustomer;
  }

  /**
   * 软删除客户
   * [Fix 3.1] 记录审计日志
   */
  static async deleteCustomer(id: string, tenantId: string, userId: string) {
    const existing = await db.query.customers.findFirst({
      where: and(eq(customers.id, id), eq(customers.tenantId, tenantId)),
    });

    if (!existing) {
      throw new AppError('客户不存在或无权操作', ERROR_CODES.CUSTOMER_NOT_FOUND, 404);
    }

    // [Fix 5.2] 幂等性检查：如果已删除，直接返回
    if (existing.deletedAt) {
      return;
    }

    await db.transaction(async (tx) => {
      await tx
        .update(customers)
        .set({ deletedAt: new Date() })
        .where(and(eq(customers.id, id), eq(customers.tenantId, tenantId)));

      // [Fix 3.1] 审计日志
      await AuditService.log(tx, {
        tenantId,
        tableName: 'customers',
        recordId: id,
        action: 'DELETE',
        userId,
        oldValues: existing,
      });
    });
  }
}
