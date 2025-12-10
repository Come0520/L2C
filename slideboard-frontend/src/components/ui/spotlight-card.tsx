'use client';

import { motion, useMotionTemplate, useMotionValue } from 'framer-motion';
import React from 'react';

import { cn } from '@/lib/utils';

interface SpotlightCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  spotlightColor?: string;
}

/**
 * Linear Style Spotlight Card
 * A card with a subtle spotlight effect that follows the cursor.
 * 
 * Optimized with Framer Motion to avoid re-renders.
 */
export const SpotlightCard: React.FC<SpotlightCardProps> = ({
  children,
  className,
  spotlightColor = 'rgba(59, 130, 246, 0.15)', // Default blue subtle glow
  ...props
}) => {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const opacity = useMotionValue(0);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const { left, top } = e.currentTarget.getBoundingClientRect();
    mouseX.set(e.clientX - left);
    mouseY.set(e.clientY - top);
  };

  const handleMouseEnter = () => {
    opacity.set(1);
  };

  const handleMouseLeave = () => {
    opacity.set(0);
  };

  const background = useMotionTemplate`radial-gradient(600px circle at ${mouseX}px ${mouseY}px, ${spotlightColor}, transparent 40%)`;

  return (
    <div
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={cn(
        'relative overflow-hidden rounded-xl border border-theme-border bg-theme-bg-secondary transition-colors duration-200',
        className
      )}
      {...props}
    >
      <motion.div
        className="pointer-events-none absolute -inset-px transition duration-300 z-10"
        style={{
          opacity,
          background,
        }}
      />
      <div className="relative z-20 h-full">{children}</div>
    </div>
  );
};

// Export sub-components for easier migration from PaperCard
export const SpotlightCardHeader: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ children, className, ...props }) => (
  <div className={cn('p-6 pb-0 mb-4', className)} {...props}>
    {children}
  </div>
);

export const SpotlightCardTitle: React.FC<React.HTMLAttributes<HTMLHeadingElement>> = ({ children, className, ...props }) => (
  <h3 className={cn('text-lg font-semibold text-theme-text-primary', className)} {...props}>
    {children}
  </h3>
);

export const SpotlightCardContent: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ children, className, ...props }) => (
  <div className={cn('p-6 pt-0', className)} {...props}>
    {children}
  </div>
);

// Compatibility wrapper to allow easy replacement
export const SpotlightCardWithStatics = Object.assign(SpotlightCard, {
  Header: SpotlightCardHeader,
  Title: SpotlightCardTitle,
  Content: SpotlightCardContent,
});
