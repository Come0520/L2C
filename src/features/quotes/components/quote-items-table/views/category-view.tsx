'use client';

import React, { Fragment, useMemo } from 'react';
import { Table, TableBody, TableRow, TableCell } from '@/shared/ui/table';
import { QuoteTableHeader } from '../table-header';
import { QuoteItemRow } from '../quote-item-row';
import { QuoteInlineAddRow } from '../../quote-inline-add-row';
import { RoomSelectorWithConfig } from '../../room-selector-popover';
import { useRowSpanCalc } from '../use-rowspan-calc';
import type { ColumnVisibility, CalcResult, RoomData } from '../types';
import type { QuoteItem } from '@/shared/api/schema/quotes';
import type { ProductSearchResult } from '@/features/quotes/actions/product-actions';

type CalcHandler = (
  item: QuoteItem,
  field: string,
  value: number
) => { quantity: number; calcResult?: CalcResult } | number | null;

interface CategoryViewProps extends ColumnVisibility {
  quoteId: string;
  rooms?: RoomData[];
  items: QuoteItem[];
  allowedCategories?: string[];
  readOnly: boolean;
  expandedItemIds: Set<string>;
  handleUpdate: (id: string, data: Record<string, unknown>) => Promise<void>;
  handleDelete: (id: string) => Promise<void>;

  handleProductSelect: (id: string, product: ProductSearchResult) => Promise<void>;
  handleClientCalc: CalcHandler;
  handleAddAccessory: (parentId: string, roomId: string | null) => Promise<void>;
  handleToggleItem: (id: string) => void;
  handleToggleRoom: (id: string) => void;
  expandedRoomIds: Set<string>;
  onAddRoom?: (name: string) => void;
  onRowClick?: (item: QuoteItem) => void;
  /** 高级配置按鈕回调（URL 驱动模式下传入） */
  onAdvancedEdit?: (item: QuoteItem) => void;
}

export const CategoryView = React.memo(function CategoryView({
  quoteId,
  rooms = [],
  items,
  allowedCategories,
  readOnly,
  showImage,
  showWidth,
  showHeight,
  showFold,
  showProcessFee,
  showQuantity,
  showUnit,
  showUnitPrice,
  showAmount,
  showRemark,
  expandedItemIds,
  handleUpdate,
  handleDelete,

  handleProductSelect,
  handleClientCalc,
  handleAddAccessory,
  handleToggleItem,
  handleToggleRoom,
  expandedRoomIds,
  onAddRoom,
  onRowClick,
  onAdvancedEdit,
}: CategoryViewProps) {
  /**
   * 按空间分组：将扁平 items 列表按 roomId 归入对应空间
   * 逻辑与 RoomView 保持一致
   */
  const itemsByRoom = useMemo(() => {
    const mapping: Record<string, QuoteItem[]> = {};
    const unassigned: QuoteItem[] = [];

    // 初始化每个空间的数组
    rooms.forEach((r) => {
      mapping[r.id] = [];
    });

    items.forEach((item) => {
      if (item.parentId) return; // 附件由父商品的 children 属性承载，不单独分组
      if (item.roomId && mapping[item.roomId]) {
        mapping[item.roomId].push(item);
      } else {
        unassigned.push(item);
      }
    });

    return { mapping, unassigned };
  }, [items, rooms]);

  /**
   * RowSpan 计算：与 RoomView 完全一致
   */
  const rowSpanMap = useRowSpanCalc(rooms, itemsByRoom.mapping, expandedItemIds, readOnly);

  /** 总列数 */
  const columnCount =
    1 + // 商品列
    (showImage ? 1 : 0) +
    (showWidth || showHeight ? 1 : 0) +
    (showFold ? 1 : 0) +
    (showProcessFee ? 1 : 0) +
    (showQuantity ? 1 : 0) +
    (showUnit ? 1 : 0) +
    (showUnitPrice ? 1 : 0) +
    (showAmount ? 1 : 0) +
    (showRemark ? 1 : 0) +
    1; // 操作列

  /** 递归渲染商品行及其附件行 */
  const renderRows = (nodes: QuoteItem[], level = 0, roomName?: string): React.ReactNode => {
    return nodes.map((item) => {
      const isItemExpanded = expandedItemIds.has(item.id);
      const rowSpanInfo = rowSpanMap.get(item.id);

      return (
        <QuoteItemRow
          key={item.id}
          item={item}
          level={level}
          readOnly={readOnly}
          roomName={roomName}
          rowSpanInfo={rowSpanInfo}
          showImage={showImage}
          showWidth={showWidth}
          showHeight={showHeight}
          showFold={showFold}
          showProcessFee={showProcessFee}
          showQuantity={showQuantity}
          showUnit={showUnit}
          showUnitPrice={showUnitPrice}
          showAmount={showAmount}
          showRemark={showRemark}
          isExpanded={isItemExpanded}
          colSpan={columnCount}
          handleUpdate={handleUpdate}
          handleDelete={handleDelete}
          hideRoomColumn
          handleProductSelect={handleProductSelect}
          handleClientCalc={handleClientCalc}
          handleAddAccessory={handleAddAccessory}
          onToggleExpand={() => handleToggleItem(item.id)}
          renderChildren={(children, childLevel) => renderRows(children, childLevel, roomName)}
          onRowClick={onRowClick}
          onAdvancedEdit={onAdvancedEdit}
        />
      );
    });
  };

  const hasRooms = rooms.length > 0;

  return (
    <div className="space-y-4">
      {/* 顶部添加空间按钮 */}
      {hasRooms && !readOnly && onAddRoom && (
        <div className="flex justify-start">
          <RoomSelectorWithConfig onSelect={onAddRoom} align="start" />
        </div>
      )}

      {/* 空状态：无空间且无商品 */}
      {!hasRooms && items.length === 0 && (
        <div className="glass-empty-state text-muted-foreground py-12 text-center">
          <p className="text-sm">暂无报价明细</p>
          <p className="mt-1 text-xs opacity-60">请先添加空间，再在空间内添加商品</p>
          {!readOnly && onAddRoom && (
            <div className="mt-4">
              <RoomSelectorWithConfig onSelect={onAddRoom} align="center" />
            </div>
          )}
        </div>
      )}

      {/* 主体：按空间分块显示 */}
      {(hasRooms || items.length > 0) && (
        <div className="space-y-6">
          {rooms.map((room) => {
            const roomItems = itemsByRoom.mapping[room.id] || [];
            const isExpanded = expandedRoomIds.has(room.id);

            return (
              <div
                key={room.id}
                className="glass-table border-border/50 overflow-hidden rounded-xl border shadow-sm"
              >
                <div
                  className="bg-muted/30 hover:bg-muted/50 flex cursor-pointer items-center justify-between border-b px-4 py-3 transition-colors"
                  onClick={() => handleToggleRoom(room.id)}
                >
                  <div className="flex items-center gap-2 text-base font-semibold">
                    <span className="text-muted-foreground mr-1">{isExpanded ? '▼' : '▶'}</span>
                    {room.name}
                  </div>
                </div>

                {isExpanded && (
                  <div className="overflow-x-auto">
                    <Table>
                      <QuoteTableHeader
                        hideRoomColumn
                        showImage={showImage}
                        showWidth={showWidth}
                        showHeight={showHeight}
                        showFold={showFold}
                        showProcessFee={showProcessFee}
                        showQuantity={showQuantity}
                        showUnit={showUnit}
                        showUnitPrice={showUnitPrice}
                        showAmount={showAmount}
                        showRemark={showRemark}
                      />
                      <TableBody>
                        {roomItems.length > 0 ? (
                          renderRows(roomItems, 0)
                        ) : (
                          // 空空间占位行
                          <TableRow key={`empty-${room.id}`}>
                            <TableCell
                              colSpan={columnCount}
                              className="text-muted-foreground border-b py-8 text-center text-xs italic"
                            >
                              此空间暂无明细，请添加商品
                            </TableCell>
                          </TableRow>
                        )}

                        {/* 添加商品行 */}
                        {!readOnly && (
                          <QuoteInlineAddRow
                            quoteId={quoteId}
                            roomId={room.id}
                            category={allowedCategories?.[0] || 'CURTAIN_CUSTOM'}
                            allowedCategories={allowedCategories}
                            showImage={showImage}
                            showWidth={showWidth}
                            showHeight={showHeight}
                            showFold={showFold}
                            showProcessFee={showProcessFee}
                            showRemark={showRemark}
                            showUnit={showUnit}
                          />
                        )}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </div>
            );
          })}

          {/* 未分配商品（兼容旧数据） */}
          {itemsByRoom.unassigned.length > 0 && (
            <div className="glass-table overflow-hidden rounded-xl border border-amber-500/20 shadow-sm">
              <div className="glass-section-header border-b border-amber-500/20 bg-amber-500/10 px-4 py-2 dark:bg-amber-500/10">
                <span className="text-sm font-semibold text-amber-700 dark:text-amber-400">
                  未分配空间商品（请将商品移至具体空间）
                </span>
              </div>
              <div className="overflow-x-auto">
                <Table>
                  <QuoteTableHeader
                    hideRoomColumn
                    showImage={showImage}
                    showWidth={showWidth}
                    showHeight={showHeight}
                    showFold={showFold}
                    showProcessFee={showProcessFee}
                    showQuantity={showQuantity}
                    showUnit={showUnit}
                    showUnitPrice={showUnitPrice}
                    showAmount={showAmount}
                    showRemark={showRemark}
                  />
                  <TableBody>{renderRows(itemsByRoom.unassigned, 0)}</TableBody>
                </Table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 底部添加空间入口 */}
      {!readOnly && onAddRoom && hasRooms && (
        <div className="border-muted bg-muted/20 hover:bg-muted/40 mt-4 flex items-center justify-center rounded-xl border-2 border-dashed p-6 transition-colors">
          <RoomSelectorWithConfig onSelect={onAddRoom} align="center" />
        </div>
      )}
    </div>
  );
});
