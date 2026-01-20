/**
 * useCachedData - SWR 封装 hook
 * 
 * 提供自动去重、缓存和后台重新验证功能
 */
'use client';

import useSWR, { SWRConfiguration } from 'swr';

interface UseCachedDataOptions extends Omit<SWRConfiguration, 'fetcher'> {
    /** 是否在窗口聚焦时重新验证 */
    revalidateOnFocus?: boolean;
    /** 去重间隔（毫秒） */
    dedupingInterval?: number;
}

const defaultOptions: UseCachedDataOptions = {
    revalidateOnFocus: false,
    dedupingInterval: 5000,
};

/**
 * 通用数据获取 hook，内置 SWR 缓存和去重
 * 
 * @example
 * const { data, isLoading, error, mutate } = useCachedData(
 *   'user-profile',
 *   () => getProfile()
 * );
 */
export function useCachedData<T>(
    key: string | null,
    fetcher: () => Promise<T>,
    options?: UseCachedDataOptions
) {
    const mergedOptions = { ...defaultOptions, ...options };

    return useSWR<T>(
        key,
        key ? fetcher : null,
        mergedOptions
    );
}

/**
 * 带自动刷新的数据获取 hook
 * 适用于需要定期更新的数据（如通知、仪表盘）
 */
export function usePolledData<T>(
    key: string | null,
    fetcher: () => Promise<T>,
    intervalMs: number = 30000
) {
    return useSWR<T>(
        key,
        key ? fetcher : null,
        {
            refreshInterval: intervalMs,
            revalidateOnFocus: true,
        }
    );
}
