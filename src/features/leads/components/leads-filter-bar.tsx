'use client';

import { Tabs, TabsList, TabsTrigger } from '@/shared/ui/tabs';
import { useRouter, useSearchParams } from 'next/navigation';

export function LeadsFilterBar() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const currentStatus = searchParams.get('status') || 'ALL';

    const handleTabChange = (value: string) => {
        const params = new URLSearchParams(searchParams.toString());
        if (value === 'ALL') {
            params.delete('status');
        } else {
            params.set('status', value);
        }
        params.set('page', '1'); // Reset to page 1
        router.push(`?${params.toString()}`);
    };

    return (
        <Tabs value={currentStatus} onValueChange={handleTabChange} className="w-full">
            <TabsList>
                <TabsTrigger value="ALL">全部线索</TabsTrigger>
                <TabsTrigger value="PENDING_ASSIGNMENT">公海池 (待分配)</TabsTrigger>
                <TabsTrigger value="PENDING_FOLLOWUP">待跟进</TabsTrigger>
                <TabsTrigger value="Following">我的跟进</TabsTrigger> {/* Logic for 'Mine' needs backend support via separate param or special status handling */}
                <TabsTrigger value="WON">已成交</TabsTrigger>
                <TabsTrigger value="VOID">已作废</TabsTrigger>
            </TabsList>
        </Tabs>
    );
}
