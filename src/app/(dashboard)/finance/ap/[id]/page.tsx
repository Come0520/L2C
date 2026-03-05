import { notFound } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { db } from '@/shared/api/db';
import { paymentBills } from '@/shared/api/schema';
import { eq } from 'drizzle-orm';
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import { Separator } from '@/shared/ui/separator';
import ArrowLeft from 'lucide-react/dist/esm/icons/arrow-left';
import FileText from 'lucide-react/dist/esm/icons/file-text';
import Link from 'next/link';
import { Suspense } from 'react';
import { Skeleton } from '@/shared/ui/skeleton';
import { ApDetailActions } from './actions';
import { ApPaymentInfo } from './payment-info';
// import { ApItemsTable } from './items-table'; // Inline or separate? Separate.
import { ApApprovalHistory } from './approval-history';
import { ApFilePreview } from './file-preview';

export default async function ApDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  if (!id) {
    notFound();
  }

  return (
    <Suspense fallback={<DetailSkeleton />}>
      <ApDetailDataWrapper id={id} />
    </Suspense>
  );
}

async function ApDetailDataWrapper({ id }: { id: string }) {
  const bill = await db.query.paymentBills.findFirst({
    where: eq(paymentBills.id, id),
    with: {
      items: {
        with: {
          supplierStatement: true,
          laborStatement: true,
        },
      },
      recordedBy: true,
    },
  });

  if (!bill) {
    return <div className="text-muted-foreground p-8 text-center">付款单不存在</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/finance/ap">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight">付款单 {bill.paymentNo}</h1>
              <StatusBadge status={bill.status} />
            </div>
            <p className="text-muted-foreground mt-1 text-sm">
              创建于 {bill.createdAt?.toLocaleDateString()} · 由{' '}
              {bill.recordedBy?.name || '未知用户'} 提交
            </p>
          </div>
        </div>
        <ApDetailActions billId={bill.id} status={bill.status} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="space-y-6 lg:col-span-2">
          {/* Items */}
          <Card>
            <CardHeader>
              <CardTitle>款项明细</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {bill.items.map((item: any) => (
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
                          {item.statementType === 'AP_SUPPLIER'
                            ? item.supplierStatement?.statementNo || item.statementNo
                            : item.laborStatement?.statementNo || item.statementNo}
                        </p>
                      </div>
                    </div>
                    <div className="font-mono font-medium">¥{Number(item.amount).toFixed(2)}</div>
                  </div>
                ))}
                <Separator />
                <div className="flex items-center justify-end gap-4 pt-2">
                  <span className="text-muted-foreground text-sm">总金额</span>
                  <span className="font-mono text-2xl font-bold">
                    ¥{Number(bill.amount).toFixed(2)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Proof / Attachments */}
          {bill.proofUrl && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>支付凭证/附件</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-background/50 flex items-center gap-4 rounded-lg border p-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10 text-blue-500">
                    <FileText className="h-5 w-5" />
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <p className="truncate text-sm font-medium">
                      {bill.proofUrl.split('/').pop() || 'attachment'}
                    </p>
                    <p className="text-muted-foreground text-xs">点击预览查看详细内容</p>
                  </div>
                  <ApFilePreview url={bill.proofUrl} />
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar Info */}
        <div className="space-y-6">
          <ApPaymentInfo bill={bill} />

          {/* Approval History */}
          <Suspense fallback={<Skeleton className="h-40 w-full" />}>
            <ApApprovalHistory entityId={id} entityType="PAYMENT_BILL" />
          </Suspense>
        </div>
      </div>
    </div>
  );
}

function DetailSkeleton() {
  return (
    <div className="space-y-8 p-8">
      <Skeleton className="h-8 w-1/3" />
      <div className="grid grid-cols-3 gap-6">
        <Skeleton className="col-span-2 h-[400px]" />
        <Skeleton className="h-[400px]" />
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<
    string,
    { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' | 'success' }
  > = {
    DRAFT: { label: '草稿', variant: 'secondary' },
    PENDING: { label: '待处理', variant: 'secondary' },
    PENDING_APPROVAL: { label: '审批中', variant: 'outline' },
    APPROVED: { label: '已通过', variant: 'success' },
    REJECTED: { label: '已驳回', variant: 'destructive' },
    PAID: { label: '已付款', variant: 'success' },
    WITHDRAWN: { label: '已撤回', variant: 'secondary' },
  };
  const c = map[status] || { label: status, variant: 'secondary' };

  return <Badge variant={c.variant}>{c.label}</Badge>;
}
