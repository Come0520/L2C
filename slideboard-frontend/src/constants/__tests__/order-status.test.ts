import { describe, it, expect } from 'vitest'

import { ORDER_STATUS, ORDER_STATUS_TRANSITIONS, ORDER_STATUS_CONFIG } from '../order-status'

describe('ORDER_STATUS naming and transitions', () => {
  it('uses unified follow up naming keys with preserved values', () => {
    expect(ORDER_STATUS.PENDING_FOLLOW_UP).toBe('pending_tracking')
    expect(ORDER_STATUS.FOLLOWING_UP).toBe('tracking')
  })

  it('transitions include new follow up keys', () => {
    expect(ORDER_STATUS_TRANSITIONS[ORDER_STATUS.PENDING_ASSIGNMENT]).toContain(
      ORDER_STATUS.PENDING_FOLLOW_UP
    )
    expect(ORDER_STATUS_TRANSITIONS[ORDER_STATUS.PENDING_FOLLOW_UP]).toContain(
      ORDER_STATUS.FOLLOWING_UP
    )
  })

  it('config exposes labels for new keys', () => {
    expect(ORDER_STATUS_CONFIG[ORDER_STATUS.PENDING_FOLLOW_UP].label).toBe('待跟踪')
    expect(ORDER_STATUS_CONFIG[ORDER_STATUS.FOLLOWING_UP].label).toBe('跟踪中')
  })
})
