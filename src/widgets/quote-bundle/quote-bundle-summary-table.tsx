'use client';

import { Card, CardContent } from '../../shared/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../shared/ui/table';

/** 报价包汇总数据 */
interface QuoteBundleData {
  id?: string;
  name?: string;
  quotes?: { items?: unknown[] };
}

interface QuoteBundleSummaryTableProps {
  bundle: QuoteBundleData;
  mode?: 'BY_ROOM' | 'BY_CATEGORY';
}

/** 报价包汇总表格组件 */
export function QuoteBundleSummaryTable({
  bundle,
  mode = 'BY_ROOM',
}: QuoteBundleSummaryTableProps) {
  const itemCount = bundle.quotes?.items?.length ?? 0;

  return (
    <Card className="glass-liquid mt-6 border-white/40 shadow-sm">
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{mode === 'BY_ROOM' ? '房间' : '品类'}</TableHead>
              <TableHead className="text-right">金额</TableHead>
              <TableHead className="text-right">数量</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell colSpan={3} className="text-muted-foreground h-24 text-center">
                {itemCount === 0 ? `${bundle.name ?? '报价包'} 暂无汇总数据` : `共 ${itemCount} 项`}
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
