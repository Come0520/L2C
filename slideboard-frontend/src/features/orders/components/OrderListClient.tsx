'use client';

import { motion } from 'framer-motion';
import { User, FileDown, Users, CheckSquare } from 'lucide-react';
import Link from 'next/link';
import React, { useState } from 'react';

import { BatchActionBar } from '@/components/ui/batch-action-bar';
import { BulkOperationProgress } from '@/components/ui/bulk-operation-progress';
import { ExportMenu } from '@/components/ui/export-menu';
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
import { ReassignModal } from '@/components/ui/reassign-modal';
import { SpotlightCard, SpotlightCardHeader, SpotlightCardTitle, SpotlightCardContent } from '@/components/ui/spotlight-card';
import { useExport } from '@/hooks/useExport';
import { OrderFormData } from '@/shared/types/order';
import { formatDuration, calculateHoursDifference } from '@/utils/date';

interface OrderListClientProps {
    initialOrders: OrderFormData[];
    initialTotal: number;
    initialPage: number;
    initialPageSize: number;
    salesUsers?: Array<{ id: string; name: string }>;
}

export function OrderListClient({
    initialOrders,
    initialTotal,
    initialPage,
    initialPageSize,
    salesUsers = []
}: OrderListClientProps) {
    const [orders] = useState<OrderFormData[]>(initialOrders);
    const [total] = useState(initialTotal);
    const [page, setPage] = useState(initialPage);
    const [pageSize] = useState(initialPageSize);
    const [selectedOrderIds, setSelectedOrderIds] = useState<string[]>([]);
    const [showBulkProgress, setShowBulkProgress] = useState(false);
    const [reassignModalOpen, setReassignModalOpen] = useState(false);
    const [bulkOperation, setBulkOperation] = useState<{
        title: string;
        total: number;
        current: number;
        successCount: number;
        failedCount: number;
        failedItems?: Array<{ id: string; name?: string; reason: string }>;
    }>({
        title: '批量操作',
        total: 0,
        current: 0,
        successCount: 0,
        failedCount: 0
    });

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

    // 处理全选/取消全选
    const handleSelectAll = (checked: boolean) => {
        if (checked) {
            setSelectedOrderIds(orders.map(order => order.id || ''));
        } else {
            setSelectedOrderIds([]);
        }
    };

    // 处理单个订单选择
    const handleSelectOrder = (orderId: string, checked: boolean) => {
        if (checked) {
            setSelectedOrderIds([...selectedOrderIds, orderId]);
        } else {
            setSelectedOrderIds(selectedOrderIds.filter(id => id !== orderId));
        }
    };

    // 处理批量操作
    const handleBulkAction = async (action: string) => {
        if (selectedOrderIds.length === 0) {
            alert('请先选择订单');
            return;
        }

        if (action === 'assign') {
            setReassignModalOpen(true);
            return;
        }

        // 导入salesOrderService服务
        const { salesOrderService } = await import('@/services/salesOrders.client');

        // 设置初始批量操作状态
        setBulkOperation({
            title: action === 'export' ? '批量导出订单' : '批量操作',
            total: selectedOrderIds.length,
            current: 0,
            successCount: 0,
            failedCount: 0
        });
        setShowBulkProgress(true);

        try {
            if (action === 'export') {
                // 调用批量导出服务
                const result = await salesOrderService.exportOrders(selectedOrderIds, 'csv');
                if (result.code === 0 && result.data) {
                    // 导出成功，更新进度
                    setBulkOperation(prev => ({
                        ...prev,
                        current: selectedOrderIds.length,
                        successCount: selectedOrderIds.length,
                        failedCount: 0
                    }));
                    // 打开下载链接
                    window.open(result.data.downloadUrl, '_blank');
                } else {
                    // 导出失败
                    setBulkOperation(prev => ({
                        ...prev,
                        current: selectedOrderIds.length,
                        successCount: 0,
                        failedCount: selectedOrderIds.length,
                        failedItems: selectedOrderIds.map(id => ({
                            id,
                            name: orders.find(order => order.id === id)?.salesNo || '',
                            reason: result.message || '导出失败'
                        }))
                    }));
                }
            }
        } catch (error) {
            console.error('批量操作失败:', error);
            // 更新批量操作状态为失败
            setBulkOperation(prev => ({
                ...prev,
                current: selectedOrderIds.length,
                successCount: 0,
                failedCount: selectedOrderIds.length,
                failedItems: selectedOrderIds.map(id => ({
                    id,
                    name: orders.find(order => order.id === id)?.salesNo || '',
                    reason: error instanceof Error ? error.message : '操作失败'
                }))
            }));
        }
    };

    const handleAssignSales = async (itemIds: string[], userId: string) => {
        const { salesOrderService } = await import('@/services/salesOrders.client');
        
        setBulkOperation({
            title: '批量分配销售人员',
            total: itemIds.length,
            current: 0,
            successCount: 0,
            failedCount: 0
        });
        setShowBulkProgress(true);

        try {
            const result = await salesOrderService.batchAssignSalesPerson(itemIds, userId);
            
            if (result.data) {
                setBulkOperation(prev => ({
                    ...prev,
                    current: itemIds.length,
                    successCount: result.data!.successCount,
                    failedCount: result.data!.failedCount,
                    failedItems: result.data!.failedOrders.map(item => ({
                        id: item.orderId,
                        name: item.orderNo,
                        reason: item.reason
                    }))
                }));
            }
        } catch (error) {
             setBulkOperation(prev => ({
                ...prev,
                current: itemIds.length,
                successCount: 0,
                failedCount: itemIds.length,
                failedItems: itemIds.map(id => ({
                    id,
                    name: orders.find(o => o.id === id)?.salesNo || '',
                    reason: error instanceof Error ? error.message : '操作失败'
                }))
            }));
        }
    };

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
                    <div className="flex items-center gap-4">
                        <div className="text-sm text-theme-text-secondary">共 {total} 条订单</div>
                        {selectedOrderIds.length > 0 && (
                            <div className="text-sm font-medium text-theme-text-primary">
                                已选择 {selectedOrderIds.length} 条订单
                            </div>
                        )}
                    </div>
                    <div className="flex items-center gap-2">
                        {selectedOrderIds.length > 0 && (
                            <>
                                <PaperButton 
                                    variant="outline" 
                                    size="sm"
                                    onClick={() => handleBulkAction('assign')}
                                >
                                    批量分配
                                </PaperButton>
                                <PaperButton 
                                    variant="outline" 
                                    size="sm"
                                    onClick={() => handleBulkAction('export')}
                                >
                                    批量导出
                                </PaperButton>
                            </>
                        )}
                        <ExportMenu onExport={(format) => handleExport(orders, format)} />
                    </div>
                </PaperTableToolbar>

                <PaperTable className="border-0">
                    <PaperTableHeader className="bg-theme-bg-tertiary">
                        <PaperTableRow>
                            <PaperTableCell isHeader className="w-10">
                                <input
                                    type="checkbox"
                                    checked={selectedOrderIds.length === orders.length && orders.length > 0}
                                    onChange={(e) => handleSelectAll(e.target.checked)}
                                    className="cursor-pointer"
                                />
                            </PaperTableCell>
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
                                <PaperTableCell colSpan={8} className="text-center py-12 text-theme-text-secondary">
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
                                    <PaperTableCell className="w-10">
                                        <input
                                            type="checkbox"
                                            checked={selectedOrderIds.includes(order.id || '')}
                                            onChange={(e) => handleSelectOrder(order.id || '', e.target.checked)}
                                            className="cursor-pointer"
                                        />
                                    </PaperTableCell>
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

            {/* 批量操作栏 */}
            <BatchActionBar
                selectedCount={selectedOrderIds.length}
                onClearSelection={() => setSelectedOrderIds([])}
                actions={[
                    {
                        id: 'assign',
                        label: '分配销售',
                        icon: <Users className="w-4 h-4" />,
                        onClick: () => handleBulkAction('assign')
                    },
                    {
                        id: 'export',
                        label: '导出选中',
                        icon: <FileDown className="w-4 h-4" />,
                        onClick: () => handleBulkAction('export')
                    }
                ]}
            />

            {/* 重新分配模态框 */}
            <ReassignModal
                open={reassignModalOpen}
                onOpenChange={setReassignModalOpen}
                selectedIds={selectedOrderIds}
                users={salesUsers}
                title="批量分配销售人员"
                itemType="订单"
                onReassign={handleAssignSales}
            />

            {/* 批量操作进度模态框 */}
            <BulkOperationProgress
                isOpen={showBulkProgress}
                onClose={() => setShowBulkProgress(false)}
                title={bulkOperation.title}
                total={bulkOperation.total}
                current={bulkOperation.current}
                successCount={bulkOperation.successCount}
                failedCount={bulkOperation.failedCount}
                failedItems={bulkOperation.failedItems}
                onRetry={(failedIds) => {
                    // 处理重试逻辑
                    console.log('重试失败项:', failedIds);
                }}
                onExportFailedItems={(failedIds) => {
                    // 处理导出失败项
                    console.log('导出失败项:', failedIds);
                }}
            />
        </SpotlightCard>
    );
}
