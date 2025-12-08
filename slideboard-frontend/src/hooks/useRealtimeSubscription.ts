import { useCallback, useEffect, useRef } from 'react'

import { createClient } from '@/lib/supabase/client'
import { throttle } from '@/utils/debounce-throttle'

export type RealtimeEvent = 'INSERT' | 'UPDATE' | 'DELETE' | '*'

export interface PostgresChangePayload<T = any> {
  eventType: 'INSERT' | 'UPDATE' | 'DELETE'
  new: T | null
  old: Partial<T> | null
  table: string
  schema: string
  commit_timestamp: string
}

export interface UseRealtimeSubscriptionOptions<T = any> {
  table: string
  event?: RealtimeEvent
  filter?: string
  channelName?: string
  handler: (payload: PostgresChangePayload<T>) => void
  throttleMs?: number // 默认200ms，平衡实时性和性能
}

export function useRealtimeSubscription<T = any>(options: UseRealtimeSubscriptionOptions<T>) {
  const { table, event = '*', filter, channelName, handler, throttleMs = 200 } = options
  // 修复类型定义 - 使用正确的TypeScript语法
  type SupabaseClient = ReturnType<typeof createClient>
  type Channel = ReturnType<SupabaseClient['channel']>
  const subscriptionRef = useRef<Channel | null>(null)
  const reconnectTimerRef = useRef<NodeJS.Timeout | undefined>(undefined)

  const setup = useCallback(() => {
    const supabase = createClient()
    if (typeof (supabase as any).channel !== 'function') {
      return
    }
    if (subscriptionRef.current) {
      supabase.removeChannel(subscriptionRef.current)
      subscriptionRef.current = null
    }

    // 使用节流函数优化性能，默认200ms
    const finalHandler = throttle(handler as any, throttleMs)

    const channel = supabase
      .channel(channelName || `${table}:subscription`)
      .on(
        'postgres_changes' as 'system',
        { event, schema: 'public', table, filter },
        finalHandler
      )
      .on('system', { event: 'close' }, () => {
        if (!reconnectTimerRef.current) {
          reconnectTimerRef.current = setTimeout(() => {
            setup()
          }, 2000)
        }
      })
      .on('system', { event: 'error' }, () => {})
      .subscribe()

    subscriptionRef.current = channel
  }, [table, event, filter, channelName, handler, throttleMs])

  useEffect(() => {
    setup()
    return () => {
      const supabase = createClient()
      if (subscriptionRef.current) {
        supabase.removeChannel(subscriptionRef.current)
      }
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current)
      }
    }
  }, [setup])
}
