'use client';

import Link from 'next/link';
import React from 'react';

import { cn } from '@/utils/lib-utils';

interface PaperNavProps {
  children: React.ReactNode;
  className?: string;
  vertical?: boolean;
}

export const PaperNav: React.FC<PaperNavProps> = ({ children, className, vertical = true }) => {
  const classes = cn(
    'space-y-1',
    !vertical && 'flex space-x-1 space-y-0',
    className
  );
  
  return <nav className={classes}>{children}</nav>;
};

interface PaperNavItemProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  children: React.ReactNode;
  active?: boolean;
  icon?: React.ReactNode;
  href: string;
  onClick?: (e: React.MouseEvent<HTMLAnchorElement>) => void;
}

export const PaperNavItem: React.FC<PaperNavItemProps> = ({ 
  children, 
  active = false, 
  icon, 
  className, 
  href,
  onClick,
  ...props 
}) => {
  const classes = cn(
    'paper-nav-item',
    'flex items-center py-2 px-3 rounded-md transition-all duration-200',
    // Default state: Secondary text, transparent background
    'text-theme-text-secondary hover:text-theme-text-primary hover:bg-theme-bg-tertiary',
    // Active state: Primary text, highlight background (Linear style: glowy border/bg)
    active 
      ? 'bg-blue-500/10 text-blue-500 dark:text-blue-400 border-l-2 border-blue-500 font-medium shadow-[0_0_10px_rgba(59,130,246,0.1)]' 
      : 'border-l-2 border-transparent',
    className
  );
  
  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (onClick) {
      onClick(e);
    }
  };
  
  return (
    <Link 
      href={href} 
      className={classes}
      onClick={handleClick}
      {...props}
    >
      {icon && <span className={cn("h-5 w-5 flex-shrink-0", children ? "mr-3" : "")}>{icon}</span>}
      <span className="truncate">{children}</span>
    </Link>
  );
};

interface PaperNavGroupProps {
  title: string;
  children: React.ReactNode;
  className?: string;
  defaultOpen?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export const PaperNavGroup: React.FC<PaperNavGroupProps> = ({ 
  title, 
  children, 
  className, 
  defaultOpen = false,
  open,
  onOpenChange
}) => {
  const [internalOpen, setInternalOpen] = React.useState(defaultOpen);
  const isControlled = open !== undefined;
  const isOpen = isControlled ? (open as boolean) : internalOpen;

  const toggle = () => {
    const next = !isOpen;
    if (isControlled && onOpenChange) onOpenChange(next);
    if (!isControlled) setInternalOpen(next);
  };

  return (
    <div className={cn('space-y-1', className)}>
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          toggle();
        }}
        className="flex items-center justify-between w-full px-3 py-2 text-sm font-medium text-theme-text-secondary hover:text-theme-text-primary hover:bg-theme-bg-tertiary rounded-md transition-all duration-200"
        aria-expanded={isOpen}
        aria-controls={`nav-group-${title}`}
      >
        <span>{title}</span>
        <svg 
          className={cn('h-4 w-4 transition-transform', isOpen && 'rotate-180')} 
          fill="none" 
          viewBox="0 0 24 24" 
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      <div 
        id={`nav-group-${title}`}
        className={cn('ml-4 space-y-1 overflow-hidden transition-all duration-300 ease-in-out', !isOpen ? 'max-h-0 opacity-0' : 'max-h-[2000px] opacity-100')}
      >
        {children}
      </div>
    </div>
  );
};

interface PaperSidebarProps {
  children: React.ReactNode;
  className?: string;
  collapsed?: boolean;
  onToggle?: () => void;
}

export const PaperSidebar: React.FC<PaperSidebarProps> = ({ 
  children, 
  className, 
  collapsed = false, 
  onToggle 
}) => {
  const classes = cn(
    'h-screen flex flex-col transition-all duration-300 bg-theme-bg-secondary border-r border-theme-border',
    collapsed ? 'w-16' : 'w-64',
    className
  );
  
  return (
    <aside className={classes}>
      <div className="flex-1 overflow-y-auto p-4">
        {children}
      </div>
      {onToggle && (
        <div className="border-t border-theme-border p-4">
          <button
            onClick={onToggle}
            className="paper-button w-full justify-center text-theme-text-secondary hover:text-theme-text-primary hover:bg-theme-bg-tertiary"
            aria-label={collapsed ? '展开侧边栏' : '收起侧边栏'}
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              {collapsed ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              )}
            </svg>
          </button>
        </div>
      )}
    </aside>
  );
};
