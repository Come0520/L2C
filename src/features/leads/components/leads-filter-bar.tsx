'use client';

import { AceternityTabs } from '@/shared/ui/aceternity-tabs';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTransition } from 'react';

const LEAD_STATUS_TABS = [
  { value: 'ALL', title: '全部线索' },
  { value: 'PENDING_ASSIGNMENT', title: '公海池' },
  { value: 'PENDING_FOLLOWUP', title: '待跟进' },
  { value: 'MY_FOLLOWING', title: '我的跟进' },
  { value: 'FOLLOWING_UP', title: '跟进中' },
  { value: 'WON', title: '已成交' },
  { value: 'PENDING_APPROVAL', title: '待审批' },
  { value: 'INVALID', title: '无效' },
  { value: 'ANALYTICS', title: '分析' },
];

export function LeadsFilterBar() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  const currentStatus =
    searchParams.get('status') ||
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
    startTransition(() => {
      router.push(`?${params.toString()}`);
    });
  };

  return (
    <AceternityTabs
      tabs={LEAD_STATUS_TABS}
      activeTab={currentStatus}
      onTabChange={handleTabChange}
      containerClassName="w-full mb-4"
    />
  );
}
