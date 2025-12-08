import { render, act, cleanup } from '@testing-library/react'
import { vi } from 'vitest'

import { useRealtimeSubscription } from '@/hooks/useRealtimeSubscription'

const handlers: Record<string, any> = {}

vi.mock('@/lib/supabase/client', () => {
  const removeChannel = vi.fn()
  let lastChannel: any
  const channel = () => {
    const ch = {
      on: (_type: string, _filter: any, cb: any) => {
        if (typeof _filter === 'object' && _filter.event) {
          handlers[`system:${_filter.event}`] = cb
        } else {
          handlers['postgres_changes'] = cb
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
  }
})

function Probe() {
  useRealtimeSubscription({
    table: 'quotes',
    event: '*',
    handler: () => {}
  })
  return <div />
}

describe('useRealtimeSubscription', () => {
  afterEach(async () => {
    cleanup()
    Object.keys(handlers).forEach(k => delete handlers[k])
    const mod = await import('@/lib/supabase/client')
    ;(mod as any).supabase.removeChannel.mockClear()
  })

  it('setup and cleanup subscription', async () => {
    render(<Probe />)
    await act(async () => { await new Promise(r => setTimeout(r, 0)) })
    cleanup()
    const mod2 = await import('@/lib/supabase/client')
    expect((mod2 as any).supabase.removeChannel).toHaveBeenCalled()
  })
})

