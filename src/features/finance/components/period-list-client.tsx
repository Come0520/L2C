'use client';

import { useTransition } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/ui/table';
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import { Lock } from 'lucide-react';
import { toast } from 'sonner';
import { closeAccountingPeriod } from '../actions/period-actions';
import { format } from 'date-fns';

type PeriodRowClient = {
  id: string;
  year: number;
  month: number;
  quarter: number;
  status: 'OPEN' | 'CLOSED';
  closedByName: string | null;
  closedAt: Date | null;
};

interface PeriodListProps {
  initialData: PeriodRowClient[];
  canClose?: boolean;
}

export function PeriodListClient({ initialData, canClose = false }: PeriodListProps) {
  const [isPending, startTransition] = useTransition();

  const handleClosePeriod = (id: string, year: number, month: number) => {
    if (
      confirm(
        `⚠ 警告：关账操作是不可逆的。\n\n您确定要关闭 ${year}年${month}月 的账期吗？\n一旦关闭，将无法在此账期内新建或修改任何凭证与报表数据！`
      )
    ) {
      startTransition(async () => {
        try {
          const res = await closeAccountingPeriod(id);
          if (res.error) {
            toast.error(res.error);
          } else {
            toast.success(`${year}年${month}月 账期已成功关闭`);
          }
        } catch (_err) {
          toast.error('网络请求失败');
        }
      });
    }
  };

  return (
    <div className="rounded-lg border bg-white p-6 shadow-sm">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>账期 (年月)</TableHead>
            <TableHead>所属季度</TableHead>
            <TableHead>状态</TableHead>
            <TableHead>关账操作人</TableHead>
            <TableHead>关账时间</TableHead>
            <TableHead className="text-right">操作</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {initialData.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="text-muted-foreground h-24 text-center">
                暂无账期数据
              </TableCell>
            </TableRow>
          ) : (
            initialData.map((period) => (
              <TableRow key={period.id}>
                <TableCell className="font-medium">
                  {period.year} 年 {period.month} 月
                </TableCell>
                <TableCell>Q{period.quarter}</TableCell>
                <TableCell>
                  {period.status === 'OPEN' ? (
                    <Badge
                      variant="outline"
                      className="border-green-500 bg-green-50 text-green-600"
                    >
                      进行中
                    </Badge>
                  ) : (
                    <Badge
                      variant="secondary"
                      className="flex w-fit items-center gap-1 bg-gray-100"
                    >
                      <Lock size={12} />
                      已关闭
                    </Badge>
                  )}
                </TableCell>
                <TableCell>{period.closedByName || '-'}</TableCell>
                <TableCell>
                  {period.closedAt ? format(new Date(period.closedAt), 'yyyy-MM-dd HH:mm:ss') : '-'}
                </TableCell>
                <TableCell className="flex justify-end text-right">
                  {period.status === 'OPEN' && canClose && (
                    <Button
                      variant="destructive"
                      size="sm"
                      disabled={isPending}
                      onClick={() => handleClosePeriod(period.id, period.year, period.month)}
                    >
                      <Lock className="mr-1 h-4 w-4" />
                      执行关账
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
