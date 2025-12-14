'use client';

import { CheckCircle2, Clock, AlertTriangle, Circle } from 'lucide-react';

import { useWorkflow } from '@/hooks/useWorkflow';
import { SalesOrderStatus, getStatusName, STATUS_METADATA } from '@/types/sales-order-status';

interface StatusBadgeProps {
    status: SalesOrderStatus;
    size?: 'sm' | 'md' | 'lg';
    showIcon?: boolean;
    animated?: boolean;
    className?: string;
}

export function StatusBadge({
    status,
    size = 'md',
    showIcon = true,
    animated = false,
    className = '',
}: StatusBadgeProps) {
    const { getStatusMetadata } = useWorkflow();
    // Prefer dynamic config, fallback to hardcoded metadata
    const configMetadata = getStatusMetadata(status);
    const metadata = configMetadata
        ? { ...configMetadata, category: configMetadata.category as any } // Cast category if types differ slightly
        : STATUS_METADATA[status];

    const statusName = configMetadata ? configMetadata.name : getStatusName(status);

    // Size classes
    const sizeClasses = {
        sm: 'text-xs px-2 py-1',
        md: 'text-sm px-3 py-1.5',
        lg: 'text-base px-4 py-2',
    };

    const iconSizes = {
        sm: 'w-3 h-3',
        md: 'w-4 h-4',
        lg: 'w-5 h-5',
    };

    // Get icon based on category
    const getIcon = () => {
        switch (metadata.category) {
            case 'LEAD':
                return <Clock className={iconSizes[size]} />;
            case 'ORDER':
                return <CheckCircle2 className={iconSizes[size]} />;
            case 'FINANCE':
                return <CheckCircle2 className={iconSizes[size]} />;
            case 'EXCEPTION':
                return <AlertTriangle className={iconSizes[size]} />;
            default:
                return <Circle className={iconSizes[size]} />;
        }
    };

    // Get color classes based on category
    const getColorClasses = () => {
        switch (metadata.category) {
            case 'LEAD':
                return 'bg-blue-100 text-blue-700 border-blue-300';
            case 'ORDER':
                return 'bg-green-100 text-green-700 border-green-300';
            case 'FINANCE':
                return 'bg-purple-100 text-purple-700 border-purple-300';
            case 'EXCEPTION':
                return 'bg-red-100 text-red-700 border-red-300';
            default:
                return 'bg-gray-100 text-gray-700 border-gray-300';
        }
    };

    return (
        <div
            className={`
        inline-flex items-center gap-1.5 font-medium rounded-full border-2
        ${sizeClasses[size]}
        ${getColorClasses()}
        ${animated ? 'animate-pulse-gentle' : 'animate-fadeIn'}
        ${className}
      `}
        >
            {showIcon && getIcon()}
            <span>{statusName}</span>

            {/* Pulse animation for active statuses */}
            {animated && (
                <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-current opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-current" />
                </span>
            )}

            <style jsx global>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }

        @keyframes pulse-gentle {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.8; }
        }

        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }

        .animate-pulse-gentle {
          animation: pulse-gentle 2s ease-in-out infinite;
        }
      `}</style>
        </div>
    );
}
