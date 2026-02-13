'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { AnimatedTabs } from '@/components/ui/animated-tabs';

// 安装任务状态 Tabs 配置
const INSTALL_STATUS_TABS = [
    { value: 'ALL', label: '全部' },
    { value: 'PENDING_DISPATCH', label: '待分配' },
    { value: 'DISPATCHING', label: '待上门' },
    { value: 'PENDING_CONFIRM', label: '待确认' },
    { value: 'COMPLETED', label: '已完成' },
];

/**
 * 安装任务状态筛选 Tabs
 * 使用 URL 参数持久化状态
 */
export function InstallationStatusTabs() {
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
        params.set('page', '1');
        router.push(`?${params.toString()}`);
    };

    return (
        <AnimatedTabs
            tabs={INSTALL_STATUS_TABS}
            activeTab={currentStatus}
            onChange={handleTabChange}
            layoutId="install-status-tabs"
        />
    );
}
