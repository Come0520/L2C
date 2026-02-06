'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { AnimatedTabs, TabItem } from './animated-tabs';

interface UrlSyncedTabsProps {
    /** Tab 配置列表 */
    tabs: TabItem[];
    /** URL 参数名称，默认为 'status' */
    paramName?: string;
    /** 默认选中值（当 URL 无参数时） */
    defaultValue?: string;
    /** 额外的容器样式 */
    containerClassName?: string;
    /** layoutId 用于 Framer Motion 动画区分 */
    layoutId?: string;
}

/**
 * 支持 URL 同步的 Tabs 组件
 * 
 * 自动从 URL 读取当前选中状态，并在切换时更新 URL 参数。
 * 适用于需要分享链接、浏览器前进后退保持状态的场景。
 * 
 * @example
 * // 基础用法 - 使用 'status' 参数
 * <UrlSyncedTabs
 *     tabs={[
 *         { value: 'ALL', label: '全部' },
 *         { value: 'PENDING', label: '待处理' },
 *     ]}
 * />
 * 
 * @example
 * // 自定义参数名
 * <UrlSyncedTabs
 *     paramName="tab"
 *     defaultValue="pending"
 *     tabs={[
 *         { value: 'pending', label: '待处理' },
 *         { value: 'processed', label: '已处理' },
 *     ]}
 * />
 */
export function UrlSyncedTabs({
    tabs,
    paramName = 'status',
    defaultValue,
    containerClassName,
    layoutId,
}: UrlSyncedTabsProps) {
    const router = useRouter();
    const searchParams = useSearchParams();

    // 从 URL 读取当前值，若无则使用默认值或第一个 Tab
    const currentValue = searchParams.get(paramName) || defaultValue || tabs[0]?.value || '';

    const handleChange = (value: string) => {
        const params = new URLSearchParams(searchParams.toString());

        // 如果选中的是默认值或第一个选项，则清除参数保持 URL 简洁
        if (value === defaultValue || value === tabs[0]?.value) {
            params.delete(paramName);
        } else {
            params.set(paramName, value);
        }

        // 重置分页参数
        params.delete('page');

        const queryString = params.toString();
        router.push(queryString ? `?${queryString}` : window.location.pathname);
    };

    return (
        <AnimatedTabs
            tabs={tabs}
            activeTab={currentValue}
            onChange={handleChange}
            containerClassName={containerClassName}
            layoutId={layoutId || `tabs-${paramName}`}
        />
    );
}
