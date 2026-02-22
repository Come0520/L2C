import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { LoginForm } from '../components/login-form';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

// Mock dependencies
vi.mock('next-auth/react', () => ({
    signIn: vi.fn(),
}));

vi.mock('next/navigation', () => ({
    useRouter: vi.fn(),
}));

vi.mock('sonner', () => ({
    toast: {
        success: vi.fn(),
        error: vi.fn(),
        info: vi.fn(),
    },
}));

describe('LoginForm', () => {
    let mockPush: ReturnType<typeof vi.fn>;
    let mockRefresh: ReturnType<typeof vi.fn>;

    beforeEach(() => {
        vi.clearAllMocks();
        mockPush = vi.fn();
        mockRefresh = vi.fn();
        vi.mocked(useRouter).mockReturnValue({
            push: mockPush,
            refresh: mockRefresh,
            back: vi.fn(),
            forward: vi.fn(),
            replace: vi.fn(),
            prefetch: vi.fn(),
        } as any);
    });

    it('renders correctly', () => {
        render(<LoginForm />);
        expect(screen.getByText('欢迎回到 L2C 系统')).toBeDefined();
        expect(screen.getByLabelText(/手机号 \/ 邮箱/i)).toBeDefined();
        expect(screen.getByLabelText(/^密码$/i)).toBeDefined();
        expect(screen.getByRole('button', { name: /登录/i })).toBeDefined();
    });

    it('toggles password visibility', () => {
        render(<LoginForm />);
        const passwordInput = screen.getByLabelText(/^密码$/i) as HTMLInputElement;
        const toggleButton = screen.getByRole('button', { name: /显示密码/i });

        expect(passwordInput.type).toBe('password');
        fireEvent.click(toggleButton);
        expect(passwordInput.type).toBe('text');

        const hideButton = screen.getByRole('button', { name: /隐藏密码/i });
        fireEvent.click(hideButton);
        expect(passwordInput.type).toBe('password');
    });

    it('shows info toast on forgot password click', () => {
        render(<LoginForm />);
        const forgotBtn = screen.getByText('忘记密码？');
        fireEvent.click(forgotBtn);
        expect(toast.info).toHaveBeenCalledWith('请联系管理员重置密码');
    });

    it('submits form and handles successful login', async () => {
        vi.mocked(signIn).mockResolvedValueOnce({ error: null } as any);
        render(<LoginForm />);

        fireEvent.change(screen.getByLabelText(/手机号 \/ 邮箱/i), { target: { value: 'test@example.com' } });
        fireEvent.change(screen.getByLabelText(/^密码$/i), { target: { value: 'password123' } });

        fireEvent.click(screen.getByRole('button', { name: /登录/i }));

        await waitFor(() => {
            expect(signIn).toHaveBeenCalledWith('credentials', {
                username: 'test@example.com',
                password: 'password123',
                redirect: false,
            });
            expect(toast.success).toHaveBeenCalledWith('登录成功');
            expect(mockPush).toHaveBeenCalledWith('/');
            expect(mockRefresh).toHaveBeenCalled();
        });
    });

    it('handles login failure', async () => {
        vi.mocked(signIn).mockResolvedValueOnce({ error: 'Invalid credentials' } as any);
        render(<LoginForm />);

        fireEvent.change(screen.getByLabelText(/手机号 \/ 邮箱/i), { target: { value: 'test@example.com' } });
        fireEvent.change(screen.getByLabelText(/^密码$/i), { target: { value: 'wrongpass' } });

        fireEvent.click(screen.getByRole('button', { name: /登录/i }));

        await waitFor(() => {
            expect(toast.error).toHaveBeenCalledWith('登录失败：用户名或密码错误');
            expect(mockPush).not.toHaveBeenCalled();
        });
    });

    it('handles unhandled exceptions during login', async () => {
        vi.mocked(signIn).mockRejectedValueOnce(new Error('Network error'));
        render(<LoginForm />);

        fireEvent.change(screen.getByLabelText(/手机号 \/ 邮箱/i), { target: { value: 'test@example.com' } });
        fireEvent.change(screen.getByLabelText(/^密码$/i), { target: { value: 'wrongpass' } });

        fireEvent.click(screen.getByRole('button', { name: /登录/i }));

        await waitFor(() => {
            expect(toast.error).toHaveBeenCalledWith('登录失败，请稍后重试');
            expect(mockPush).not.toHaveBeenCalled();
        });
    });
});
