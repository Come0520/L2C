import { db } from '@/shared/api/db';
import { quotes, quoteItems, quoteRooms } from '@/shared/api/schema/quotes';
import { measureSheets } from '@/shared/api/schema/service';
import { eq, and } from 'drizzle-orm';
import { updateQuoteTotal } from '@/features/quotes/actions/shared-helpers';

/**
 * 粗略定义的测量明细项结构
 */
export interface MeasureItemRecord {
  id?: string;
  roomName?: string;
  windowType?: string;
  width?: string | number;
  height?: string | number;
  [key: string]: unknown;
}

/**
 * 带有匹配标记的报价单明细项
 */
type QuoteItemWithMatched = typeof quoteItems.$inferSelect & { _matched?: boolean };

/**
 * 定义导入动作的结构
 */
export interface ImportAction {
  /** 动作类型 */
  type: 'CREATE_ROOM' | 'CREATE_ITEM' | 'UPDATE_ITEM';
  /** 动作的详细说明文字 */
  description: string;
  /** 动作关联的具体数据载荷 */
  data: Record<string, unknown>;
  /** 源测量项目原始数据 */
  measureItem: Record<string, unknown>;
  /** 如果是更新，记录差异字段信息 */
  diff?: { field: string; oldValue: unknown; newValue: unknown }[];
}

/**
 * 测量数据导入预览结果
 */
export interface ImportPreviewResult {
  /** 生成的动作指令列表 */
  actions: ImportAction[];
  /** 各类动作的汇总计数 */
  summary: { created: number; updated: number; ignored: number };
}

/**
 * 报价单导入服务
 * 专门处理外部测绘数据到系统内置报价单明细的数据解析与自动匹配校准。
 */
export class QuoteImportService {
  /**
   * 预览测量表向指定报价单导入的数据变动情况。
   * 比较现有明细与测绘数据，生成新增空间、新增明细或更新尺寸的待办指令。
   *
   * @param quoteId - 接收导入的目标报价单ID
   * @param measureTaskId - 提供数据源的测量任务单ID
   * @param tenantId - 操作者的租户ID，用于安全的数据隔离
   * @returns 预览生成的比对结果，包含即将执行的 actions 和结果统计 summary
   * @throws {Error} 若报价单不存在、无权限或测量单未找到则抛出此异常
   *
   * @example
   * const preview = await QuoteImportService.previewMeasurementImport(qId, mId, tId);
   */
  static async previewMeasurementImport(
    quoteId: string,
    measureTaskId: string,
    tenantId: string
  ): Promise<ImportPreviewResult> {
    const quote = await db.query.quotes.findFirst({
      where: and(eq(quotes.id, quoteId), eq(quotes.tenantId, tenantId)),
      with: {
        rooms: {
          with: {
            items: true,
          },
        },
        items: true,
      },
    });

    if (!quote) throw new Error('Quote not found or access denied');

    const measureSheet = await db.query.measureSheets.findFirst({
      where: eq(measureSheets.taskId, measureTaskId),
      with: {
        items: true,
      },
      orderBy: (sheets, { desc }) => [desc(sheets.createdAt)],
    });

    if (!measureSheet) throw new Error('Measurement sheet not found');

    const actions: ImportAction[] = [];
    const summary = { created: 0, updated: 0, ignored: 0 };

    /** 构造以房间名为 key 的明细分组映射表，便于快速匹配寻找 */
    const quoteMap = new Map<string, typeof quote.items>();
    quote.rooms.forEach((r) => {
      quoteMap.set(r.name, r.items);
    });

    for (const mItem of measureSheet.items) {
      const roomName = mItem.roomName;
      const existingRoomItems = quoteMap.get(roomName || '');

      if (!existingRoomItems) {
        actions.push({
          type: 'CREATE_ROOM',
          description: `创建新空间: ${roomName}`,
          data: { roomName: roomName },
          measureItem: mItem as unknown as Record<string, unknown>,
        });
        actions.push({
          type: 'CREATE_ITEM',
          description: `新增: ${mItem.windowType} (${mItem.width}x${mItem.height})`,
          data: this.mapMeasureItemToQuoteItem(mItem, quote.id, null),
          measureItem: mItem as unknown as Record<string, unknown>,
        });
        summary.created++;
        quoteMap.set(roomName || '', []);
        continue;
      }

      /** 在对应空间下寻找同大类或同名且尚未被标记匹配的现有明细项，作为尺寸更新的候选项 */
      const matchedQuoteItem = (existingRoomItems as QuoteItemWithMatched[]).find(
        (qItem) =>
          (qItem.productName === mItem.windowType ||
            qItem.category === this.mapWindowTypeToCategory(mItem.windowType || '')) &&
          !qItem._matched
      );

      if (matchedQuoteItem) {
        const qWidth = Number(matchedQuoteItem.width || 0);
        const qHeight = Number(matchedQuoteItem.height || 0);
        const mWidth = Number(mItem.width || 0);
        const mHeight = Number(mItem.height || 0);

        const hasDiff = Math.abs(qWidth - mWidth) > 5 || Math.abs(qHeight - mHeight) > 5;

        if (hasDiff) {
          actions.push({
            type: 'UPDATE_ITEM',
            description: `校准: ${roomName} - ${mItem.windowType}`,
            data: { id: matchedQuoteItem.id },
            measureItem: mItem as unknown as Record<string, unknown>,
            diff: [
              { field: 'width', oldValue: qWidth, newValue: mWidth },
              { field: 'height', oldValue: qHeight, newValue: mHeight },
            ],
          });
          summary.updated++;
        } else {
          summary.ignored++;
        }
        (matchedQuoteItem as QuoteItemWithMatched)._matched = true;
      } else {
        actions.push({
          type: 'CREATE_ITEM',
          description: `新增: ${roomName} - ${mItem.windowType}`,
          data: this.mapMeasureItemToQuoteItem(
            mItem,
            quote.id,
            quote.rooms.find((r) => r.name === roomName)?.id ?? null
          ),
          measureItem: mItem as unknown as Record<string, unknown>,
        });
        summary.created++;
      }
    }

    return { actions, summary };
  }

  /**
   * 正式执行由预览阶段生成的测量单导入指令。
   * 批量向数据库写入对应的房间及明细记录，并最终更新一次总价。
   *
   * @param quoteId - 待操作的目标报价单ID
   * @param actions - 预览步骤返回的安全动作指令集合
   * @param tenantId - 操作者的租户ID，用作越权防护校验
   * @returns 包含执行成功状态和成功处理的数据行数的对象
   * @throws {Error} 未找到相应的报价单时抛出
   *
   * @example
   * await QuoteImportService.executeMeasurementImport(qId, preview.actions, tId);
   */
  static async executeMeasurementImport(
    quoteId: string,
    actions: ImportAction[],
    tenantId: string
  ) {
    const quote = await db.query.quotes.findFirst({
      where: and(eq(quotes.id, quoteId), eq(quotes.tenantId, tenantId)),
      with: { rooms: true },
    });

    if (!quote) throw new Error('Quote not found or access denied');

    const results = [];
    /** 过滤并提取所有空间创建指令 */
    const roomActions = actions.filter((a) => a.type === 'CREATE_ROOM');
    /** 缓存新创建的空间信息，防止同一批次内对同名房间产生重复创建 */
    const createdRoomMap = new Map<string, string>();

    for (const action of roomActions) {
      const roomName = action.measureItem?.roomName as string;

      if (createdRoomMap.has(roomName) || quote.rooms.some((r) => r.name === roomName)) {
        const existing = quote.rooms.find((r) => r.name === roomName);
        if (existing) createdRoomMap.set(roomName, existing.id);
        continue;
      }

      const [newRoom] = await db
        .insert(quoteRooms)
        .values({
          quoteId: quoteId,
          name: roomName || '默认空间',
          tenantId: quote.tenantId,
          measureRoomId: (action.measureItem?.id as string) || null,
          createdAt: new Date(),
        })
        .returning();
      createdRoomMap.set(roomName, newRoom.id);
      results.push({ type: 'CREATE_ROOM', id: newRoom.id, name: roomName });
    }

    /** 过滤出所有的创建与更新商品条目的动作指令 */
    const itemActions = actions.filter((a) => a.type !== 'CREATE_ROOM');

    for (const action of itemActions) {
      if (action.type === 'CREATE_ITEM') {
        let roomId = action.data.roomId as string | undefined;
        const roomName = action.measureItem?.roomName as string | undefined;

        if (!roomId && roomName) {
          roomId = createdRoomMap.get(roomName);
          if (!roomId) {
            const existing = await db.query.quoteRooms.findFirst({
              where: and(eq(quoteRooms.quoteId, quoteId), eq(quoteRooms.name, roomName)),
            });
            if (existing) roomId = existing.id;
          }
        }

        if (roomId) {
          const [newItem] = await db
            .insert(quoteItems)
            .values({
              tenantId: quote.tenantId,
              quoteId: quoteId,
              roomId: roomId,
              category: (action.data.category as string) || 'CURTAIN_FABRIC',
              productName: (action.data.productName as string) || 'Unknown',
              unitPrice: action.data.unitPrice?.toString() || '0',
              quantity: action.data.quantity?.toString() || '1',
              subtotal: action.data.subtotal?.toString() || '0',
              width: action.data.width?.toString() || null,
              height: action.data.height?.toString() || null,
              attributes: (action.data.attributes as Record<string, unknown>) || {},
              createdAt: new Date(),
            })
            .returning();
          results.push({ type: 'CREATE_ITEM', id: newItem.id });
        }
      } else if (action.type === 'UPDATE_ITEM') {
        const mItem = action.measureItem as MeasureItemRecord;
        await db
          .update(quoteItems)
          .set({
            width: mItem.width?.toString(),
            height: mItem.height?.toString(),
          })
          .where(
            and(eq(quoteItems.id, action.data.id as string), eq(quoteItems.tenantId, tenantId))
          );
        results.push({ type: 'UPDATE_ITEM', id: action.data.id as string });
      }
    }

    await updateQuoteTotal(quoteId, tenantId);
    return { success: true, count: results.length };
  }

  /**
   * 将外部非标的测绘项数据统一映射转换为本系统的报价明细（Item）通用结构。
   *
   * @param mItem - 单条原始的测绘对象记录
   * @param quoteId - 它将被挂载的报价主表主键
   * @param roomId - 它所在的物理业务空间表主键（如有）
   * @returns 标准化后的报价商品记录对象
   */
  private static mapMeasureItemToQuoteItem(
    mItem: MeasureItemRecord,
    quoteId: string,
    roomId: string | null
  ) {
    return {
      quoteId,
      roomId,
      category: this.mapWindowTypeToCategory(mItem.windowType || ''),
      productName: mItem.windowType || 'Unknown',
      unit: '米',
      quantity: '1',
      width: mItem.width?.toString(),
      subtotal: '0',
      attributes: {
        installType: mItem.installType,
        wallMaterial: mItem.wallMaterial,
        bracketDist: mItem.bracketDist,
        hasBox: mItem.hasBox,
        boxDepth: mItem.boxDepth,
        isElectric: mItem.isElectric,
        remark: mItem.remark,
        segmentData: mItem.segmentData,
      },
    };
  }

  /**
   * 匹配处理测绘工具中的特色窗型为标准化的内部明细分类。
   *
   * @param windowType - 原始填报的外部窗型文本
   * @returns 系统中能够支持后续生命周期流转的统一 Category 值
   */
  private static mapWindowTypeToCategory(windowType: string): string {
    const typeMap: Record<string, string> = {
      CURTAIN: 'CURTAIN_FABRIC',
      ROLLER: 'CURTAIN_FABRIC',
      VENETIAN: 'CURTAIN_FABRIC',
      VERTICAL: 'CURTAIN_FABRIC',
      ROMAN: 'CURTAIN_FABRIC',
      PLEATED: 'CURTAIN_FABRIC',
      WALLPAPER: 'WALLPAPER',
      WALLCLOTH: 'WALLCLOTH',
      SHUTTER: 'SHUTTER',
    };
    return typeMap[windowType] || 'CURTAIN_FABRIC';
  }
}
