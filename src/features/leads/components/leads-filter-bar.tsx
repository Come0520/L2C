'use client';

import { AnimatedTabs } from '@/components/ui/animated-tabs';
import { useRouter, useSearchParams } from 'next/navigation';

const LEAD_STATUS_TABS = [
    { value: 'ALL', label: '全部线索' },
    { value: 'PENDING_ASSIGNMENT', label: '公海池' },
    { value: 'PENDING_FOLLOWUP', label: '待跟进' },
    { value: 'MY_FOLLOWING', label: '我的跟进' },
    { value: 'FOLLOWING_UP', label: '跟进中' },
    { value: 'WON', label: '已成交' },
    { value: 'VOID', label: '已作废' },
];

export function LeadsFilterBar() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const currentStatus = searchParams.get('status') ||
        (searchParams.get('salesFilter') === 'MINE' ? 'MY_FOLLOWING' : 'ALL');

    const handleTabChange = (value: string) => {
        const params = new URLSearchParams(searchParams.toString());
        if (value === 'ALL') {
            params.delete('status');
            params.delete('salesFilter');
        } else if (value === 'MY_FOLLOWING') {
            // 我的跟进：按归属销售筛选
            params.delete('status');
            params.set('salesFilter', 'MINE');
        } else {
            params.set('status', value);
            params.delete('salesFilter');
        }
        params.set('page', '1'); // 重置到第1页
        router.push(`?${params.toString()}`);
    };

    return (
        <AnimatedTabs
            tabs={LEAD_STATUS_TABS}
            activeTab={currentStatus}
            onChange={handleTabChange}
            layoutId="leads-status-tabs"
            containerClassName="w-full mb-4"
        />
    );
}
