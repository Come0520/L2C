'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { UrlSyncedTabs } from '@/components/ui/url-synced-tabs';
import { DataTableToolbar } from '@/components/ui/data-table-toolbar';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/shared/ui/table';
import { Button } from '@/shared/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select';
import { Checkbox } from '@/shared/ui/checkbox';
import Eye from 'lucide-react/dist/esm/icons/eye';
import Printer from 'lucide-react/dist/esm/icons/printer';
import Filter from 'lucide-react/dist/esm/icons/filter';
import Link from 'next/link';
import { format } from 'date-fns';
import { PurchaseOrderPreviewDialog } from './purchase-order-preview-dialog';
import { AddLogisticsDialog } from './add-logistics-dialog';
import { ConfirmQuoteDialog } from './confirm-quote-dialog';
import { ConfirmPaymentDialog } from './confirm-payment-dialog';
import { ConfirmReceiptDialog } from './confirm-receipt-dialog';
import Truck from 'lucide-react/dist/esm/icons/truck';
import FileCheck from 'lucide-react/dist/esm/icons/file-check';
import CreditCard from 'lucide-react/dist/esm/icons/credit-card';
import PackageCheck from 'lucide-react/dist/esm/icons/package-check';
import { PO_STATUS_LABELS } from '../constants';


interface PurchaseOrderItem {
    id: string;
    productId: string;
    productName: string;
    quantity: string | number;
    unitPrice: string | number;
    subtotal: string | number;
}

interface PurchaseOrder {
    id: string;
    poNo: string;
    status: string | null;
    supplierName: string;
    createdAt: string | Date | null;
    expectedDate?: string | Date;
    totalAmount: string | number;
    logisticsNo?: string;
    logisticsCompany?: string;
    shippedAt?: string | Date;
    remark?: string;
    orderId?: string | null;
    order?: { orderNo: string } | null;
    creator?: { name: string } | null;
    items?: PurchaseOrderItem[];
    type?: 'FINISHED' | 'FABRIC' | 'STOCK'; // Add type
    paymentStatus?: 'PENDING' | 'PAID' | 'PARTIAL'; // Add paymentStatus
}

interface POTableProps {
    data: PurchaseOrder[];
}

export interface POFilters {
    dateRange?: { start: Date; end: Date };
    supplier?: string;
    paymentStatus?: string;
    status?: string;
    searchQuery?: string;
}

const STATUS_TABS = [
    { value: 'all', label: '全部' },
    { value: 'pending', label: '待处理' },
    { value: 'active', label: '执行中' },
    { value: 'inbound', label: '物流/入库' },
    { value: 'history', label: '历史归档' },
];

export function EnhancedPOTable({ data }: POTableProps) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    // Initialize state from URL params
    const initialSearch = searchParams.get('search') || '';
    const initialPaymentStatus = searchParams.get('paymentStatus') || 'all';

    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [showFilters, setShowFilters] = useState(false);
    const [previewPO, setPreviewPO] = useState<PurchaseOrder | null>(null);
    const [logisticsPOId, setLogisticsPOId] = useState<string | null>(null);
    const [quotePOId, setQuotePOId] = useState<string | null>(null);
    const [paymentPOId, setPaymentPOId] = useState<string | null>(null);
    const [receiptPO, setReceiptPO] = useState<PurchaseOrder | null>(null);


    // Create a query update handler
    const createQueryString = useCallback(
        (params: Record<string, string | null | undefined>) => {
            const newSearchParams = new URLSearchParams(searchParams.toString());

            Object.entries(params).forEach(([key, value]) => {
                if (value === null || value === undefined || value === 'all' || value === '') {
                    newSearchParams.delete(key);
                } else {
                    newSearchParams.set(key, value);
                }
            });
            // Reset page to 1 when filters change
            newSearchParams.set('page', '1');

            return newSearchParams.toString();
        },
        [searchParams]
    );



    // We need a local state for search input to avoid lag, and debounce the URL update
    const [searchValue, setSearchValue] = useState(initialSearch);

    // Sync local search value with URL param if it changes externally
    useEffect(() => {
        setSearchValue(initialSearch);
    }, [initialSearch]);

    // Debounce search update
    useEffect(() => {
        const timer = setTimeout(() => {
            if (searchValue !== initialSearch) {
                router.push(`${pathname}?${createQueryString({ search: searchValue })}`);
            }
        }, 500);
        return () => clearTimeout(timer);
    }, [searchValue, initialSearch, pathname, router, createQueryString]);


    const handlePaymentStatusChange = (value: string) => {
        router.push(`${pathname}?${createQueryString({ paymentStatus: value })}`);
    };

    const handleSelectAll = (checked: boolean) => {
        if (checked) {
            setSelectedIds(new Set(data.map(item => item.id)));
        } else {
            setSelectedIds(new Set());
        }
    };

    const handleSelectRow = (id: string, checked: boolean) => {
        const newSelected = new Set(selectedIds);
        if (checked) {
            newSelected.add(id);
        } else {
            newSelected.delete(id);
        }
        setSelectedIds(newSelected);
    };

    const handleBatchConfirm = () => {
    };

    return (
        <div className="space-y-4">
            <UrlSyncedTabs
                tabs={STATUS_TABS}
                paramName="status"
                defaultValue="all"
                layoutId="po-status-tabs"
            />

            <DataTableToolbar
                searchProps={{
                    value: searchValue,
                    onChange: setSearchValue,
                    placeholder: "搜索采购单号/供应商..."
                }}
                actions={
                    <>
                        {selectedIds.size > 0 && (
                            <Button size="sm" onClick={handleBatchConfirm}>
                                批量确认下单 ({selectedIds.size})
                            </Button>
                        )}
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setShowFilters(!showFilters)}
                        >
                            <Filter className="mr-2 h-4 w-4" />
                            筛选
                        </Button>
                    </>
                }
                className="border-none shadow-none p-0 bg-transparent"
            />

            {showFilters && (
                <div className="flex gap-4 p-4 border rounded-md glass-panel">
                    <div className="flex-1">
                        <label className="text-sm font-medium mb-2 block">付款状态</label>
                        <Select
                            value={initialPaymentStatus}
                            onValueChange={handlePaymentStatusChange}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="全部状态" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">全部</SelectItem>
                                <SelectItem value="PENDING">待付款</SelectItem>
                                <SelectItem value="PARTIAL">部分付款</SelectItem>
                                <SelectItem value="PAID">已付款</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            )}


            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-10">
                                <Checkbox
                                    checked={selectedIds.size === data.length && data.length > 0}
                                    onCheckedChange={handleSelectAll}
                                />
                            </TableHead>
                            <TableHead>采购单号</TableHead>
                            <TableHead>关联订单</TableHead>
                            <TableHead>供应商</TableHead>
                            <TableHead>类型</TableHead>
                            <TableHead>采购金额</TableHead>
                            <TableHead>状态</TableHead>
                            <TableHead>付款状态</TableHead>
                            <TableHead>创建时间</TableHead>
                            <TableHead className="text-right">操作</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {data.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={10} className="h-24 text-center">
                                    暂无采购单数据
                                </TableCell>
                            </TableRow>
                        ) : (
                            data.map((item) => (
                                <TableRow key={item.id}>
                                    <TableCell>
                                        <Checkbox
                                            checked={selectedIds.has(item.id)}
                                            onCheckedChange={(checked) => handleSelectRow(item.id, checked as boolean)}
                                        />
                                    </TableCell>
                                    <TableCell className="font-medium">
                                        <button
                                            onClick={() => setPreviewPO(item)}
                                            className="hover:underline text-left"
                                        >
                                            {item.poNo}
                                        </button>
                                    </TableCell>
                                    <TableCell>
                                        {item.order?.orderNo && (
                                            <Link href={`/orders/${item.orderId}`} className="text-sm text-muted-foreground hover:underline">
                                                {item.order.orderNo}
                                            </Link>
                                        )}
                                    </TableCell>
                                    <TableCell>{item.supplierName}</TableCell>
                                    <TableCell>
                                        <span className={
                                            item.type === 'FINISHED' ? 'glass-alert-info px-2 py-1 rounded text-xs' :
                                                item.type === 'FABRIC' ? 'glass-alert-success px-2 py-1 rounded text-xs' :
                                                    'glass-step-inactive px-2 py-1 rounded text-xs'
                                        }>
                                            {item.type === 'FINISHED' ? '成品' :
                                                item.type === 'FABRIC' ? '面料' : '内部备货'}
                                        </span>
                                    </TableCell>
                                    <TableCell className="text-right">¥{item.totalAmount}</TableCell>
                                    <TableCell>
                                        <span className={
                                            item.status === 'COMPLETED' ? 'glass-alert-success px-2 py-1 rounded text-xs' :
                                                item.status === 'CANCELLED' ? 'glass-step-inactive px-2 py-1 rounded text-xs' :
                                                    item.status === 'PENDING_PAYMENT' || item.status === 'PENDING_CONFIRMATION' ? 'glass-alert-warning px-2 py-1 rounded text-xs' :
                                                        item.status === 'DRAFT' ? 'glass-step-inactive px-2 py-1 rounded text-xs' :
                                                            'glass-alert-info px-2 py-1 rounded text-xs'
                                        }>
                                            {PO_STATUS_LABELS[item.status ?? ''] || item.status || '-'}
                                        </span>
                                    </TableCell>
                                    <TableCell>
                                        <span className={
                                            item.paymentStatus === 'PAID' ? 'glass-alert-success px-2 py-1 rounded text-xs' :
                                                item.paymentStatus === 'PARTIAL' ? 'glass-alert-warning px-2 py-1 rounded text-xs' :
                                                    'glass-step-inactive px-2 py-1 rounded text-xs'
                                        }>
                                            {item.paymentStatus === 'PAID' ? '已付款' :
                                                item.paymentStatus === 'PARTIAL' ? '部分付款' : '待付款'}
                                        </span>
                                    </TableCell>
                                    <TableCell className="text-sm text-muted-foreground">
                                        {item.createdAt ? format(new Date(item.createdAt), 'yyyy-MM-dd HH:mm') : '-'}
                                    </TableCell>
                                    <TableCell className="text-right space-x-1">
                                        {item.status === 'READY' && (
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => setLogisticsPOId(item.id)}
                                                title="填写物流"
                                            >
                                                <Truck className="h-4 w-4" />
                                            </Button>
                                        )}
                                        {item.status === 'PENDING_CONFIRMATION' && (
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => setQuotePOId(item.id)}
                                                title="确认报价"
                                            >
                                                <FileCheck className="h-4 w-4 text-orange-500" />
                                            </Button>
                                        )}
                                        {item.status === 'PENDING_PAYMENT' && (
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => setPaymentPOId(item.id)}
                                                title="确认付款"
                                            >
                                                <CreditCard className="h-4 w-4 text-blue-500" />
                                            </Button>
                                        )}
                                        {item.status === 'SHIPPED' && (
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => setReceiptPO(item)}
                                                title="确认收货"
                                            >
                                                <PackageCheck className="h-4 w-4 text-green-500" />
                                            </Button>
                                        )}
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => setPreviewPO(item)}
                                            title="查看详情"
                                        >
                                            <Eye className="h-4 w-4" />
                                        </Button>
                                        <Button variant="ghost" size="icon">
                                            <Printer className="h-4 w-4" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            <PurchaseOrderPreviewDialog
                open={!!previewPO}
                onOpenChange={(open) => !open && setPreviewPO(null)}
                data={previewPO}
            />

            {logisticsPOId && (
                <AddLogisticsDialog
                    open={!!logisticsPOId}
                    onClose={() => {
                        setLogisticsPOId(null);
                        router.refresh();
                    }}
                    poId={logisticsPOId}
                />
            )}

            {quotePOId && (
                <ConfirmQuoteDialog
                    open={!!quotePOId}
                    onOpenChange={(open) => !open && setQuotePOId(null)}
                    poId={quotePOId}
                    defaultAmount={data.find(p => p.id === quotePOId)?.totalAmount}
                />
            )}

            {paymentPOId && (
                <ConfirmPaymentDialog
                    open={!!paymentPOId}
                    onOpenChange={(open) => !open && setPaymentPOId(null)}
                    poId={paymentPOId}
                    totalAmount={data.find(p => p.id === paymentPOId)?.totalAmount}
                />
            )}

            {receiptPO && receiptPO.items && (
                <ConfirmReceiptDialog
                    open={!!receiptPO}
                    onOpenChange={(open) => !open && setReceiptPO(null)}
                    po={{
                        id: receiptPO.id,
                        items: receiptPO.items.map(i => ({
                            productId: i.productId,
                            productName: i.productName,
                            quantity: i.quantity
                        }))
                    }}
                />
            )}
        </div>
    );
}
