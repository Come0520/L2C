'use client';

import { memo } from 'react';
import { toast } from 'sonner';
import { cn } from '@/shared/lib/utils';
import { TableCell } from '@/shared/ui/table';
import { Input } from '@/shared/ui/input';
import type { CalcResult } from '../types';
import type { QuoteItem } from '@/shared/api/schema/quotes';

type CalcHandler = (
  item: QuoteItem,
  field: string,
  value: number
) => { quantity: number; calcResult?: CalcResult } | number | null;

interface FoldRatioCellProps {
  item: QuoteItem;
  readOnly: boolean;
  onUpdate: (id: string, data: Record<string, unknown>) => Promise<void>;
  onClientCalc: CalcHandler;
}

export const FoldRatioCell = memo(function FoldRatioCell({
  item,
  readOnly,
  onUpdate,
  onClientCalc,
}: FoldRatioCellProps) {
  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    if (isNaN(val)) return;
    const res = onClientCalc(item, 'foldRatio', val);
    if (res && typeof res === 'object') {
      onUpdate(item.id, {
        foldRatio: val,
        quantity: res.quantity,
        attributes: { ...item.attributes, calcResult: res.calcResult },
      });
    } else if (typeof res === 'number') {
      onUpdate(item.id, { foldRatio: val, quantity: res });
    } else {
      onUpdate(item.id, { foldRatio: val });
    }
  };

  return (
    <TableCell className="p-2">
      <Input
        disabled={readOnly}
        type="number"
        className="ml-auto h-8 w-14 bg-transparent/50 px-1 text-right"
        defaultValue={Number(item.foldRatio) || ''}
        placeholder="倍数"
        onBlur={handleBlur}
      />
    </TableCell>
  );
});

interface ProcessFeeCellProps {
  item: QuoteItem;
  readOnly: boolean;
  onUpdate: (id: string, data: Record<string, unknown>) => Promise<void>;
}

export const ProcessFeeCell = memo(function ProcessFeeCell({
  item,
  readOnly,
  onUpdate,
}: ProcessFeeCellProps) {
  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    if (isNaN(val)) return;
    onUpdate(item.id, { processFee: val });
  };

  return (
    <TableCell className="p-2">
      <Input
        disabled={readOnly}
        type="number"
        className="ml-auto h-8 w-16 bg-transparent/50 px-1 text-right"
        defaultValue={Number(item.processFee) || ''}
        placeholder="工费"
        onBlur={handleBlur}
      />
    </TableCell>
  );
});

interface UnitCellProps {
  item: QuoteItem;
  readOnly: boolean;
  onUpdate: (id: string, data: Record<string, unknown>) => Promise<void>;
}

export const UnitCell = memo(function UnitCell({ item, readOnly, onUpdate }: UnitCellProps) {
  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    onUpdate(item.id, { unit: e.target.value });
  };

  return (
    <TableCell className="p-2">
      <Input
        disabled={readOnly}
        className="mx-auto h-8 w-12 bg-transparent/50 px-1 text-center text-xs"
        defaultValue={item.unit || '-'}
        placeholder="单位"
        onBlur={handleBlur}
      />
    </TableCell>
  );
});

interface UnitPriceCellProps {
  item: QuoteItem;
  readOnly: boolean;
  onUpdate: (id: string, data: Record<string, unknown>) => Promise<void>;
}

export const UnitPriceCell = memo(function UnitPriceCell({
  item,
  readOnly,
  onUpdate,
}: UnitPriceCellProps) {
  // 从行项目属性中获取产品基准价快照，用于低价警告判断
  const basePrice = Number((item.attributes as Record<string, unknown> | null)?._basePrice || 0);

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    if (isNaN(val)) return;

    // 低价警告：当手动输入的单价低于产品基准价时，弹出警告提示（向上调价则无需警告）
    if (basePrice > 0 && val < basePrice) {
      toast.warning(`单价 ¥${val} 低于产品基准价 ¥${basePrice}，市场评估价格偏低，请确认是否继续`, {
        duration: 6000,
        id: `low-price-${item.id}`,
      });
    }

    onUpdate(item.id, { unitPrice: val });
  };

  return (
    <TableCell className="p-2 text-right">
      <Input
        key={item.unitPrice}
        disabled={readOnly}
        type="number"
        onFocus={(e) => e.target.select()}
        className="ml-auto h-8 w-20 bg-transparent/50 px-1 text-right"
        defaultValue={Number(item.unitPrice)}
        onBlur={handleBlur}
      />
    </TableCell>
  );
});

interface AmountCellProps {
  item: QuoteItem;
  rowSpan?: number;
  className?: string;
}

export const AmountCell = memo(function AmountCell({ item, rowSpan, className }: AmountCellProps) {
  return (
    <TableCell
      rowSpan={rowSpan}
      className={cn('p-2 text-right align-middle font-medium', className)}
    >
      <span className="font-mono text-slate-700 dark:text-slate-100">
        ¥{Number(item.subtotal).toFixed(2)}
      </span>
    </TableCell>
  );
});

interface RemarkCellProps {
  item: QuoteItem;
  readOnly: boolean;
  onUpdate: (id: string, data: Record<string, unknown>) => Promise<void>;
  colSpan?: number;
}

export const RemarkCell = memo(function RemarkCell({
  item,
  readOnly,
  onUpdate,
  colSpan,
}: RemarkCellProps) {
  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    onUpdate(item.id, { remark: e.target.value });
  };

  return (
    <TableCell className="p-2" colSpan={colSpan}>
      <Input
        disabled={readOnly}
        className="h-8 w-24 bg-transparent/50 px-2 text-xs"
        defaultValue={item.remark || ''}
        placeholder="备注"
        onBlur={handleBlur}
      />
    </TableCell>
  );
});
