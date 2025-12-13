'use client';

import { motion } from 'framer-motion';
import { Moon, Sun, Droplets } from 'lucide-react';
import * as React from 'react';

import { PaperTooltip } from '@/components/ui/paper-tooltip';
import { useTheme, ThemeName } from '@/contexts/theme-context';
import { cn } from '@/utils/lib-utils';

export function ThemeToggle() {
    const { theme, setTheme } = useTheme();

    const themes: { name: ThemeName; icon: React.ReactNode; label: string }[] = [
        {
            name: 'linear',
            icon: <Moon className="w-4 h-4" />,
            label: 'Linear (Dark)',
        },
        {
            name: 'warmRicePaper',
            icon: <Sun className="w-4 h-4" />,
            label: 'Warm (Rice Paper)',
        },
        {
            name: 'liquidGlass',
            icon: <Droplets className="w-4 h-4" />,
            label: 'Glass (Liquid)',
        },
    ];

    return (
        <div className="flex items-center p-1 bg-theme-bg-tertiary/50 backdrop-blur-sm border border-theme-border rounded-full relative">
            {themes.map((t) => {
                const isActive = theme === t.name;
                return (
                    <PaperTooltip key={t.name} content={t.label}>
                        <button
                            onClick={() => setTheme(t.name)}
                            className={cn(
                                "relative z-10 w-9 h-9 flex items-center justify-center rounded-full transition-colors duration-200",
                                isActive ? "text-theme-text-primary" : "text-theme-text-secondary hover:text-theme-text-primary"
                            )}
                            aria-label={t.label}
                        >
                            {isActive && (
                                <motion.div
                                    layoutId="theme-toggle-indicator"
                                    className="absolute inset-0 bg-theme-bg-primary shadow-sm rounded-full border border-theme-border/50"
                                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                                    style={{ zIndex: -1 }}
                                />
                            )}
                            {t.icon}
                        </button>
                    </PaperTooltip>
                );
            })}
        </div>
    );
}
