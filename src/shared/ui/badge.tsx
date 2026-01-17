/**
 * Badge 组件
 * 用于显示状态、标签、计数等
 */

import { forwardRef, type HTMLAttributes, type ReactNode } from 'react';
import { cn } from '@/shared/lib/utils';

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
    variant?: 'default' | 'primary' | 'secondary' | 'outline' | 'success' | 'warning' | 'error' | 'info' | 'destructive';
    size?: 'sm' | 'md';
    children: ReactNode;
}

const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
    ({ className, variant = 'default', size = 'md', ...props }, ref) => {
        const variants = {
            default: 'bg-gray-100 text-gray-700',
            primary: 'bg-primary-100 text-primary-700',
            secondary: 'bg-gray-100 text-gray-900', // Added secondary
            outline: 'border border-gray-200 text-gray-700', // Added outline
            success: 'bg-success-50 text-success-600',
            warning: 'bg-warning-50 text-warning-600',
            error: 'bg-error-50 text-error-600',
            info: 'bg-info-50 text-info-600',
            destructive: 'bg-red-100 text-red-700',
        };

        const sizes = {
            sm: 'px-1.5 py-0.5 text-xs',
            md: 'px-2 py-1 text-xs',
        };

        return (
            <span
                ref={ref}
                className={cn(
                    'inline-flex items-center font-medium rounded-md',
                    variants[variant],
                    sizes[size],
                    className
                )}
                {...props}
            />
        );
    }
);

Badge.displayName = 'Badge';

export { Badge };
