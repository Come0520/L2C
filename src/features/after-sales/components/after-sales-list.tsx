'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { getAfterSalesTickets } from '../actions';
import { Button } from '@/shared/ui/button';
import Link from 'next/link';
import { Plus } from 'lucide-react';
import { useDebounce } from '@/shared/hooks/use-debounce';
import { UrlSyncedTabs } from '@/components/ui/url-synced-tabs';
import { FiltersBar } from './filters-bar';
import { TicketListTable } from './ticket-list-table';
import { AdvancedFiltersDialog } from './advanced-filters-dialog';

const TABS = [
    { value: 'all', label: '全部工单' },
    { value: 'PENDING', label: '待处理' },
    { value: 'PROCESSING', label: '处理中' },
    { value: 'CLOSED', label: '已关闭' },
];

export function AfterSalesList() {
    const searchParams = useSearchParams();
    const status = searchParams.get('status') || 'all';

    const [search, setSearch] = useState('');
    const [type, setType] = useState('all');
    const [priority, setPriority] = useState('all');
    const [isWarranty, setIsWarranty] = useState('all');
    const [page, _setPage] = useState(1);
    const [advancedFiltersOpen, setAdvancedFiltersOpen] = useState(false);

    const debouncedSearch = useDebounce(search, 500);

    const { data, isLoading } = useQuery({
        queryKey: ['after-sales-tickets', page, status, debouncedSearch, type, priority, isWarranty],
        queryFn: () => getAfterSalesTickets({
            page,
            status: status === 'all' ? undefined : status,
            search: debouncedSearch,
            type: type === 'all' ? undefined : type,
            priority: priority === 'all' ? undefined : priority,
            isWarranty: isWarranty === 'all' ? undefined : isWarranty
        }),
    });

    const tickets = data?.data || [];

    const handleApplyAdvancedFilters = (filters: { type: string; priority: string; isWarranty: string }) => {
        setType(filters.type);
        setPriority(filters.priority);
        setIsWarranty(filters.isWarranty);
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center mb-2">
                <h1 className="text-2xl font-bold tracking-tight">售后管理</h1>
                <Link href="/after-sales/new">
                    <Button className="shadow-lg shadow-primary/20">
                        <Plus className="mr-2 h-4 w-4" /> 新建工单
                    </Button>
                </Link>
            </div>

            <UrlSyncedTabs
                tabs={TABS}
                paramName="status"
                defaultValue="all"
                containerClassName="w-full"
                layoutId="after-sales-tabs"
            />

            <div className="glass-liquid-ultra p-6 rounded-2xl border border-white/10 shadow-xl">
                <FiltersBar
                    search={search}
                    onSearchChange={setSearch}
                    type={type}
                    onTypeChange={setType}
                    priority={priority}
                    onPriorityChange={setPriority}
                    onAdvancedFilterClick={() => setAdvancedFiltersOpen(true)}
                />

                <TicketListTable
                    tickets={tickets}
                    isLoading={isLoading}
                />

                <AdvancedFiltersDialog
                    open={advancedFiltersOpen}
                    onOpenChange={setAdvancedFiltersOpen}
                    currentFilters={{ type, priority, isWarranty }}
                    onApply={handleApplyAdvancedFilters}
                />
            </div>
        </div>
    );
}
