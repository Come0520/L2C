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
 * 
 * 核心功能：
 * 1. 提供“全部”、“待分配”、“待上门”等核心状态的快速切换。
 * 2. 使用 URL 参数 `status` 进行状态持久化。
 * 3. 切换状态时自动重置页码到第 1 页。
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
