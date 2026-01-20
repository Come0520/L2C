'use client';

import { useState } from 'react';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/shared/ui/table';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select';
import { Checkbox } from '@/shared/ui/checkbox';
import Eye from 'lucide-react/dist/esm/icons/eye';
import Printer from 'lucide-react/dist/esm/icons/printer';
import Filter from 'lucide-react/dist/esm/icons/filter';
import Search from 'lucide-react/dist/esm/icons/search';
import { StatusBadge } from '@/shared/ui/status-badge';
import Link from 'next/link';
import { format } from 'date-fns';

interface POTableProps {
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

export function EnhancedPOTable({ data, onFilterChange }: POTableProps) {
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [filters, setFilters] = useState<POFilters>({});
    const [showFilters, setShowFilters] = useState(false);

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

    const handleFilterChange = (key: keyof POFilters, value: any) => {
        const newFilters = { ...filters, [key]: value };
        setFilters(newFilters);
        onFilterChange?.(newFilters);
    };

    const handleBatchConfirm = () => {
        console.log('Batch confirm POs:', Array.from(selectedIds));
    };

    const filteredData = data.filter(item => {
        if (filters.searchQuery) {
            const query = filters.searchQuery.toLowerCase();
            return item.poNo.toLowerCase().includes(query) ||
                item.supplierName.toLowerCase().includes(query);
        }
        if (filters.supplier && item.supplierId !== filters.supplier) return false;
        if (filters.paymentStatus && item.paymentStatus !== filters.paymentStatus) return false;
        if (filters.status && item.status !== filters.status) return false;
        return true;
    });

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowFilters(!showFilters)}
                    >
                        <Filter className="mr-2 h-4 w-4" />
                        筛选
                    </Button>
                    {selectedIds.size > 0 && (
                        <Button size="sm" onClick={handleBatchConfirm}>
                            批量确认下单 ({selectedIds.size})
                        </Button>
                    )}
                </div>
                <div className="flex items-center gap-2">
                    <div className="relative">
                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="搜索采购单号/供应商"
                            className="pl-8 w-64"
                            value={filters.searchQuery || ''}
                            onChange={(e) => handleFilterChange('searchQuery', e.target.value)}
                        />
                    </div>
                </div>
            </div>

            {showFilters && (
                <div className="flex gap-4 p-4 border rounded-md glass-panel">
                    <div className="flex-1">
                        <label className="text-sm font-medium mb-2 block">付款状态</label>
                        <Select
                            value={filters.paymentStatus || 'all'}
                            onValueChange={(value) => handleFilterChange('paymentStatus', value === 'all' ? undefined : value)}
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
                    <div className="flex-1">
                        <label className="text-sm font-medium mb-2 block">采购单状态</label>
                        <Select
                            value={filters.status || 'all'}
                            onValueChange={(value) => handleFilterChange('status', value === 'all' ? undefined : value)}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="全部状态" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">全部</SelectItem>
                                <SelectItem value="DRAFT">草稿</SelectItem>
                                <SelectItem value="IN_PRODUCTION">生产中</SelectItem>
                                <SelectItem value="READY">备货完成</SelectItem>
                                <SelectItem value="SHIPPED">已发货</SelectItem>
                                <SelectItem value="DELIVERED">已到货</SelectItem>
                                <SelectItem value="CANCELLED">已取消</SelectItem>
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
                                    checked={selectedIds.size === filteredData.length && filteredData.length > 0}
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
                        {filteredData.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={10} className="h-24 text-center">
                                    暂无采购单数据
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredData.map((item) => (
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