import { db } from '@/shared/api/db';
import { quotes, quoteItems, quoteRooms } from '@/shared/api/schema/quotes';
import { eq, and, ne } from 'drizzle-orm';

/**
 * 报价单版本与生命周期增强服务 (Quote Version & Lifecycle Enhancement Service)
 */
export class QuoteVersionService {
  /**
   * 激活指定版本的报价单 (Activate Quote Version)
   * 在同源的版本链中停用其他版本，并点亮当前版本，确保只有一个对外活跃的有效版本。
   *
   * @param quoteId - 需要被激活的目标报价单主键
   * @param tenantId - 租户身份标志，用于在整个版本链寻找中确保数据隔离与安全
   * @returns 成功点亮激活的报价单数据对象
   * @throws {Error} 若找不到要激活的报价单则抛出异常
   */
  static async activateVersion(quoteId: string, tenantId: string) {
    return await db.transaction(async (tx) => {
      const quote = await tx.query.quotes.findFirst({
        where: and(eq(quotes.id, quoteId), eq(quotes.tenantId, tenantId)),
      });

      if (!quote) throw new Error('Quote not found');

      if (quote.rootQuoteId) {
        await tx
          .update(quotes)
          .set({ isActive: false, updatedAt: new Date() })
          .where(
            and(
              eq(quotes.rootQuoteId, quote.rootQuoteId),
              eq(quotes.isActive, true),
              ne(quotes.id, quoteId),
              eq(quotes.tenantId, tenantId)
            )
          );
      }

      const [activated] = await tx
        .update(quotes)
        .set({ isActive: true, updatedAt: new Date() })
        .where(and(eq(quotes.id, quoteId), eq(quotes.tenantId, tenantId)))
        .returning();

      return activated;
    });
  }

  /**
   * 为已有报价单创建演进版本 (Create Next Version)
   * 根据现有的选定报价单深度克隆其所有空间与明细结构，并生成下一个 V+号 版本，作为新的草稿单。
   *
   * @param quoteId - 来源的基础报价单ID
   * @param userId - 发起版本迭代的系统操作人ID
   * @param tenantId - 用于权限校验与全量复制过程的数据隔离ID
   * @returns 返回全新克隆出来的下一版本报价快照单对象
   * @throws {Error} 当源报价单实体丢失时抛出异常
   */
  static async createNextVersion(quoteId: string, userId: string, tenantId: string) {
    return await db.transaction(async (tx) => {
      const originalQuote = await tx.query.quotes.findFirst({
        where: and(eq(quotes.id, quoteId), eq(quotes.tenantId, tenantId)),
        with: {
          rooms: true,
          items: true,
        },
      });

      if (!originalQuote) throw new Error('Quote not found');

      /** 向上追溯找出同源派系所有版本的基点主干网络 ID */
      const rootQuoteId = originalQuote.rootQuoteId || originalQuote.id;

      await tx
        .update(quotes)
        .set({ isActive: false })
        .where(and(eq(quotes.rootQuoteId, rootQuoteId), eq(quotes.tenantId, tenantId)));

      const newVersion = (originalQuote.version || 1) + 1;
      /** 解析剥离出纯净基础版的数字母版号字符，去掉后缀小尾巴再追加新的版本叠加项 */
      const baseQuoteNo = originalQuote.quoteNo.replace(/-V\d+$/, '');
      const finalQuoteNo = `${baseQuoteNo}-V${newVersion}`;

      const newQuoteData = {
        tenantId: originalQuote.tenantId,
        customerId: originalQuote.customerId,
        quoteNo: finalQuoteNo,
        version: newVersion,
        totalAmount: originalQuote.totalAmount?.toString() || '0',
        finalAmount: originalQuote.finalAmount?.toString() || '0',
        discountAmount: originalQuote.discountAmount?.toString() || '0',
        status: 'DRAFT' as const,
        parentQuoteId: originalQuote.id,
        rootQuoteId: rootQuoteId,
        bundleId: originalQuote.bundleId,
        isActive: true,
        createdBy: userId,
        createdAt: new Date(),
        updatedAt: new Date(),
        notes: originalQuote.notes,
        leadId: originalQuote.leadId,
        measureVariantId: originalQuote.measureVariantId,
        title: originalQuote.title,
        discountRate: originalQuote.discountRate,
        validUntil: originalQuote.validUntil,
      };

      const [newQuote] = await tx.insert(quotes).values(newQuoteData).returning();

      /** 维护原房间ID到新复制房间ID的映射关系，用于稍后明细项的关联对齐 */
      const roomIdMap = new Map<string, string>();
      if (originalQuote.rooms.length > 0) {
        const roomData = originalQuote.rooms.map((room) => ({
          tenantId: originalQuote.tenantId,
          quoteId: newQuote.id,
          name: room.name,
          measureRoomId: room.measureRoomId,
          sortOrder: room.sortOrder,
          createdAt: new Date(),
        }));
        const insertedRooms = await tx.insert(quoteRooms).values(roomData).returning();
        originalQuote.rooms.forEach((room, index) => {
          roomIdMap.set(room.id, insertedRooms[index].id);
        });
      }

      const itemIdMap = new Map<string, string>();
      /** 执行全明细的剥离第一步：先行鉴别且仅抽取出位于首层的主件核心条目集合作为本次克隆的第一批数据结构 */
      const parentItems = originalQuote.items.filter((i) => !i.parentId);

      if (parentItems.length > 0) {
        const parentData = parentItems.map((item) => ({
          tenantId: newQuote.tenantId,
          quoteId: newQuote.id,
          roomId: item.roomId ? roomIdMap.get(item.roomId) : null,
          parentId: null,
          category: item.category,
          productId: item.productId,
          productName: item.productName,
          productSku: item.productSku,
          roomName: item.roomName,
          unit: item.unit,
          unitPrice: item.unitPrice?.toString() || '0',
          costPrice: item.costPrice?.toString() || '0',
          quantity: item.quantity?.toString() || '0',
          width: item.width?.toString() || null,
          height: item.height?.toString() || null,
          foldRatio: item.foldRatio?.toString() || null,
          processFee: item.processFee?.toString() || null,
          subtotal: item.subtotal?.toString() || '0',
          remark: item.remark,
          attributes: item.attributes,
          calculationParams: item.calculationParams,
          sortOrder: item.sortOrder,
          createdAt: new Date(),
        }));

        /** 执行批量插入动作并接收生成的全新主键 ID 回放 */
        const insertedParents = await tx.insert(quoteItems).values(parentData).returning();
        parentItems.forEach((item, index) => {
          itemIdMap.set(item.id, insertedParents[index].id);
        });

        /** 提取所有依附于父项之下的子配置项（如延伸工艺或配件关联） */
        const childItems = originalQuote.items.filter((i) => i.parentId);
        if (childItems.length > 0) {
          const childData = childItems.map((item) => ({
            tenantId: newQuote.tenantId,
            quoteId: newQuote.id,
            roomId: item.roomId ? roomIdMap.get(item.roomId) : null,
            parentId: item.parentId ? itemIdMap.get(item.parentId) : null,
            category: item.category,
            productId: item.productId,
            productName: item.productName,
            productSku: item.productSku,
            roomName: item.roomName,
            unit: item.unit,
            unitPrice: item.unitPrice?.toString() || '0',
            costPrice: item.costPrice?.toString() || '0',
            quantity: item.quantity?.toString() || '0',
            width: item.width?.toString() || null,
            height: item.height?.toString() || null,
            foldRatio: item.foldRatio?.toString() || null,
            processFee: item.processFee?.toString() || null,
            subtotal: item.subtotal?.toString() || '0',
            remark: item.remark,
            attributes: item.attributes,
            calculationParams: item.calculationParams,
            sortOrder: item.sortOrder,
            createdAt: new Date(),
          }));

          await tx.insert(quoteItems).values(childData);
        }
      }

      return newQuote;
    });
  }

  /**
   * 复制报价单为新的独立平行报价单
   * 和版本升级不同，此操作会彻底脱离原有的版本链约束，生成一个全新的单列报价。
   * 可以被用于跨客户模板复制、标准化应用等功能场景。
   *
   * @param quoteId - 将要被基础拷贝的源报价单标识
   * @param userId - 本次复制操作授权与生成的系统操作人员标识
   * @param tenantId - 防越权的强身份隔离查询标识
   * @param targetCustomerId - 可选目标参数，若存在则能够直接挂载给另一位客户
   * @returns 全新的独立属性报价单对象
   * @throws {Error} 未查询到有效的拷贝基础源单时抛出
   */
  static async copyQuote(
    quoteId: string,
    userId: string,
    tenantId: string,
    targetCustomerId?: string
  ) {
    return await db.transaction(async (tx) => {
      const originalQuote = await tx.query.quotes.findFirst({
        where: and(eq(quotes.id, quoteId), eq(quotes.tenantId, tenantId)),
        with: {
          rooms: true,
          items: true,
        },
      });

      if (!originalQuote) throw new Error('报价单不存在');

      /** 脱离源头自行独创生成的纯净序列号发号器（目前简单使用时间戳替代） */
      const newQuoteNo = `QT${Date.now()}`;

      const newQuoteData = {
        tenantId: originalQuote.tenantId,
        customerId: targetCustomerId || originalQuote.customerId,
        quoteNo: newQuoteNo,
        version: 1,
        totalAmount: originalQuote.totalAmount?.toString() || '0',
        finalAmount: originalQuote.finalAmount?.toString() || '0',
        discountAmount: originalQuote.discountAmount?.toString() || '0',
        discountRate: originalQuote.discountRate?.toString() || '1',
        status: 'DRAFT' as const,
        parentQuoteId: null,
        rootQuoteId: null as string | null,
        isActive: true,
        createdBy: userId,
        createdAt: new Date(),
        updatedAt: new Date(),
        notes: originalQuote.notes
          ? `[复制自 ${originalQuote.quoteNo}] ${originalQuote.notes}`
          : `复制自 ${originalQuote.quoteNo}`,
        title: originalQuote.title,
      };

      const [newQuote] = await tx.insert(quotes).values(newQuoteData).returning();

      await tx.update(quotes).set({ rootQuoteId: newQuote.id }).where(eq(quotes.id, newQuote.id));

      const roomIdMap = new Map<string, string>();
      if (originalQuote.rooms.length > 0) {
        const roomData = originalQuote.rooms.map((room) => ({
          tenantId: originalQuote.tenantId,
          quoteId: newQuote.id,
          name: room.name,
          measureRoomId: room.measureRoomId,
          sortOrder: room.sortOrder,
          createdAt: new Date(),
        }));
        const insertedRooms = await tx.insert(quoteRooms).values(roomData).returning();
        originalQuote.rooms.forEach((room, index) => {
          roomIdMap.set(room.id, insertedRooms[index].id);
        });
      }

      /** 建立起独立平行空间内的全新数据映射字典表，完全截断和原单库的牵连 */
      const itemIdMap = new Map<string, string>();
      /** 执行全明细的剥离第一步：先鉴别识别出主件逻辑集合 */
      const parentItems = originalQuote.items.filter((i) => !i.parentId);

      if (parentItems.length > 0) {
        const parentData = parentItems.map((item) => ({
          tenantId: newQuote.tenantId,
          quoteId: newQuote.id,
          roomId: item.roomId ? roomIdMap.get(item.roomId) : null,
          parentId: null,
          category: item.category,
          productId: item.productId,
          productName: item.productName,
          productSku: item.productSku,
          /** TypeScript 辅助挂载：利用原对象的冗余记录重新映射为新空间对象名关联 */
          roomName: item.roomName, // TypeScript error handle: maybe unit? wait, earlier I used roomName: item.roomName but actually unit. original code has unit: item.unit
          unit: item.unit,
          unitPrice: item.unitPrice?.toString() || '0',
          costPrice: item.costPrice?.toString() || '0',
          quantity: item.quantity?.toString() || '0',
          width: item.width?.toString() || null,
          height: item.height?.toString() || null,
          foldRatio: item.foldRatio?.toString() || null,
          processFee: item.processFee?.toString() || null,
          subtotal: item.subtotal?.toString() || '0',
          remark: item.remark,
          attributes: item.attributes,
          calculationParams: item.calculationParams,
          sortOrder: item.sortOrder,
          createdAt: new Date(),
        }));

        const insertedParents = await tx.insert(quoteItems).values(parentData).returning();
        parentItems.forEach((item, index) => {
          itemIdMap.set(item.id, insertedParents[index].id);
        });

        /** 然后在拿到全新插入好带有合法主键的新生父类记录后，挂钩组装并插入所有从属类附属品子集数据 */
        const childItems = originalQuote.items.filter((i) => i.parentId);
        if (childItems.length > 0) {
          const childData = childItems.map((item) => ({
            tenantId: newQuote.tenantId,
            quoteId: newQuote.id,
            roomId: item.roomId ? roomIdMap.get(item.roomId) : null,
            parentId: item.parentId ? itemIdMap.get(item.parentId) : null,
            category: item.category,
            productId: item.productId,
            productName: item.productName,
            productSku: item.productSku,
            unit: item.unit,
            unitPrice: item.unitPrice?.toString() || '0',
            costPrice: item.costPrice?.toString() || '0',
            quantity: item.quantity?.toString() || '0',
            width: item.width?.toString() || null,
            height: item.height?.toString() || null,
            foldRatio: item.foldRatio?.toString() || null,
            processFee: item.processFee?.toString() || null,
            subtotal: item.subtotal?.toString() || '0',
            remark: item.remark,
            attributes: item.attributes,
            calculationParams: item.calculationParams,
            sortOrder: item.sortOrder,
            createdAt: new Date(),
          }));

          await tx.insert(quoteItems).values(childData);
        }
      }

      return { ...newQuote, rootQuoteId: newQuote.id };
    });
  }

  /**
   * 获取某一系列报价单的完整版本演进历史谱系。
   * 将基于最初始的 Root Quote 获取所有同簇系下相关变体清单，按照高低版本递减排列。
   *
   * @param rootQuoteId - 当前报价单链系的根元祖 ID 获取源
   * @param tenantId - 租户级数据隔离安全要求的强匹配参数
   * @returns 版本号从新到老倒序排列的所有挂属报价单快照详情数组
   */
  static async getQuoteHistory(rootQuoteId: string, tenantId: string) {
    return await db.query.quotes.findMany({
      where: and(eq(quotes.rootQuoteId, rootQuoteId), eq(quotes.tenantId, tenantId)),
      orderBy: (q, { desc }) => [desc(q.version)],
      with: {
        creator: true,
      },
    });
  }
}
