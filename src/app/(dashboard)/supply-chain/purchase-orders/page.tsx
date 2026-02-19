/**
 * 采购单管理页面
 * 
 * 注意：采购单由订单拆分自动生成，不提供手动创建功能
 */
import { Suspense } from 'react';
import { getPurchaseOrders } from '@/features/supply-chain/actions/po-actions';
import { EnhancedPOTable } from '@/features/supply-chain/components/enhanced-po-table';

import { auth } from '@/shared/lib/auth';
import { redirect } from 'next/navigation';
import { TableSkeleton } from '@/shared/ui/skeleton-variants';
import { CreatePODialog } from '@/features/supply-chain/components/create-po-dialog';
import { getSuppliers } from '@/features/supply-chain/actions/supplier-actions';

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
    const statusParam = resolvedParams?.status as string | undefined;
    const supplierId = resolvedParams?.supplierId as string | undefined;
    const paymentStatus = resolvedParams?.paymentStatus as string | undefined;
    const search = resolvedParams?.search as string | undefined;

    // 状态分组定义
    const STATUS_GROUPS: Record<string, string[]> = {
        pending: ['DRAFT', 'PENDING_CONFIRMATION'],
        active: ['PENDING_PAYMENT', 'IN_PRODUCTION', 'READY'],
        inbound: ['SHIPPED', 'DELIVERED'],
        history: ['COMPLETED', 'CANCELLED'],
    };

    const status = STATUS_GROUPS[statusParam || ''] || statusParam;

    // 获取采购单数据
    const result = await getPurchaseOrders({
        page,
        pageSize: 20,
        status,
        supplierId,
        paymentStatus,
        search,
    });

    // 获取供应商列表 (用于创建 PO Dialog)
    const suppliersResult = await getSuppliers({ page: 1, pageSize: 100, type: 'BOTH' });
    const suppliersData = suppliersResult.data?.data || [];
    const suppliers = suppliersData.map(s => ({ id: s.id, name: s.name }));

    return (
        <div className="flex h-full flex-col space-y-4">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold tracking-tight">采购订单</h2>
                <CreatePODialog suppliers={suppliers} />
            </div>
            <div className="flex-1 glass-liquid-ultra p-6 rounded-2xl border border-white/10">
                <Suspense fallback={<TableSkeleton />}>
                    {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                    <EnhancedPOTable data={result.data as any} />
                </Suspense>

                {/* 分页信息 */}
                <div className="mt-4 text-sm text-muted-foreground text-center">
                    共 {result.total} 条，第 {result.page} / {result.totalPages} 页
                </div>
            </div>
        </div>
    );
}

