import '@testing-library/jest-dom';
import { render, screen, waitFor } from '@testing-library/react';
import MobileApprovalsPage from '../page';
import { useMobileAuth } from '@/shared/auth/mobile-auth-context';
import { mobileGet } from '@/shared/lib/mobile-api-client';
import { vi, describe, it, expect, beforeEach } from 'vitest';

vi.mock('next/navigation', () => ({
    useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
}));

vi.mock('@/shared/auth/mobile-auth-context', () => ({
    useMobileAuth: vi.fn(),
}));

vi.mock('@/shared/lib/mobile-api-client', () => ({
    mobileGet: vi.fn(),
}));

// Mock Skeleton
vi.mock('@/shared/ui/skeleton-variants', () => ({
    MobileApprovalSkeleton: () => <div data-testid="skeleton">Loading...</div>,
}));

describe('MobileApprovalsPage', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should show skeleton while loading auth', () => {
        (useMobileAuth as any).mockReturnValue({ isAuthenticated: false, isLoading: true });

        render(<MobileApprovalsPage />);
        expect(screen.getByTestId('skeleton')).toBeInTheDocument();
    });

    it('should fetch and display approvals', async () => {
        (useMobileAuth as any).mockReturnValue({ isAuthenticated: true, isLoading: false });

        (mobileGet as any).mockResolvedValue({
            success: true,
            data: {
                items: [
                    {
                        id: 'app-1',
                        flowName: '请假审批',
                        requesterName: '张三',
                        nodeName: '部门经理',
                        createdAt: '2023-01-01T00:00:00Z',
                    },
                ],
                total: 1,
            },
        });

        render(<MobileApprovalsPage />);

        await waitFor(() => {
            expect(screen.getByText('请假审批')).toBeInTheDocument();
            expect(screen.getByText('张三 提交的申请')).toBeInTheDocument();
            expect(screen.getByText('1 单')).toBeInTheDocument();
        });
    });

    it('should show empty state if no approvals', async () => {
        (useMobileAuth as any).mockReturnValue({ isAuthenticated: true, isLoading: false });

        (mobileGet as any).mockResolvedValue({
            success: true,
            data: { items: [], total: 0 },
        });

        render(<MobileApprovalsPage />);

        await waitFor(() => {
            expect(screen.getByText('暂无待处理的审批')).toBeInTheDocument();
            expect(screen.getByText('0 单')).toBeInTheDocument();
        });
    });
});
