import { describe, it, expect, vi, beforeEach } from 'vitest';

import { leadService } from '../leads.client';

const { mockSupabase } = vi.hoisted(() => {
  return {
    mockSupabase: {
      from: vi.fn(),
      rpc: vi.fn(),
      auth: {
        getUser: vi.fn(),
      },
    }
  };
});

// Mock the supabase client
vi.mock('@/lib/supabase/client', () => ({
  createClient: vi.fn(() => mockSupabase),
  supabase: mockSupabase,
}));

describe('leadsService - Business Tags', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getLeads with businessTags filter', () => {
    it('should filter leads by business tags', async () => {
      const mockLeads = [
        {
          id: 'lead-1',
          name: 'Test Lead 1',
          phone: '13800138000',
          business_tags: ['quoted'],
          status: 'ACTIVE',
          // 其他必要字段...
        },
      ];
      
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        or: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        contains: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        lt: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({ data: mockLeads, count: 1, error: null }),
        count: vi.fn().mockReturnValue({ count: 1 }),
      });
      
      const result = await leadService.getLeads(1, 10, { businessTags: ['quoted'] });
      
      expect(result).toBeDefined();
      expect(mockSupabase.from).toHaveBeenCalledWith('leads');
      expect(((mockSupabase.from as any).mock.results[0].value.contains)).toHaveBeenCalledWith('business_tags', ['quoted']);
    });
  });

  describe('createLead with businessTags', () => {
    it('should create lead with business tags', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: 'user-1' } } });
      const mockLead = {
        id: 'lead-1',
        name: 'Test Lead 1',
        phone: '13800138000',
        business_tags: ['quoted', 'appointment'],
        // 其他必要字段...
      };
      
      mockSupabase.from.mockReturnValue({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: mockLead, error: null }),
          }),
        }),
      });
      
      const result = await leadService.createLead({
        customerName: 'Test Lead 1',
        phone: '13800138000',
        projectAddress: 'Test Address',
        customerLevel: 'A',
        budgetMin: 10000,
        budgetMax: 20000,
        requirements: [],
        businessTags: ['quoted', 'appointment'],
      });
      
      expect(result).toBeDefined();
      expect(((mockSupabase.from as any).mock.results[0].value.insert)).toHaveBeenCalled();
    });
  });

  describe('updateLead with businessTags', () => {
    it('should update lead business tags', async () => {
      const mockLead = {
        id: 'lead-1',
        name: 'Test Lead 1',
        phone: '13800138000',
        business_tags: ['updated-tag'],
        // 其他必要字段...
      };
      
      mockSupabase.from.mockReturnValue({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnThis(),
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: mockLead, error: null }),
          }),
        }),
      });
      
      const result = await leadService.patchLead('lead-1', { 
        businessTags: ['updated-tag'] 
      });
      
      expect(result).toBeDefined();
      expect(((mockSupabase.from as any).mock.results[0].value.update)).toHaveBeenCalled();
    });
  });
});
