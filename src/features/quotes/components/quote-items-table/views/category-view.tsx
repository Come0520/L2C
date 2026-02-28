'use client';

import { Table, TableBody } from '@/shared/ui/table';
import { Badge } from '@/shared/ui/badge';
import { CATEGORY_LABELS } from '@/features/quotes/constants';
import { QuoteTableHeader } from '../table-header';
import { QuoteItemRow } from '../quote-item-row';
import { QuoteInlineAddRow } from '../../quote-inline-add-row';
import type { QuoteItem, ColumnVisibility, CalcResult, RoomData } from '../types';
import type { ProductSearchResult } from '@/features/quotes/actions/product-actions';
import { RoomSelectorWithConfig } from '../../room-selector-popover';

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
  handleAddAccessory: (parentId: string, roomId: string | null) => Promise<void>;
  handleProductSelect: (id: string, product: ProductSearchResult) => Promise<void>;
  handleClientCalc: CalcHandler;
  handleAdvancedEdit: (item: QuoteItem) => void;
  handleToggleItem: (itemId: string) => void;
  onAddRoom?: (name: string) => void;
  onRowClick?: (item: QuoteItem) => void;
}

export function CategoryView({
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
  handleAddAccessory,
  handleProductSelect,
  handleClientCalc,
  handleAdvancedEdit,
  handleToggleItem,
  onAddRoom,
  onRowClick,
}: CategoryViewProps) {
  const itemsByCategory: Record<string, QuoteItem[]> = {};
  items.forEach((item) => {
    const cat = item.category || 'OTHER';
    if (!itemsByCategory[cat]) itemsByCategory[cat] = [];
    itemsByCategory[cat].push(item);
  });

  const columnCount =
    2 +
    (showImage ? 1 : 0) +
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
      const room = rooms.find((r) => r.id === item.roomId);
      return (
        <QuoteItemRow
          key={item.id}
          item={item}
          level={level}
          readOnly={readOnly}
          showImage={showImage}
          roomName={room?.name}
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
          onRowClick={onRowClick}
        />
      );
    });
  };

  return (
    <div className="space-y-6">
      {Object.entries(itemsByCategory).map(([category, categoryItems]) => (
        <div key={category} className="space-y-2">
          <div className="flex items-center gap-2 px-1">
            <h3 className="text-base font-semibold">{CATEGORY_LABELS[category] || category}</h3>
            <Badge variant="secondary" className="text-xs">
              {categoryItems.length} 项
            </Badge>
          </div>
          <div className="glass-table overflow-hidden rounded-lg">
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
                {renderRows(categoryItems)}
                {!readOnly && (
                  <QuoteInlineAddRow
                    quoteId={quoteId}
                    roomId={null}
                    rooms={rooms}
                    onSuccess={undefined}
                    readOnly={readOnly}
                    showFold={showFold}
                    showProcessFee={showProcessFee}
                    showRemark={showRemark}
                    showWidth={showWidth}
                    showHeight={showHeight}
                    showUnit={showUnit}
                    showImage={showImage}
                    allowedCategories={allowedCategories || [category]}
                  />
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      ))}
      {!readOnly && onAddRoom && (
        <div className="pt-4 border-t border-dashed flex justify-center">
          <RoomSelectorWithConfig
            onSelect={(name) => {
              onAddRoom(name);
            }}
            size="default"
          />
        </div>
      )}
    </div>
  );
}
