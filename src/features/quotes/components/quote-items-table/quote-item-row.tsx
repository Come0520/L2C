'use client';

import { memo } from 'react';
import { TableRow } from '@/shared/ui/table';
import { Input } from '@/shared/ui/input';
import { TableCell } from '@/shared/ui/table';
import { cn } from '@/shared/lib/utils';
import { QuoteItemExpandRow } from '../quote-item-expand-row';
import {
  ProductNameCell,
  DimensionCell,
  QuantityCell,
  FoldRatioCell,
  ProcessFeeCell,
  UnitCell,
  UnitPriceCell,
  AmountCell,
  RemarkCell,
  ItemActionsCell,
  ImageCell,
} from './cells';
import type { QuoteItem, CalcResult, ColumnVisibility } from './types';
import type { ProductSearchResult } from '@/features/quotes/actions/product-actions';

type CalcHandler = (
  item: QuoteItem,
  field: string,
  value: number
) => { quantity: number; calcResult?: CalcResult } | number | null;

interface QuoteItemRowProps extends ColumnVisibility {
  item: QuoteItem;
  level: number;
  readOnly: boolean;
  roomName?: string;
  isExpanded: boolean;
  colSpan: number;
  handleUpdate: (id: string, data: Record<string, unknown>) => Promise<void>;
  handleDelete: (id: string) => Promise<void>;
  handleAddAccessory: (parentId: string, roomId: string | null) => Promise<void>;
  handleProductSelect: (id: string, product: ProductSearchResult) => Promise<void>;
  handleClientCalc: CalcHandler;
  handleAdvancedEdit: (item: QuoteItem) => void;
  onToggleExpand: () => void;
  renderChildren: (nodes: QuoteItem[], level: number) => React.ReactNode;
  onRowClick?: (item: QuoteItem) => void;
}

export const QuoteItemRow = memo(function QuoteItemRow({
  item,
  level,
  readOnly,
  roomName,
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
  isExpanded,
  colSpan,
  handleUpdate,
  handleDelete,
  handleAddAccessory,
  handleProductSelect,
  handleClientCalc,
  handleAdvancedEdit,
  onToggleExpand,
  renderChildren,
  onRowClick,
}: QuoteItemRowProps) {
  const isCurtain = ['CURTAIN', 'CURTAIN_FABRIC', 'CURTAIN_SHEER'].includes(item.category);
  const isAccessory = item.category === 'CURTAIN_ACCESSORY';

  const middleSectionColSpan =
    (showWidth || showHeight ? 1 : 0) + (showFold ? 1 : 0) + (showProcessFee ? 1 : 0);

  return (
    <>
      <TableRow
        key={item.id}
        className={cn(
          'glass-row-hover transition-all duration-200 cursor-pointer',
          level > 0 ? 'bg-white/5 hover:bg-white/10' : 'hover:bg-white/5'
        )}
        onClick={(e) => {
          // Prevent triggering when clicking on interactive elements
          if (
            e.target instanceof HTMLElement &&
            (e.target.closest('button') || e.target.closest('input'))
          ) {
            return;
          }
          onRowClick?.(item);
        }}
      >
        <ProductNameCell
          item={item}
          level={level}
          readOnly={readOnly}
          showImage={showImage}
          roomName={roomName}
          onProductSelect={handleProductSelect}
        />

        {showImage && <ImageCell item={item} />}

        {isAccessory && middleSectionColSpan > 0 ? (
          <TableCell colSpan={middleSectionColSpan} className="p-2">
            <Input
              disabled={readOnly}
              className="h-8 w-full bg-transparent/50 px-2 text-xs"
              defaultValue={item.remark || ''}
              placeholder="附件备注 (如：需要对花、加长)"
              onBlur={(e) => handleUpdate(item.id, { remark: e.target.value })}
            />
          </TableCell>
        ) : (
          <>
            {(showWidth || showHeight) && (
              <DimensionCell
                item={item}
                readOnly={readOnly}
                showWidth={showWidth}
                showHeight={showHeight}
                onUpdate={handleUpdate}
                onClientCalc={handleClientCalc}
              />
            )}

            {showFold && (
              <FoldRatioCell
                item={item}
                readOnly={readOnly}
                onUpdate={handleUpdate}
                onClientCalc={handleClientCalc}
              />
            )}

            {showProcessFee && (
              <ProcessFeeCell item={item} readOnly={readOnly} onUpdate={handleUpdate} />
            )}
          </>
        )}

        {showQuantity && <QuantityCell item={item} readOnly={readOnly} onUpdate={handleUpdate} />}

        {showUnit && <UnitCell item={item} readOnly={readOnly} onUpdate={handleUpdate} />}

        {showUnitPrice && <UnitPriceCell item={item} readOnly={readOnly} onUpdate={handleUpdate} />}

        {showAmount && <AmountCell item={item} />}

        {showRemark && (!isAccessory || middleSectionColSpan === 0) && (
          <RemarkCell item={item} readOnly={readOnly} onUpdate={handleUpdate} />
        )}

        <ItemActionsCell
          level={level}
          isCurtain={isCurtain}
          isExpanded={isExpanded}
          readOnly={readOnly}
          onAddAccessory={() => handleAddAccessory(item.id, item.roomId)}
          onToggleExpand={onToggleExpand}
          onAdvancedEdit={() => handleAdvancedEdit(item)}
          onDelete={() => handleDelete(item.id)}
        />
      </TableRow>

      {level === 0 && isExpanded && (
        <QuoteItemExpandRow
          itemId={item.id}
          productName={item.productName || ''}
          category={item.category}
          attributes={item.attributes || {}}
          foldRatio={Number(item.foldRatio) || 2}
          processFee={Number(item.processFee) || 0}
          remark={item.remark || undefined}
          attachments={[]}
          readOnly={readOnly}
          isExpanded={isExpanded}
          onToggle={onToggleExpand}
          onSave={() => { }}
          colSpan={colSpan}
        />
      )}

      {item.children && item.children.length > 0 && renderChildren(item.children, level + 1)}
    </>
  );
});
