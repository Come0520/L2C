'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import { Moon, Sun, Droplets } from 'lucide-react';
import { useTheme, ThemeName } from '@/contexts/theme-context';
import { cn } from '@/utils/lib-utils';

export function GooeyThemeToggle() {
    const { theme, setTheme } = useTheme();

    // Map theme names to indices for potential slide logic, though explicit mapping is easier
    const themes: { name: ThemeName; icon: React.ReactNode; label: string }[] = [
        { name: 'linear', icon: <Moon className="w-5 h-5" />, label: 'Linear' },
        { name: 'warmRicePaper', icon: <Sun className="w-5 h-5" />, label: 'Warm' },
        { name: 'liquidGlass', icon: <Droplets className="w-5 h-5" />, label: 'Glass' },
    ];

    const activeIndex = themes.findIndex(t => t.name === theme);

    return (
        <div className="relative h-12">
            {/* SVG Filter Definition */}
            <svg className="hidden">
                <defs>
                    <filter id="gooey-filter">
                        <feGaussianBlur in="SourceGraphic" stdDeviation="5" result="blur" />
                        <feColorMatrix
                            in="blur"
                            mode="matrix"
                            values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 19 -9"
                            result="gooey"
                        />
                        <feComposite in="SourceGraphic" in2="gooey" operator="atop" />
                    </filter>
                </defs>
            </svg>

            {/* Main Container with Filter */}
            <div
                className="relative flex items-center bg-theme-bg-tertiary rounded-full p-1 h-full"
                style={{ filter: "url(#gooey-filter)" }} // This might affect text sharpness if applied to parent
            >
                {/* We need a separate layer for the gooey effect to avoid blurring icons */}
            </div>

            {/* Alternative Implementation: The "Gooey" effect is usually best for the background blob */}
            <div className="relative flex items-center bg-theme-bg-tertiary/50 border border-theme-border rounded-full p-1.5 h-10 shadow-inner backdrop-blur-sm">
                {/* Background Indicator */}
                {/* We simply use standard Framer Motion layoutId for a clean sliding pill first. 
             If user wants "Gooey", we simulate it or use the filter on a separate layer. 
             Given the complexity of "Gooey" with text/icons, a "Jelly" spring animation is often what is meant by "Gooey Nav" in React Bits context 
             if it's the one with the sliding blob.
         */}
                {themes.map((t) => {
                    const isActive = theme === t.name;
                    return (
                        <button
                            key={t.name}
                            onClick={() => setTheme(t.name)}
                            className={cn(
                                "relative z-10 w-10 h-full flex items-center justify-center rounded-full transition-colors duration-200 focus:outline-none",
                                isActive ? "text-theme-text-primary" : "text-theme-text-secondary hover:text-theme-text-primary"
                            )}
                            aria-label={t.label}
                        >
                            {t.icon}
                        </button>
                    );
                })}

                {/* Sliding Background Blob */}
                <motion.div
                    className="absolute left-1.5 top-1.5 bottom-1.5 w-10 bg-theme-bg-primary rounded-full shadow-sm border border-theme-border/50"
                    initial={false}
                    animate={{
                        x: activeIndex * 40, // 40px is button width approximately (w-10)
                    }}
                    transition={{
                        type: "spring",
                        stiffness: 300,
                        damping: 20
                    }}
                />
            </div>
        </div>
    );
}

// Re-implementing strictly as React Bits "Gooey Nav" style implies fluid morphing.
// The code below creates a dedicated component for the specific requested effect.
// Reference: usually involves a wrapper with contrast filter and children with blur.

export function GooeySwitch() {
    const { theme, setTheme } = useTheme();

    const themes: { name: ThemeName; icon: React.ReactNode }[] = [
        { name: 'linear', icon: <Moon size={18} /> },
        { name: 'warmRicePaper', icon: <Sun size={18} /> },
        { name: 'liquidGlass', icon: <Droplets size={18} /> },
    ];

    const activeIndex = themes.findIndex((t) => t.name === theme);
    // Fallback if theme not found
    const safeIndex = activeIndex === -1 ? 0 : activeIndex;

    return (
        <div className="relative isolate">
            {/* SVG Filter Definition */}
            <svg className="absolute hidden">
                <defs>
                    <filter id="goo">
                        <feGaussianBlur in="SourceGraphic" stdDeviation="6" result="blur" />
                        <feColorMatrix
                            in="blur"
                            mode="matrix"
                            values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 19 -9"
                            result="goo"
                        />
                        <feComposite in="SourceGraphic" in2="goo" operator="atop" />
                    </filter>
                </defs>
            </svg>

            {/* Layer 1: Gooey Background & Blob (Filtered) */}
            {/* We use specific sizing to match the container of icons */}
            <div
                className="absolute inset-0 z-0 rounded-full bg-theme-bg-tertiary/40"
                style={{ filter: "url(#goo)" }}
            >
                <div className="relative w-full h-full flex items-center px-1">
                    <motion.div
                        className="absolute w-10 h-10 bg-blue-500 rounded-full"
                        animate={{
                            x: safeIndex * 50, // Calculated based on icon width + gap (40 + 10)
                        }}
                        transition={{
                            type: "spring",
                            stiffness: 300,
                            damping: 25,
                        }}
                    />
                </div>
            </div>

            {/* Layer 2: Icons (Unfiltered, Crisp) */}
            <div className="relative z-10 flex items-center p-1 gap-[10px] rounded-full border border-theme-border/50 bg-theme-bg-secondary/20 backdrop-blur-sm">
                {themes.map((t, i) => {
                    const isActive = theme === t.name;
                    return (
                        <button
                            key={t.name}
                            onClick={() => setTheme(t.name)}
                            className={cn(
                                "relative w-10 h-10 flex items-center justify-center rounded-full transition-colors duration-200 focus:outline-none",
                                isActive ? "text-white" : "text-theme-text-secondary hover:text-theme-text-primary"
                            )}
                            aria-label={t.name}
                        >
                            {t.icon}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
