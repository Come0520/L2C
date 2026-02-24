import '@testing-library/jest-dom';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import MobileTasksPage from '../page';
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

vi.mock('@/shared/ui/skeleton-variants', () => ({
    MobileTaskSkeleton: () => <div data-testid="skeleton">Loading...</div>,
}));

describe('MobileTasksPage', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should show skeleton while loading auth', () => {
        (useMobileAuth as any).mockReturnValue({ isAuthenticated: false, isLoading: true });

        render(<MobileTasksPage />);
        expect(screen.getByTestId('skeleton')).toBeInTheDocument();
    });

    it('should fetch and display tasks based on tabs', async () => {
        (useMobileAuth as any).mockReturnValue({ isAuthenticated: true, isLoading: false });

        (mobileGet as any).mockResolvedValue({
            success: true,
            data: [
                {
                    id: 't-1',
                    type: 'measure',
                    status: 'PENDING_VISIT',
                    customer: { name: '李四' },
                    address: '朝阳区',
                },
                {
                    id: 't-2',
                    type: 'install',
                    status: 'IN_PROGRESS',
                    customer: { name: '王五' },
                    address: '海淀区',
                },
            ],
        });

        render(<MobileTasksPage />);

        // Wait for tasks to load (default tab is 'pending' -> 'PENDING_VISIT')
        await waitFor(() => {
            expect(screen.getByText('李四')).toBeInTheDocument();
            expect(screen.queryByText('王五')).not.toBeInTheDocument();
        });

        // Switch to 'inProgress' (shows 'IN_PROGRESS')
        fireEvent.click(screen.getByText('进行中'));

        await waitFor(() => {
            expect(screen.queryByText('李四')).not.toBeInTheDocument();
            expect(screen.getByText('王五')).toBeInTheDocument();
        });
    });

    it('should show empty state if no tasks match tab', async () => {
        (useMobileAuth as any).mockReturnValue({ isAuthenticated: true, isLoading: false });

        (mobileGet as any).mockResolvedValue({
            success: true,
            data: [],
        });

        render(<MobileTasksPage />);

        await waitFor(() => {
            expect(screen.getByText('暂无待处理任务')).toBeInTheDocument();
        });
    });
});
