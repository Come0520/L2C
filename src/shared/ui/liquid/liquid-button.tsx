'use client';

import { motion, HTMLMotionProps } from 'framer-motion';
import { cn } from '@/shared/lib/utils';
import React from 'react';

interface LiquidButtonProps extends HTMLMotionProps<"button"> {
    variant?: 'primary' | 'secondary' | 'ghost';
    size?: 'sm' | 'md' | 'lg';
    children: React.ReactNode;
}

export const LiquidButton = React.forwardRef<HTMLButtonElement, LiquidButtonProps>(
    ({ className, children, variant = 'primary', size = 'md', ...props }, ref) => {

        const variants = {
            primary: "bg-gradient-to-r from-purple-600 via-blue-600 to-purple-600 bg-[length:200%_auto] text-white border-none shadow-[0_0_20px_rgba(124,58,237,0.5)]",
            secondary: "bg-slate-100 dark:bg-white/10 backdrop-blur-md border border-slate-200 dark:border-white/10 text-slate-700 dark:text-white hover:bg-slate-200 dark:hover:bg-white/20",
            ghost: "bg-transparent text-slate-600 dark:text-gray-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 border border-slate-200 dark:border-transparent"
        };

        const sizes = {
            sm: "px-4 py-2 text-sm",
            md: "px-6 py-3 text-base",
            lg: "px-8 py-4 text-lg"
        };

        return (
            <motion.button
                ref={ref}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                animate={variant === 'primary' ? {
                    backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
                } : undefined}
                transition={variant === 'primary' ? {
                    backgroundPosition: {
                        duration: 3,
                        repeat: Infinity,
                        ease: "linear"
                    }
                } : undefined}
                className={cn(
                    "relative rounded-full font-medium transition-all duration-300 overflow-hidden",
                    "flex items-center justify-center gap-2",
                    variants[variant],
                    sizes[size],
                    className
                )}
                {...props}
            >
                {/* Glossy Overlay */}
                {variant !== 'ghost' && (
                    <div className="absolute inset-0 rounded-full bg-gradient-to-b from-white/20 to-transparent opacity-50 pointer-events-none" />
                )}

                <span className="relative z-10 flex items-center gap-2">{children}</span>
            </motion.button>
        );
    }
);
LiquidButton.displayName = "LiquidButton";
