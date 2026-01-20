import { Suspense } from 'react';
import { getProcessingOrders } from '@/features/supply-chain/actions/processing-actions';
import { ProcessingOrderTable } from '@/features/supply-chain/components/processing-order-table';
import { PageHeader } from '@/components/ui/page-header';
import { Input } from '@/shared/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/shared/ui/tabs';
import Search from 'lucide-react/dist/esm/icons/search';
import { auth } from '@/shared/lib/auth';
import { redirect } from 'next/navigation';

export const revalidate = 60;

export default async function ProcessingOrdersPage({
    searchParams,
}: {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
    const [session, resolvedParams] = await Promise.all([
        auth(),
        searchParams
    ]);

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
        <div className="flex h-full flex-col">
            <div className="border-b px-6 py-4">
                <PageHeader
                    title="加工单管理"
                    description="管理面料加工订单，跟踪加工进度和完成状态"
                />
            </div>
            <div className="flex-1 p-6 space-y-4">
                {/* 筛选栏 */}
                <div className="flex items-center justify-between gap-4">
                    {/* 状态 Tabs */}
                    <Tabs defaultValue={status || 'ALL'} className="w-auto">
                        <TabsList>
                            <TabsTrigger value="ALL" asChild>
                                <a href="/supply-chain/processing-orders?status=ALL">全部</a>
                            </TabsTrigger>
                            <TabsTrigger value="PENDING" asChild>
                                <a href="/supply-chain/processing-orders?status=PENDING">待加工</a>
                            </TabsTrigger>
                            <TabsTrigger value="IN_PROGRESS" asChild>
                                <a href="/supply-chain/processing-orders?status=IN_PROGRESS">加工中</a>
                            </TabsTrigger>
                            <TabsTrigger value="COMPLETED" asChild>
                                <a href="/supply-chain/processing-orders?status=COMPLETED">已完成</a>
                            </TabsTrigger>
                        </TabsList>
                    </Tabs>

                    {/* 搜索框 */}
                    <div className="relative w-64">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
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
                <Suspense fallback={<div className="text-center py-8">加载中...</div>}>
                    <ProcessingOrderTable data={result.data} />
                </Suspense>

                {/* 分页信息 */}
                <div className="mt-4 text-sm text-muted-foreground text-center">
                    共 {result.total} 条，第 {result.page} / {result.totalPages} 页
                </div>
            </div>
        </div>
    );
}
