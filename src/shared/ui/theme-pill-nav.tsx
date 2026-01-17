"use client";

import React from "react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "@/shared/lib/utils";
import { useTheme } from "next-themes";
import { Sun, Moon, Monitor } from "lucide-react";

/**
 * 主题选项配置
 */
const themeOptions = [
    { value: "light", label: "浅色", icon: Sun },
    { value: "dark", label: "深色", icon: Moon },
    { value: "system", label: "系统", icon: Monitor },
];

/**
 * PillNav 主题切换组件
 * 点击 Logo 后弹出的胶囊形导航，用于切换主题
 * 参考 ReactBits PillNav 风格
 */
interface ThemePillNavProps {
    isOpen: boolean;
    onClose: () => void;
    className?: string;
}

export function ThemePillNav({ isOpen, onClose, className }: ThemePillNavProps) {
    const { theme, setTheme } = useTheme();

    const handleThemeChange = (newTheme: string) => {
        setTheme(newTheme);
        // 延迟关闭，让用户看到选中效果
        setTimeout(onClose, 200);
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* 点击外部关闭 */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-40"
                        onClick={onClose}
                    />

                    {/* 胶囊导航 */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: -10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: -10 }}
                        transition={{
                            type: "spring",
                            stiffness: 400,
                            damping: 25
                        }}
                        className={cn(
                            "absolute z-50 mt-2 p-1.5 rounded-full glass-liquid border border-white/20 dark:border-white/10",
                            "flex items-center gap-1",
                            className
                        )}
                    >
                        {themeOptions.map((option) => {
                            const Icon = option.icon;
                            const isActive = theme === option.value;

                            return (
                                <motion.button
                                    key={option.value}
                                    onClick={() => handleThemeChange(option.value)}
                                    className={cn(
                                        "relative flex items-center gap-2 px-3 py-2 rounded-full text-sm font-medium transition-colors",
                                        isActive
                                            ? "text-primary-600 dark:text-primary-400"
                                            : "text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100"
                                    )}
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                >
                                    {/* 选中背景 */}
                                    {isActive && (
                                        <motion.div
                                            layoutId="theme-pill-active"
                                            className="absolute inset-0 bg-primary-500/20 dark:bg-primary-500/30 rounded-full"
                                            transition={{
                                                type: "spring",
                                                stiffness: 500,
                                                damping: 30
                                            }}
                                        />
                                    )}

                                    <Icon className="h-4 w-4 relative z-10" />
                                    <span className="relative z-10 hidden sm:inline">
                                        {option.label}
                                    </span>
                                </motion.button>
                            );
                        })}
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}

/**
 * 简单 Logo 组件（不带主题切换）
 * 主题切换功能已移至用户设置页面
 */
interface LogoProps {
    className?: string;
}

export function Logo({ className }: LogoProps) {
    return (
        <div className={className}>
            <div className="h-8 w-8 bg-linear-to-br from-primary-500 to-primary-600 rounded-lg shrink-0 flex items-center justify-center shadow-lg">
                <span className="text-white font-bold text-sm">L</span>
            </div>
        </div>
    );
}

// 保留别名以保持向后兼容
export { Logo as LogoWithThemeSwitcher };
