'use client';

import { Button } from '@/shared/ui/button';
import { X } from 'lucide-react';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/shared/ui/select';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import { ChannelPicker } from '@/features/channels/components/channel-picker';
import { DatePickerWithRange } from '@/shared/ui/date-range-picker';
import { addDays, format } from 'date-fns';

interface LeadsAdvancedFilterProps {
    tenantId: string;
    salesList?: Array<{ id: string; name: string }>;
}

// 意向等级选项
const INTENTION_OPTIONS = [
    { value: 'HIGH', label: '高意向' },
    { value: 'MEDIUM', label: '中意向' },
    { value: 'LOW', label: '低意向' },
];

// 标签选项
const TAG_OPTIONS = [
    { value: 'INVITED', label: '已邀约' },
    { value: 'QUOTED', label: '已报价' },
    { value: 'VISITED', label: '已到店' },
    { value: 'MEASURED', label: '已测量' },
];

export function LeadsAdvancedFilter({ tenantId, salesList = [] }: LeadsAdvancedFilterProps) {
    const router = useRouter();
    const searchParams = useSearchParams();

    // 筛选状态
    const [filters, setFilters] = useState({
        intentionLevel: searchParams.get('intentionLevel') || '',
        channelId: searchParams.get('channelId') || '',
        salesId: searchParams.get('salesId') || '',
        tags: searchParams.get('tags') || '',
        dateFrom: searchParams.get('dateFrom') || '',
        dateTo: searchParams.get('dateTo') || '',
    });

    // 监听 filters 变化自动应用 (防抖? 或者直接 push 路由)
    // 这里为了响应迅速，我们在 onChange 时直接触发, 但为了避免过于频繁，通常在 Select onChange 时触发即可。
    // 但是 DatePicker 可能会频繁触发。

    // 直接复用 Measurement 的逻辑，单个 filter 变化直接更新 URL
    const updateUrl = (updates: Partial<typeof filters>) => {
        const params = new URLSearchParams(searchParams.toString());
        Object.entries(updates).forEach(([key, value]) => {
            if (value && value !== 'ALL') {
                params.set(key, value);
            } else {
                params.delete(key);
            }
        });
        params.set('page', '1');
        router.push(`?${params.toString()}`);
    };

    const handleFilterChange = (key: string, value: string) => {
        setFilters(prev => ({ ...prev, [key]: value }));
        updateUrl({ [key]: value });
    };

    const handleDateRangeChange = (range: any) => {
        const from = range?.from ? format(range.from, 'yyyy-MM-dd') : '';
        const to = range?.to ? format(range.to, 'yyyy-MM-dd') : '';
        setFilters(prev => ({ ...prev, dateFrom: from, dateTo: to }));
        updateUrl({ dateFrom: from, dateTo: to });
    };

    const handleClear = () => {
        const emptyState = {
            intentionLevel: '',
            channelId: '',
            salesId: '',
            tags: '',
            dateFrom: '',
            dateTo: '',
        };
        setFilters(emptyState);
        const params = new URLSearchParams(searchParams.toString());
        Object.keys(emptyState).forEach(k => params.delete(k));
        params.set('page', '1');
        router.push(`?${params.toString()}`);
    };

    const dateRange = filters.dateFrom ? {
        from: new Date(filters.dateFrom),
        to: filters.dateTo ? new Date(filters.dateTo) : undefined
    } : undefined;

    const hasFilters = Object.values(filters).some(v => v !== '' && v !== 'ALL');

    return (
        <div className="flex flex-wrap items-center gap-2">
            {/* 意向等级 */}
            <Select
                value={filters.intentionLevel || 'ALL'}
                onValueChange={(v) => handleFilterChange('intentionLevel', v)}
            >
                <SelectTrigger className="w-[120px] bg-muted/20 border-white/10 h-9">
                    <SelectValue placeholder="意向" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="ALL">所有意向</SelectItem>
                    {INTENTION_OPTIONS.map(opt => (
                        <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                </SelectContent>
            </Select>

            {/* 渠道 - ChannelPicker 需要确认是否支持高度自定义，还是用Select封装 */}
            {/* 为了简单统一，这里我们假设 ChannelPicker 能适应 button 样式，或者如果 ChannelPicker 复杂，我们先用简单 Select 占位？ */}
            {/* 之前的代码里用了 ChannelPicker，但现在为了统一 "平铺 Select" 风格，如果 ChannelPicker 是个 Dialog Trigger，那也行。但看 props 似乎是个 Select */}
            <div className="w-[140px]">
                {/* 暂时用 div 包裹 ChannelPicker 以限制宽度，实际上可能需要深入 ChannelPicker 修改样式 */}
                <ChannelPicker
                    tenantId={tenantId}
                    value={filters.channelId}
                    onChange={(v) => handleFilterChange('channelId', v)}
                    placeholder="渠道"
                // 假设 ChannelPicker 支持 className
                // className="h-9 bg-muted/20 border-white/10" 
                />
            </div>


            {/* 归属销售 */}
            <Select
                value={filters.salesId || 'ALL'}
                onValueChange={(v) => handleFilterChange('salesId', v)}
            >
                <SelectTrigger className="w-[120px] bg-muted/20 border-white/10 h-9">
                    <SelectValue placeholder="销售" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="ALL">所有销售</SelectItem>
                    <SelectItem value="UNASSIGNED">未分配</SelectItem>
                    {salesList.map(sales => (
                        <SelectItem key={sales.id} value={sales.id}>{sales.name}</SelectItem>
                    ))}
                </SelectContent>
            </Select>

            {/* 标签/阶段 */}
            <Select
                value={filters.tags || 'ALL'}
                onValueChange={(v) => handleFilterChange('tags', v)}
            >
                <SelectTrigger className="w-[120px] bg-muted/20 border-white/10 h-9">
                    <SelectValue placeholder="标签" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="ALL">所有标签</SelectItem>
                    {TAG_OPTIONS.map(opt => (
                        <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                </SelectContent>
            </Select>

            {/* 日期范围 */}
            <div className="w-[240px]">
                <DatePickerWithRange
                    date={dateRange}
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
