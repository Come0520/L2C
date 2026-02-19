'use client';

import React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { DataTableToolbar } from '@/components/ui/data-table-toolbar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select';
import { DatePickerWithRange } from '@/shared/ui/date-range-picker';
import { useDebounce } from '@/shared/hooks/use-debounce'; // Assuming this hook exists, created earlier
import { format } from 'date-fns';
import { DateRange } from 'react-day-picker';

interface Option {
    id: string;
    name: string;
}

interface MeasurementToolbarProps {
    workerOptions: Option[];
    salesOptions: Option[];
    channelOptions: Option[];
}

export function MeasurementToolbar({ workerOptions, salesOptions, channelOptions }: MeasurementToolbarProps) {
    const router = useRouter();
    const searchParams = useSearchParams();

    // Local State
    const [search, setSearch] = React.useState(searchParams.get('search') || '');
    const debouncedSearch = useDebounce(search, 500);

    // Sync Search
    React.useEffect(() => {
        const params = new URLSearchParams(searchParams.toString());
        const current = params.get('search') || '';
        if (debouncedSearch !== current) {
            if (debouncedSearch) params.set('search', debouncedSearch);
            else params.delete('search');
            params.set('page', '1');
            router.push(`?${params.toString()}`);
        }
    }, [debouncedSearch, router, searchParams]);


    const handleFilterChange = (key: string, value: string | undefined) => {
        const params = new URLSearchParams(searchParams.toString());
        if (value && value !== 'ALL') {
            params.set(key, value);
        } else {
            params.delete(key);
        }
        params.set('page', '1');
        router.push(`?${params.toString()}`);
    };

    const handleDateRangeChange = (range: DateRange | undefined) => {
        const params = new URLSearchParams(searchParams.toString());
        if (range?.from) {
            params.set('dateFrom', format(range.from, 'yyyy-MM-dd'));
        } else {
            params.delete('dateFrom');
        }
        if (range?.to) {
            params.set('dateTo', format(range.to, 'yyyy-MM-dd'));
        } else {
            params.delete('dateTo');
        }
        params.set('page', '1');
        router.push(`?${params.toString()}`);
    };

    // Get current values
    // const status = searchParams.get('status') || 'ALL';
    const workerId = searchParams.get('workerId') || 'ALL';
    const salesId = searchParams.get('salesId') || 'ALL';
    const channelId = searchParams.get('channel') || 'ALL';
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');

    const dateRange = dateFrom ? {
        from: new Date(dateFrom),
        to: dateTo ? new Date(dateTo) : undefined
    } : undefined;

    return (
        <DataTableToolbar
            searchProps={{
                value: search,
                onChange: setSearch,
                placeholder: "搜索客户、地址、电话..."
            }}
            onRefresh={() => router.refresh()}
        >


            <Select value={workerOptions.some(w => w.id === workerId) ? workerId : 'ALL'} onValueChange={(v) => handleFilterChange('workerId', v)}>
                <SelectTrigger className="w-[120px] bg-muted/20 border-white/10">
                    <SelectValue placeholder="测量员" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="ALL">所有测量员</SelectItem>
                    {workerOptions.map(w => (
                        <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>
                    ))}
                </SelectContent>
            </Select>

            <Select value={salesOptions.some(s => s.id === salesId) ? salesId : 'ALL'} onValueChange={(v) => handleFilterChange('salesId', v)}>
                <SelectTrigger className="w-[120px] bg-muted/20 border-white/10">
                    <SelectValue placeholder="销售" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="ALL">所有销售</SelectItem>
                    {salesOptions.map(s => (
                        <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                    ))}
                </SelectContent>
            </Select>

            <Select value={channelId !== 'ALL' ? channelId : 'ALL'} onValueChange={(v) => handleFilterChange('channel', v)}>
                <SelectTrigger className="w-[120px] bg-muted/20 border-white/10">
                    <SelectValue placeholder="渠道" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="ALL">所有渠道</SelectItem>
                    {channelOptions.map(c => (
                        <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                </SelectContent>
            </Select>

            <div className="w-[240px]">
                <DatePickerWithRange date={dateRange} setDate={handleDateRangeChange} />
            </div>
        </DataTableToolbar>
    );
}
