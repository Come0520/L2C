'use client';

import { memo } from 'react';
import Image from 'next/image';
import { TableCell } from '@/shared/ui/table';
import { Badge } from '@/shared/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/shared/ui/popover';
import { CornerDownRight } from 'lucide-react';
import { ProductAutocomplete } from '../../product-autocomplete';
import type { QuoteItem } from '../types';
import type { ProductSearchResult } from '@/features/quotes/actions/product-actions';

interface ProductNameCellProps {
  item: QuoteItem;
  level: number;
  readOnly: boolean;
  showImage: boolean;
  onProductSelect: (id: string, product: ProductSearchResult) => Promise<void>;
}

export const ProductNameCell = memo(function ProductNameCell({
  item,
  level,
  readOnly,
  showImage,
  onProductSelect,
}: ProductNameCellProps) {
  const warning = item.attributes?.calcResult?.warning || item.attributes?._warnings;

  return (
    <TableCell className="p-2 font-medium">
      <div className="flex items-center" style={{ paddingLeft: `${level * 24}px` }}>
        {level > 0 && (
          <div className="relative mr-2 flex h-full items-center">
            <div className="border-muted-foreground/30 absolute -top-3 left-0 h-4 w-4 rounded-bl-md border-b border-l"></div>
            <CornerDownRight className="text-muted-foreground/50 h-4 w-4" />
          </div>
        )}
        {readOnly ? (
          <span className="block max-w-[200px] truncate">{item.productName}</span>
        ) : (
          <div className="w-48">
            <ProductAutocomplete
              value={item.productName}
              onSelect={(p) => onProductSelect(item.id, p)}
              allowedCategories={
                item.category === 'CURTAIN_ACCESSORY' ? ['CURTAIN_ACCESSORY'] : undefined
              }
              category={item.category}
              placeholder={
                item.category === 'CURTAIN_ACCESSORY' ? '搜索辅料(绑带等)...' : '选择商品...'
              }
            />
          </div>
        )}
        {!readOnly &&
          showImage &&
          (item.attributes?.productImage ? (
            <Popover>
              <PopoverTrigger asChild>
                <div className="bg-muted group relative ml-2 h-8 w-8 shrink-0 cursor-zoom-in overflow-hidden rounded border">
                  <Image
                    src={String(item.attributes.productImage)}
                    alt="Product"
                    width={32}
                    height={32}
                    className="h-full w-full object-cover transition-transform group-hover:scale-110"
                  />
                </div>
              </PopoverTrigger>
              <PopoverContent
                className="w-64 overflow-hidden border-none p-0 shadow-xl"
                side="right"
              >
                <Image
                  src={String(item.attributes.productImage)}
                  alt="Preview"
                  width={256}
                  height={256}
                  className="h-auto w-full"
                />
              </PopoverContent>
            </Popover>
          ) : (
            <div
              className="ml-2 flex h-8 w-8 shrink-0 items-center justify-center rounded border border-dashed border-slate-300 bg-slate-50 opacity-50"
              title="No Image"
            >
              <span className="text-muted-foreground text-[10px]">图</span>
            </div>
          ))}
        {warning && (
          <Popover>
            <PopoverTrigger asChild>
              <Badge
                variant="error"
                className="ml-2 shrink-0 cursor-pointer text-xs hover:opacity-80"
              >
                !
              </Badge>
            </PopoverTrigger>
            <PopoverContent className="glass-popover text-destructive w-64 p-3 text-sm" side="top">
              <div className="mb-1 font-semibold">⚠️ 警报</div>
              <div className="text-xs opacity-90">{warning}</div>
            </PopoverContent>
          </Popover>
        )}
      </div>
    </TableCell>
  );
});
