'use client';

import React, { useEffect } from 'react';

import { cn } from '@/utils/lib-utils';

interface PaperModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  className?: string;
}

export const PaperModal: React.FC<PaperModalProps> = ({ isOpen, onClose, title, children, className }) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      return () => { document.body.style.overflow = ''; };
    }
    return undefined;
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className={cn('bg-paper-400 border border-paper-600 rounded-xl shadow-paper-xl w-full max-w-3xl mx-4', className)}>
        <div className="px-6 py-4 border-b border-paper-600 flex items-center justify-between">
          <div className="text-lg font-semibold text-ink-800">{title}</div>
          <button className="paper-button" onClick={onClose}>关闭</button>
        </div>
        <div className="px-6 py-4">
          {children}
        </div>
      </div>
    </div>
  );
};

