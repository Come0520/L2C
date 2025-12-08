import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';

import { measurementService } from '@/services/measurements.client';
import { CreateMeasurementRequest, UpdateMeasurementRequest } from '@/types/measurement';

import { useRealtimeSubscription } from './useRealtimeSubscription'

interface MeasurementFilters {
    status?: string;
    customerName?: string;
    measurementNo?: string;
    [key: string]: string | undefined;
}

export function useMeasurements(page = 1, pageSize = 10, filters: MeasurementFilters = {}) {
    const queryClient = useQueryClient();
    const queryKey = ['measurements', page, pageSize, filters];

    const query = useQuery({
        queryKey,
        queryFn: () => measurementService.getMeasurements(page, pageSize, filters.status, undefined, filters.customerName, filters.measurementNo),
        placeholderData: keepPreviousData,
        staleTime: 60 * 1000,
    });

    useRealtimeSubscription({
        table: 'measurements',
        event: '*',
        channelName: 'measurements:list',
        handler: () => {
            queryClient.invalidateQueries({ queryKey })
        }
    })

    return {
        ...query,
        data: query.data?.measurements || [],
        total: query.data?.total || 0,
    };
}

export function useMeasurement(id: string) {
    const queryClient = useQueryClient();
    const queryKey = ['measurement', id];

    const query = useQuery({
        queryKey,
        queryFn: () => measurementService.getMeasurementById(id),
        enabled: !!id,
    });

    useRealtimeSubscription({
        table: 'measurements',
        event: '*',
        filter: id ? `id=eq.${id}` : undefined,
        channelName: id ? `measurements:${id}` : 'measurements:detail',
        handler: () => {
            queryClient.invalidateQueries({ queryKey })
        }
    })

    const updateMutation = useMutation({
        mutationFn: (data: UpdateMeasurementRequest) => measurementService.updateMeasurement(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey });
            queryClient.invalidateQueries({ queryKey: ['measurements'] });
        },
    });

    const updateStatusMutation = useMutation({
        mutationFn: (status: string) => measurementService.updateMeasurementStatus(id, status),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey });
            queryClient.invalidateQueries({ queryKey: ['measurements'] });
        },
    });

    return {
        ...query,
        measurement: query.data,
        updateMeasurement: updateMutation.mutateAsync,
        updateStatus: updateStatusMutation.mutateAsync,
    };
}

export function useCreateMeasurement() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: CreateMeasurementRequest) => measurementService.createMeasurement(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['measurements'] });
        },
    });
}
