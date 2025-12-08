'use client';

import React, { useState } from 'react';

import { cn } from '@/utils/lib-utils';

interface PaperTooltipProps {
  content?: string;
  children: React.ReactNode;
  disabled?: boolean;
  className?: string;
}

export const PaperTooltip: React.FC<PaperTooltipProps> = ({ 
  content, 
  children, 
  disabled = false,
  className 
}) => {
  const [isVisible, setIsVisible] = useState(false);

  if (!content || disabled) {
    return <>{children}</>;
  }

  return (
    <div 
      className={cn("relative inline-block", className)}
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
    >
      {children}
      {isVisible && (
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-1 bg-ink-900 text-white text-xs rounded shadow-lg whitespace-nowrap z-50">
          {content}
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-ink-900" />
        </div>
      )}
    </div>
  );
};
