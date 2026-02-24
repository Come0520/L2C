import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import MobileLayout from '../layout';
import { usePathname } from 'next/navigation';
import { vi, describe, it, expect } from 'vitest';

vi.mock('next/navigation', () => ({
    usePathname: vi.fn(),
}));

vi.mock('@/shared/auth/mobile-auth-context', () => ({
    MobileAuthProvider: ({ children }: any) => <div data-testid="auth-provider">{children}</div>,
}));

describe('MobileLayout', () => {
    it('should render header and children correctly', () => {
        (usePathname as any).mockReturnValue('/mobile/tasks');

        render(
            <MobileLayout>
                <div>Test Content</div>
            </MobileLayout>
        );

        expect(screen.getByText('L2C 移动端')).toBeInTheDocument();
        expect(screen.getByText('Test Content')).toBeInTheDocument();
    });

    it('should show bottom nav on non-login pages', () => {
        (usePathname as any).mockReturnValue('/mobile/tasks');

        render(
            <MobileLayout>
                <div>Test Content</div>
            </MobileLayout>
        );

        expect(screen.getByText('任务')).toBeInTheDocument();
        expect(screen.getByText('我的')).toBeInTheDocument();
    });

    it('should hide bottom nav on login page', () => {
        (usePathname as any).mockReturnValue('/mobile/login');

        render(
            <MobileLayout>
                <div>Test Content</div>
            </MobileLayout>
        );

        expect(screen.queryByText('任务')).not.toBeInTheDocument();
        expect(screen.queryByText('我的')).not.toBeInTheDocument();
    });
});
