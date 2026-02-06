'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { DataTableToolbar } from '@/components/ui/data-table-toolbar';
import { LeadsAdvancedFilter } from './leads-advanced-filter';
import { useDebounce } from '@/shared/hooks/use-debounce';

interface LeadsToolbarProps {
    tenantId: string;
    channels?: any[]; // Keep flexible if we want to pass channel options directly to filter eventually
}

export function LeadsToolbar({ tenantId }: LeadsToolbarProps) {
    const router = useRouter();
    const searchParams = useSearchParams();

    // Initialize search state from URL
    const [search, setSearch] = useState(searchParams.get('search') || '');
    const debouncedSearch = useDebounce(search, 500);

    // Sync URL when debounced search changes
    useEffect(() => {
        const params = new URLSearchParams(searchParams.toString());
        const currentSearch = params.get('search') || '';

        if (debouncedSearch !== currentSearch) {
            if (debouncedSearch) {
                params.set('search', debouncedSearch);
            } else {
                params.delete('search');
            }
            params.set('page', '1'); // Reset page
            router.push(`?${params.toString()}`);
        }
    }, [debouncedSearch, router, searchParams]);

    const handleRefresh = () => {
        router.refresh();
    };

    return (
        <DataTableToolbar
            searchProps={{
                value: search,
                onChange: setSearch,
                placeholder: "搜索客户姓名、电话、楼盘..."
            }}
            onRefresh={handleRefresh}
        >
            <LeadsAdvancedFilter tenantId={tenantId} />
        </DataTableToolbar>
    );
}
