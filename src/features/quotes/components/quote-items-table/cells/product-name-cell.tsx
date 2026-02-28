'use client';

import { memo } from 'react';
import Image from 'next/image';
import { TableCell } from '@/shared/ui/table';
import { Badge } from '@/shared/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/shared/ui/popover';
import CornerDownRight from 'lucide-react/dist/esm/icons/corner-down-right';
import { ProductAutocomplete } from '../../product-autocomplete';
import type { QuoteItem } from '../types';
import type { ProductSearchResult } from '@/features/quotes/actions/product-actions';

interface ProductNameCellProps {
  item: QuoteItem;
  level: number;
  readOnly: boolean;
  showImage: boolean;
  roomName?: string;
  onProductSelect: (id: string, product: ProductSearchResult) => Promise<void>;
}

export const ProductNameCell = memo(function ProductNameCell({
  item,
  level,
  readOnly,
  showImage,
  roomName,
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
          <div className="flex items-center">
            <span className="block max-w-[200px] truncate">{item.productName}</span>
            {roomName && (
              <Badge variant="outline" className="ml-2 text-[10px] text-muted-foreground font-normal bg-muted/30 whitespace-nowrap">
                {roomName}
              </Badge>
            )}
          </div>
        ) : (
          <div className="flex items-center w-full max-w-[300px]">
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
              {roomName && (
                <Badge variant="outline" className="ml-2 text-[10px] text-muted-foreground font-normal bg-muted/30 whitespace-nowrap shrink-0">
                  {roomName}
                </Badge>
              )}
            </div>
          </div>
        )}
      </div>
    </TableCell>
  );
});
