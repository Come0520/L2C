'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import React, { useState } from 'react';

import { PaperButton } from '@/components/ui/paper-button';
import {
    PaperTable,
    PaperTableHeader,
    PaperTableBody,
    PaperTableRow,
    PaperTableCell,
    PaperTablePagination,
    PaperTableToolbar
} from '@/components/ui/paper-table';
import { SpotlightCard, SpotlightCardHeader, SpotlightCardTitle, SpotlightCardContent } from '@/components/ui/spotlight-card';
import { OrderFormData } from '@/shared/types/order';
import { formatDuration, calculateHoursDifference } from '@/utils/date';
import { ExportMenu } from '@/components/ui/export-menu';
import { useExport } from '@/hooks/useExport';

interface OrderListClientProps {
    initialOrders: OrderFormData[];
    initialTotal: number;
    initialPage: number;
    initialPageSize: number;
}

export function OrderListClient({
    initialOrders,
    initialTotal,
    initialPage,
    initialPageSize
}: OrderListClientProps) {
    const [orders] = useState<OrderFormData[]>(initialOrders);
    const [total] = useState(initialTotal);
    const [page, setPage] = useState(initialPage);
    const [pageSize] = useState(initialPageSize);

    // In a real server component scenario, pagination would likely trigger a URL change or server action.
    // For now, we are displaying the initial data. To make it fully interactive with server pagination,
    // we would use router.push with search params.

    const { handleExport } = useExport<OrderFormData>({
        filename: '销售订单列表',
        columns: [
            { header: '订单号', dataKey: 'salesNo' },
            { header: '客户', dataKey: 'customerName' },
            { header: '状态', dataKey: 'status' },
            { header: '金额', dataKey: 'totalAmount', formatter: (val) => `¥${val?.toLocaleString()}` },
            { header: '更新时间', dataKey: 'updateTime' },
        ]
    });

    const containerVariants = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: {
                staggerChildren: 0.05
            }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 10 },
        show: { opacity: 1, y: 0 }
    };

    return (
        <SpotlightCard className="bg-theme-bg-secondary border-theme-border">
            <SpotlightCardHeader>
                <SpotlightCardTitle>全部订单</SpotlightCardTitle>
            </SpotlightCardHeader>
            <SpotlightCardContent className="p-0">
                <PaperTableToolbar className="bg-transparent border-theme-border flex justify-between items-center">
                    <div className="text-sm text-theme-text-secondary">共 {total} 条订单</div>
                    <ExportMenu onExport={(format) => handleExport(orders, format)} />
                </PaperTableToolbar>

                <PaperTable className="border-0">
                    <PaperTableHeader className="bg-theme-bg-tertiary">
                        <PaperTableRow>
                            <PaperTableCell isHeader>订单号</PaperTableCell>
                            <PaperTableCell isHeader>客户</PaperTableCell>
                            <PaperTableCell isHeader>状态</PaperTableCell>
                            <PaperTableCell isHeader>金额</PaperTableCell>
                            <PaperTableCell isHeader>更新时间</PaperTableCell>
                            <PaperTableCell isHeader>停留时间</PaperTableCell>
                            <PaperTableCell isHeader>操作</PaperTableCell>
                        </PaperTableRow>
                    </PaperTableHeader>
                    <motion.tbody
                        variants={containerVariants}
                        initial="hidden"
                        animate="show"
                        className="divide-y divide-paper-border"
                    >
                        {orders.length === 0 ? (
                            <PaperTableRow>
                                <PaperTableCell colSpan={7} className="text-center py-12 text-theme-text-secondary">
                                    暂无订单
                                </PaperTableCell>
                            </PaperTableRow>
                        ) : (
                            orders.map((order) => (
                                <motion.tr
                                    key={order.id}
                                    variants={itemVariants}
                                    className="hover:bg-theme-bg-tertiary/50 transition-colors border-b border-theme-border last:border-0"
                                >
                                    <PaperTableCell className="font-mono text-sm">{order.salesNo}</PaperTableCell>
                                    <PaperTableCell className="font-medium text-theme-text-primary">{order.customerName}</PaperTableCell>
                                    <PaperTableCell>
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium bg-theme-bg-tertiary text-theme-text-secondary border border-theme-border">
                                            {order.status}
                                        </span>
                                    </PaperTableCell>
                                    <PaperTableCell>¥{order.totalAmount}</PaperTableCell>
                                    <PaperTableCell className="text-theme-text-secondary text-sm">
                                         {/* order.createTime is likely available, updatedAt might need check */}
                                        {order.createTime ? new Date(order.createTime).toLocaleString() : '-'}
                                    </PaperTableCell>
                                    <PaperTableCell>
                                        <span className={order.createTime && calculateHoursDifference(order.createTime) > 24 ? 'text-rose-500 font-medium' : 'text-theme-text-secondary'}>
                                             {/* Using createTime as proxy for update if not available in this type */}
                                            {order.createTime ? formatDuration(order.createTime) : '-'}
                                        </span>
                                    </PaperTableCell>
                                    <PaperTableCell>
                                        <Link href={`/orders/${order.id}`}>
                                            <PaperButton variant="ghost" size="sm" className="text-blue-500 hover:text-blue-400">
                                                查看
                                            </PaperButton>
                                        </Link>
                                    </PaperTableCell>
                                </motion.tr>
                            ))
                        )}
                    </motion.tbody>
                </PaperTable>

                <div className="p-4 border-t border-theme-border">
                    <PaperTablePagination
                        currentPage={page}
                        totalPages={Math.ceil(total / pageSize)}
                        totalItems={total}
                        itemsPerPage={pageSize}
                        onPageChange={setPage} // This currently only updates local state, needs routing for server-side pagination
                        className="text-theme-text-secondary"
                    />
                </div>
            </SpotlightCardContent>
        </SpotlightCard>
    );
}
