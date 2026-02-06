/**
 * 采购单管理页面
 * 
 * 注意：采购单由订单拆分自动生成，不提供手动创建功能
 */
import { Suspense } from 'react';
import { getPurchaseOrders } from '@/features/supply-chain/actions/queries';
import { EnhancedPOTable } from '@/features/supply-chain/components/enhanced-po-table';

import { auth } from '@/shared/lib/auth';
import { redirect } from 'next/navigation';
import { TableSkeleton } from '@/shared/ui/skeleton-variants';

export const revalidate = 60;

export default async function PurchaseOrdersPage({
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
    const supplierId = resolvedParams?.supplierId as string | undefined;
    const paymentStatus = resolvedParams?.paymentStatus as string | undefined;
    const search = resolvedParams?.search as string | undefined;

    // 获取采购单数据
    const result = await getPurchaseOrders({
        page,
        pageSize: 20,
        status,
        supplierId,
        paymentStatus,
        search,
    });

    return (
        <div className="flex h-full flex-col space-y-4">
            <div className="flex-1 glass-liquid-ultra p-6 rounded-2xl border border-white/10">
                <Suspense fallback={<TableSkeleton />}>
                    <EnhancedPOTable data={result.data} />
                </Suspense>

                {/* 分页信息 */}
                <div className="mt-4 text-sm text-muted-foreground text-center">
                    共 {result.total} 条，第 {result.page} / {result.totalPages} 页
                </div>
            </div>
        </div>
    );
}

