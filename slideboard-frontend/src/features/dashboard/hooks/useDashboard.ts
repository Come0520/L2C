import { useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';

import { dashboardService } from '@/services/dashboard.client';
import { TRACK_PAGE_VIEW } from '@/utils/analytics';

export const useDashboard = () => {
  // 埋点逻辑
  useEffect(() => {
    if (typeof window !== 'undefined') {
      TRACK_PAGE_VIEW('dashboard', { component: 'DashboardPage' });
    }
  }, []);

  // ✅ 使用 useQuery 替代 useEffect + useState
  const {
    data,
    isLoading,
    isError,
    error,
    refetch
  } = useQuery({
    queryKey: ['dashboard-overview'],
    queryFn: () => dashboardService.getDashboardOverview(),
    staleTime: 1000 * 60 * 5, // 5分钟缓存，避免频繁刷新
    refetchOnWindowFocus: false,
  });

  return {
    stats: data?.stats || [],
    recentActivities: data?.recentActivities || [],
    pendingTasks: data?.pendingTasks || [],
    isLoading,
    isError,
    error,
    refetch,
  };
};
