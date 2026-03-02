'use client';

import React, { Fragment, useMemo } from 'react';
import { Table, TableBody, TableRow, TableCell } from '@/shared/ui/table';
import { QuoteInlineAddRow } from '../../quote-inline-add-row';
import { RoomSelectorWithConfig } from '../../room-selector-popover';
import { QuoteTableHeader } from '../table-header';
import { QuoteItemRow } from '../quote-item-row';
import { useRowSpanCalc } from '../use-rowspan-calc';
import type { RoomData, ColumnVisibility, CalcResult } from '../types';
import type { QuoteItem } from '@/shared/api/schema/quotes';
import type { ProductSearchResult } from '@/features/quotes/actions/product-actions';

type CalcHandler = (
  item: QuoteItem,
  field: string,
  value: number
) => { quantity: number; calcResult?: CalcResult } | number | null;

interface RoomViewProps extends ColumnVisibility {
  quoteId: string;
  rooms: RoomData[];
  items: QuoteItem[];
  itemsByRoom: { mapping: Record<string, QuoteItem[]>; unassigned: QuoteItem[] };
  readOnly: boolean;
  expandedRoomIds: Set<string>;
  expandedItemIds: Set<string>;
  onAddRoom?: (name: string) => void;
  handleUpdate: (id: string, data: Record<string, unknown>) => Promise<void>;
  handleDelete: (id: string) => Promise<void>;

  handleProductSelect: (id: string, product: ProductSearchResult) => Promise<void>;
  handleClientCalc: CalcHandler;
  handleAddAccessory: (parentId: string, roomId: string | null) => Promise<void>;
  handleToggleItem: (itemId: string) => void;
  handleToggleRoom: (roomId: string) => void;
  handleRoomRename: (id: string, name: string) => Promise<void>;
  handleDeleteRoom: (id: string) => Promise<void>;
  getRoomSubtotal: (roomId: string) => number;
  allowedCategories?: string[];
  onRowClick?: (item: QuoteItem) => void;
}

export const RoomView = React.memo(function RoomView({
  quoteId,
  rooms,
  itemsByRoom,
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
  expandedRoomIds,
  expandedItemIds,
  onAddRoom,
  handleUpdate,
  handleDelete,

  handleProductSelect,
  handleClientCalc,
  handleAddAccessory,
  handleToggleItem,
  handleToggleRoom,
  allowedCategories,
  onRowClick,
  getRoomSubtotal,
}: RoomViewProps) {
  /**
   * 将 itemsByRoom.mapping 转换为 useRowSpanCalc 所需的格式
   * （只包含 root items，附件作为 children）
   */
  const itemsByRoomForCalc = useMemo(() => itemsByRoom.mapping, [itemsByRoom.mapping]);

  /**
   * 计算每行的 RowSpan 信息：
   *   - roomRowSpan / isRoomFirstRow → 空间列合并
   *   - productRowSpan / isProductFirstRow → 图片列合并
   *   - roomSubtotal → 空间小计
   *   - roomIndex → 交替背景色
   */
  const rowSpanMap = useRowSpanCalc(rooms, itemsByRoomForCalc, expandedItemIds, readOnly);

  /** 总列数（用于 expand 行的 colSpan） */
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
        />
      );
    });
  };

  return (
    <>
      {/* 顶部添加空间按钮 */}
      {rooms.length > 0 && !readOnly && onAddRoom && (
        <div className="flex justify-start">
          <RoomSelectorWithConfig onSelect={onAddRoom} align="start" />
        </div>
      )}

      {/* 空状态提示（无空间且无未分配商品） */}
      {rooms.length === 0 && itemsByRoom.unassigned.length === 0 && (
        <div className="glass-empty-state text-muted-foreground py-12 text-center">
          <p className="text-sm">暂无报价文件明细</p>
          <p className="mt-1 text-xs opacity-60">请先添加空间，再在空间内添加商品</p>
          {!readOnly && onAddRoom && (
            <div className="mt-4">
              <RoomSelectorWithConfig onSelect={onAddRoom} align="center" />
            </div>
          )}
        </div>
      )}

      {/* 主体：按空间分块显示 */}
      {rooms.length > 0 && (
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
                  <div className="text-primary font-bold">
                    ¥{getRoomSubtotal(room.id).toFixed(2)}
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
                        {/* 渲染该空间下的所有商品行（含附件） */}
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

                        {/* 每个空间底部的添加商品行 */}
                        {!readOnly && (
                          <QuoteInlineAddRow
                            quoteId={quoteId}
                            roomId={room.id}
                            category={allowedCategories?.[0]}
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
        </div>
      )}

      {/* 未分配商品（临时兼容，后续将强制绑定空间） */}
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

      {/* 底部添加空间入口 */}
      {!readOnly && onAddRoom && rooms.length > 0 && (
        <div className="border-muted bg-muted/20 hover:bg-muted/40 mt-4 flex items-center justify-center rounded-xl border-2 border-dashed p-6 transition-colors">
          <RoomSelectorWithConfig onSelect={onAddRoom} align="center" />
        </div>
      )}
    </>
  );
});
