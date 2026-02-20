'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { DataTableToolbar } from '@/components/ui/data-table-toolbar';
import { useDebounce } from '@/shared/hooks/use-debounce';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select';
import { Button } from '@/shared/ui/button';
import { X } from 'lucide-react';

// interface CustomersToolbarProps {}

export function CustomersToolbar() {
    const router = useRouter();
    const searchParams = useSearchParams();

    // Search State
    const [search, setSearch] = useState(searchParams.get('search') || '');
    const debouncedSearch = useDebounce(search, 500);

    // Filter States
    const type = searchParams.get('type') || 'ALL';
    const level = searchParams.get('level') || 'ALL';

    const [isPending, startTransition] = React.useTransition();

    // Sync Search to URL
    useEffect(() => {
        const params = new URLSearchParams(searchParams.toString());
        const currentSearch = params.get('search') || '';

        if (debouncedSearch !== currentSearch) {
            startTransition(() => {
                if (debouncedSearch) {
                    params.set('search', debouncedSearch);
                } else {
                    params.delete('search');
                }
                params.set('page', '1');
                router.push(`?${params.toString()}`);
            });
        }
    }, [debouncedSearch, router, searchParams]);

    const handleFilterChange = (key: string, value: string) => {
        const params = new URLSearchParams(searchParams.toString());
        startTransition(() => {
            if (value && value !== 'ALL') {
                params.set(key, value);
            } else {
                params.delete(key);
            }
            params.set('page', '1');
            router.push(`?${params.toString()}`);
        });
    };

    const isFiltered = type !== 'ALL' || level !== 'ALL' || !!search;

    const handleReset = () => {
        setSearch('');
        startTransition(() => {
            router.push('?page=1');
        });
    };

    const handleRefresh = () => {
        startTransition(() => {
            router.refresh();
        });
    };

    return (
        <DataTableToolbar
            searchProps={{
                value: search,
                onChange: setSearch,
                placeholder: "搜索姓名、电话、编号...",
                isPending: isPending
            }}
            onRefresh={handleRefresh}
        >
            <div className="flex items-center gap-2">
                <Select value={type} onValueChange={(v) => handleFilterChange('type', v)}>
                    <SelectTrigger className="h-9 w-[130px] bg-muted/20 border-white/10">
                        <SelectValue placeholder="客户类型" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="ALL">全部类型</SelectItem>
                        <SelectItem value="INDIVIDUAL">个人</SelectItem>
                        <SelectItem value="COMPANY">公司</SelectItem>
                        <SelectItem value="DESIGNER">设计师</SelectItem>
                        <SelectItem value="PARTNER">合作伙伴</SelectItem>
                    </SelectContent>
                </Select>

                <Select value={level} onValueChange={(v) => handleFilterChange('level', v)}>
                    <SelectTrigger className="h-9 w-[130px] bg-muted/20 border-white/10">
                        <SelectValue placeholder="客户等级" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="ALL">全部等级</SelectItem>
                        <SelectItem value="A">A级 (VIP)</SelectItem>
                        <SelectItem value="B">B级 (核心)</SelectItem>
                        <SelectItem value="C">C级 (重要)</SelectItem>
                        <SelectItem value="D">D级 (普通)</SelectItem>
                    </SelectContent>
                </Select>

                {/* Filter buttons on the left */}
                {isFiltered && (
                    <Button
                        variant="ghost"
                        onClick={handleReset}
                        className="h-8 px-2 lg:px-3 text-muted-foreground hover:text-foreground"
                    >
                        重置
                        <X className="ml-2 h-4 w-4" />
                    </Button>
                )}
            </div>
        </DataTableToolbar>
    );
}
