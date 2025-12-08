'use client';

import { motion } from 'framer-motion';
import React from 'react';

import { cn } from '@/utils/lib-utils';

interface PaperCardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  onClick?: React.MouseEventHandler<HTMLDivElement>;
}

export const PaperCard: React.FC<PaperCardProps> = ({
  children,
  className,
  hover = false,
  padding = 'md',
  onClick
}) => {
  const paddingClasses = {
    none: '',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
  };

  const classes = cn(
    'paper-card relative overflow-hidden transition-all duration-200',
    'bg-theme-bg-primary border border-theme-border', // Semantic base styles
    paddingClasses[padding],
    hover && 'hover:-translate-y-0.5', // Removed hover:shadow-md here as we might want to control it via var
    onClick && 'cursor-pointer',
    className
  );

  return (
    <motion.div
      className={classes}
      onClick={onClick}
      style={{
        borderRadius: 'var(--radius-xl)',
        boxShadow: hover ? 'var(--shadow-card), 0 10px 15px -3px rgba(0, 0, 0, 0.1)' : 'var(--shadow-card)', // Combine theme shadow with hover lift? Or just theme shadow?
        // Let's just use theme shadow as base. If hover, maybe we amplify it?
        // For now, let's just apply the variable.
      }}
      whileHover={{ scale: 1.01, y: -2 }}
      whileTap={onClick ? { scale: 0.99 } : undefined}
    >
      {children}
    </motion.div>
  );
};

interface PaperCardHeaderProps {
  children: React.ReactNode;
  className?: string;
  onClick?: React.MouseEventHandler<HTMLDivElement>;
}

export const PaperCardHeader: React.FC<PaperCardHeaderProps> = ({ children, className, onClick }) => {
  return (
    <div className={cn('border-b border-theme-border pb-4 mb-4', className)} onClick={onClick}>
      {children}
    </div>
  );
};

interface PaperCardTitleProps {
  children: React.ReactNode;
  className?: string;
  level?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
}

export const PaperCardTitle: React.FC<PaperCardTitleProps> = ({ children, className, level = 'h3' }) => {
  const Tag = level;
  const sizeClasses = {
    h1: 'text-3xl font-bold',
    h2: 'text-2xl font-bold',
    h3: 'text-xl font-semibold',
    h4: 'text-lg font-semibold',
    h5: 'text-base font-semibold',
    h6: 'text-sm font-semibold',
  };

  return (
    <Tag className={cn(sizeClasses[level], 'text-theme-text-primary', className)}>
      {children}
    </Tag>
  );
};

interface PaperCardDescriptionProps {
  children: React.ReactNode;
  className?: string;
}

export const PaperCardDescription: React.FC<PaperCardDescriptionProps> = ({ children, className }) => {
  return (
    <p className={cn('text-theme-text-secondary text-sm mt-1', className)}>
      {children}
    </p>
  );
};

interface PaperCardContentProps {
  children: React.ReactNode;
  className?: string;
}

export const PaperCardContent = React.forwardRef<HTMLDivElement, PaperCardContentProps>(({ children, className }, ref) => {
  return <div ref={ref} className={cn('text-theme-text-primary', className)}>{children}</div>;
});
PaperCardContent.displayName = "PaperCardContent";

interface PaperCardFooterProps {
  children: React.ReactNode;
  className?: string;
  onClick?: React.MouseEventHandler<HTMLDivElement>;
}

export const PaperCardFooter: React.FC<PaperCardFooterProps> = ({ children, className }) => {
  return (
    <div className={cn('border-t border-theme-border pt-4 mt-4', className)}>
      {children}
    </div>
  );
};

const PaperCardWithStatics = Object.assign(PaperCard, {
  Header: PaperCardHeader,
  Title: PaperCardTitle,
  Description: PaperCardDescription,
  Content: PaperCardContent,
  Footer: PaperCardFooter,
});

export default PaperCardWithStatics;
