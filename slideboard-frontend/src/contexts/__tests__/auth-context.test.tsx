import { render, screen } from '@testing-library/react';
import { act } from 'react-dom/test-utils';
import { describe, it, expect, vi } from 'vitest';

import { AuthProvider, useAuth } from '@/contexts/auth-context';

// Supabase client mock
const signInWithPassword = vi.fn().mockResolvedValue({ error: null });
const signUp = vi.fn().mockResolvedValue({ error: null });
const signInWithOtp = vi.fn().mockResolvedValue({ error: null });
const verifyOtp = vi.fn().mockResolvedValue({ error: null });
const signInWithOAuth = vi.fn().mockResolvedValue({ error: null });
const signOut = vi.fn().mockResolvedValue({ error: null });
let onAuthCallback: any = null;
const onAuthStateChange = vi.fn((cb: any) => {
  onAuthCallback = cb;
  return { data: { subscription: { unsubscribe: vi.fn() } } };
});
const getSession = vi.fn().mockResolvedValue({ data: { session: null }, error: null });

vi.mock('@/lib/supabase/client', () => {
  return {
    createClient: () => ({
      auth: {
        signInWithPassword,
        signUp,
        signInWithOtp,
        verifyOtp,
        signInWithOAuth,
        signOut,
        onAuthStateChange,
        getSession,
      },
    }),
  };
});

let exportedCtx: any;
function ContextProbe() {
  const ctx = useAuth();
  exportedCtx = ctx;
  return (
    <div>
      <div data-testid="loading">{String(ctx.loading)}</div>
      <div data-testid="user-role">{ctx.user?.role ?? 'none'}</div>
    </div>
  );
}

describe('AuthContext', () => {
  it('initializes with no session and loading becomes false', async () => {
    render(
      <AuthProvider>
        <ContextProbe />
      </AuthProvider>
    );
    expect(screen.getByTestId('loading').textContent).toBe('true');
    await act(async () => {});
    expect(screen.getByTestId('loading').textContent).toBe('false');
    expect(screen.getByTestId('user-role').textContent).toBe('none');
  });

  it('login with password succeeds and calls supabase', async () => {
    render(
      <AuthProvider>
        <ContextProbe />
      </AuthProvider>
    );
    await act(async () => {
      await exportedCtx.login('13800000000', 'pass');
    });
    expect(signInWithPassword).toHaveBeenCalledWith({ phone: '13800000000', password: 'pass' });
  });

  it('login with password fails and throws error', async () => {
    signInWithPassword.mockResolvedValueOnce({ error: { message: 'invalid credentials' } });
    render(
      <AuthProvider>
        <ContextProbe />
      </AuthProvider>
    );
    await act(async () => {
      await expect(exportedCtx.login('13800000000', 'pass')).rejects.toBeDefined();
    });
    expect(signInWithPassword).toHaveBeenCalled();
  });

  it('sendVerificationCode handles network error', async () => {
    signInWithOtp.mockRejectedValueOnce(new Error('network error'));
    render(
      <AuthProvider>
        <ContextProbe />
      </AuthProvider>
    );
    await act(async () => {
      await expect(exportedCtx.sendVerificationCode('13800000002')).rejects.toBeDefined();
    });
    expect(signInWithOtp).toHaveBeenCalledWith({ phone: '13800000002', options: { channel: 'sms' } });
  });

  it('loginWithSms fails on invalid code', async () => {
    verifyOtp.mockResolvedValueOnce({ error: { message: 'invalid code' } });
    render(
      <AuthProvider>
        <ContextProbe />
      </AuthProvider>
    );
    await act(async () => {
      await expect(exportedCtx.loginWithSms('13800000003', '123456')).rejects.toBeDefined();
    });
    expect(verifyOtp).toHaveBeenCalledWith({ phone: '13800000003', token: '123456', type: 'sms' });
  });

  it('loginWithThirdParty fails correctly', async () => {
    signInWithOAuth.mockResolvedValueOnce({ error: { message: 'oauth failed' } });
    render(
      <AuthProvider>
        <ContextProbe />
      </AuthProvider>
    );
    await act(async () => {
      await expect(exportedCtx.loginWithThirdParty('wechat')).rejects.toBeDefined();
    });
    expect(signInWithOAuth).toHaveBeenCalled();
  });

  it('onAuthStateChange subscribes and logout clears user', async () => {
    const session = {
      user: {
        id: 'u1',
        phone: '13800000000',
        user_metadata: { name: '张三', role: 'LEAD_ADMIN' },
      },
    };
    getSession.mockResolvedValueOnce({ data: { session }, error: null });
    render(
      <AuthProvider>
        <ContextProbe />
      </AuthProvider>
    );
    await act(async () => {});
    expect(onAuthStateChange).toHaveBeenCalled();
    await act(async () => {
      onAuthCallback('SIGNED_IN', session);
      await Promise.resolve();
    });
    await new Promise(r => setTimeout(r, 0));

    await act(async () => {
      await exportedCtx.logout();
    });
    expect(signOut).toHaveBeenCalled();
    expect(exportedCtx.user).toBeNull();
  });
});
