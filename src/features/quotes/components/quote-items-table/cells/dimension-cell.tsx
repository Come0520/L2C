'use client';

import { memo } from 'react';
import { TableCell } from '@/shared/ui/table';
import { Input } from '@/shared/ui/input';
import type { QuoteItem, CalcResult } from '../types';

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
  const handleWidthBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    if (isNaN(val)) return;
    const res = onClientCalc(item, 'width', val);
    if (res && typeof res === 'object') {
      onUpdate(item.id, {
        width: val,
        quantity: res.quantity,
        attributes: { ...item.attributes, calcResult: res.calcResult },
      });
    } else if (typeof res === 'number') {
      onUpdate(item.id, { width: val, quantity: res });
    } else {
      onUpdate(item.id, { width: val });
    }
  };

  const handleHeightBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    if (isNaN(val)) return;
    const res = onClientCalc(item, 'height', val);
    if (res && typeof res === 'object') {
      onUpdate(item.id, {
        height: val,
        quantity: res.quantity,
        attributes: { ...item.attributes, calcResult: res.calcResult },
      });
    } else if (typeof res === 'number') {
      onUpdate(item.id, { height: val, quantity: res });
    } else {
      onUpdate(item.id, { height: val });
    }
  };

  if (!showWidth && !showHeight) return null;

  return (
    <TableCell className="p-2">
      <div className="flex items-center space-x-1">
        {showWidth && (
          <Input
            disabled={readOnly}
            type="number"
            className="h-8 w-16 bg-transparent/50 px-1 text-right"
            defaultValue={Number(item.width) || ''}
            placeholder="宽"
            onBlur={handleWidthBlur}
          />
        )}
        {showWidth && showHeight && <span className="text-muted-foreground text-xs">x</span>}
        {showHeight && (
          <Input
            disabled={readOnly}
            type="number"
            className="h-8 w-16 bg-transparent/50 px-1 text-right"
            defaultValue={Number(item.height) || ''}
            placeholder="高"
            onBlur={handleHeightBlur}
          />
        )}
      </div>
    </TableCell>
  );
});
