"use client";

import * as React from "react";
import Image from "next/image";
import { useTheme } from "next-themes";
import { motion, AnimatePresence } from "framer-motion";
import { Sun, Moon } from "lucide-react";
import { cn } from "@/shared/lib/utils";

const themes = [
    { id: "light", label: "明亮", icon: Sun },
    { id: "dark", label: "暗黑", icon: Moon },
];

export function ThemeSwitcher({ open = true }: { open?: boolean; animate?: boolean }) {
    const { theme, setTheme } = useTheme();
    const [isMenuOpen, setIsMenuOpen] = React.useState(false);
    const containerRef = React.useRef<HTMLDivElement>(null);

    // 点击外部关闭
    React.useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsMenuOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    return (
        <div className="relative flex items-center group" ref={containerRef}>
            {/* Logo 区域 - �?Logo 作为触发�?*/}
            <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className={cn(
                    "relative h-10 w-10 flex items-center justify-center rounded-xl transition-all duration-300 z-101",
                    "hover:bg-black/5 dark:hover:bg-white/10 active:scale-95",
                    isMenuOpen && "bg-black/5 dark:bg-white/10 shadow-inner"
                )}
                title="切换主题"
            >
                <div className="h-7 w-7 relative shrink-0">
                    <Image
                        src="/l2c-logo.svg"
                        alt="L2C Logo"
                        fill
                        className="object-contain"
                        priority
                    />
                </div>
            </button>

            {/* 系统标题 - 不触发切�?*/}
            <AnimatePresence mode="wait">
                {open && (
                    <motion.span
                        initial={{ opacity: 0, x: -5 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -5 }}
                        className="ml-2 font-bold text-lg text-neutral-700 dark:text-neutral-200 whitespace-nowrap cursor-default"
                    >
                        L2C System
                    </motion.span>
                )}
            </AnimatePresence>

            {/* Pill Nav 主题选择�?- 悬浮�?Logo 右侧上方层级 */}
            <AnimatePresence>
                {isMenuOpen && (
                    <motion.div
                        initial={{ opacity: 0, x: -10, scale: 0.8 }}
                        animate={{ opacity: 1, x: 20, scale: 1 }}
                        exit={{ opacity: 0, x: -10, scale: 0.8 }}
                        transition={{ type: "spring", stiffness: 400, damping: 25 }}
                        className={cn(
                            "fixed md:absolute left-10 top-1/2 -translate-y-1/2 flex items-center gap-1 p-1 z-1000",
                            "bg-neutral-900 dark:bg-black border border-neutral-800 dark:border-white/10",
                            "rounded-full shadow-2xl"
                        )}
                    >
                        {themes.map((t) => {
                            const Icon = t.icon;
                            const isActive = theme === t.id;

                            return (
                                <motion.button
                                    key={t.id}
                                    whileHover={{ y: -2 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => {
                                        setTheme(t.id);
                                        setTimeout(() => setIsMenuOpen(false), 300);
                                    }}
                                    className={cn(
                                        "relative px-4 py-2 rounded-full text-xs transition-colors duration-200",
                                        isActive ? "text-neutral-900 font-bold" : "text-neutral-400 hover:text-white"
                                    )}
                                >
                                    {isActive && (
                                        <motion.div
                                            layoutId="activePill"
                                            className="absolute inset-0 bg-white rounded-full shadow-sm"
                                            initial={false}
                                            transition={{ type: "spring", stiffness: 400, damping: 30 }}
                                        />
                                    )}
                                    <span className="relative z-10 flex items-center gap-2 whitespace-nowrap">
                                        <Icon className={cn("w-3.5 h-3.5", isActive ? "text-neutral-900" : "")} />
                                        <span>{t.label}</span>
                                    </span>
                                </motion.button>
                            );
                        })}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
