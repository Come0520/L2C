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
    success: 'bg-green-50 border-green-200 text-green-800',
    error: 'bg-red-50 border-red-200 text-red-800',
    info: 'bg-blue-50 border-blue-200 text-blue-800'
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
