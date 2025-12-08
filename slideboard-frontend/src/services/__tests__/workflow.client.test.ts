import { vi } from 'vitest'

import { WORKFLOW_SERVICE as workflowService } from '../workflow.client'

const client = {
  from: vi.fn(),
}

vi.mock('@/lib/supabase/client', () => ({
  createClient: vi.fn(() => client),
}))

beforeEach(() => {
  vi.clearAllMocks()
})

describe('workflowService', () => {
  describe('getWorkflowRules', () => {
    it('returns mapped rules', async () => {
      const query = {
        select: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({
          data: [
            {
              id: 'w1',
              name: 'Rule1',
              description: 'Desc',
              from_status: 'pending',
              to_status: 'completed',
              conditions: '["a","b"]',
              approvers: '["x"]',
              is_active: true,
              created_at: '2024-01-01',
              updated_at: '2024-01-02',
            },
          ],
          error: null,
        }),
      }
      ;(client.from as any).mockReturnValue(query)
      const rules = await workflowService.getWorkflowRules()
      expect(rules).toHaveLength(1)
      expect(rules[0]).toEqual({
        id: 'w1',
        name: 'Rule1',
        description: 'Desc',
        fromStatus: 'pending',
        toStatus: 'completed',
        conditions: ['a', 'b'],
        approvers: ['x'],
        isActive: true,
        created_at: '2024-01-01',
        updated_at: '2024-01-02',
      })
      expect(client.from).toHaveBeenCalledWith('workflow_rules')
    })

    it('handles non-json values', async () => {
      const query = {
        select: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({
          data: [
            {
              id: 'w2',
              name: 'Rule2',
              description: '',
              from_status: 'draft',
              to_status: 'pending',
              conditions: null,
              approvers: 'not-json',
              is_active: false,
              created_at: '2024-01-01',
              updated_at: '2024-01-02',
            },
          ],
          error: null,
        }),
      }
      ;(client.from as any).mockReturnValue(query)
      const rules = await workflowService.getWorkflowRules()
      expect(rules[0]!.conditions).toEqual([])
      expect(rules[0]!.approvers).toEqual([])
    })

    it('throws on error', async () => {
      const query = {
        select: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({
          data: null,
          error: new Error('fail'),
        }),
      }
      ;(client.from as any).mockReturnValue(query)
      await expect(workflowService.getWorkflowRules()).rejects.toThrow('fail')
    })
  })

  describe('createWorkflowRule', () => {
    it('creates and returns mapped rule', async () => {
      const query = {
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: {
            id: 'w3',
            name: 'Rule3',
            description: 'Desc',
            from_status: 'pending',
            to_status: 'completed',
            conditions: '["c"]',
            approvers: '["y"]',
            is_active: true,
            created_at: '2024-01-01',
            updated_at: '2024-01-02',
          },
          error: null,
        }),
      }
      ;(client.from as any).mockReturnValue(query)
      const rule = await workflowService.createWorkflowRule('Rule3', 'Desc', 'pending', 'completed', ['c'], ['y'], true)
      expect(rule).toEqual({
        id: 'w3',
        name: 'Rule3',
        description: 'Desc',
        fromStatus: 'pending',
        toStatus: 'completed',
        conditions: ['c'],
        approvers: ['y'],
        isActive: true,
        created_at: '2024-01-01',
        updated_at: '2024-01-02',
      })
      expect(query.insert).toHaveBeenCalled()
    })

    it('throws on insert error', async () => {
      const query = {
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: null,
          error: new Error('insert fail'),
        }),
      }
      ;(client.from as any).mockReturnValue(query)
      await expect(workflowService.createWorkflowRule('n', '', 'pending', 'completed')).rejects.toThrow('insert fail')
    })
  })
})
