'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useServerActionQuery } from '@/shared/hooks/use-server-action-query';
import { getAfterSalesTickets } from '../actions';
import { Button } from '@/shared/ui/button';
import Link from 'next/link';
import { Plus } from 'lucide-react';
import { useDebounce } from '@/shared/hooks/use-debounce';
import { UrlSyncedTabs } from '@/shared/ui/url-synced-tabs';
import { FiltersBar } from './filters-bar';
import { TicketListTable } from './ticket-list-table';
import { AdvancedFiltersDialog } from './advanced-filters-dialog';

const TABS = [
  { value: 'all', title: '全部工单' },
  { value: 'PENDING', title: '待处理' },
  { value: 'PROCESSING', title: '处理中' },
  { value: 'CLOSED', title: '已关闭' },
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

  const { data, isLoading } = useServerActionQuery(
    ['after-sales-tickets', page, status, debouncedSearch, type, priority, isWarranty],
    () =>
      getAfterSalesTickets({
        page,
        status: status === 'all' ? undefined : status,
        search: debouncedSearch,
        type: type === 'all' ? undefined : type,
        priority: priority === 'all' ? undefined : priority,
        isWarranty: isWarranty === 'all' ? undefined : isWarranty,
      })
  );

  const tickets = data?.data || [];

  const handleApplyAdvancedFilters = (filters: {
    type: string;
    priority: string;
    isWarranty: string;
  }) => {
    setType(filters.type);
    setPriority(filters.priority);
    setIsWarranty(filters.isWarranty);
  };

  return (
    <div className="space-y-6">
      <div className="mb-2 flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">售后管理</h1>
        <Link href="/after-sales/new">
          <Button className="shadow-primary/20 shadow-lg">
            <Plus className="mr-2 h-4 w-4" /> 新建工单
          </Button>
        </Link>
      </div>

      <UrlSyncedTabs
        tabs={TABS}
        paramName="status"
        defaultValue="all"
        containerClassName="w-full"
      />

      <div className="glass-liquid-ultra rounded-2xl border border-white/10 p-6 shadow-xl">
        <FiltersBar
          search={search}
          onSearchChange={setSearch}
          type={type}
          onTypeChange={setType}
          priority={priority}
          onPriorityChange={setPriority}
          onAdvancedFilterClick={() => setAdvancedFiltersOpen(true)}
        />

        <TicketListTable tickets={tickets} isLoading={isLoading} />

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
