import { TableHead, TableHeader, TableRow } from '@/shared/ui/table';
import type { ColumnVisibility } from './types';

type QuoteTableHeaderProps = ColumnVisibility;

export function QuoteTableHeader({
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
}: QuoteTableHeaderProps) {
  return (
    <TableHeader>
      <TableRow className="glass-table-header">
        <TableHead className="h-9 w-[25%] px-4">商品</TableHead>
        {showImage && <TableHead className="h-9 w-[60px] text-center">图片</TableHead>}
        {(showWidth || showHeight) && <TableHead className="h-9 w-[15%]">尺寸 (cm)</TableHead>}
        {showFold && <TableHead className="h-9 w-[8%]">倍数</TableHead>}
        {showProcessFee && <TableHead className="h-9 w-[10%]">加工费</TableHead>}
        {showQuantity && <TableHead className="h-9 w-[12%]">数量</TableHead>}
        {showUnit && <TableHead className="h-9 w-[8%]">单位</TableHead>}
        {showUnitPrice && <TableHead className="h-9 w-[10%] text-right">单价</TableHead>}
        {showAmount && <TableHead className="h-9 w-[10%] text-right">小计</TableHead>}
        {showRemark && <TableHead className="h-9">备注</TableHead>}
        <TableHead className="h-9 w-[80px]"></TableHead>
      </TableRow>
    </TableHeader>
  );
}
