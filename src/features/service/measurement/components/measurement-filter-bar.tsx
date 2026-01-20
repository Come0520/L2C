'use client';

import { Input } from '@/shared/ui/input';
import { Button } from '@/shared/ui/button';
import Search from 'lucide-react/dist/esm/icons/search';
import { useRouter, useSearchParams } from 'next/navigation';
import { Tabs, TabsList, TabsTrigger } from '@/shared/ui/tabs';
import { useCallback, useState } from 'react';

export function MeasurementFilterBar() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [searchValue, setSearchValue] = useState(searchParams.get('search') || '');

    const createQueryString = useCallback(
        (name: string, value: string) => {
            const params = new URLSearchParams(searchParams.toString());
            if (value) {
                params.set(name, value);
            } else {
                params.delete(name);
            }
            return params.toString();
        },
        [searchParams]
    );

    const handleSearch = (term: string) => {
        setSearchValue(term);
    };

    const applySearch = () => {
        router.push(`?${createQueryString('search', searchValue)}`);
    };

    const handleStatusChange = (status: string) => {
        const params = new URLSearchParams(searchParams.toString());
        if (status === 'ALL') {
            params.delete('status');
        } else {
            params.set('status', status);
        }
        params.delete('page');
        router.push(`?${params.toString()}`);
    };

    const currentStatus = searchParams.get('status') || 'ALL';

    return (
        <div className="space-y-4 mb-6">
            <Tabs defaultValue={currentStatus} onValueChange={handleStatusChange} className="w-full">
                <TabsList>
                    <TabsTrigger value="ALL">全部</TabsTrigger>
                    <TabsTrigger value="PENDING">待分配</TabsTrigger>
                    <TabsTrigger value="PENDING_VISIT">待上门</TabsTrigger>
                    <TabsTrigger value="PENDING_CONFIRM">待确认</TabsTrigger>
                    <TabsTrigger value="COMPLETED">已完成</TabsTrigger>
                </TabsList>
            </Tabs>

            <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        className="pl-10"
                        placeholder="搜索测量单号、客户姓名、备注..."
                        value={searchValue}
                        onChange={(e) => handleSearch(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && applySearch()}
                    />
                </div>
                <div className="flex gap-2">
                    <Button onClick={applySearch}>搜索</Button>
                </div>
            </div>
        </div>
    );
}
