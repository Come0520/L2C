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
import { StatusBadge } from '@/shared/ui/status-badge';
import Link from 'next/link';
import { format } from 'date-fns';

interface POTableProps {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data: any[];
    onFilterChange?: (filters: POFilters) => void;
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
    { value: 'DRAFT', label: '草稿' },
    { value: 'IN_PRODUCTION', label: '生产中' },
    { value: 'READY', label: '备货完成' },
    { value: 'SHIPPED', label: '已发货' },
    { value: 'DELIVERED', label: '已到货' },
    { value: 'CANCELLED', label: '已取消' },
];

export function EnhancedPOTable({ data }: POTableProps) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    // Initialize state from URL params
    const initialStatus = searchParams.get('status') || 'all';
    const initialSearch = searchParams.get('search') || '';
    const initialPaymentStatus = searchParams.get('paymentStatus') || 'all';

    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [showFilters, setShowFilters] = useState(false);

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
        console.log('Batch confirm:', Array.from(selectedIds));
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
                                        <Link href={`/supply-chain/po/${item.id}`} className="hover:underline">
                                            {item.poNo}
                                        </Link>
                                    </TableCell>
                                    <TableCell>
                                        {item.orderNo && (
                                            <Link href={`/orders/${item.orderId}`} className="text-sm text-muted-foreground hover:underline">
                                                {item.orderNo}
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
                                        <StatusBadge status={item.status} />
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
                                        {format(new Date(item.createdAt), 'yyyy-MM-dd HH:mm')}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Button variant="ghost" size="icon" asChild>
                                            <Link href={`/supply-chain/po/${item.id}`}>
                                                <Eye className="h-4 w-4" />
                                            </Link>
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
        </div>
    );
}