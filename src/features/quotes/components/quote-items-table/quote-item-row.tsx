'use client';

import { memo } from 'react';
import Image from 'next/image';
import { TableRow, TableCell } from '@/shared/ui/table';
import { Input } from '@/shared/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/shared/ui/popover';
import { cn } from '@/shared/lib/utils';
import { QuoteItemExpandRow } from '../quote-item-expand-row';
import {
  DimensionCell,
  QuantityCell,
  FoldRatioCell,
  ProcessFeeCell,
  UnitCell,
  UnitPriceCell,
  AmountCell,
  RemarkCell,
  ItemActionsCell,
  ProductNameCell,
} from './cells';
import type { CalcResult, ColumnVisibility } from './types';
import type { QuoteItem } from './types';
import type { RowSpanInfo } from './use-rowspan-calc';
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
  /** 空间名称（用于空间列显示） */
  roomName?: string;
  /** RowSpan 合并信息（由 useRowSpanCalc 提供） */
  rowSpanInfo?: RowSpanInfo;
  isExpanded: boolean;
  colSpan: number;
  handleUpdate: (id: string, data: Record<string, unknown>) => Promise<void>;
  handleDelete: (id: string) => Promise<void>;

  handleProductSelect: (id: string, product: ProductSearchResult) => Promise<void>;
  handleClientCalc: CalcHandler;
  handleAddAccessory: (parentId: string, roomId: string | null) => Promise<void>;
  onToggleExpand: () => void;
  renderChildren: (nodes: QuoteItem[], level: number) => React.ReactNode;
  onRowClick?: (item: QuoteItem) => void;
  /** 高级配置按鈕回调（URL 驱动模式下传入） */
  onAdvancedEdit?: (item: QuoteItem) => void;
}

export const QuoteItemRow = memo(function QuoteItemRow({
  item,
  level,
  readOnly,
  roomName,
  rowSpanInfo,
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
  hideRoomColumn,
  isExpanded,
  handleUpdate,
  handleDelete,

  handleProductSelect,
  handleClientCalc,
  handleAddAccessory,
  onToggleExpand,
  renderChildren,
  onRowClick,
  onAdvancedEdit,
}: QuoteItemRowProps) {
  const isCurtain = ['CURTAIN', 'CURTAIN_FABRIC', 'CURTAIN_SHEER'].includes(item.category);
  const isAccessory = item.category === 'CURTAIN_ACCESSORY';
  const productImage = item.attributes?.productImage as string | undefined;

  const middleSectionColSpan =
    (showWidth || showHeight ? 1 : 0) + (showFold ? 1 : 0) + (showProcessFee ? 1 : 0);

  const middleVisibleCount =
    middleSectionColSpan +
    (showQuantity ? 1 : 0) +
    (showUnit ? 1 : 0) +
    (showUnitPrice ? 1 : 0) +
    (showRemark && (!isAccessory || middleSectionColSpan === 0) ? 1 : 0);

  // 空间行交替背景色
  const roomBgClass =
    rowSpanInfo && rowSpanInfo.roomIndex % 2 === 0
      ? 'bg-slate-50/40 dark:bg-slate-800/20'
      : 'bg-blue-50/30 dark:bg-blue-900/10';

  const isCustomPanel = item.attributes?.openingStyle === 'CUSTOM';
  let drawerRowCount = 0;
  if (level === 0 && isExpanded) {
    if (isCurtain) {
      drawerRowCount = isCustomPanel ? 4 : 3;
    } else {
      // 非窗帘类展开时目前只渲染1行备注
      drawerRowCount = 1;
    }
  }
  const parentRowSpan = 1 + drawerRowCount;

  return (
    <>
      <TableRow
        key={item.id}
        className={cn(
          'glass-row-hover cursor-pointer transition-all duration-200',
          level > 0 ? 'bg-white/5 hover:bg-white/10' : 'hover:bg-white/5'
        )}
        onClick={(e) => {
          if (
            e.target instanceof Element &&
            (e.target.closest('button') || e.target.closest('input'))
          ) {
            return;
          }
          onRowClick?.(item);
        }}
      >
        {/* 第1列：空间（仅空间第一行渲染，rowSpan 覆盖剩余行） */}
        {!hideRoomColumn && rowSpanInfo?.isRoomFirstRow && (
          <TableCell
            rowSpan={rowSpanInfo.roomRowSpan}
            className={cn(
              'w-[100px] border-r px-3 py-2 text-center align-middle text-sm font-semibold',
              roomBgClass
            )}
          >
            {roomName || '—'}
          </TableCell>
        )}
        {/* 附件行：空间列被 rowSpan 覆盖，无需渲染 */}

        {/* 第2列：商品名称（每行均渲染，附件行通过缩进体现层级） */}
        <ProductNameCell
          item={item}
          level={level}
          readOnly={readOnly}
          showImage={false} // 图片已独立为第3列，不内嵌在商品列
          onProductSelect={handleProductSelect}
          rowSpan={level === 0 && isExpanded ? parentRowSpan : 1}
        />

        {/* 第3列：图片（每行均渲染，抽屉行由主商品跨行覆盖） */}
        {showImage && (
          <TableCell
            rowSpan={level === 0 && isExpanded ? parentRowSpan : 1}
            className="w-[60px] p-1 text-center align-middle"
          >
            {productImage ? (
              <Popover>
                <PopoverTrigger asChild>
                  <div
                    className={cn(
                      'bg-muted group relative mx-auto cursor-zoom-in overflow-hidden rounded border transition-all duration-300',
                      isExpanded ? 'h-[100px] w-[100px]' : 'h-[44px] w-[44px]'
                    )}
                  >
                    <Image
                      src={productImage}
                      alt="商品图片"
                      fill
                      className="object-cover transition-transform group-hover:scale-110"
                    />
                  </div>
                </PopoverTrigger>
                <PopoverContent
                  className="w-64 overflow-hidden border-none p-0 shadow-xl"
                  side="right"
                >
                  <Image
                    src={productImage}
                    alt="商品图片预览"
                    width={256}
                    height={256}
                    className="h-auto w-full"
                  />
                </PopoverContent>
              </Popover>
            ) : (
              // 无图片占位
              <div
                className="mx-auto flex h-[44px] w-[44px] items-center justify-center rounded border border-dashed border-slate-300 bg-slate-50/50 opacity-60"
                title="暂无图片"
              >
                <span className="text-muted-foreground text-[10px]">图</span>
              </div>
            )}
          </TableCell>
        )}

        {/* 中间区域：附件行合并为备注输入；主商品行显示尺寸/倍数/工费 */}
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

        {showAmount && (
          <AmountCell
            item={item}
            rowSpan={level === 0 && isExpanded ? parentRowSpan : 1}
            className={level === 0 && isExpanded ? 'border-l border-slate-100' : ''}
          />
        )}

        {showRemark && (!isAccessory || middleSectionColSpan === 0) && (
          <RemarkCell item={item} readOnly={readOnly} onUpdate={handleUpdate} />
        )}

        <ItemActionsCell
          level={level}
          isCurtain={isCurtain}
          isExpanded={isExpanded}
          readOnly={readOnly}
          onToggleExpand={onToggleExpand}
          onAddAccessory={() => handleAddAccessory(item.id, item.roomId)}
          onDelete={() => handleDelete(item.id)}
          onAdvancedEdit={onAdvancedEdit ? () => onAdvancedEdit(item) : undefined}
          rowSpan={level === 0 && isExpanded ? parentRowSpan : 1} // 整体跨行包裹高级参数
        />

        {/* 第10列：空间小计（仅空间第一行渲染，rowSpan 与空间列同步） */}
        {rowSpanInfo?.isRoomFirstRow && (
          <TableCell
            rowSpan={rowSpanInfo.roomRowSpan}
            className="border-l px-3 py-2 text-right align-middle"
          >
            <span className="text-primary font-semibold">
              ¥{rowSpanInfo.roomSubtotal.toFixed(2)}
            </span>
          </TableCell>
        )}
      </TableRow>

      {/* 展开区域（高级配置） */}
      {level === 0 && isExpanded && (
        <QuoteItemExpandRow
          itemId={item.id}
          productName={item.productName || ''}
          category={item.category}
          attributes={item.attributes || {}}
          foldRatio={Number(item.foldRatio) || 2}
          processFee={Number(item.processFee) || 0}
          remark={item.remark || undefined}
          readOnly={readOnly}
          isExpanded={isExpanded}
          onToggle={onToggleExpand}
          onSave={() => {
            // 展开行保存后，触发数据刷新以反映服务端重算的数量
            handleUpdate(item.id, {});
          }}
          middleCols={middleVisibleCount}
        />
      )}

      {/* 递归渲染附件行 */}
      {item.children && item.children.length > 0 && renderChildren(item.children, level + 1)}
    </>
  );
});
