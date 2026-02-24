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
            <span className="absolute inset-0 pointer-events-none opacity-30 mix-blend-overlay bg-repeat" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.5'/%3E%3C/svg%3E")` }} />
            <span className="relative z-10">{children}</span>
        </button>
    );
}
