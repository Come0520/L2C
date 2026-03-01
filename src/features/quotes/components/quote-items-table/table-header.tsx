import { TableHead, TableHeader, TableRow } from '@/shared/ui/table';
import type { ColumnVisibility } from './types';

type QuoteTableHeaderProps = ColumnVisibility;

/**
 * 报价单表格表头
 * 列顺序：空间 → 商品 → 图片 → 尺寸 → 数量 → 单位 → 单价 → 金额 → 操作 → 空间小计
 */
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
  hideRoomColumn,
}: QuoteTableHeaderProps) {
  return (
    <TableHeader>
      <TableRow className="glass-table-header">
        {/* 第1列：空间 */}
        {!hideRoomColumn && <TableHead className="h-9 w-[100px] px-3 text-center">空间</TableHead>}
        {/* 第2列：商品 */}
        <TableHead className="h-9 w-[15%] px-4 text-center">商品</TableHead>
        {/* 第3列：图片（独立列） */}
        {showImage && <TableHead className="h-9 w-[80px] text-center">图片</TableHead>}
        {/* 第4列：尺寸 */}
        {(showWidth || showHeight) && (
          <TableHead className="h-9 w-[15%] text-center">尺寸 (cm)</TableHead>
        )}
        {/* 折叠列 */}
        {showFold && <TableHead className="h-9 w-[8%] text-center">倍数</TableHead>}
        {showProcessFee && <TableHead className="h-9 w-[10%] text-center">加工费</TableHead>}
        {/* 第5列：数量 */}
        {showQuantity && <TableHead className="h-9 w-[10%] text-center">数量</TableHead>}
        {/* 第6列：单位 */}
        {showUnit && <TableHead className="h-9 w-[6%] text-center">单位</TableHead>}
        {/* 第7列：单价 */}
        {showUnitPrice && <TableHead className="h-9 w-[8%] text-center">单价</TableHead>}
        {/* 第8列：金额（原"小计"） */}
        {showAmount && <TableHead className="h-9 w-[10%] text-center">金额</TableHead>}
        {/* 备注列 */}
        {showRemark && <TableHead className="h-9 text-center">备注</TableHead>}
        {/* 第9列：操作 */}
        <TableHead className="h-9 w-[80px] text-center">操作</TableHead>
        {/* 第10列：空间小计 */}
        <TableHead className="h-9 w-[90px] text-center">空间小计</TableHead>
      </TableRow>
    </TableHeader>
  );
}
