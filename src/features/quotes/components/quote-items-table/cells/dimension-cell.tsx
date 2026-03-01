'use client';

import { memo, useRef } from 'react';
import { TableCell } from '@/shared/ui/table';
import { Input } from '@/shared/ui/input';
import type { CalcResult } from '../types';
import type { QuoteItem } from '@/shared/api/schema/quotes';

type CalcHandler = (
  item: QuoteItem,
  field: string,
  value: number
) => { quantity: number; calcResult?: CalcResult } | number | null;

interface DimensionCellProps {
  item: QuoteItem;
  readOnly: boolean;
  showWidth: boolean;
  showHeight: boolean;
  onUpdate: (id: string, data: Record<string, unknown>) => Promise<void>;
  onClientCalc: CalcHandler;
}

export const DimensionCell = memo(function DimensionCell({
  item,
  readOnly,
  showWidth,
  showHeight,
  onUpdate,
  onClientCalc,
}: DimensionCellProps) {
  const widthRef = useRef<HTMLInputElement>(null);
  const heightRef = useRef<HTMLInputElement>(null);

  const handleWidthBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    if (isNaN(val)) return;

    // 竞争状态修复：直接从DOM获取最新的高，无视可能过期的 item.height
    const currentHeight = heightRef.current ? parseFloat(heightRef.current.value) : Number(item.height);
    const syntheticItem = {
      ...item,
      height: isNaN(currentHeight) ? String(item.height) : String(currentHeight),
    } as QuoteItem;

    const res = onClientCalc(syntheticItem, 'width', val);

    // 注意：不发送 calcResult 嵌套对象到服务端，因为 safeAttributesSchema 不允许嵌套对象
    // 服务端 updateQuoteItem 会自动重算数量和 calcResult
    if (res && typeof res === 'object') {
      onUpdate(item.id, { width: val, quantity: res.quantity });
    } else if (typeof res === 'number') {
      onUpdate(item.id, { width: val, quantity: res });
    } else {
      onUpdate(item.id, { width: val });
    }
  };

  const handleHeightBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    if (isNaN(val)) return;

    // 竞争状态修复：直接从DOM获取最新的宽，无视可能过期的 item.width
    const currentWidth = widthRef.current ? parseFloat(widthRef.current.value) : Number(item.width);
    const syntheticItem = {
      ...item,
      width: isNaN(currentWidth) ? String(item.width) : String(currentWidth),
    } as QuoteItem;

    const res = onClientCalc(syntheticItem, 'height', val);

    // 注意：不发送 calcResult 嵌套对象到服务端，因为 safeAttributesSchema 不允许嵌套对象
    // 服务端 updateQuoteItem 会自动重算数量和 calcResult
    if (res && typeof res === 'object') {
      onUpdate(item.id, { height: val, quantity: res.quantity });
    } else if (typeof res === 'number') {
      onUpdate(item.id, { height: val, quantity: res });
    } else {
      onUpdate(item.id, { height: val });
    }
  };

  if (!showWidth && !showHeight) return null;

  return (
    <TableCell className="p-2">
      <div className="flex justify-center items-center space-x-1">
        {showWidth && (
          <Input
            ref={widthRef}
            disabled={readOnly}
            type="number"
            className="h-8 w-16 bg-transparent/50 px-1 text-center"
            defaultValue={Number(item.width) || ''}
            placeholder="宽"
            onBlur={handleWidthBlur}
          />
        )}
        {showWidth && showHeight && <span className="text-muted-foreground text-xs">x</span>}
        {showHeight && (
          <Input
            ref={heightRef}
            disabled={readOnly}
            type="number"
            className="h-8 w-16 bg-transparent/50 px-1 text-center"
            defaultValue={Number(item.height) || ''}
            placeholder="高"
            onBlur={handleHeightBlur}
          />
        )}
      </div>
    </TableCell>
  );
});
