import React from 'react';

/**
 * NoiseButton 组件
 * 一个带有噪点效果的按钮组件
 */
export interface NoiseButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    asChild?: boolean;
    variant?: 'default' | 'primary' | 'secondary';
    size?: 'default' | 'sm' | 'lg' | 'icon';
}

export function NoiseButton({ asChild: _asChild, variant: _variant, children, className, ...props }: NoiseButtonProps) {
    // asChild 是 Radix UI 的特殊 prop，不应传递给 DOM 元素
    // 如果 asChild 为 true，理论上应该使用 Slot 组件，但这里简化处理
    const buttonClassName = [
        'inline-flex items-center justify-center whitespace-nowrap rounded-xl text-sm font-medium',
        'ring-offset-background transition-all duration-300',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
        'disabled:pointer-events-none disabled:opacity-50',
        'bg-primary text-primary-foreground hover:bg-primary/90',
        'relative overflow-hidden',
        className,
    ].filter(Boolean).join(' ');

    return (
        <button className={buttonClassName} {...props}>
            {/* 噪点层 */}
            <span className="absolute inset-0 pointer-events-none opacity-30 mix-blend-overlay bg-[url('/noise.svg')] bg-repeat" />
            <span className="relative z-10">{children}</span>
        </button>
    );
}
