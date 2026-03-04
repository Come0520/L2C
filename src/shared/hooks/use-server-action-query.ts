'use client';

import { useQuery, type UseQueryOptions } from '@tanstack/react-query';

/**
 * 将 Server Action 桥接为 react-query 的 useQuery
 * 提供自动去重、缓存、stale-while-revalidate 能力
 */
export function useServerActionQuery<TData>(
  queryKey: unknown[],
  serverAction: () => Promise<TData>,
  options?: Omit<UseQueryOptions<TData>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey,
    queryFn: serverAction,
    ...options,
  });
}
