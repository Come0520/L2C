'use client';

import { motion } from 'framer-motion';
import React from 'react';

import { cn } from '@/utils/lib-utils';

interface MovingBorderCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  duration?: number;
  borderColor?: string;
}

/**
 * Linear Style Moving Border Card
 * A card with a continuously rotating gradient border.
 * Ideal for high-priority items or active states.
 */
export const MovingBorderCard: React.FC<MovingBorderCardProps> = ({
  children,
  className,
  duration = 4000,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  borderColor,
  ...props
}) => {
  return (
    <div className={cn('relative overflow-hidden rounded-xl bg-neutral-950 p-[1px]', className)} {...props}>
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: duration / 1000, repeat: Infinity, ease: 'linear' }}
        className="absolute -inset-[300%] bg-[conic-gradient(from_90deg_at_50%_50%,#00000000_50%,#3b82f6_100%)] opacity-100"
      />
      <div className="relative h-full w-full overflow-hidden rounded-xl bg-white dark:bg-neutral-900">
        {children}
      </div>
    </div>
  );
};
