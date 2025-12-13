import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';

import { QUERY_CONFIG } from '@/config/query-config';
import { installationService } from '@/services/installations.client';
import { CreateInstallationRequest, UpdateInstallationRequest } from '@/shared/types/installation';

import { useRealtimeSubscription } from './useRealtimeSubscription'

// 定义过滤器类型
interface InstallationFilters {
  status?: string;
  salesOrderId?: string;
  customerName?: string;
  installationNo?: string;
  installationType?: string;
  startDate?: string;
  endDate?: string;
  installerId?: string;
  installationTeamId?: string;
}

export function useInstallations(page = 1, pageSize = 10, filters: InstallationFilters = {}) {
    const queryClient = useQueryClient();
    const queryKey = ['installations', page, pageSize, filters];

    const query = useQuery({
        queryKey,
        queryFn: () => installationService.getInstallations({ page, pageSize, ...filters }),
        placeholderData: keepPreviousData,
        staleTime: QUERY_CONFIG.list.staleTime,
        gcTime: QUERY_CONFIG.list.gcTime,
    });

    useRealtimeSubscription({
        table: 'installation_orders',
        event: '*',
        channelName: 'installation_orders:list',
        handler: () => {
            queryClient.invalidateQueries({ queryKey: ['installations'] })
        }
    })

    return {
        ...query,
        data: query.data?.installations || [],
        total: query.data?.total || 0,
    };
}

export function useInstallation(id: string) {
    const queryClient = useQueryClient();
    const queryKey = ['installation', id];

    const query = useQuery({
        queryKey,
        queryFn: () => installationService.getInstallationById(id),
        enabled: !!id,
        staleTime: QUERY_CONFIG.detail.staleTime,
        gcTime: QUERY_CONFIG.detail.gcTime,
    });

    useRealtimeSubscription({
        table: 'installation_orders',
        event: '*',
        filter: id ? `id=eq.${id}` : undefined,
        channelName: id ? `installation_orders:${id}` : 'installation_orders:detail',
        handler: () => {
            queryClient.invalidateQueries({ queryKey: ['installation', id] });
            queryClient.invalidateQueries({ queryKey: ['installations'] });
        }
    })

    const updateMutation = useMutation({
        mutationFn: (data: UpdateInstallationRequest) => installationService.updateInstallation(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['installation', id] });
            queryClient.invalidateQueries({ queryKey: ['installations'] });
        },
    });

    const updateStatusMutation = useMutation({
        mutationFn: (status: string) => installationService.updateInstallationStatus(id, status),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['installation', id] });
            queryClient.invalidateQueries({ queryKey: ['installations'] });
        },
    });

    return {
        ...query,
        installation: query.data,
        updateInstallation: updateMutation.mutateAsync,
        updateStatus: updateStatusMutation.mutateAsync,
    };
}

export function useCreateInstallation() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: CreateInstallationRequest) => installationService.createInstallation(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['installations'] });
        },
    });
}
