import { describe, it, expect, vi } from 'vitest'

import { leadService } from '../leads.client'

vi.mock('../../lib/supabase/client', () => {
  const dbRecord: any = {
    id: 'id1234567890',
    name: '王小明',
    phone: '13700000000',
    project_address: '北京市朝阳区',
    source: 'online',
    status: 'new',
    customer_level: 'b',
    budget_min: 1000,
    budget_max: 2000,
    requirements: ['门窗'],
    business_tags: ['quoted', 'unknown-tag'],
    appointment_time: '2024-01-01T00:00:00Z',
    appointment_reminder: '24h',
    construction_progress: 'painting',
    expected_purchase_date: '2024-02-01',
    expected_check_in_date: '2024-03-01',
    area_size: 88,
    lead_number: 'LEAD-001',
    quote_versions: 2,
    measurement_completed: true,
    installation_completed: false,
    financial_status: 'pending',
    expected_measurement_date: '2024-02-10',
    expected_installation_date: '2024-03-10',
    total_quote_amount: 12345,
    last_status_change_at: '2024-02-05T00:00:00Z',
    last_status_change_by_id: 'user-1',
    is_cancelled: false,
    cancellation_reason: null,
    is_paused: false,
    pause_reason: null,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-02-01T00:00:00Z',
    assigned_to_id: 'assignee-1',
    designer_id: 'designer-1',
    shopping_guide_id: 'guide-1',
    created_by_id: 'creator-1'
  }
  const single = vi.fn().mockResolvedValue({ data: dbRecord, error: null })
  const query = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single
  }
  return {
    createClient: () => ({
      from: vi.fn().mockReturnValue(query),
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'u1' } } }) }
    })
  }
})

describe('leadService.getLeadById', () => {
  it('maps DB record to LeadItem with normalized fields', async () => {
    const lead = await leadService.getLeadById('id1234567890')

    expect(lead.id).toBe('id1234567890')
    expect(lead.leadNumber).toBe('LEAD-001')
    expect(lead.customerName).toBe('王小明')
    expect(lead.phone).toBe('13700000000')
    expect(lead.projectAddress).toBe('北京市朝阳区')
    expect(lead.requirements).toEqual(['门窗'])
    expect(lead.budgetMin).toBe(1000)
    expect(lead.budgetMax).toBe(2000)
    expect(lead.customerLevel).toBe('B')
    expect(lead.status).toBe('PENDING_ASSIGNMENT')
    expect(lead.businessTags).toEqual(['quoted'])
    expect(lead.appointmentTime).toBe('2024-01-01T00:00:00Z')
    expect(lead.quoteVersions).toBe(2)
    expect(lead.measurementCompleted).toBe(true)
    expect(lead.installationCompleted).toBe(false)
    expect(lead.totalQuoteAmount).toBe(12345)
    expect(lead.createdAt).toBe('2024-01-01T00:00:00Z')
    expect(lead.lastFollowUpAt).toBe('2024-02-01T00:00:00Z')
    expect(lead.lastStatusChangeAt).toBe('2024-02-05T00:00:00Z')
  })
})
