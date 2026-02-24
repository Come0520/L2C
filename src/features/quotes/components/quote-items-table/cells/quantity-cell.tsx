'use client';

import { memo } from 'react';
import { TableCell } from '@/shared/ui/table';
import { Input } from '@/shared/ui/input';
import { Button } from '@/shared/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/shared/ui/popover';
import Info from 'lucide-react/dist/esm/icons/info';
import type { QuoteItem } from '../types';

interface QuantityCellProps {
  item: QuoteItem;
  readOnly: boolean;
  onUpdate: (id: string, data: Record<string, unknown>) => Promise<void>;
}

export const QuantityCell = memo(function QuantityCell({
  item,
  readOnly,
  onUpdate,
}: QuantityCellProps) {
  const calcDetails = item.attributes?.calcResult;

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    if (isNaN(val)) return;
    onUpdate(item.id, { quantity: val });
  };

  return (
    <TableCell className="p-2">
      <div className="flex items-center gap-1">
        <Input
          key={item.quantity}
          disabled={readOnly}
          type="number"
          className="text-primary h-8 w-16 bg-transparent/50 px-1 text-right font-medium"
          defaultValue={Number(item.quantity)}
          onBlur={handleBlur}
        />
        {calcDetails && (
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="text-muted-foreground hover:text-primary h-6 w-6 shrink-0"
              >
                <Info className="h-3.5 w-3.5" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="glass-popover w-64 overflow-hidden p-0" side="right">
              <div className="glass-section-header p-3">
                <h4 className="text-muted-foreground text-center text-xs font-medium tracking-wider uppercase">
                  计算详情
                </h4>
              </div>
              <div className="space-y-2 p-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">成品展示:</span>
                  <span className="font-mono">
                    {calcDetails.finishedWidth} x {calcDetails.finishedHeight} cm
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">预留净尺寸:</span>
                  <span className="text-primary font-mono">
                    {calcDetails.cutWidth} x {calcDetails.cutHeight} cm
                  </span>
                </div>
                {calcDetails.stripCount !== undefined && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">消耗份数:</span>
                    <span className="font-mono">{calcDetails.stripCount}</span>
                  </div>
                )}
                {calcDetails.fabricWidthCm !== undefined && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">参考幅宽:</span>
                    <span className="font-mono">{calcDetails.fabricWidthCm} cm</span>
                  </div>
                )}
                {calcDetails.warning && (
                  <div className="text-destructive mt-2 border-t border-dashed pt-2 text-xs">
                    <div className="mb-0.5 font-semibold">⚠️ 异常提醒:</div>
                    <div>{calcDetails.warning}</div>
                  </div>
                )}
              </div>
            </PopoverContent>
          </Popover>
        )}
      </div>
    </TableCell>
  );
});
