import { render, act, cleanup } from '@testing-library/react'
import { vi } from 'vitest'

import { useRealtimeMeasurement, useRealtimeMeasurements } from '@/hooks/useRealtimeMeasurement'
import { useRealtimeOrders } from '@/hooks/useRealtimeOrders'
import { Measurement } from '@/types/measurement'

const handlers: Record<string, any> = {}

vi.mock('@/lib/supabase/client', () => {
  const removeChannel = vi.fn()
  let lastChannel: any
  let lastPgCb: any
  const channel = () => {
    const ch = {
      on: (_type: string, _filter: any, cb: any) => {
        if (typeof _filter === 'object' && _filter.event) {
          handlers[`system:${_filter.event}`] = cb
        } else {
          handlers['postgres_changes'] = cb
          lastPgCb = cb
        }
        return ch
      },
      subscribe: () => ch,
    }
    lastChannel = ch
    return ch
  }
  return {
    createClient: vi.fn(() => ({ channel, removeChannel })),
    supabase: { channel, removeChannel },
    getLastChannel: () => lastChannel,
    getLastPgCb: () => lastPgCb,
  }
})

function OrdersProbe() {
  const { orders } = useRealtimeOrders([{ id: 'o1' } as any])
  return <div data-testid="orders-count">{orders.length}</div>
}

function MeasurementProbe() {
  const { measurement } = useRealtimeMeasurement('m1', { id: 'm1' } as Measurement)
  return <div data-testid="measurement-id">{measurement?.id || 'none'}</div>
}

function MeasurementsProbe() {
  const { measurements } = useRealtimeMeasurements([{ id: 'm1' } as any])
  return <div data-testid="measurements-count">{measurements.length}</div>
}

describe('Realtime hooks', () => {
  afterEach(async () => {
    cleanup()
    Object.keys(handlers).forEach(k => delete handlers[k])
    const mod = await import('@/lib/supabase/client')
    ;(mod as any).supabase.removeChannel.mockClear()
  })

  it('orders subscription setup and cleanup', async () => {
    render(<OrdersProbe />)
    await act(async () => { await new Promise(r => setTimeout(r, 0)) })
    cleanup()
    const mod2 = await import('@/lib/supabase/client')
    expect((mod2 as any).supabase.removeChannel).toHaveBeenCalled()
  })

  it('single measurement subscription setup and cleanup', async () => {
    render(<MeasurementProbe />)
    await act(async () => { await new Promise(r => setTimeout(r, 0)) })
    cleanup()
    const mod2 = await import('@/lib/supabase/client')
    expect((mod2 as any).supabase.removeChannel).toHaveBeenCalled()
  })

  it('measurements list subscription setup and cleanup', async () => {
    render(<MeasurementsProbe />)
    await act(async () => { await new Promise(r => setTimeout(r, 0)) })
    cleanup()
    const mod2 = await import('@/lib/supabase/client')
    expect((mod2 as any).supabase.removeChannel).toHaveBeenCalled()
  })
})
