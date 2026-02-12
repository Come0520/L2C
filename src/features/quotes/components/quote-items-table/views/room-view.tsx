'use client';

import { Table, TableBody, TableRow, TableCell } from '@/shared/ui/table';
import { QuoteRoomAccordion } from '../../quote-room-accordion';
import { QuoteInlineAddRow } from '../../quote-inline-add-row';
import { RoomSelectorWithConfig } from '../../room-selector-popover';
import { QuoteTableHeader } from '../table-header';
import { QuoteItemRow } from '../quote-item-row';
import type { QuoteItem, RoomData, ColumnVisibility, CalcResult } from '../types';
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
  handleAddAccessory: (parentId: string, roomId: string | null) => Promise<void>;
  handleProductSelect: (id: string, product: ProductSearchResult) => Promise<void>;
  handleClientCalc: CalcHandler;
  handleAdvancedEdit: (item: QuoteItem) => void;
  handleToggleRoom: (roomId: string) => void;
  handleToggleItem: (itemId: string) => void;
  handleRoomRename: (id: string, name: string) => Promise<void>;
  handleDeleteRoom: (id: string) => Promise<void>;
  getRoomSubtotal: (roomId: string) => number;
  allowedCategories?: string[];
}

export function RoomView({
  quoteId,
  rooms,
  items: _items,
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
  handleAddAccessory,
  handleProductSelect,
  handleClientCalc,
  handleAdvancedEdit,
  handleToggleRoom,
  handleToggleItem,
  handleRoomRename,
  handleDeleteRoom,
  getRoomSubtotal,
  allowedCategories,
}: RoomViewProps) {
  const columnCount =
    2 +
    (showWidth || showHeight ? 1 : 0) +
    (showFold ? 1 : 0) +
    (showProcessFee ? 1 : 0) +
    (showQuantity ? 1 : 0) +
    (showUnit ? 1 : 0) +
    (showUnitPrice ? 1 : 0) +
    (showAmount ? 1 : 0) +
    (showRemark ? 1 : 0);

  const renderRows = (nodes: QuoteItem[], level = 0): React.ReactNode => {
    return nodes.map((item) => {
      const isItemExpanded = expandedItemIds.has(item.id);
      return (
        <QuoteItemRow
          key={item.id}
          item={item}
          level={level}
          readOnly={readOnly}
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
          handleAddAccessory={handleAddAccessory}
          handleProductSelect={handleProductSelect}
          handleClientCalc={handleClientCalc}
          handleAdvancedEdit={handleAdvancedEdit}
          onToggleExpand={() => handleToggleItem(item.id)}
          renderChildren={renderRows}
        />
      );
    });
  };

  return (
    <>
      {(rooms.length > 0 || itemsByRoom.unassigned.length > 0) && !readOnly && onAddRoom && (
        <div className="flex justify-start">
          <RoomSelectorWithConfig onSelect={onAddRoom} align="start" />
        </div>
      )}

      {rooms.map((room) => {
        const isExpanded = expandedRoomIds.has(room.id);
        const roomItemCount = (itemsByRoom.mapping[room.id] || []).length;
        const roomSubtotal = getRoomSubtotal(room.id);

        return (
          <QuoteRoomAccordion
            key={room.id}
            room={{
              id: room.id,
              name: room.name,
              itemCount: roomItemCount,
              subtotal: roomSubtotal,
            }}
            isExpanded={isExpanded}
            onToggle={handleToggleRoom}
            readOnly={readOnly}
            onRename={handleRoomRename}
            onDelete={handleDeleteRoom}
          >
            <div className="overflow-x-auto">
              <Table>
                <QuoteTableHeader
                  showWidth={showWidth}
                  showHeight={showHeight}
                  showFold={showFold}
                  showProcessFee={showProcessFee}
                  showQuantity={showQuantity}
                  showUnit={showUnit}
                  showUnitPrice={showUnitPrice}
                  showAmount={showAmount}
                  showRemark={showRemark}
                  showImage={showImage}
                />
                <TableBody>
                  {itemsByRoom.mapping[room.id]?.length > 0 ? (
                    renderRows(itemsByRoom.mapping[room.id])
                  ) : (
                    <TableRow>
                      <TableCell
                        colSpan={9}
                        className="text-muted-foreground h-16 border-none py-4 text-center italic"
                      >
                        此空间暂无明细，请添加商品
                      </TableCell>
                    </TableRow>
                  )}
                  <QuoteInlineAddRow
                    quoteId={quoteId}
                    roomId={room.id}
                    onSuccess={undefined}
                    readOnly={readOnly}
                    showFold={showFold}
                    showProcessFee={showProcessFee}
                    showRemark={showRemark}
                    showWidth={showWidth}
                    showHeight={showHeight}
                    showUnit={showUnit}
                    allowedCategories={allowedCategories}
                  />
                </TableBody>
              </Table>
            </div>
          </QuoteRoomAccordion>
        );
      })}

      {itemsByRoom.unassigned.length > 0 && (
        <div className="glass-table overflow-hidden shadow-sm">
          <div className="glass-section-header bg-amber-500/10 px-4 py-2 dark:bg-amber-500/10">
            <span className="text-sm font-semibold text-amber-700 dark:text-amber-400">
              未分配空间商品
            </span>
          </div>
          <div className="overflow-x-auto">
            <Table>
              <QuoteTableHeader
                showWidth={showWidth}
                showHeight={showHeight}
                showFold={showFold}
                showProcessFee={showProcessFee}
                showQuantity={showQuantity}
                showUnit={showUnit}
                showUnitPrice={showUnitPrice}
                showAmount={showAmount}
                showRemark={showRemark}
                showImage={showImage}
              />
              <TableBody>{renderRows(itemsByRoom.unassigned)}</TableBody>
            </Table>
          </div>
        </div>
      )}
    </>
  );
}
