'use client';

import { X } from 'lucide-react';
import React, { useEffect } from 'react';

import { cn } from '@/utils/lib-utils';

interface PaperToastProps {
  message: string;
  type?: 'success' | 'error' | 'info';
  duration?: number;
  onClose: () => void;
  className?: string;
}

export const PaperToast: React.FC<PaperToastProps> = ({
  message,
  type = 'info',
  duration = 3000,
  onClose,
  className
}) => {
  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(onClose, duration);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [duration, onClose]);

  const bgColors = {
    success: 'bg-success-50 border-success-200 text-success-800',
    error: 'bg-rose-50 border-rose-200 text-rose-800',
    info: 'bg-primary-50 border-primary-200 text-primary-800'
  };

  return (
    <div className={cn(
      'fixed top-4 right-4 z-50 flex items-center p-4 rounded-lg border shadow-lg',
      bgColors[type],
      className
    )}>
      <span className="mr-3 text-sm font-medium">{message}</span>
      <button onClick={onClose} className="p-1 hover:bg-black/5 rounded-full">
        <X size={16} />
      </button>
    </div>
  );
};
