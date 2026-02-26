'use client';

import { Button } from '@/shared/ui/button';
import X from 'lucide-react/dist/esm/icons/x';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/shared/ui/select';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useTransition, useCallback, useMemo } from 'react';
import { ChannelPicker } from '@/features/channels/components/channel-picker';
import { DatePickerWithRange } from '@/shared/ui/date-range-picker';
import { MultiSelect } from '@/shared/ui/multi-select';
import { format } from 'date-fns';

/**
 * 线索模块高级筛选组件接口
 */
interface LeadsAdvancedFilterProps {
    /** 租户 ID */
    tenantId: string;
    /** 销售人员列表 */
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

/**
 * 线索模块高级筛选组件
 * 支持意向等级、渠道、销售、标签(多选)及日期范围过滤
 */
export function LeadsAdvancedFilter({ tenantId, salesList = [] }: LeadsAdvancedFilterProps) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [, startTransition] = useTransition();

    // 从 URL 解析初始状态
    const initialTags = useMemo(() => {
        const t = searchParams.get('tags');
        return t ? t.split(',').filter(Boolean) : [];
    }, [searchParams]);

    // 筛选状态
    const [filters, setFilters] = useState({
        intentionLevel: searchParams.get('intentionLevel') || '',
        channelId: searchParams.get('channelId') || '',
        salesId: searchParams.get('salesId') || '',
        tags: initialTags,
        dateFrom: searchParams.get('dateFrom') || '',
        dateTo: searchParams.get('dateTo') || '',
    });

    /**
     * 更新 URL 参数并触发导航
     */
    const updateUrl = useCallback((updates: Partial<typeof filters>) => {
        const params = new URLSearchParams(searchParams.toString());

        Object.entries(updates).forEach(([key, value]) => {
            if (Array.isArray(value)) {
                // 处理数组类型（如标签多选）
                if (value.length > 0) {
                    params.set(key, value.join(','));
                } else {
                    params.delete(key);
                }
            } else if (value && value !== 'ALL') {
                params.set(key, value as string);
            } else {
                params.delete(key);
            }
        });

        params.set('page', '1'); // 任何筛选变化都重置页码

        startTransition(() => {
            router.push(`?${params.toString()}`);
        });
    }, [router, searchParams]);

    /**
     * 处理普通单选变化
     */
    const handleFilterChange = (key: string, value: string) => {
        setFilters(prev => ({ ...prev, [key]: value }));
        updateUrl({ [key]: value });
    };

    /**
     * 处理多选变化（如标签）
     */
    const handleMultiFilterChange = (key: string, values: string[]) => {
        setFilters(prev => ({ ...prev, [key]: values }));
        updateUrl({ [key]: values });
    };

    /**
     * 处理日期范围变化
     */
    const handleDateRangeChange = (range: { from?: Date; to?: Date } | undefined) => {
        const from = range?.from ? format(range.from, 'yyyy-MM-dd') : '';
        const to = range?.to ? format(range.to, 'yyyy-MM-dd') : '';
        setFilters(prev => ({ ...prev, dateFrom: from, dateTo: to }));
        updateUrl({ dateFrom: from, dateTo: to });
    };

    /**
     * 清空所有筛选条件
     */
    const handleClear = () => {
        const emptyState = {
            intentionLevel: '',
            channelId: '',
            salesId: '',
            tags: [],
            dateFrom: '',
            dateTo: '',
        };
        setFilters(emptyState);

        const params = new URLSearchParams(searchParams.toString());
        ['intentionLevel', 'channelId', 'salesId', 'tags', 'dateFrom', 'dateTo'].forEach(k => params.delete(k));
        params.set('page', '1');

        startTransition(() => {
            router.push(`?${params.toString()}`);
        });
    };

    const dateRange = useMemo(() => filters.dateFrom ? {
        from: new Date(filters.dateFrom),
        to: filters.dateTo ? new Date(filters.dateTo) : undefined
    } : undefined, [filters.dateFrom, filters.dateTo]);

    const hasFilters = useMemo(() => {
        const { tags, ...others } = filters;
        return tags.length > 0 || Object.values(others).some(v => v !== '' && v !== 'ALL');
    }, [filters]);

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

            {/* 渠道选择 */}
            <div className="w-[140px]">
                <ChannelPicker
                    tenantId={tenantId}
                    value={filters.channelId}
                    onChange={(v) => handleFilterChange('channelId', v)}
                    placeholder="渠道"
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

            {/* 标签多选 */}
            <div className="min-w-[140px]">
                <MultiSelect
                    options={TAG_OPTIONS}
                    selected={filters.tags}
                    onChange={(values) => handleMultiFilterChange('tags', values)}
                    placeholder="选择标签"
                    className="bg-muted/20 border-white/10 h-9 min-h-auto py-0"
                />
            </div>

            {/* 日期范围 */}
            <div className="w-[240px]">
                <DatePickerWithRange
                    date={dateRange}
                    setDate={handleDateRangeChange}
                    className="h-9"
                />
            </div>

            {hasFilters && (
                <Button variant="ghost" size="icon" onClick={handleClear} className="h-9 w-9" title="清除所有筛选">
                    <X className="h-4 w-4" />
                </Button>
            )}
        </div>
    );
}
