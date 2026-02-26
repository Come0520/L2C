import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { LoginForm } from '../components/login-form';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';

vi.mock('next-auth/react', () => ({
    signIn: vi.fn(),
}));

vi.mock('next/navigation', () => ({
    useRouter: vi.fn(),
}));

// 关键：使用同步工厂（非 async），确保 vi.fn() 实例在模块解析时就就绪
vi.mock('sonner', () => ({
    toast: {
        success: vi.fn(),
        error: vi.fn(),
        info: vi.fn(),
    },
}));

// 组件导入了 logger，需要 mock 防止 Node.js 模块解析失败
vi.mock('@/shared/lib/logger', () => ({
    logger: {
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
        debug: vi.fn(),
    },
}));

describe('LoginForm', () => {
    let mockPush: ReturnType<typeof vi.fn>;
    let mockRefresh: ReturnType<typeof vi.fn>;

    beforeEach(() => {
        vi.clearAllMocks(); // 完全清理所有 mock 历史

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

        vi.mocked(signIn).mockReset();
    });

    it('renders correctly', () => {
        render(<LoginForm />);
        expect(screen.getByText('欢迎回到 L2C 系统')).toBeDefined();
        expect(screen.getByLabelText(/手机号 \/ 邮箱/i)).toBeDefined();
        expect(screen.getByLabelText(/^密码$/i)).toBeDefined();
        expect(screen.getByRole('button', { name: /登录/i })).toBeDefined();
    });

    it('shows error toast when submitting empty form (Zod validation)', async () => {
        const { container } = render(<LoginForm />);
        // JSDOM 中 fireEvent.click(submitBtn) 不会自动触发 form.onSubmit
        // 必须使用 fireEvent.submit(form) 直接触发 handleSubmit
        const form = container.querySelector('form')!;

        // 重置 toast.error 调用历史
        const { toast } = await import('sonner');
        vi.mocked(toast.error).mockClear();

        fireEvent.submit(form);

        await waitFor(() => {
            expect(toast.error).toHaveBeenCalledWith('请输入手机号或邮箱');
            expect(signIn).not.toHaveBeenCalled();
        });
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

    it('has a link to forgot password page', () => {
        render(<LoginForm />);
        const forgotLink = screen.getByText('忘记密码？', { selector: 'a' });
        expect(forgotLink.getAttribute('href')).toBe('/forgot-password');
    });

    it('submits form and handles successful login', async () => {
        vi.mocked(signIn).mockResolvedValueOnce({ error: null } as any);
        render(<LoginForm />);

        const { toast } = await import('sonner');
        vi.mocked(toast.success).mockClear();

        fireEvent.change(screen.getByLabelText(/手机号 \/ 邮箱/i), { target: { value: 'test@example.com' } });
        fireEvent.change(screen.getByLabelText(/^密码$/i), { target: { value: 'password123' } });

        fireEvent.click(screen.getByRole('button', { name: /登录/i }));

        await waitFor(() => {
            expect(toast.success).toHaveBeenCalledWith('登录成功，欢迎回来');
            expect(mockPush).toHaveBeenCalledWith('/');
        });
    });

    it('handles login failure with error message', async () => {
        vi.mocked(signIn).mockResolvedValueOnce({ error: 'CredentialsSignin' } as any);
        render(<LoginForm />);

        const { toast } = await import('sonner');
        vi.mocked(toast.error).mockClear();

        fireEvent.change(screen.getByLabelText(/手机号 \/ 邮箱/i), { target: { value: 'test@example.com' } });
        fireEvent.change(screen.getByLabelText(/^密码$/i), { target: { value: 'wrongpassword' } });

        fireEvent.click(screen.getByRole('button', { name: /登录/i }));

        await waitFor(() => {
            expect(toast.error).toHaveBeenCalledWith('登录失败：用户名或密码错误');
        });
    });

    it('handles unexpected exceptions during login', async () => {
        vi.mocked(signIn).mockRejectedValueOnce(new Error('Network error'));
        render(<LoginForm />);

        const { toast } = await import('sonner');
        vi.mocked(toast.error).mockClear();

        fireEvent.change(screen.getByLabelText(/手机号 \/ 邮箱/i), { target: { value: 'test@example.com' } });
        fireEvent.change(screen.getByLabelText(/^密码$/i), { target: { value: 'password123' } });

        fireEvent.click(screen.getByRole('button', { name: /登录/i }));

        await waitFor(() => {
            expect(toast.error).toHaveBeenCalledWith('网络连接异常，请稍后重试');
        });
    });
});
