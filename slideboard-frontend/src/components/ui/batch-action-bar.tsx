'use client';

import React from 'react';

import { cn } from '@/utils/lib-utils';

import { PaperButton } from './paper-button';

interface BatchAction {
  id: string;
  label: string;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'success' | 'warning' | 'error' | 'info';
  size?: 'small' | 'medium' | 'large';
  icon?: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
}

interface BatchActionBarProps {
  selectedCount: number;
  actions: BatchAction[];
  onClearSelection?: () => void;
  className?: string;
}

export const BatchActionBar: React.FC<BatchActionBarProps> = ({
  selectedCount,
  actions,
  onClearSelection,
  className
}) => {
  if (selectedCount === 0) return null;

  return (
    <div className={cn(
      'fixed bottom-0 left-0 right-0 bg-white border-t border-paper-600 shadow-lg z-40',
      className
    )}>
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        {/* Selected Count */}
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-ink-700">
            已选择 <span className="font-semibold text-blue-600">{selectedCount}</span> 项
          </span>
          {onClearSelection && (
            <button
              onClick={onClearSelection}
              className="text-sm text-ink-500 hover:text-ink-700 hover:underline"
            >
              取消选择
            </button>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {actions.map((action) => (
            <PaperButton
              key={action.id}
              variant={action.variant}
              size={action.size || 'medium'}
              icon={action.icon}
              onClick={action.onClick}
              disabled={action.disabled}
            >
              {action.label}
            </PaperButton>
          ))}
        </div>
      </div>
    </div>
  );
};
