import { describe, it, expect, vi } from 'vitest'

import { quoteService } from '../quotes.client'

vi.mock('../../lib/supabase/client', () => {
  // Mock data fixtures defined inside factory to avoid hoisting issues
  const quotes = [
    {
      id: 'q1',
      lead_id: 'l1',
      customer_id: 'c1',
      project_name: '望京小区A期',
      project_address: '北京市朝阳区望京街道',
      salesperson_name: '张三',
      salesperson_id: 'u1',
      current_version: 2,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-02-01T00:00:00Z',
      type: 'BUDGET',
      versions: [
        {
          id: 'v1',
          quote_id: 'q1',
          version: 1,
          quote_no: 'BJ-0001',
          total_amount: 1000,
          status: 'draft',
          valid_until: '2024-03-01',
          items: [
            {
              id: 'i1',
              quote_id: 'q1',
              category: '门',
              space: '客厅',
              product_name: '推拉门A',
              quantity: 1,
              unit_price: 1000,
              total_price: 1000,
              description: '铝合金',
              image_url: null,
              width: 200,
              height: 240,
              unit: '套',
            },
          ],
        },
        {
          id: 'v2',
          quote_id: 'q1',
          version: 2,
          quote_no: 'BJ-0002',
          total_amount: 3000,
          status: 'submitted',
          valid_until: '2024-03-15',
          items: [
            {
              id: 'i2',
              quote_id: 'q1',
              category: '窗',
              space: '卧室',
              product_name: '断桥窗B',
              quantity: 2,
              unit_price: 1500,
              total_price: 3000,
              description: '双层玻璃',
              image_url: null,
              width: 120,
              height: 150,
              unit: '樘',
            },
          ],
        },
      ],
    },
  ]

  const insertQuoteResp = {
    id: 'q2',
    lead_id: 'l2',
    customer_id: 'c2',
    project_name: '天通苑B区',
    project_address: '北京市昌平区天通苑',
    salesperson_name: '李四',
    salesperson_id: 'u2',
    current_version: 1,
    created_at: '2024-04-01T00:00:00Z',
    updated_at: '2024-04-01T00:00:00Z',
    type: 'BUDGET',
  }

  const versionResp = {
    id: 'v3',
    quote_id: 'q2',
    version: 1,
    quote_no: 'BJ-0101',
    total_amount: 3500,
    status: 'draft',
    valid_until: '2024-05-01',
  }

  const client = {
    from: (table: string) => {
      if (table === 'quotes') {
        const select = () => ({
          order: () => {
            const filters: Record<string, any> = {}
            const thenable: any = {
              eq(field: string, value: any) {
                filters[field] = value
                return thenable
              },
              then(resolve: any) {
                let data = quotes
                if (filters['lead_id']) data = data.filter(q => q.lead_id === filters['lead_id'])
                if (filters['customer_id']) data = data.filter(q => q.customer_id === filters['customer_id'])
                return resolve({ data, error: null })
              },
            }
            return thenable
          },
        })

        const insert = () => ({
          select: () => ({
            single: async () => ({ data: insertQuoteResp, error: null }),
          }),
        })

        const update = () => ({
          eq: async () => ({ data: null, error: null }),
        })

        return { select, insert, update }
      }
      if (table === 'quote_versions') {
        return {
          insert: () => ({
            select: () => ({
              single: async () => ({ data: versionResp, error: null }),
            }),
          }),
        }
      }
      if (table === 'quote_items') {
        return {
          insert: async () => ({ data: null, error: null }),
        }
      }
      return {
        select: async () => ({ data: quotes, error: null }),
      }
    },
    auth: {
      getUser: async () => ({ data: { user: { id: 'u2', user_metadata: { name: '李四' } } } }),
    },
  }

  return {
    createClient: () => client,
  }
})

describe('quoteService', () => {
  it('getQuotes maps versions and derives status by latest version', async () => {
    const quotesArr = await quoteService.getQuotes({ leadId: 'l1' })
    expect(quotesArr.length).toBe(1)
    const q = quotesArr[0]!
    expect(q.id).toBe('q1')
    expect(q.leadId).toBe('l1')
    expect(q.projectName).toBe('望京小区A期')
    expect(q.currentVersion?.version).toBe(2)
    expect(q.versions.length).toBe(2)
    // latest version status is 'submitted' (non-standard), derive to 'draft'
    expect(q.status).toBe('draft')
    const latest = q.versions.find((v: any) => v.version === 2)
    expect(latest?.items[0]?.productName).toBe('断桥窗B')
    expect(latest?.totalAmount).toBe(3000)
  })

  it('createBudgetQuote creates quote, version and items and returns mapped quote', async () => {
    const result = await quoteService.createBudgetQuote('l2', {
      projectName: '天通苑B区',
      projectAddress: '北京市昌平区天通苑',
      customerId: 'c2',
      items: [
        { productName: '窗X', quantity: 1, unitPrice: 2000, totalPrice: 2000, unit: '樘' },
        { productName: '门Y', quantity: 1, unitPrice: 1500, totalPrice: 1500, unit: '套' },
      ],
    })

    expect(result.id).toBe('q2')
    expect(result.currentVersion?.version).toBe(1)
    expect(result.salesperson_id).toBe('u2')
    const v = result.currentVersion
    expect(v?.total_amount).toBe(3500)
  })
})
