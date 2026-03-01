import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { Separator } from '@/shared/ui/separator';
import { FileText } from 'lucide-react';

export function ApItemsTable({ items, totalAmount }: { items: any[]; totalAmount: string }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>款项明细</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {items.map((item: any) => (
            <div
              key={item.id}
              className="bg-muted/30 flex items-center justify-between rounded-lg border p-3"
            >
              <div className="flex items-center gap-3">
                <div className="bg-primary/10 text-primary flex h-8 w-8 items-center justify-center rounded-md">
                  <FileText className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-sm font-medium">
                    {item.statementType === 'SUPPLIER_STATEMENT' ? '供应商对账单' : '其他'}#
                    {item.statementNo}
                  </p>
                  <p className="text-muted-foreground text-xs">
                    {item.statement?.id || item.statementId}
                  </p>
                </div>
              </div>
              <div className="font-mono font-medium">¥{Number(item.amount).toFixed(2)}</div>
            </div>
          ))}
          <Separator />
          <div className="flex items-center justify-end gap-4 pt-2">
            <span className="text-muted-foreground text-sm">总金额</span>
            <span className="font-mono text-2xl font-bold">¥{Number(totalAmount).toFixed(2)}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
