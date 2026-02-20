import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { UserForm } from '../user-form';
import * as userActions from '../../actions/user-actions';
import React from 'react';

// Mock actions
vi.mock('../../actions/user-actions', () => ({
    updateUser: vi.fn(),
}));

// Mock sonner
vi.mock('sonner', () => ({
    toast: {
        success: vi.fn(),
        error: vi.fn(),
    },
}));

// Mock Dialog to avoid Portal issues in JSDOM
vi.mock('@/shared/ui/dialog', () => ({
    Dialog: ({ children, open }: any) => open ? <div>{children}</div> : null,
    DialogContent: ({ children }: any) => <div>{children}</div>,
    DialogHeader: ({ children }: any) => <div>{children}</div>,
    DialogTitle: ({ children }: any) => <h2>{children}</h2>,
    DialogFooter: ({ children }: any) => <div>{children}</div>,
}));

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
}));

// Mock UI Components to avoid Radix UI issues in JSDOM
vi.mock('@/shared/ui/dialog', () => ({
    Dialog: ({ children, open }: { children: React.ReactNode, open: boolean }) => open ? <div>{children}</div> : null,
    DialogContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    DialogHeader: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    DialogTitle: ({ children }: { children: React.ReactNode }) => <h2>{children}</h2>,
    DialogFooter: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

vi.mock('./role-selector', () => ({
    RoleSelector: () => <div data-testid="role-selector">Role Selector</div>,
}));

describe('UserForm Loading', () => {
    const defaultProps = {
        open: true,
        onOpenChange: vi.fn(),
        onSuccess: vi.fn(),
        initialData: { id: 'user-1', name: 'Test User', roles: ['USER'], isActive: true },
        availableRoles: [{ label: 'Admin', value: 'ADMIN' }],
    };

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('提交时按钮应进入 Loading 状态并禁用', async () => {
        let resolveAction: (val: { success: boolean, error?: string }) => void;
        const promise = new Promise<{ success: boolean, error?: string }>(resolve => {
            resolveAction = resolve;
        });

        vi.mocked(userActions.updateUser).mockReturnValue(promise as any);

        render(<UserForm {...defaultProps} />);

        const saveButton = screen.getByRole('button', { name: /保存/i }) as HTMLButtonElement;

        // 填写必填项（如果有校验）
        const nameInput = screen.getByPlaceholderText(/用户姓名/i);
        fireEvent.change(nameInput, { target: { value: 'New Name' } });

        fireEvent.submit(screen.getByRole('form'));

        // 验证 Loading 状态：按钮应被禁用
        await waitFor(() => {
            expect(saveButton.disabled).toBe(true);
        });

        // 结束 action
        resolveAction!({ success: true });

        await waitFor(() => {
            expect(saveButton.disabled).toBe(false);
        });
    });

    it('提交失败时应显示错误提示', async () => {
        const errorMessage = '服务器内部错误';
        vi.mocked(userActions.updateUser).mockResolvedValue({
            success: false,
            error: errorMessage
        } as any);

        const { toast } = await import('sonner');

        render(<UserForm {...defaultProps} />);

        const nameInput = screen.getByPlaceholderText(/用户姓名/i);
        fireEvent.change(nameInput, { target: { value: 'New Name' } });
        fireEvent.submit(screen.getByRole('form'));

        await waitFor(() => {
            expect(toast.error).toHaveBeenCalledWith(errorMessage);
        });
    });
});
