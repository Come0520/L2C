'use client';

import { Table, TableBody } from '@/shared/ui/table';
import { Badge } from '@/shared/ui/badge';
import { CATEGORY_LABELS } from '@/features/quotes/constants';
import { QuoteTableHeader } from '../table-header';
import { QuoteItemRow } from '../quote-item-row';
import type { QuoteItem, ColumnVisibility, CalcResult } from '../types';
import type { ProductSearchResult } from '@/features/quotes/actions/product-actions';

type CalcHandler = (
  item: QuoteItem,
  field: string,
  value: number
) => { quantity: number; calcResult?: CalcResult } | number | null;

interface CategoryViewProps extends ColumnVisibility {
  items: QuoteItem[];
  readOnly: boolean;
  expandedItemIds: Set<string>;
  handleUpdate: (id: string, data: Record<string, unknown>) => Promise<void>;
  handleDelete: (id: string) => Promise<void>;
  handleAddAccessory: (parentId: string, roomId: string | null) => Promise<void>;
  handleProductSelect: (id: string, product: ProductSearchResult) => Promise<void>;
  handleClientCalc: CalcHandler;
  handleAdvancedEdit: (item: QuoteItem) => void;
  handleToggleItem: (itemId: string) => void;
}

export function CategoryView({
  items,
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
}: CategoryViewProps) {
  const itemsByCategory: Record<string, QuoteItem[]> = {};
  items.forEach((item) => {
    const cat = item.category || 'OTHER';
    if (!itemsByCategory[cat]) itemsByCategory[cat] = [];
    itemsByCategory[cat].push(item);
  });

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
              <TableBody>{renderRows(categoryItems)}</TableBody>
            </Table>
          </div>
        </div>
      ))}
    </div>
  );
}
