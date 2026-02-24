'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { DataTableToolbar } from '@/components/ui/data-table-toolbar';
import { useDebounce } from '@/shared/hooks/use-debounce';

/**
 * 安装列表工具栏
 * 
 * 集成了带防抖功能的搜索框和表格刷新功能。
 * 搜索结果会同步到 URL 的 `search` 参数中。
 */
export function InstallationToolbar() {
    const router = useRouter();
    const searchParams = useSearchParams();

    // 搜索状态
    const [search, setSearch] = useState(searchParams.get('search') || '');
    const debouncedSearch = useDebounce(search, 500);

    // 同步搜索到 URL
    useEffect(() => {
        const params = new URLSearchParams(searchParams.toString());
        const currentSearch = params.get('search') || '';
        if (debouncedSearch !== currentSearch) {
            if (debouncedSearch) params.set('search', debouncedSearch);
            else params.delete('search');
            params.set('page', '1');
            router.push(`?${params.toString()}`);
        }
    }, [debouncedSearch, router, searchParams]);

    return (
        <DataTableToolbar
            searchProps={{
                value: search,
                onChange: setSearch,
                placeholder: "搜索客户、单号、师傅..."
            }}
            onRefresh={() => router.refresh()}
        />
    );
}


