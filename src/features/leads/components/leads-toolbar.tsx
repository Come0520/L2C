'use client';

import { logger } from "@/shared/lib/logger";
import React, { useState, useEffect, useTransition } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { DataTableToolbar } from '@/components/ui/data-table-toolbar';
import { LeadsAdvancedFilter } from './leads-advanced-filter';
import { useDebounce } from '@/shared/hooks/use-debounce';

/**
 * 线索模块工具栏属性
 */
interface LeadsToolbarProps {
    /** 租户 ID */
    tenantId: string;
    /** 销售人员列表 (用于高级筛选) */
    salesList?: Array<{ id: string; name: string }>;
}

/**
 * 线索模块顶部工具栏
 * 包含全局搜索、刷新功能及高级筛选入口
 */
export function LeadsToolbar({ tenantId, salesList }: LeadsToolbarProps) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [, startTransition] = useTransition();

    // 初始化搜索状态自 URL
    const [search, setSearch] = useState(searchParams.get('search') || '');
    const debouncedSearch = useDebounce(search, 500);

    // 当防抖搜索值变化时同步 URL
    useEffect(() => {
        const params = new URLSearchParams(searchParams.toString());
        const currentSearch = params.get('search') || '';

        if (debouncedSearch !== currentSearch) {
            if (debouncedSearch) {
                params.set('search', debouncedSearch);
            } else {
                params.delete('search');
            }
            params.set('page', '1'); // 搜索变化重置页码
            startTransition(() => {
                router.push(`?${params.toString()}`);
            });
        }
    }, [debouncedSearch, router, searchParams]);

    /**
     * 手动刷新表格数据
     */
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
            <LeadsAdvancedFilter tenantId={tenantId} salesList={salesList} />
        </DataTableToolbar>
    );
}
