'use client';

import React from 'react';
import { DatePickerWithRange } from '@/shared/ui/date-range-picker';
import { Button } from '@/shared/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select';
import X from 'lucide-react/dist/esm/icons/x';

/**
 * 订单筛选条件类型
 */
export interface OrderFilters {
    salesId?: string;
    channelId?: string;
    designerId?: string;
    referrerId?: string;
    address?: string; // 已合并到通用搜索，这里保留类型兼容但界面上移除
    dateRange?: { from: Date; to: Date };
}

export interface OrderAdvancedFilterProps {
    filters: OrderFilters;
    onFiltersChange: (filters: OrderFilters) => void;
    salesOptions?: { id: string; name: string }[];
    channelOptions?: { id: string; name: string }[];
    designerOptions?: { id: string; name: string }[];
    referrerOptions?: { id: string; name: string }[];
}

/**
 * 订单高级筛选 - 平铺式
 */
export function OrderAdvancedFilter({
    filters,
    onFiltersChange,
    salesOptions = [],
    channelOptions = [],
    designerOptions = [],
    referrerOptions = [],
}: OrderAdvancedFilterProps) {

    const handleFilterChange = (key: keyof OrderFilters, value: string | string[] | undefined) => {
        const newFilters = { ...filters, [key]: value === 'ALL' ? undefined : value };
        onFiltersChange(newFilters);
    };

    const handleDateRangeChange = (range: { from?: Date; to?: Date } | undefined) => {
        if (range?.from && range?.to) {
            onFiltersChange({ ...filters, dateRange: { from: range.from, to: range.to } });
        } else {
            onFiltersChange({ ...filters, dateRange: undefined });
        }
    };

    const handleClear = () => {
        onFiltersChange({});
    };

    const hasFilters = Object.values(filters).some(v => v !== undefined);

    return (
        <div className="flex flex-wrap items-center gap-2">
            {/* 销售人员 */}
            <Select
                value={filters.salesId || 'ALL'}
                onValueChange={(v) => handleFilterChange('salesId', v)}
            >
                <SelectTrigger className="w-[120px] bg-muted/20 border-white/10 h-9">
                    <SelectValue placeholder="销售" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="ALL">所有销售</SelectItem>
                    {salesOptions.map((opt) => (
                        <SelectItem key={opt.id} value={opt.id}>{opt.name}</SelectItem>
                    ))}
                </SelectContent>
            </Select>

            {/* 渠道 */}
            <Select
                value={filters.channelId || 'ALL'}
                onValueChange={(v) => handleFilterChange('channelId', v)}
            >
                <SelectTrigger className="w-[120px] bg-muted/20 border-white/10 h-9">
                    <SelectValue placeholder="渠道" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="ALL">所有渠道</SelectItem>
                    {channelOptions.map((opt) => (
                        <SelectItem key={opt.id} value={opt.id}>{opt.name}</SelectItem>
                    ))}
                </SelectContent>
            </Select>

            {/* 设计师 */}
            <Select
                value={filters.designerId || 'ALL'}
                onValueChange={(v) => handleFilterChange('designerId', v)}
            >
                <SelectTrigger className="w-[120px] bg-muted/20 border-white/10 h-9">
                    <SelectValue placeholder="设计师" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="ALL">所有设计师</SelectItem>
                    {designerOptions.map((opt) => (
                        <SelectItem key={opt.id} value={opt.id}>{opt.name}</SelectItem>
                    ))}
                </SelectContent>
            </Select>

            {/* 带单人 - 为避免过宽，可能需要根据实际屏幕调整，这里先平铺 */}
            <Select
                value={filters.referrerId || 'ALL'}
                onValueChange={(v) => handleFilterChange('referrerId', v)}
            >
                <SelectTrigger className="w-[120px] bg-muted/20 border-white/10 h-9">
                    <SelectValue placeholder="带单人" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="ALL">所有带单人</SelectItem>
                    {referrerOptions.map((opt) => (
                        <SelectItem key={opt.id} value={opt.id}>{opt.name}</SelectItem>
                    ))}
                </SelectContent>
            </Select>

            {/* 日期筛选 */}
            <div className="w-[240px]">
                <DatePickerWithRange
                    date={filters.dateRange ? { from: filters.dateRange.from, to: filters.dateRange.to || undefined } : undefined}
                    setDate={handleDateRangeChange}
                    className="h-9"
                />
            </div>

            {hasFilters && (
                <Button variant="ghost" size="icon" onClick={handleClear} className="h-9 w-9">
                    <X className="h-4 w-4" />
                </Button>
            )}
        </div>
    );
}

export default OrderAdvancedFilter;
