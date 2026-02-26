'use client';

import React from 'react';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from '@/shared/ui/table';
import { Button } from '@/shared/ui/button';
import { Badge } from '@/shared/ui/badge';
import Plus from 'lucide-react/dist/esm/icons/plus';
import Eye from 'lucide-react/dist/esm/icons/eye';
import { useState } from 'react';
import { PaymentBillDialog } from './PaymentBillDialog';
import { format } from 'date-fns';
import Link from 'next/link';
import { EmptyTableRow } from '@/shared/ui/empty-table-row';

import { APStatementWithRelations, APSupplierStatementWithRelations, APLaborStatementWithRelations } from '../types';

interface APStatementTableProps {
    data: APStatementWithRelations[];
    type: 'SUPPLIER' | 'LABOR';
}

const getStatusVariant = (status: string): "success" | "info" | "warning" | "error" | "secondary" | "default" => {
    const variants: Record<string, "success" | "info" | "warning" | "error" | "secondary" | "default"> = {
        CALCULATED: 'secondary',
        CONFIRMED: 'info',
        PARTIAL: 'warning',
        COMPLETED: 'success',
        VOIDED: 'error',
    };
    return variants[status] || 'secondary';
};

const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
        CALCULATED: '已试算',
        CONFIRMED: '已确认',
        PARTIAL: '部分付款',
        COMPLETED: '已付完',
        VOIDED: '已作废',
    };
    return labels[status] || status;
};

interface APStatementTableRowProps {
    item: APStatementWithRelations;
    type: 'SUPPLIER' | 'LABOR';
    onCreatePayment: (statement: APStatementWithRelations) => void;
}

/**
 * 应付账单数据行组件 (AP Statement Table Row)
 * 
 * 使用 `React.memo` 优化重渲染性能，呈现单条应付账单核心指标：
 * 总金额、已付金额、待付金额及业务关联对象等，并提供收银/付款操作入口。
 * 
 * @param {APStatementTableRowProps} props - 行渲染属性
 */
const APStatementTableRow = React.memo(function APStatementTableRow({ item, type, onCreatePayment }: APStatementTableRowProps) {
    const isSupplier = type === 'SUPPLIER';

    const renderSecondaryField = () => {
        if (isSupplier) {
            const supplierItem = item as APSupplierStatementWithRelations;
            return (
                <>
                    <TableCell>{supplierItem.supplier?.name || supplierItem.supplierName || '-'}</TableCell>
                    <TableCell>
                        <Link href={`/purchase-orders/${supplierItem.purchaseOrderId}`} className="text-blue-500 hover:underline">
                            {supplierItem.purchaseOrder?.poNo || '查看采购单'}
                        </Link>
                    </TableCell>
                </>
            );
        } else {
            const laborItem = item as APLaborStatementWithRelations;
            return (
                <>
                    <TableCell>{laborItem.worker?.name || laborItem.workerName || '-'}</TableCell>
                    <TableCell>{laborItem.settlementPeriod}</TableCell>
                </>
            );
        }
    };

    return (
        <TableRow key={item.id}>
            <TableCell className="font-medium">{item.statementNo}</TableCell>
            {renderSecondaryField()}
            <TableCell>¥{parseFloat(item.totalAmount).toLocaleString()}</TableCell>
            <TableCell className="text-blue-600">¥{parseFloat(item.paidAmount).toLocaleString()}</TableCell>
            <TableCell className="font-semibold text-orange-600">¥{parseFloat(item.pendingAmount).toLocaleString()}</TableCell>
            <TableCell>
                <Badge variant={getStatusVariant(item.status)}>
                    {getStatusLabel(item.status)}
                </Badge>
            </TableCell>
            <TableCell>{item.createdAt ? format(new Date(item.createdAt), 'yyyy-MM-dd') : '-'}</TableCell>
            <TableCell className="text-right space-x-2">
                <Button variant="ghost" size="icon" title="查看明细" asChild>
                    <Link href={`/finance/ap/${type.toLowerCase()}/${item.id}`}>
                        <Eye className="w-4 h-4" />
                    </Link>
                </Button>
                {parseFloat(item.pendingAmount) > 0 && (
                    <Button variant="ghost" size="icon" title="提交付款" onClick={() => onCreatePayment(item)}>
                        <Plus className="w-4 h-4" />
                    </Button>
                )}
            </TableCell>
        </TableRow>
    );
});

/**
 * 应付账单核心数据表格 (AP Statement Table)
 * 
 * 支持“供应商应付”与“劳务应付”两种类型面板。
 * 具备表格明细清单概览、空状态提示、快捷进入对账/付款单的触发能力。
 * 
 * @param {APStatementTableProps} props - 表格渲染数据和业务类型区分标识
 * @returns {JSX.Element} 应付对账单表格的 React 回显结构
 */
export function APStatementTable({ data, type }: APStatementTableProps) {
    const [isBillDialogOpen, setIsBillDialogOpen] = useState(false);
    const [selectedStatement, setSelectedStatement] = useState<APStatementWithRelations | null>(null);

    const handleCreatePayment = React.useCallback((statement: APStatementWithRelations | null) => {
        setSelectedStatement(statement);
        setIsBillDialogOpen(true);
    }, []);

    const title = type === 'SUPPLIER' ? '供应商应付' : '劳务结算';

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">{title}</h3>
                <Button size="sm" onClick={() => handleCreatePayment(null)}>
                    <Plus className="w-4 h-4 mr-1" />
                    新建付款单
                </Button>
            </div>

            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>账单编号</TableHead>
                            <TableHead>{type === 'SUPPLIER' ? '供应商' : '安装工'}</TableHead>
                            <TableHead>期间/订单</TableHead>
                            <TableHead>总额</TableHead>
                            <TableHead>已付</TableHead>
                            <TableHead>待付</TableHead>
                            <TableHead>状态</TableHead>
                            <TableHead>日期</TableHead>
                            <TableHead className="text-right">操作</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {data.length === 0 ? (
                            <EmptyTableRow colSpan={9} message="暂无应付记录" />
                        ) : (
                            data.map((item) => (
                                <APStatementTableRow
                                    key={item.id}
                                    item={item}
                                    type={type}
                                    onCreatePayment={handleCreatePayment}
                                />
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            <PaymentBillDialog
                open={isBillDialogOpen}
                onOpenChange={setIsBillDialogOpen}
                initialStatement={selectedStatement}
                statementType={type === 'SUPPLIER' ? 'AP_SUPPLIER' : 'AP_LABOR'}
            />
        </div>
    );
}
