import { describe, it, expect, vi, beforeEach } from 'vitest';

import { ApiError } from '@/lib/api/error-handler';
import { createClient } from '@/lib/supabase/client';

import { authService } from '../auth.client';

// Mock the supabase client (stable instance)
const client = {
  auth: {
    signInWithPassword: vi.fn(),
    signInWithOtp: vi.fn(),
    verifyOtp: vi.fn(),
    signInWithOAuth: vi.fn(),
    signUp: vi.fn(),
    signOut: vi.fn(),
    getSession: vi.fn(),
    onAuthStateChange: vi.fn(),
    getUser: vi.fn(),
    updateUser: vi.fn(),
    refreshSession: vi.fn(),
  },
};

vi.mock('@/lib/supabase/client', () => ({
  createClient: vi.fn(() => client),
}));

describe('authService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetAllMocks(); // Reset return values
  });

  const mockSupabaseUser = { 
    id: 'test-user-id', 
    phone: '13800138000',
    email: undefined,
    user_metadata: {
        name: '',
        avatar_url: undefined,
        role: 'user'
    },
    created_at: undefined,
    updated_at: undefined
  };

  const expectedUser = {
    id: 'test-user-id',
    phone: '13800138000',
    email: undefined,
    name: '',
    avatarUrl: undefined,
    role: 'user',
    createdAt: undefined,
    updatedAt: undefined
  };

  const mockSession = { access_token: 'test-token', refresh_token: 'test-refresh-token' };

  describe('loginWithPhone', () => {
    it('should login with valid phone and password', async () => {
      const supabaseClient = createClient();
      
      (supabaseClient.auth.signInWithPassword as any).mockResolvedValue({
        data: { user: mockSupabaseUser, session: mockSession },
        error: null,
      });
      
      const result = await authService.loginWithPhone('13800138000', 'password123');
      
      expect(result).toEqual({ user: expectedUser, session: mockSession });
      expect(supabaseClient.auth.signInWithPassword).toHaveBeenCalledWith({
        phone: '13800138000',
        password: 'password123',
      });
    });

    it('should throw error with invalid phone format', async () => {
      // Use a number that looks like phone but invalid (11 digits but wrong prefix)
      await expect(authService.loginWithPhone('12345678901', 'password123'))
        .rejects.toThrow(ApiError);
    });

    it('should throw error when supabase returns error', async () => {
      const supabaseClient = createClient();
      
      (supabaseClient.auth.signInWithPassword as any).mockResolvedValue({
        data: { user: null, session: null },
        error: { message: 'Invalid credentials', code: 'INVALID_CREDENTIALS' },
      });
      
      await expect(authService.loginWithPhone('13800138000', 'wrong-password'))
        .rejects.toThrow(ApiError);
    });
  });

  describe('loginWithSms', () => {
    it('should login with valid phone and verification code', async () => {
      const supabaseClient = createClient();
      
      (supabaseClient.auth.verifyOtp as any).mockResolvedValue({
        data: { user: mockSupabaseUser, session: mockSession },
        error: null,
      });
      
      const result = await authService.loginWithSms('13800138000', '123456');
      
      expect(result).toEqual({ user: expectedUser, session: mockSession });
      expect(supabaseClient.auth.verifyOtp).toHaveBeenCalled();
    });

    it('should throw error when supabase returns error', async () => {
      const supabaseClient = createClient();
      
      (supabaseClient.auth.verifyOtp as any).mockResolvedValue({
        data: { user: null, session: null },
        error: { message: 'Invalid OTP', code: 'INVALID_OTP' },
      });
      
      await expect(authService.loginWithSms('13800138000', 'wrong-code'))
        .rejects.toThrow(ApiError);
    });
  });

  describe('registerWithPhone', () => {
      it('should register with phone and password successfully', async () => {
        const supabaseClient = createClient();
        
        (supabaseClient.auth.signUp as any).mockResolvedValue({
            data: { user: mockSupabaseUser, session: mockSession },
            error: null
        });

        const result = await authService.registerWithPhone('13800138000', 'password123', { name: 'Test User' });
        
        expect(result).toHaveProperty('user', expectedUser);
        expect(supabaseClient.auth.signUp).toHaveBeenCalled();
      });
  });

  describe('getCurrentUser', () => {
      it('should get current user successfully', async () => {
          const supabaseClient = createClient();
          (supabaseClient.auth.getUser as any).mockResolvedValue({
              data: { user: mockSupabaseUser },
              error: null
          });

          const result = await authService.getCurrentUser();
          expect(result).toEqual(expectedUser);
      });

      it('should return null when supabase returns error', async () => {
          const supabaseClient = createClient();
          (supabaseClient.auth.getUser as any).mockResolvedValue({
              data: { user: null },
              error: { message: 'Fetch failed' }
          });

          const result = await authService.getCurrentUser();
          expect(result).toBeNull();
      });
  });

  describe('onAuthStateChange', () => {
      it('should subscribe to auth state changes', async () => {
          const supabaseClient = createClient();
          const mockCallback = vi.fn();
          const mockUnsubscribe = vi.fn();
          
          (supabaseClient.auth.onAuthStateChange as any).mockReturnValue({
              data: { subscription: { unsubscribe: mockUnsubscribe } }
          });

          const result = authService.onAuthStateChange(mockCallback);
          
          expect(supabaseClient.auth.onAuthStateChange).toHaveBeenCalledWith(expect.any(Function));
          expect(result).toHaveProperty('unsubscribe');
          
          result.unsubscribe();
          expect(mockUnsubscribe).toHaveBeenCalled();
      });
  });

  describe('updateUser', () => {
      it('should update user attributes successfully', async () => {
          const supabaseClient = createClient();
          (supabaseClient.auth.updateUser as any).mockResolvedValue({
              data: { user: mockSupabaseUser },
              error: null
          });

          const result = await authService.updateUser({ phone: '13900139000', data: { name: 'New Name' } });
          
          expect(result).toEqual(expectedUser);
          expect(supabaseClient.auth.updateUser).toHaveBeenCalled();
      });
  });

  describe('register', () => {
      it('should register new user with valid data', async () => {
          const supabaseClient = createClient();
          (supabaseClient.auth.signUp as any).mockResolvedValue({
              data: { user: mockSupabaseUser, session: mockSession },
              error: null
          });

          const result = await authService.register('13800138000', 'password123', 'Test User');
          
          expect(result).toEqual({ user: expectedUser });
          expect(supabaseClient.auth.signUp).toHaveBeenCalled();
      });
  });

  describe('verifyOtp', () => {
      it('should verify OTP successfully', async () => {
          const supabaseClient = createClient();
          (supabaseClient.auth.verifyOtp as any).mockResolvedValue({
              data: { user: mockSupabaseUser, session: mockSession },
              error: null
          });

          const result = await authService.verifyOtp('13800138000', '123456');
          
          expect(result).toEqual({ user: expectedUser, session: mockSession });
          expect(supabaseClient.auth.verifyOtp).toHaveBeenCalled();
      });
  });
});
