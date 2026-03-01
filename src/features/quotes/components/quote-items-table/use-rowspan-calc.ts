import { useMemo } from 'react';
import type { RoomData } from './types';
import type { QuoteItem as BaseQuoteItem } from '@/shared/api/schema/quotes';

type QuoteItem = BaseQuoteItem & { children?: QuoteItem[] };

/**
 * 每个报价项的 RowSpan 信息
 */
export interface RowSpanInfo {
  /** 空间列 rowSpan（该空间下所有行总数） */
  roomRowSpan: number;
  /** 是否是空间的第一行（需要渲染空间单元格） */
  isRoomFirstRow: boolean;
  /** 商品列 rowSpan（主商品 + 附件 + 展开行） */
  productRowSpan: number;
  /** 是否是商品组的第一行（需要渲染商品、图片单元格） */
  isProductFirstRow: boolean;
  /** 空间小计金额 */
  roomSubtotal: number;
  /** 空间索引（用于交替背景色） */
  roomIndex: number;
}

/**
 * 计算单个主商品的行数（含自身 + 附件 + 展开行）
 */
function calcProductRowCount(item: QuoteItem, expandedItemIds: Set<string>): number {
  const childCount = item.children?.length ?? 0;
  // 展开高级配置时增加 1 行（QuoteItemExpandRow 渲染为单个 <tr>）
  const expandCount = expandedItemIds.has(item.id) ? 1 : 0;
  return 1 + childCount + expandCount;
}

/**
 * RowSpan 动态计算 Hook
 *
 * 根据空间分组、商品树结构和展开状态，计算每个报价项的 rowSpan 信息。
 *
 * @param rooms - 空间列表
 * @param itemsByRoom - 按空间分组的商品树（已 buildTree）
 * @param expandedItemIds - 当前展开的商品 ID 集合
 * @returns Map<itemId, RowSpanInfo> — 每个报价项（含附件）的合并信息
 */
export function useRowSpanCalc(
  rooms: RoomData[],
  itemsByRoom: Record<string, QuoteItem[]>,
  expandedItemIds: Set<string>,
  readOnly: boolean = false
): Map<string, RowSpanInfo> {
  return useMemo(() => {
    const result = new Map<string, RowSpanInfo>();

    rooms.forEach((room, roomIndex) => {
      const rootItems = itemsByRoom[room.id] || [];

      // 1) 计算空间总行数
      let roomRowSpan = 1;
      const productSpans: { item: QuoteItem; span: number }[] = [];

      for (const item of rootItems) {
        const span = calcProductRowCount(item, expandedItemIds);
        productSpans.push({ item, span });
        roomRowSpan += span;
      }

      // 如果非只读，则预留一行给 AddRow（合并到空间 RowSpan）
      if (roomRowSpan === 0) {
        roomRowSpan = 1;
      } else if (!readOnly) {
        roomRowSpan += 1;
      }

      // 2) 计算空间小计
      const roomSubtotal = (itemsByRoom[room.id] || []).reduce((sum, item) => {
        // 主商品金额
        let total = sum + Number(item.subtotal || 0);
        // 附件金额
        if (item.children) {
          for (const child of item.children) {
            total += Number(child.subtotal || 0);
          }
        }
        return total;
      }, 0);

      // 3) 标记每个 item 的 RowSpanInfo
      let isFirstRoomRow = true;

      for (const { item, span } of productSpans) {
        // 主商品行
        result.set(item.id, {
          roomRowSpan: isFirstRoomRow ? roomRowSpan : 0,
          isRoomFirstRow: isFirstRoomRow,
          productRowSpan: span,
          isProductFirstRow: true,
          roomSubtotal,
          roomIndex,
        });
        isFirstRoomRow = false;

        // 附件行（不渲染空间和商品单元格，被 rowSpan 覆盖）
        if (item.children) {
          for (const child of item.children) {
            result.set(child.id, {
              roomRowSpan: 0,
              isRoomFirstRow: false,
              productRowSpan: 0,
              isProductFirstRow: false,
              roomSubtotal,
              roomIndex,
            });
          }
        }
      }
    });

    return result;
  }, [rooms, itemsByRoom, expandedItemIds, readOnly]);
}
