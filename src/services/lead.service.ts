import { db } from '@/shared/api/db';
import { leads, channels, leadActivities, leadStatusHistory, customers } from '@/shared/api/schema';
import { eq, and, desc, sql, or, ilike, count, isNull, notInArray } from 'drizzle-orm';
import { CustomerService } from './customer.service';
import { randomBytes } from 'crypto';
import { format } from 'date-fns';
import { calculateLeadScore } from '@/features/leads/logic/scoring';
import { getSettingInternal } from '@/features/settings/actions/system-settings-actions';
import { distributeToNextSales } from '@/features/leads/logic/distribution-engine';
import { AuditService } from '@/shared/lib/audit-service';
import { escapeSqlLike } from '@/shared/lib/utils';

export class LeadService {
  /**
   * Generates a unique Lead No.
   * Format: LD + YYYYMMDD + 6 hex chars
   */
  private static async generateLeadNo() {
    const prefix = `LD${format(new Date(), 'yyyyMMdd')}`;
    const random = randomBytes(3).toString('hex').toUpperCase(); // 6 chars
    return `${prefix}${random}`; // TOTAL 8+6=14 chars
  }

  /**
   * Create a new lead with duplicate check, auto-linking, and stats update.
   * @param data Lead data (partial)
   * @param tenantId Tenant ID
   * @param userId Creator User ID
   */
  static async createLead(
    data: Omit<
      typeof leads.$inferInsert,
      | 'id'
      | 'createdAt'
      | 'updatedAt'
      | 'tenantId'
      | 'leadNo'
      | 'createdBy'
      | 'assignedAt'
      | 'status'
    >,
    tenantId: string,
    userId: string
  ): Promise<{
    isDuplicate: boolean;
    duplicateReason?: 'PHONE' | 'ADDRESS';
    lead: typeof leads.$inferSelect;
  }> {
    // Calculate initial score
    const score = calculateLeadScore(data).toString();

    // 使用单一事务包裹整个流程
    return await db.transaction(async (tx) => {
      // 读取消重配置（使用统一的键名 LEAD_DUPLICATE_STRATEGY）
      const deduplicationSetting = (await getSettingInternal(
        'LEAD_DUPLICATE_STRATEGY',
        tenantId
      )) as string;
      // 消重策略：NONE=不校验, AUTO_LINK=自动关联(复用为查重), REJECT=拒绝
      if (deduplicationSetting !== 'NONE') {
        const activeLead = await tx.query.leads.findFirst({
          where: and(
            eq(leads.customerPhone, data.customerPhone),
            eq(leads.tenantId, tenantId),
            notInArray(leads.status, ['WON', 'INVALID'])
          ),
        });

        if (activeLead) {
          return { isDuplicate: true, duplicateReason: 'PHONE' as const, lead: activeLead };
        }
        // 地址查重：检查是否启用了第二键查重
        const enableSecondKeyCheck = (await getSettingInternal(
          'ENABLE_SECOND_KEY_DUPLICATE_CHECK',
          tenantId
        )) as boolean;
        if (enableSecondKeyCheck && data.community && data.address) {
          const existingAddress = await tx.query.leads.findFirst({
            where: and(
              eq(leads.community, data.community),
              eq(leads.address, data.address),
              eq(leads.tenantId, tenantId),
              notInArray(leads.status, ['WON', 'INVALID'])
            ),
          });
          if (existingAddress) {
            return {
              isDuplicate: true,
              duplicateReason: 'ADDRESS' as const,
              lead: existingAddress,
            };
          }
        }
      }

      // 3. Auto-link to existing customer
      let customerId = data.customerId;
      if (!customerId && data.customerPhone) {
        // 注意：CustomerService.findByPhone 可能需要支持 tx 参数，暂时假设可以单独查询
        const existingCustomer = await CustomerService.findByPhone(data.customerPhone, tenantId);
        if (existingCustomer) {
          customerId = existingCustomer.id;
        }
      }

      // 5. 自动分配策略 (Round Robin / Load Balance)
      // 尝试获取分配建议
      let assignedSalesId = null;
      let initialStatus: (typeof leads.$inferInsert)['status'] = 'PENDING_ASSIGNMENT';

      // 如果没有指定销售，且未成交，尝试自动分配
      if (!data.assignedSalesId && initialStatus === 'PENDING_ASSIGNMENT') {
        try {
          // 读取自动分配配置（使用统一的键名 LEAD_AUTO_ASSIGN_RULE）
          const assignRule = (await getSettingInternal(
            'LEAD_AUTO_ASSIGN_RULE',
            tenantId
          )) as string;

          if (assignRule !== 'MANUAL') {
            // 动态导入以避免循环依赖
            // 传入当前的事务上下文 tx
            const distribution = await distributeToNextSales(tenantId, tx);

            if (distribution.salesId) {
              assignedSalesId = distribution.salesId;
              initialStatus = 'PENDING_FOLLOWUP';
            }
          }
        } catch (error) {
          console.error('Auto-distribution failed:', error);
          // 降级处理：保持未分配
        }
      }

      // 6. Generate Lead No
      const leadNo = await this.generateLeadNo();

      // 7. Create Lead
      const [lead] = await tx
        .insert(leads)
        .values({
          ...data,
          leadNo,
          score,
          customerId: customerId,
          tenantId: tenantId,
          createdBy: userId,
          status: initialStatus,
          assignedSalesId: assignedSalesId || data.assignedSalesId, // 优先使用自动分配结果，其次是传入的
          assignedAt: assignedSalesId || data.assignedSalesId ? new Date() : null,
        })
        .returning();

      await AuditService.record(
        {
          tenantId,
          userId,
          action: 'CREATE',
          tableName: 'LEAD',
          recordId: lead.id,
          newValues: lead as unknown as Record<string, unknown>,
        },
        tx
      );

      // 8. Update Channel Statistics
      if (data.channelId) {
        await tx
          .update(channels)
          .set({ totalLeads: sql`${channels.totalLeads} + 1` })
          .where(and(eq(channels.id, data.channelId), eq(channels.tenantId, tenantId)));
      }

      // 如果初始分配了销售，需要记录状态变更历史? 暂不，这里是创建。

      return { isDuplicate: false, lead };
    });
  }

  /**
   * Get lead detail by ID.
   */
  static async getLead(id: string, tenantId: string) {
    const lead = await db.query.leads.findFirst({
      where: and(eq(leads.id, id), eq(leads.tenantId, tenantId)),
      with: {
        assignedSales: true,
        sourceChannel: true,
        sourceSub: true,
        customer: true,
        referrerCustomer: true,
      },
    });
    return lead;
  }

  /**
   * Update lead information using partial data.
   */
  static async updateLead(
    id: string,
    data: Partial<typeof leads.$inferInsert>,
    tenantId: string,
    operatorId?: string,
    version?: number
  ) {
    // Ensure the lead exists and belongs to the tenant
    const existingLead = await db.query.leads.findFirst({
      where: and(eq(leads.id, id), eq(leads.tenantId, tenantId)),
      columns: {
        id: true,
        status: true,
        // Scoring related fields
        intentionLevel: true,
        customerPhone: true,
        customerWechat: true,
        community: true,
        address: true,
        houseType: true,
        estimatedAmount: true,
        channelId: true,
        sourceChannelId: true,
      },
    });

    if (!existingLead) {
      throw new Error('Lead not found or access denied');
    }

    // Calculate new score if relevant fields are updated
    let newScore = undefined;
    // Check if any scoring field is present in data
    const scoringFields = [
      'intentionLevel',
      'customerPhone',
      'customerWechat',
      'community',
      'address',
      'houseType',
      'estimatedAmount',
      'channelId',
      'sourceChannelId',
    ];
    const shouldRecalculate = scoringFields.some((field) => field in data);

    if (shouldRecalculate) {
      // Merge existing data with updates
      const merged = { ...existingLead, ...data };
      newScore = calculateLeadScore(merged).toString();
    }

    return await db.transaction(async (tx) => {
      const updatePayload = {
        ...data,
        ...(newScore ? { score: newScore } : {}),
        version: sql`${leads.version} + 1`,
      };

      const whereCondition = and(
        eq(leads.id, id),
        eq(leads.tenantId, tenantId),
        version !== undefined ? eq(leads.version, version) : undefined
      );

      const [updated] = await tx.update(leads).set(updatePayload).where(whereCondition).returning();

      if (!updated && version !== undefined) {
        throw new Error('Concurrent modification detected. Please refresh and try again.');
      }

      // 如果状态发生变更，且提供了操作人ID，则记录历史
      if (data.status && data.status !== existingLead.status && operatorId) {
        await tx.insert(leadStatusHistory).values({
          tenantId,
          leadId: id,
          oldStatus: existingLead.status || 'PENDING_ASSIGNMENT',
          newStatus: data.status,
          changedBy: operatorId,
          reason: '编辑线索更新状态', // Changed to Chinese
        });
      }

      if (operatorId) {
        await AuditService.record(
          {
            tenantId,
            userId: operatorId,
            action: 'UPDATE',
            tableName: 'LEAD',
            recordId: id,
            oldValues: existingLead as unknown as Record<string, unknown>,
            newValues: updated as unknown as Record<string, unknown>,
          },
          tx
        );
      }

      return updated;
    });
  }

  /**
   * Assign lead to a sales user.
   */
  static async assignLead(
    id: string,
    salesId: string,
    tenantId: string,
    userId: string,
    version?: number
  ) {
    return await db.transaction(async (tx) => {
      const whereCondition = and(
        eq(leads.id, id),
        eq(leads.tenantId, tenantId),
        version !== undefined ? eq(leads.version, version) : undefined
      );

      const [lead] = await tx.select().from(leads).where(whereCondition).for('update');

      if (!lead)
        throw new Error(
          version !== undefined
            ? '数据已被他人修改，请刷新后重试'
            : 'Lead not found or access denied'
        );

      const [updated] = await tx
        .update(leads)
        .set({
          assignedSalesId: salesId,
          assignedAt: new Date(),
          status: lead.status === 'PENDING_ASSIGNMENT' ? 'PENDING_FOLLOWUP' : lead.status,
          version: sql`${leads.version} + 1`,
        })
        .where(eq(leads.id, id))
        .returning();

      await tx.insert(leadStatusHistory).values({
        tenantId: lead.tenantId,
        leadId: id,
        oldStatus: lead.status || 'PENDING_ASSIGNMENT',
        newStatus: updated.status || 'PENDING_ASSIGNMENT',
        changedBy: userId,
        reason: '手动分配',
      });

      await AuditService.record(
        {
          tenantId,
          userId,
          action: 'ASSIGN',
          tableName: 'LEAD',
          recordId: id,
          oldValues: { assignedSalesId: lead.assignedSalesId, status: lead.status },
          newValues: { assignedSalesId: salesId, status: updated.status },
        },
        tx
      );

      return updated;
    });
  }

  /**
   * Add a followup activity to a lead.
   */
  static async addActivity(
    leadId: string,
    data: {
      type: (typeof leadActivities.$inferInsert)['activityType'];
      content: string;
      nextFollowupAt?: Date;
      quoteId?: string;
      purchaseIntention?: (typeof leadActivities.$inferInsert)['purchaseIntention'];
      customerLevel?: string;
    },
    tenantId: string,
    userId: string,
    version?: number
  ): Promise<string> {
    return await db.transaction(async (tx) => {
      // 1. Verify lead existence and access
      const whereCondition = and(
        eq(leads.id, leadId),
        eq(leads.tenantId, tenantId),
        version !== undefined ? eq(leads.version, version) : undefined
      );

      const [lead] = await tx.select().from(leads).where(whereCondition).for('update');
      if (!lead)
        throw new Error(
          version !== undefined
            ? '数据已被他人修改，请刷新后重试'
            : 'Lead not found or access denied'
        );

      // 2. Insert Activity
      const [activity] = await tx
        .insert(leadActivities)
        .values({
          tenantId,
          leadId,
          activityType: data.type,
          content: data.content,
          quoteId: data.quoteId,
          purchaseIntention: data.purchaseIntention,
          customerLevel: data.customerLevel,
          createdBy: userId,
          createdAt: new Date(),
        })
        .returning({ id: leadActivities.id });

      // 3. Update Lead (lastActivityAt, nextFollowupAt, status -> FOLLOWING_UP if pending)
      // 使用 Record 类型：兼容 SQL 表达式 (version) 和后续动态属性 (status)
      const updateData: Record<string, unknown> = {
        lastActivityAt: new Date(),
        nextFollowupAt: data.nextFollowupAt ?? null, // 清空或更新下次跟进时间
        version: sql`${leads.version} + 1`,
      };

      const oldStatus = lead.status;
      if (lead.status === 'PENDING_FOLLOWUP') {
        updateData.status = 'FOLLOWING_UP';
        // Add status history
        await tx.insert(leadStatusHistory).values({
          tenantId,
          leadId,
          oldStatus: 'PENDING_FOLLOWUP',
          newStatus: 'FOLLOWING_UP',
          changedBy: userId,
          reason: '自动状态变更：添加跟进记录',
        });
      }

      await tx.update(leads).set(updateData).where(eq(leads.id, leadId));

      await AuditService.record(
        {
          tableName: 'leadActivities',
          recordId: activity.id,
          action: 'CREATE',
          userId,
          tenantId,
          changedFields: { ...data, leadId, message: '添加跟进记录' } as unknown as Record<
            string,
            unknown
          >,
        },
        tx
      );

      if (updateData.status && updateData.status !== oldStatus) {
        await AuditService.record(
          {
            tableName: 'leads',
            recordId: leadId,
            action: 'STATUS_CHANGE',
            userId,
            tenantId,
            oldValues: { status: oldStatus },
            newValues: { status: updateData.status },
          },
          tx
        );
      }

      return activity.id;
    });
  }

  /**
   * Void a lead (Mark as lost/void).
   */
  static async voidLead(
    leadId: string,
    reason: string,
    tenantId: string,
    userId: string,
    version?: number
  ): Promise<void> {
    await db.transaction(async (tx) => {
      const whereCondition = and(
        eq(leads.id, leadId),
        eq(leads.tenantId, tenantId),
        version !== undefined ? eq(leads.version, version) : undefined
      );

      const [lead] = await tx.select().from(leads).where(whereCondition).for('update');

      if (!lead)
        throw new Error(
          version !== undefined
            ? '数据已被他人修改，请刷新后重试'
            : 'Lead not found or access denied'
        );
      if (lead.status === 'WON') throw new Error('Cannot void a WON lead');
      if (lead.status === 'INVALID') return; // Already voided

      const oldStatus = lead.status;

      await tx
        .update(leads)
        .set({
          status: 'INVALID',
          lostReason: reason,
          version: sql`${leads.version} + 1`,
        })
        .where(eq(leads.id, leadId));

      await tx.insert(leadStatusHistory).values({
        tenantId,
        leadId,
        oldStatus,
        newStatus: 'INVALID',
        changedBy: userId,
        reason,
      });

      await AuditService.record(
        {
          tableName: 'leads',
          recordId: leadId,
          action: 'VOID',
          userId,
          tenantId,
          oldValues: { status: oldStatus, lostReason: lead.lostReason },
          newValues: { status: 'INVALID', lostReason: reason },
        },
        tx
      );
    });
  }

  /**
   * Convert a lead to a confirmed customer (Status: WON).
   */
  static async convertLead(
    leadId: string,
    targetCustomerId: string | undefined,
    tenantId: string,
    userId: string,
    version?: number
  ) {
    return await db.transaction(async (tx) => {
      let finalCustomerId = targetCustomerId;

      const whereCondition = and(
        eq(leads.id, leadId),
        eq(leads.tenantId, tenantId),
        version !== undefined ? eq(leads.version, version) : undefined
      );

      const [lead] = await tx.select().from(leads).where(whereCondition).for('update');

      if (!lead)
        throw new Error(
          version !== undefined
            ? '数据已被他人修改，请刷新后重试'
            : 'Lead not found or access denied'
        );

      // If no customer ID provided, create new customer from lead info
      if (!finalCustomerId) {
        // 2. Generate Customer Number (C20231027001)
        // Use randomBytes + hex to avoid collision better than Math.random()
        const customerNo = `C${format(new Date(), 'yyyyMMdd')}${randomBytes(3).toString('hex').toUpperCase()}`;

        const [newCustomer] = await tx
          .insert(customers)
          .values({
            tenantId,
            customerNo,
            name: lead.customerName,
            phone: lead.customerPhone,
            createdBy: userId,
            assignedSalesId: lead.assignedSalesId || userId,
          })
          .returning();
        finalCustomerId = newCustomer.id;

        await AuditService.record(
          {
            tableName: 'customers',
            recordId: newCustomer.id,
            action: 'CREATE',
            userId,
            tenantId,
            changedFields: { ...newCustomer, message: '线索转化时创建新客户' } as unknown as Record<
              string,
              unknown
            >,
          },
          tx
        );
      }

      await tx
        .update(leads)
        .set({
          status: 'WON',
          customerId: finalCustomerId,
          wonAt: new Date(),
          version: sql`${leads.version} + 1`,
        })
        .where(eq(leads.id, leadId));

      // Update Channel Amount Stats if channel exists
      if (lead.channelId) {
        const estimatedAmountNum = parseFloat(lead.estimatedAmount || '0') || 0;
        await tx
          .update(channels)
          .set({
            totalDealAmount: sql`COALESCE(${channels.totalDealAmount}, '0'):: decimal + ${estimatedAmountNum}:: decimal`,
          })
          .where(and(eq(channels.id, lead.channelId), eq(channels.tenantId, tenantId)));
      }

      await tx.insert(leadStatusHistory).values({
        tenantId: lead.tenantId,
        leadId: leadId,
        oldStatus: lead.status || 'PENDING_ASSIGNMENT',
        newStatus: 'WON',
        changedBy: userId,
        reason: '已转化为客户',
      });

      await AuditService.record(
        {
          tableName: 'leads',
          recordId: leadId,
          action: 'CONVERT',
          userId,
          tenantId,
          oldValues: { status: lead.status, customerId: lead.customerId },
          newValues: { status: 'WON', customerId: finalCustomerId },
          changedFields: { message: '线索转化为客户', newCustomerId: finalCustomerId },
        },
        tx
      );

      return finalCustomerId;
    });
  }

  /**
   * Get lead timeline activities.
   */
  static async getLeadTimeline(leadId: string, tenantId: string) {
    // Ensure lead belongs to tenant
    const lead = await db.query.leads.findFirst({
      where: and(eq(leads.id, leadId), eq(leads.tenantId, tenantId)),
      columns: { id: true },
    });

    if (!lead) {
      throw new Error('Lead not found or access denied');
    }

    const activities = await db.query.leadActivities.findMany({
      where: eq(leadActivities.leadId, leadId),
      with: {
        creator: true,
      },
      orderBy: [desc(leadActivities.createdAt)],
    });

    return activities;
  }

  /**
   * Release a lead back to the public pool.
   */
  static async releaseToPool(
    leadId: string,
    tenantId: string,
    userId: string,
    hasManagePerm: boolean = false
  ) {
    await db.transaction(async (tx) => {
      const [lead] = await tx
        .select()
        .from(leads)
        .where(and(eq(leads.id, leadId), eq(leads.tenantId, tenantId)))
        .for('update');

      if (!lead) throw new Error('Lead not found or access denied');

      if (!hasManagePerm && lead.assignedSalesId !== userId) {
        throw new Error('无权释放非本人的线索');
      }

      const oldStatus = lead.status;
      const oldAssignedSalesId = lead.assignedSalesId;

      await tx
        .update(leads)
        .set({
          assignedSalesId: null,
          status: 'PENDING_ASSIGNMENT',
        })
        .where(eq(leads.id, leadId));

      await tx.insert(leadStatusHistory).values({
        tenantId: lead.tenantId,
        leadId: leadId,
        oldStatus: lead.status || 'PENDING_ASSIGNMENT',
        newStatus: 'PENDING_ASSIGNMENT',
        changedBy: userId,
        reason: '释放至公海池',
      });

      await AuditService.record(
        {
          tableName: 'leads',
          recordId: leadId,
          action: 'RELEASE_TO_POOL',
          userId,
          tenantId,
          oldValues: { assignedSalesId: oldAssignedSalesId, status: oldStatus },
          newValues: { assignedSalesId: null, status: 'PENDING_ASSIGNMENT' },
          changedFields: { message: '释放线索至公海池' },
        },
        tx
      );
    });
  }

  /**
   * Claim a lead from the public pool.
   */
  static async claimFromPool(leadId: string, tenantId: string, userId: string) {
    return await db.transaction(async (tx) => {
      // FOR UPDATE lock to prevent race conditions
      const [lead] = await tx
        .select()
        .from(leads)
        .where(and(eq(leads.id, leadId), eq(leads.tenantId, tenantId)))
        .for('update');

      if (!lead) throw new Error('Lead not found or access denied');

      if (lead.assignedSalesId || lead.status !== 'PENDING_ASSIGNMENT') {
        throw new Error('线索不是待分配状态或已被认领');
      }

      const oldStatus = lead.status;
      const oldAssignedSalesId = lead.assignedSalesId;

      const [updatedLead] = await tx
        .update(leads)
        .set({
          assignedSalesId: userId,
          assignedAt: new Date(),
          status: 'PENDING_FOLLOWUP',
        })
        .where(eq(leads.id, leadId))
        .returning();

      await tx.insert(leadStatusHistory).values({
        tenantId: lead.tenantId,
        leadId: leadId,
        oldStatus: lead.status || 'PENDING_ASSIGNMENT',
        newStatus: 'PENDING_FOLLOWUP',
        changedBy: userId,
        reason: '从公海池认领',
      });

      await AuditService.record(
        {
          tableName: 'leads',
          recordId: leadId,
          action: 'CLAIM_FROM_POOL',
          userId,
          tenantId,
          oldValues: { assignedSalesId: oldAssignedSalesId, status: oldStatus },
          newValues: { assignedSalesId: userId, status: 'PENDING_FOLLOWUP' },
          changedFields: { message: '从公海池认领线索' },
        },
        tx
      );

      return updatedLead;
    });
  }

  /**
   * Get mobile lead list with pagination and keyword search for a specific user (or pool).
   */
  static async getMobileLeads(
    tenantId: string,
    userId: string,
    type: 'mine' | 'pool',
    page: number = 1,
    pageSize: number = 20,
    keyword?: string | null
  ) {
    const baseConditions = [eq(leads.tenantId, tenantId)];

    if (type === 'mine') {
      baseConditions.push(eq(leads.assignedSalesId, userId));
    } else if (type === 'pool') {
      baseConditions.push(isNull(leads.assignedSalesId));
    }

    if (keyword) {
      const escapedKeyword = escapeSqlLike(keyword);
      const searchFilter = or(
        ilike(leads.customerName, `%${escapedKeyword}%`),
        ilike(leads.customerPhone, `%${escapedKeyword}%`),
        ilike(leads.leadNo, `%${escapedKeyword}%`),
        ilike(leads.community, `%${escapedKeyword}%`)
      );
      if (searchFilter) {
        baseConditions.push(searchFilter);
      }
    }

    const leadList = await db.query.leads.findMany({
      where: and(...baseConditions),
      orderBy: [desc(leads.updatedAt)],
      limit: pageSize,
      offset: (page - 1) * pageSize,
      columns: {
        id: true,
        leadNo: true,
        customerName: true,
        customerPhone: true,
        address: true,
        status: true,
        intentionLevel: true,
        lastActivityAt: true,
        nextFollowupAt: true,
        decorationProgress: true,
        createdAt: true,
      },
    });

    const [totalResult] = await db
      .select({ total: count() })
      .from(leads)
      .where(and(...baseConditions));

    const total = totalResult?.total || 0;

    return { items: leadList, total };
  }
}
