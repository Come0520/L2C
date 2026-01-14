'use client';

import { motion } from 'framer-motion';
import { cn } from '@/shared/lib/utils';
import React from 'react';

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
    hoverEffect?: boolean;
    active?: boolean;
    as?: React.ElementType;
}

export const GlassCard = React.forwardRef<HTMLDivElement, GlassCardProps>(
    ({ className, children, hoverEffect = false, active = false, as: Component = motion.div, ...props }, ref) => {
        return (
            <Component
                ref={ref}
                whileHover={hoverEffect ? { scale: 1.02, y: -5 } : undefined}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                className={cn(
                    "relative overflow-hidden rounded-2xl border",
                    // Base Glass Style
                    "bg-white/5 backdrop-blur-xl border-white/10 shadow-xl",
                    // Hover/Active Glow
                    hoverEffect && "hover:border-white/20 hover:shadow-2xl hover:shadow-purple-500/10",
                    active && "border-purple-500/50 shadow-purple-500/20 bg-purple-500/5",
                    className
                )}
                {...props}
            >
                {/* Iridescent Gradient Border Overlay (Optional, for 'Pro' feel) */}
                <div className="absolute inset-0 pointer-events-none bg-gradient-to-br from-white/5 to-transparent opacity-50" />

                {/* Content */}
                <div className="relative z-10">
                    {children}
                </div>
            </Component>
        );
    }
);
GlassCard.displayName = "GlassCard";
