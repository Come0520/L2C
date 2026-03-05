import { Suspense } from 'react';
import { getProcessingOrders } from '@/features/supply-chain/actions/processing-actions';
import { ProcessingOrderTable } from '@/features/supply-chain/components/processing-order-table';

import { Input } from '@/shared/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/shared/ui/tabs';
import Search from 'lucide-react/dist/esm/icons/search';
import { auth } from '@/shared/lib/auth';
import { redirect } from 'next/navigation';
import { TableSkeleton } from '@/shared/ui/skeleton-variants';
import Link from 'next/link';

export default function ProcessingOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  return (
    <div className="flex h-full flex-col space-y-4">
      <Suspense fallback={<TableSkeleton />}>
        <ProcessingOrdersDataWrapper searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function ProcessingOrdersDataWrapper({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const [session, resolvedParams] = await Promise.all([auth(), searchParams]);

  if (!session?.user) redirect('/login');

  // 解析筛选参数
  const page = Number(resolvedParams?.page) || 1;
  const status = resolvedParams?.status as string | undefined;
  const search = resolvedParams?.search as string | undefined;

  // 获取加工单数据
  const result = await getProcessingOrders({
    page,
    pageSize: 20,
    status,
    search,
  });

  return (
    <div className="glass-liquid-ultra flex-1 rounded-2xl border border-white/10 p-6">
      {/* 筛选栏 */}
      <div className="mb-4 flex items-center justify-between gap-4">
        {/* 状态 Tabs */}
        <Tabs defaultValue={status || 'ALL'} className="w-auto">
          <TabsList>
            <TabsTrigger value="ALL" asChild>
              <Link href="/supply-chain/processing-orders?status=ALL">全部</Link>
            </TabsTrigger>
            <TabsTrigger value="PENDING" asChild>
              <Link href="/supply-chain/processing-orders?status=PENDING">待加工</Link>
            </TabsTrigger>
            <TabsTrigger value="IN_PROGRESS" asChild>
              <Link href="/supply-chain/processing-orders?status=IN_PROGRESS">加工中</Link>
            </TabsTrigger>
            <TabsTrigger value="COMPLETED" asChild>
              <Link href="/supply-chain/processing-orders?status=COMPLETED">已完成</Link>
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* 搜索框 */}
        <div className="relative w-64">
          <Search className="text-muted-foreground absolute top-2.5 left-2.5 h-4 w-4" />
          <form action="/supply-chain/processing-orders" method="get">
            <Input
              name="search"
              placeholder="搜索加工单号/订单号..."
              className="pl-8"
              defaultValue={search}
            />
            {status && <input type="hidden" name="status" value={status} />}
          </form>
        </div>
      </div>

      {/* 加工单列表 */}
      <ProcessingOrderTable data={result.data} />

      {/* 分页信息 */}
      <div className="text-muted-foreground mt-4 text-center text-sm">
        共 {result.total} 条，第 {result.page} / {result.totalPages} 页
      </div>
    </div>
  );
}
