'use client';

import React from 'react';
import Link from 'next/link';
import { cn } from '@/shared/lib/utils';

/**
 * 玻璃质感图标项类型
 */
export interface GlassIconItem {
    icon: React.ReactElement;
    color: 'blue' | 'purple' | 'red' | 'indigo' | 'orange' | 'green' | 'amber';
    label: string;
    href?: string;
    badge?: number;
    onClick?: () => void;
}

export interface GlassIconsProps {
    items: GlassIconItem[];
    className?: string;
}

/**
 * 颜色渐变映射
 */
const gradientMapping: Record<string, string> = {
    blue: 'linear-gradient(hsl(223, 90%, 50%), hsl(208, 90%, 50%))',
    purple: 'linear-gradient(hsl(283, 90%, 50%), hsl(268, 90%, 50%))',
    red: 'linear-gradient(hsl(3, 90%, 50%), hsl(348, 90%, 50%))',
    indigo: 'linear-gradient(hsl(253, 90%, 50%), hsl(238, 90%, 50%))',
    orange: 'linear-gradient(hsl(43, 90%, 50%), hsl(28, 90%, 50%))',
    green: 'linear-gradient(hsl(123, 90%, 40%), hsl(108, 90%, 40%))',
    amber: 'linear-gradient(hsl(43, 96%, 56%), hsl(38, 92%, 50%))',
};

/**
 * 玻璃质感图标组件
 * 3D悬浮动画 + 毛玻璃效果
 */
export function GlassIcons({ items, className }: GlassIconsProps) {
    return (
        <div className={cn(
            'grid gap-12 grid-cols-3 mx-auto py-8 overflow-visible',
            className
        )}>
            {items.map((item, index) => (
                <GlassIconButton key={index} item={item} />
            ))}
        </div>
    );
}

/**
 * 单个玻璃图标按钮
 */
function GlassIconButton({ item }: { item: GlassIconItem }) {
    const content = (
        <button
            type="button"
            aria-label={item.label}
            onClick={item.onClick}
            className={cn(
                'relative bg-transparent outline-none border-none cursor-pointer',
                'w-[4.5em] h-[4.5em]',
                '[perspective:24em] [transform-style:preserve-3d]',
                '[-webkit-tap-highlight-color:transparent]',
                'group'
            )}
        >
            {/* 彩色背景层 */}
            <span
                className={cn(
                    'absolute top-0 left-0 w-full h-full rounded-[1.25em] block',
                    'transition-[opacity,transform] duration-300',
                    'ease-[cubic-bezier(0.83,0,0.17,1)]',
                    'origin-[100%_100%] rotate-[15deg]',
                    '[will-change:transform]',
                    'group-hover:[transform:rotate(25deg)_translate3d(-0.5em,-0.5em,0.5em)]'
                )}
                style={{
                    background: gradientMapping[item.color] || item.color,
                    boxShadow: '0.5em -0.5em 0.75em hsla(223, 10%, 10%, 0.15)',
                }}
            />

            {/* 毛玻璃图标层 */}
            <span
                className={cn(
                    'absolute top-0 left-0 w-full h-full rounded-[1.25em]',
                    'bg-[hsla(0,0%,100%,0.15)]',
                    'transition-[opacity,transform] duration-300',
                    'ease-[cubic-bezier(0.83,0,0.17,1)]',
                    'origin-[80%_50%] flex',
                    'backdrop-blur-[0.75em]',
                    '[will-change:transform]',
                    'group-hover:[transform:translate3d(0,0,2em)]'
                )}
                style={{
                    boxShadow: '0 0 0 0.1em hsla(0, 0%, 100%, 0.3) inset',
                }}
            >
                <span className="m-auto w-[1.5em] h-[1.5em] flex items-center justify-center text-white">
                    {React.isValidElement(item.icon)
                        ? React.cloneElement(item.icon as React.ReactElement<{ className?: string }>, { className: 'w-6 h-6' })
                        : item.icon
                    }
                </span>
            </span>

            {/* 数量徽章 */}
            {item.badge !== undefined && item.badge > 0 && (
                <span className={cn(
                    'absolute -top-2 -right-2 z-10',
                    'min-w-[1.5em] h-[1.5em] px-1.5',
                    'rounded-full text-xs font-bold text-white',
                    'flex items-center justify-center',
                    'bg-red-500 shadow-lg'
                )}>
                    {item.badge}
                </span>
            )}

            {/* 标签 */}
            <span className={cn(
                'absolute top-full left-0 right-0',
                'text-center whitespace-nowrap leading-[2] text-sm font-medium',
                'opacity-0 transition-[opacity,transform] duration-300',
                'ease-[cubic-bezier(0.83,0,0.17,1)] translate-y-0',
                'group-hover:opacity-100 group-hover:[transform:translateY(20%)]',
                'text-foreground'
            )}>
                {item.label}
            </span>
        </button>
    );

    if (item.href) {
        return (
            <Link href={item.href} className="flex justify-center">
                {content}
            </Link>
        );
    }

    return <div className="flex justify-center">{content}</div>;
}

export default GlassIcons;
