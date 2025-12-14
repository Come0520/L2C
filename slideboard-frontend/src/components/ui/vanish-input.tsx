'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { Search, X } from 'lucide-react';
import { useEffect, useRef, useState, useCallback } from 'react';

import { cn } from '@/lib/utils';

interface VanishInputProps {
    placeholders: string[];
    onChange?: (value: string) => void;
    onSubmit?: (value: string) => void;
    className?: string;
    value?: string;
    autoFocus?: boolean;
    disabled?: boolean;
}

/**
 * VanishInput - Aceternity UI 风格搜索输入框
 * 
 * @description
 * 具有 placeholder 轮播动画和提交时消失效果的搜索框
 * 完全主题化，适配 warmRicePaper / liquidGlass / linear 三种主题
 * 
 * @example
 * ```tsx
 * <VanishInput
 *   placeholders={["搜索线索...", "搜索客户...", "搜索订单..."]}
 *   onSubmit={handleSearch}
 *   onChange={setSearchValue}
 * />
 * ```
 */
export function VanishInput({
    placeholders,
    onChange,
    onSubmit,
    className,
    value: controlledValue,
    autoFocus = false,
    disabled = false
}: VanishInputProps) {
    const [currentPlaceholder, setCurrentPlaceholder] = useState(0);
    const [internalValue, setInternalValue] = useState('');
    const [animating, setAnimating] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    // 支持受控和非受控模式
    const value = controlledValue !== undefined ? controlledValue : internalValue;
    const setValue = controlledValue !== undefined ? onChange : setInternalValue;

    // Placeholder 轮播
    useEffect(() => {
        if (placeholders.length <= 1) return;

        const interval = setInterval(() => {
            setCurrentPlaceholder((prev) => (prev + 1) % placeholders.length);
        }, 3000);

        return () => clearInterval(interval);
    }, [placeholders]);

    // 自动聚焦
    useEffect(() => {
        if (autoFocus && inputRef.current) {
            inputRef.current.focus();
        }
    }, [autoFocus]);

    const handleSubmit = useCallback((e: React.FormEvent) => {
        e.preventDefault();
        if (!value.trim() || disabled) return;

        setAnimating(true);
        onSubmit?.(value);

        setTimeout(() => {
            setAnimating(false);
            if (controlledValue === undefined) {
                setInternalValue('');
            }
        }, 1000);
    }, [value, disabled, onSubmit, controlledValue]);

    const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const newValue = e.target.value;
        setValue?.(newValue);
        onChange?.(newValue);
    }, [setValue, onChange]);

    const handleClear = useCallback(() => {
        setValue?.('');
        onChange?.('');
        inputRef.current?.focus();
    }, [setValue, onChange]);

    return (
        <form
            className={cn(
                'relative flex items-center gap-3 px-4 py-3 bg-theme-bg-secondary rounded-lg border border-theme-border transition-all duration-200',
                'hover:border-primary-500/50 focus-within:border-primary-500',
                disabled && 'opacity-50 cursor-not-allowed',
                className
            )}
            onSubmit={handleSubmit}
        >
            <Search className="h-5 w-5 text-theme-text-secondary flex-shrink-0" />

            <div className="relative flex-1 min-w-0">
                {/* Placeholder 动画 */}
                <AnimatePresence mode="wait">
                    {!value && !disabled && (
                        <motion.span
                            key={`placeholder-${currentPlaceholder}`}
                            initial={{ y: 5, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: -5, opacity: 0 }}
                            transition={{ duration: 0.3, ease: "easeInOut" }}
                            className="absolute left-0 top-1/2 -translate-y-1/2 text-theme-text-secondary pointer-events-none select-none"
                        >
                            {placeholders[currentPlaceholder] || '搜索...'}
                        </motion.span>
                    )}
                </AnimatePresence>

                {/* 输入框 */}
                <motion.input
                    ref={inputRef}
                    type="text"
                    value={value}
                    onChange={handleChange}
                    disabled={disabled}
                    animate={animating ? {
                        opacity: 0,
                        scale: 0.95,
                        filter: 'blur(4px)'
                    } : {
                        opacity: 1,
                        scale: 1,
                        filter: 'blur(0px)'
                    }}
                    transition={{ duration: 0.4, ease: "easeOut" }}
                    className={cn(
                        'w-full bg-transparent border-none outline-none',
                        'text-theme-text-primary placeholder:text-theme-text-secondary',
                        'disabled:cursor-not-allowed'
                    )}
                    aria-label="搜索输入框"
                />
            </div>

            {/* 清除按钮 */}
            <AnimatePresence>
                {value && !disabled && (
                    <motion.button
                        type="button"
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        transition={{ duration: 0.2 }}
                        onClick={handleClear}
                        className="p-1 hover:bg-theme-bg-tertiary rounded transition-colors"
                        aria-label="清除搜索"
                    >
                        <X className="h-4 w-4 text-theme-text-secondary" />
                    </motion.button>
                )}
            </AnimatePresence>
        </form>
    );
}
