'use client';

import { cn } from '@/shared/lib/utils';
import { CheckCircle2, Clock, AlertCircle } from 'lucide-react';

/**
 * 认证状态类型
 */
export type VerificationStatus = 'unverified' | 'pending' | 'verified' | 'rejected';

interface VerificationBadgeProps {
    /** 认证状态 */
    status: VerificationStatus;
    /** 尺寸 */
    size?: 'sm' | 'md' | 'lg';
    /** 是否只显示图标 */
    iconOnly?: boolean;
    /** 自定义类名 */
    className?: string;
}

/**
 * 认证状态配置
 */
const statusConfig = {
    unverified: {
        label: '未认证',
        icon: AlertCircle,
        className: 'text-gray-400 dark:text-gray-500',
        bgClassName: 'bg-gray-100 dark:bg-gray-800',
    },
    pending: {
        label: '审核中',
        icon: Clock,
        className: 'text-amber-500 dark:text-amber-400',
        bgClassName: 'bg-amber-100 dark:bg-amber-900/30',
    },
    verified: {
        label: '已认证',
        icon: CheckCircle2,
        className: 'text-blue-500 dark:text-blue-400',
        bgClassName: 'bg-blue-100 dark:bg-blue-900/30',
    },
    rejected: {
        label: '已拒绝',
        icon: AlertCircle,
        className: 'text-red-500 dark:text-red-400',
        bgClassName: 'bg-red-100 dark:bg-red-900/30',
    },
};

/**
 * 尺寸配置
 */
const sizeConfig = {
    sm: {
        icon: 'h-3.5 w-3.5',
        text: 'text-xs',
        padding: 'px-1.5 py-0.5',
        gap: 'gap-0.5',
    },
    md: {
        icon: 'h-4 w-4',
        text: 'text-sm',
        padding: 'px-2 py-1',
        gap: 'gap-1',
    },
    lg: {
        icon: 'h-5 w-5',
        text: 'text-base',
        padding: 'px-2.5 py-1.5',
        gap: 'gap-1.5',
    },
};

/**
 * 认证标识组件
 * 用于显示企业认证状态
 */
export function VerificationBadge({
    status,
    size = 'md',
    iconOnly = false,
    className,
}: VerificationBadgeProps) {
    const config = statusConfig[status];
    const sizeStyle = sizeConfig[size];
    const Icon = config.icon;

    // 只有已认证状态才默认显示
    if (status === 'unverified' && iconOnly) {
        return null;
    }

    if (iconOnly) {
        return (
            <Icon
                className={cn(sizeStyle.icon, config.className, className)}
                title={config.label}
            />
        );
    }

    return (
        <span
            className={cn(
                'inline-flex items-center rounded-full font-medium',
                sizeStyle.padding,
                sizeStyle.gap,
                sizeStyle.text,
                config.bgClassName,
                config.className,
                className
            )}
        >
            <Icon className={sizeStyle.icon} />
            <span>{config.label}</span>
        </span>
    );
}

/**
 * 认证小标识（仅图标，用于紧凑场景）
 * 仅在已认证时显示
 */
export function VerifiedIcon({
    size = 'sm',
    className,
}: {
    size?: 'sm' | 'md' | 'lg';
    className?: string;
}) {
    const sizeStyle = sizeConfig[size];

    return (
        <CheckCircle2
            className={cn(
                sizeStyle.icon,
                'text-blue-500 dark:text-blue-400',
                className
            )}
            title="已认证企业"
        />
    );
}
