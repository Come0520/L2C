import { useQuery, useQueryClient, keepPreviousData } from '@tanstack/react-query'

import { leadService } from '@/services/leads.client'
import { LeadFilter } from '@/types/lead'

import { useRealtimeSubscription } from './useRealtimeSubscription'

export function useLeads(
    page: number,
    pageSize: number,
    filters: Partial<LeadFilter>,
    cursor?: string
) {
    const queryClient = useQueryClient()
    // 更新查询键，包含游标
    const queryKey = ['leads', page, pageSize, cursor, filters]

    // 数据获取
    const query = useQuery({
        queryKey,
        queryFn: () => leadService.getLeads(page, pageSize, filters, cursor),
        placeholderData: keepPreviousData,
        staleTime: 30 * 1000, // 30秒缓存
        gcTime: 60 * 1000, // 1分钟缓存
    })

    useRealtimeSubscription({
        table: 'leads',
        event: '*',
        channelName: 'leads:list',
        handler: () => {
            queryClient.invalidateQueries({ queryKey })
        }
    })

    return {
        ...query
    }
}
