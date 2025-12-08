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
  });

  describe('loginWithPhone', () => {
    it('should login with valid phone and password', async () => {
      const supabaseClient = createClient();
      const mockUser = { id: 'test-user-id', phone: '13800138000' };
      const mockSession = { access_token: 'test-token', refresh_token: 'test-refresh-token' };
      
      (supabaseClient.auth.signInWithPassword as any).mockResolvedValue({
        data: { user: mockUser, session: mockSession },
        error: null,
      });
      
      const result = await authService.loginWithPhone('13800138000', 'password123');
      
      expect(result).toEqual({ user: mockUser, session: mockSession });
      expect(supabaseClient.auth.signInWithPassword).toHaveBeenCalledWith({
        phone: '13800138000',
        password: 'password123',
      });
    });

    it('should throw error with invalid phone format', async () => {
      await expect(authService.loginWithPhone('invalid-phone', 'password123'))
        .rejects.toThrow(ApiError);
    });

    it('should throw error when supabase returns error', async () => {
      const supabaseClient = createClient();
      
      (supabaseClient.auth.signInWithPassword as any).mockResolvedValue({
        data: null,
        error: { message: 'Invalid credentials', code: 'INVALID_CREDENTIALS' },
      });
      
      await expect(authService.loginWithPhone('13800138000', 'wrong-password'))
        .rejects.toThrow(ApiError);
    });
  });



  describe('loginWithSms', () => {
    it('should login with valid phone and verification code', async () => {
      const supabaseClient = createClient();
      const mockUser = { id: 'test-user-id', phone: '13800138000' };
      const mockSession = { access_token: 'test-token', refresh_token: 'test-refresh-token' };
      
      (supabaseClient.auth.verifyOtp as any).mockResolvedValue({
        data: { user: mockUser, session: mockSession },
        error: null,
      });
      
      const result = await authService.loginWithSms('13800138000', '123456');
      
      expect(result).toEqual({ user: mockUser, session: mockSession });
      expect(supabaseClient.auth.verifyOtp).toHaveBeenCalled();
    });

    it('should throw error when supabase returns error', async () => {
      const supabaseClient = createClient();
      
      (supabaseClient.auth.verifyOtp as any).mockResolvedValue({
        data: null,
        error: { message: 'Invalid OTP', code: 'INVALID_OTP' },
      });
      
      await expect(authService.loginWithSms('13800138000', 'wrong-code'))
        .rejects.toThrow(ApiError);
    });
  });

  describe('sendVerificationCode', () => {
    it('should send verification code to valid phone', async () => {
      const supabaseClient = createClient();
      
      (supabaseClient.auth.signInWithOtp as jest.Mock).mockResolvedValue({
        data: { session: null, user: null },
        error: null,
      });
      
      await authService.sendVerificationCode('13800138000');
      
      expect(supabaseClient.auth.signInWithOtp).toHaveBeenCalled();
    });

    it('should throw error with invalid phone format', async () => {
      await expect(authService.sendVerificationCode('invalid-phone'))
        .rejects.toThrow(ApiError);
    });

    it('should throw error when supabase returns error', async () => {
      const supabaseClient = createClient();
      
      (supabaseClient.auth.signInWithOtp as jest.Mock).mockResolvedValue({
        data: null,
        error: { message: 'Failed to send OTP', code: 'OTP_SEND_FAILED' },
      });
      
      await expect(authService.sendVerificationCode('13800138000'))
        .rejects.toThrow(ApiError);
    });
  });

  describe('register', () => {
    it('should register new user with valid data', async () => {
      const supabaseClient = createClient();
      const mockUser = { id: 'test-user-id', phone: '13800138000' };
      
      (supabaseClient.auth.signUp as any).mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });
      
      const result = await authService.register('13800138000', 'password123', 'Test User');
      
      expect(result).toEqual({ user: mockUser });
      expect(supabaseClient.auth.signUp).toHaveBeenCalled();
    });

    it('should throw error with invalid phone format', async () => {
      await expect(authService.register('invalid-phone', 'password123', 'Test User'))
        .rejects.toThrow(ApiError);
    });

    it('should throw error when supabase returns error', async () => {
      const supabaseClient = createClient();
      
      (supabaseClient.auth.signUp as any).mockResolvedValue({
        data: null,
        error: { message: 'User already exists', code: 'USER_ALREADY_EXISTS' },
      });
      
      await expect(authService.register('13800138000', 'password123', 'Test User'))
        .rejects.toThrow(ApiError);
    });
  });

  describe('logout', () => {
    it('should logout successfully', async () => {
      const supabaseClient = createClient();
      
      (supabaseClient.auth.signOut as any).mockResolvedValue({
        error: null,
      });
      
      await authService.logout();
      
      expect(supabaseClient.auth.signOut).toHaveBeenCalled();
    });

    it('should throw error when supabase returns error', async () => {
      const supabaseClient = createClient();
      
      (supabaseClient.auth.signOut as any).mockResolvedValue({
        error: { message: 'Logout failed', code: 'LOGOUT_FAILED' },
      });
      
      await expect(authService.logout()).rejects.toThrow(ApiError);
    });
  });

  describe('getCurrentUser', () => {
    it('should get current user successfully', async () => {
      createClient();
      const mockUser = { id: 'test-user-id', phone: '13800138000' };
      
      // Extend client.auth with getUser method
      (client.auth as any).getUser = vi.fn().mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });
      
      const result = await authService.getCurrentUser();
      
      expect(result).toEqual(mockUser);
      expect((client.auth as any).getUser).toHaveBeenCalled();
    });

    it('should throw error when supabase returns error', async () => {
      createClient();
      
      // Extend client.auth with getUser method
      (client.auth as any).getUser = vi.fn().mockResolvedValue({
        data: { user: null },
        error: { message: 'Failed to get user', code: 'GET_USER_FAILED' },
      });
      
      await expect(authService.getCurrentUser()).rejects.toThrow(ApiError);
    });
  });

  describe('getSession', () => {
    it('should get session successfully', async () => {
      createClient();
      const mockSession = { access_token: 'test-token', refresh_token: 'test-refresh-token' };
      
      client.auth.getSession.mockResolvedValue({
        data: { session: mockSession },
        error: null,
      });
      
      const result = await authService.getSession();
      
      expect(result).toEqual(mockSession);
      expect(client.auth.getSession).toHaveBeenCalled();
    });

    it('should throw error when supabase returns error', async () => {
      createClient();
      
      client.auth.getSession.mockResolvedValue({
        data: { session: null },
        error: { message: 'Failed to get session', code: 'GET_SESSION_FAILED' },
      });
      
      await expect(authService.getSession()).rejects.toThrow(ApiError);
    });
  });

  describe('onAuthStateChange', () => {
    it('should subscribe to auth state changes', () => {
      createClient();
      const mockCallback = vi.fn();
      const mockSubscription = { unsubscribe: vi.fn() };
      
      client.auth.onAuthStateChange.mockReturnValue({
        data: { subscription: mockSubscription },
      });
      
      const result = authService.onAuthStateChange(mockCallback);
      
      expect(client.auth.onAuthStateChange).toHaveBeenCalledWith(mockCallback);
      expect(result).toHaveProperty('unsubscribe');
      expect(typeof result.unsubscribe).toBe('function');
    });
  });



  describe('updateUser', () => {
    it('should update user attributes successfully', async () => {
      createClient();
      const mockUser = { id: 'test-user-id', phone: '13800138000' };
      
      (client.auth as any).updateUser = vi.fn().mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });
      
      const result = await authService.updateUser({ phone: '13900139000', data: { name: 'New Name' } });
      
      expect(result).toEqual(mockUser);
      expect((client.auth as any).updateUser).toHaveBeenCalled();
    });

    it('should throw error when supabase returns error', async () => {
      createClient();
      
      (client.auth as any).updateUser = vi.fn().mockResolvedValue({
        data: null,
        error: { message: 'Failed to update user', code: 'UPDATE_USER_FAILED' },
      });
      
      await expect(authService.updateUser({ phone: '13900139000' })).rejects.toThrow(ApiError);
    });
  });

  describe('refreshSession', () => {
    it('should refresh session successfully', async () => {
      createClient();
      const mockSession = { access_token: 'new-test-token', refresh_token: 'new-test-refresh-token' };
      
      (client.auth as any).refreshSession = vi.fn().mockResolvedValue({
        data: { session: mockSession },
        error: null,
      });
      
      const result = await authService.refreshSession();
      
      expect(result).toEqual(mockSession);
      expect((client.auth as any).refreshSession).toHaveBeenCalled();
    });

    it('should throw error when supabase returns error', async () => {
      createClient();
      
      (client.auth as any).refreshSession = vi.fn().mockResolvedValue({
        data: null,
        error: { message: 'Failed to refresh session', code: 'REFRESH_SESSION_FAILED' },
      });
      
      await expect(authService.refreshSession()).rejects.toThrow(ApiError);
    });
  });



  describe('sendOtp', () => {
    it('should send OTP successfully', async () => {
      createClient();
      
      (client.auth as any).signInWithOtp = vi.fn().mockResolvedValue({
        data: null,
        error: null,
      });
      
      await authService.sendOtp('13800138000');
      
      expect(client.auth.signInWithOtp).toHaveBeenCalled();
    });

    it('should throw error with invalid phone', async () => {
      await expect(authService.sendOtp('invalid-phone')).rejects.toThrow(ApiError);
    });
  });

  describe('verifyOtp', () => {
    it('should verify OTP successfully', async () => {
      createClient();
      const mockUser = { id: 'test-user-id', phone: '13800138000' };
      const mockSession = { access_token: 'test-token', refresh_token: 'test-refresh-token' };
      
      (client.auth as any).verifyOtp = vi.fn().mockResolvedValue({
        data: { user: mockUser, session: mockSession },
        error: null,
      });
      
      const result = await authService.verifyOtp('13800138000', '123456');
      
      expect(result).toEqual({ user: mockUser, session: mockSession });
      expect((client.auth as any).verifyOtp).toHaveBeenCalled();
    });

    it('should throw error when supabase returns error', async () => {
      createClient();
      
      (client.auth as any).verifyOtp = vi.fn().mockResolvedValue({
        data: null,
        error: { message: 'Invalid OTP', code: 'INVALID_OTP' },
      });
      
      await expect(authService.verifyOtp('13800138000', 'wrong-code')).rejects.toThrow(ApiError);
    });
  });

  describe('registerWithPhone', () => {
    it('should register with phone and password successfully', async () => {
      createClient();
      const mockUser = { id: 'test-user-id', phone: '13800138000' };
      
      (client.auth as any).signUp = vi.fn().mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });
      
      const result = await authService.registerWithPhone('13800138000', 'password123', { name: 'Test User' });
      
      expect(result).toHaveProperty('user', mockUser);
      expect(client.auth.signUp).toHaveBeenCalled();
    });

    it('should throw error with weak password', async () => {
      await expect(authService.registerWithPhone('13800138000', 'weak', { name: 'Test User' }))
        .rejects.toThrow(ApiError);
    });

    it('should throw error with invalid phone', async () => {
      await expect(authService.registerWithPhone('invalid-phone', 'password123', { name: 'Test User' }))
        .rejects.toThrow(ApiError);
    });
  });
});
